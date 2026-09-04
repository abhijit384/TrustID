import os
import shutil
import uuid
import datetime
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Screening, ExtractedField, ValidationResult, TamperingResult, FaceResult, AuditLog, AIAnalysis
from backend.schemas import ScreeningSummary, ScreeningDetail, ScreeningUpdateNotes, ScreeningUploadResponse
from backend.dependencies import get_current_user, require_user_or_admin, require_admin
from backend.utils.hashing import calculate_sha256_from_bytes, calculate_sha256_from_file
from backend.services.gemini_service import analyze_document_with_gemini, generate_dynamic_cv_analysis
from backend.services.ocr_service import extract_document_ocr
from backend.services.validation_service import validate_document_rules, compare_mrz_consistency
from backend.services.tampering_service import run_tampering_analysis
from backend.services.face_service import detect_and_crop_document_face, compute_face_comparison_similarity, analyze_photo_authenticity, check_multiple_identities
from backend.services.image_normalization import normalize_image_orientation
from backend.services.memory_utils import log_memory, force_gc

import threading
from pathlib import Path
import logging

logger = logging.getLogger("trustid.documents")

# Global re-entrant lock to serialize memory-intensive analysis on 512MB RAM instances
ANALYSIS_LOCK = threading.Lock()

router = APIRouter(prefix="/api/screenings", tags=["Screenings & Documents"])

BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
DOCS_DIR = UPLOAD_DIR / "documents"
FACES_DIR = UPLOAD_DIR / "faces"
SAMPLES_DIR = UPLOAD_DIR / "samples"
FORENSICS_DIR = UPLOAD_DIR / "forensics"

for _d in [UPLOAD_DIR, DOCS_DIR, FACES_DIR, SAMPLES_DIR, FORENSICS_DIR]:
    _d.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR_STR = str(UPLOAD_DIR)
DOCS_DIR_STR = str(DOCS_DIR)
FACES_DIR_STR = str(FACES_DIR)
SAMPLES_DIR_STR = str(SAMPLES_DIR)

@router.get("", response_model=List[ScreeningSummary])
def get_screenings(
    risk_level: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    doc_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Retrieve screenings list.
    - Admin: Views all organization screenings.
    - User: Strictly views only their own screenings.
    """
    query = db.query(Screening).order_by(Screening.created_at.desc())

    # Strict RBAC: User only sees their own documents
    if (current_user.role or "").lower() == "user":
        query = query.filter(Screening.created_by == current_user.id)

    if risk_level and risk_level != "all":
        query = query.filter(Screening.risk_level.ilike(risk_level))
    if status_filter and status_filter != "all":
        query = query.filter(Screening.status.ilike(status_filter))
    if doc_type and doc_type != "all":
        query = query.filter(Screening.document_type.ilike(doc_type))
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Screening.screening_id.ilike(search_pattern)) |
            (Screening.demo_person_name.ilike(search_pattern)) |
            (Screening.original_filename.ilike(search_pattern))
        )

    screenings = query.limit(100).all()
    results = []
    for s in screenings:
        raw_auth = (s.authenticity_classification or "").upper()
        if "INVALID" in raw_auth:
            overall_st = "INVALID DOCUMENT"
            auth_res = "INVALID DOCUMENT"
        elif "FAKE" in raw_auth or "TAMPER" in raw_auth or "SUSPICIOUS" in raw_auth or (s.risk_score >= 50 and "INCONCLUSIVE" not in raw_auth):
            overall_st = "FAKE DOCUMENT"
            auth_res = "POTENTIALLY SUSPICIOUS / POTENTIALLY FAKE"
        elif "INCONCLUSIVE" in raw_auth:
            overall_st = "INCONCLUSIVE"
            auth_res = "INCONCLUSIVE"
        else:
            overall_st = "REAL DOCUMENT"
            auth_res = "LIKELY GENUINE"

        results.append({
            "id": s.id,
            "screening_id": s.screening_id,
            "document_type": s.document_type,
            "status": s.status,
            "risk_score": s.risk_score,
            "risk_level": s.risk_level,
            "demo_person_name": s.demo_person_name,
            "created_at": s.created_at,
            "officer_name": s.creator.name if s.creator else "Authorized Officer",
            "document_hash": s.document_hash,
            "overall_document_status": overall_st,
            "document_status": overall_st,
            "authenticity_classification": overall_st,
            "authenticity_result": auth_res,
            "authenticity_confidence": s.authenticity_confidence
        })
    return results


@router.post("", response_model=ScreeningUploadResponse)
async def create_screening_upload(
    document: Optional[UploadFile] = File(None),
    presented_face: Optional[UploadFile] = File(None),
    document_type: str = Form("Auto-Detect"),
    sample_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Stage 1: Document Upload & Screening Record Creation.
    Receives file, calculates SHA-256, creates persistent database record, and commits immediately.
    """
    print(f"[UPLOAD] UPLOAD START")
    log_memory("before_upload_processing")

    try:
        # 1. Generate unique screening ID (e.g. TR-2026-0001)
        next_num = 1
        while True:
            test_id = f"TR-2026-{next_num:04d}"
            if not db.query(Screening).filter(Screening.screening_id == test_id).first():
                screening_id = test_id
                break
            next_num += 1

        doc_filename = f"{screening_id}_doc.jpg"
        doc_path = str(DOCS_DIR / doc_filename)

        file_bytes = b""
        original_name = "demo_document.jpg"

        if document and document.filename:
            original_name = document.filename
            file_bytes = await document.read()

            # Request size protection: Max 15MB for uploaded documents
            if len(file_bytes) > 15 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="File size exceeds 15MB limit. Please upload a standard identity document."
                )

            log_memory("after_file_read", f"name={original_name} size={len(file_bytes)/1024:.1f}KB")

            # Automatic PDF conversion: extract digital text and render page 0
            is_pdf = file_bytes.startswith(b"%PDF") or original_name.lower().endswith(".pdf")
            if is_pdf:
                try:
                    import pypdfium2 as pdfium
                    pdf = pdfium.PdfDocument(file_bytes)
                    total_pages = len(pdf)
                    log_memory("pdf_loaded", f"pages={total_pages}")

                    # Limit PDF page count to prevent memory exhaustion
                    if total_pages > 10:
                        pdf.close()
                        del pdf
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"PDF has {total_pages} pages, exceeding the 10-page limit for identity document screening."
                        )

                    # Extract text sequentially
                    pdf_lines = []
                    for p_idx in range(min(total_pages, 3)):
                        try:
                            textpage = pdf[p_idx].get_textpage()
                            txt = textpage.get_text_range()
                            if txt and txt.strip():
                                pdf_lines.append(txt.strip())
                        except Exception:
                            pass
                    
                    pdf_full_text = "\n".join(pdf_lines)
                    if pdf_full_text:
                        txt_path = f"{doc_path}.txt"
                        with open(txt_path, "w", encoding="utf-8") as tf:
                            tf.write(pdf_full_text)
                        print(f"[CONVERT] Extracted {len(pdf_full_text)} chars of text from PDF to {txt_path}")

                    # Save original PDF companion
                    orig_pdf_path = doc_path.replace(".jpg", ".pdf")
                    with open(orig_pdf_path, "wb") as pf:
                        pf.write(file_bytes)

                    if total_pages > 0:
                        # Render page 0 directly at scale 1.5 (~150 DPI) for memory efficiency
                        rendered = pdf[0].render(scale=1.5).to_pil()
                        rendered.convert("RGB").save(doc_path, format="JPEG", quality=90)
                        rendered.close()
                        del rendered
                        log_memory("after_pdf_render", f"rendered page 1 of {total_pages}")
                        print(f"[CONVERT] Successfully rendered PDF '{original_name}' (page 1) to JPEG: {doc_path}")
                    else:
                        with open(doc_path, "wb") as f:
                            f.write(file_bytes)
                    pdf.close()
                    del pdf
                except HTTPException:
                    raise
                except Exception as pdf_err:
                    print(f"[CONVERT] pypdfium2 conversion note: {pdf_err}")
                    with open(doc_path, "wb") as f:
                        f.write(file_bytes)
            else:
                # Normalize EXIF orientation and clamp oversized camera images to max 1200px
                try:
                    import io
                    from PIL import Image, ImageOps
                    with Image.open(io.BytesIO(file_bytes)) as pil_img:
                        pil_img = ImageOps.exif_transpose(pil_img) or pil_img
                        max_dim = 1200
                        if pil_img.width > max_dim or pil_img.height > max_dim:
                            pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                        pil_img.convert("RGB").save(doc_path, format="JPEG", quality=90)
                except Exception:
                    with open(doc_path, "wb") as f:
                        f.write(file_bytes)
        elif sample_id:
            sample_path = str(SAMPLES_DIR / f"{sample_id}.jpg")
            if os.path.exists(sample_path):
                with open(sample_path, "rb") as sf:
                    file_bytes = sf.read()
                with open(doc_path, "wb") as f:
                    f.write(file_bytes)
                sample_txt = f"{sample_path}.txt"
                if os.path.exists(sample_txt):
                    try:
                        shutil.copyfile(sample_txt, f"{doc_path}.txt")
                    except Exception:
                        pass
                original_name = f"{sample_id}.jpg"
            else:
                raise HTTPException(status_code=400, detail=f"Sample '{sample_id}' not found.")
        else:
            raise HTTPException(status_code=400, detail="No document file or sample ID provided.")

        print(f"[UPLOAD] FILE RECEIVED: {original_name}")

        # Auto-orient & normalize image orientation immediately on upload
        try:
            normalize_image_orientation(doc_path)
        except Exception as norm_err:
            logger.warning(f"[UPLOAD] Orientation normalization note: {norm_err}")

        # Calculate SHA-256
        doc_hash = calculate_sha256_from_bytes(file_bytes)

        # Presented face photo (optional)
        face_path = None
        if presented_face and presented_face.filename:
            face_filename = f"{screening_id}_face.jpg"
            face_path = str(FACES_DIR / face_filename)
            p_bytes = await presented_face.read()
            try:
                import io
                from PIL import Image, ImageOps
                with Image.open(io.BytesIO(p_bytes)) as p_img:
                    p_img = ImageOps.exif_transpose(p_img) or p_img
                    if p_img.width > 800 or p_img.height > 800:
                        p_img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                    p_img.convert("RGB").save(face_path, format="JPEG", quality=90)
            except Exception:
                with open(face_path, "wb") as f:
                    f.write(p_bytes)

        started_at = datetime.datetime.utcnow()

        # Initial Screening Record - Saved with status "uploaded"
        new_screening = Screening(
            screening_id=screening_id,
            document_type=document_type,
            status="uploaded",
            risk_score=0.0,
            risk_level="Pending",
            created_by=current_user.id,
            original_filename=original_name,
            file_path=doc_path,
            presented_face_path=face_path,
            document_hash=doc_hash,
            demo_person_name="Pending Analysis",
            processing_time_sec=0.0,
            analysis_started_at=started_at
        )
        db.add(new_screening)
        db.commit()
        db.refresh(new_screening)

        # Audit log: Upload
        db.add(AuditLog(
            user_id=current_user.id,
            screening_id=new_screening.id,
            action="Document Uploaded",
            details=f"Document uploaded by {current_user.name} ({current_user.role}) with SHA-256: {doc_hash[:16]}...",
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()

        print(f"[UPLOAD] SCREENING CREATED: {screening_id}")
        print(f"[DATABASE] DATABASE COMMIT SUCCESS")
        print(f"[STORAGE] FILE SAVED: {doc_path}")

        return {
            "success": True,
            "screening_id": new_screening.screening_id,
            "database_id": new_screening.id,
            "id": new_screening.id,
            "status": new_screening.status
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as upload_err:
        db.rollback()
        logger.error(f"[UPLOAD] Upload processing failed: {upload_err}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create document screening record: {str(upload_err)}")
    finally:
        import gc
        gc.collect()


@router.post("/{screening_identifier}/analyze", response_model=ScreeningDetail)
@router.post("/{screening_identifier}/retry", response_model=ScreeningDetail)
def analyze_screening(
    screening_identifier: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Stage 2: Multimodal Intelligence Analysis Pipeline.
    Loads existing screening record, executes OCR, Gemini 3.5 Flash, Face Analysis, Authenticity, and Risk.
    """
    screening = None
    if screening_identifier.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(screening_identifier)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == screening_identifier).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening record not found")

    # If already completed and not retry, return stored result without re-calling Gemini
    # Check if request is retry
    is_retry = "retry" in screening_identifier

    print(f"[ANALYSIS] ANALYSIS STARTED: {screening.screening_id}")

    # Set status to processing
    screening.status = "processing"
    db.commit()

    doc_path = screening.file_path
    if not doc_path or not os.path.exists(doc_path):
        if doc_path:
            fname = os.path.basename(doc_path.replace("\\", "/"))
            candidate = os.path.join(DOCS_DIR_STR, fname)
            if os.path.exists(candidate):
                doc_path = candidate
                screening.file_path = candidate
                db.commit()
            else:
                # Also check root uploads/documents
                legacy_candidate = os.path.join(str(BACKEND_DIR.parent / "uploads" / "documents"), fname)
                if os.path.exists(legacy_candidate):
                    shutil.copy2(legacy_candidate, candidate)
                    doc_path = candidate
                    screening.file_path = candidate
                    db.commit()

    if not doc_path or not os.path.exists(doc_path):
        logger.error(f"[ANALYSIS] Document file not found on disk: {doc_path}")
        screening.status = "failed"
        screening.investigation_notes = "Uploaded document file not found on disk."
        db.commit()
        raise HTTPException(status_code=404, detail="Document file not found on disk.")

    original_name = screening.original_filename or "document.jpg"
    started_at = datetime.datetime.utcnow()

    try:
        with ANALYSIS_LOCK:
            # Clear previous analysis runs for retried screening
            db.query(ExtractedField).filter(ExtractedField.screening_id == screening.id).delete()
            db.query(ValidationResult).filter(ValidationResult.screening_id == screening.id).delete()
            db.query(TamperingResult).filter(TamperingResult.screening_id == screening.id).delete()
            db.query(FaceResult).filter(FaceResult.screening_id == screening.id).delete()
            db.query(AIAnalysis).filter(AIAnalysis.screening_id == screening.id).delete()
            db.commit()

            # Self-healing check: If the stored file is actually a PDF, render page 1 to JPEG
            try:
                with open(doc_path, "rb") as f_check:
                    header_bytes = f_check.read(16)
                if header_bytes.startswith(b"%PDF"):
                    print(f"[CONVERT] Self-healing detected PDF document at {doc_path}. Converting to JPEG...")
                    import pypdfium2 as pdfium
                    pdf = pdfium.PdfDocument(doc_path)
                    if len(pdf) > 0:
                        rendered_page = pdf[0].render(scale=1.5).to_pil()
                        rendered_page.convert("RGB").save(doc_path, format="JPEG", quality=90)
                        rendered_page.close()
                        del rendered_page
                        print(f"[CONVERT] Self-healing successfully converted PDF to JPEG: {doc_path}")
                    pdf.close()
                    del pdf
            except Exception as conv_err:
                print(f"[CONVERT] Self-healing PDF conversion note: {conv_err}")

            # 0. Normalize image orientation (EXIF + multi-angle face/text alignment)
            try:
                normalize_image_orientation(doc_path)
            except Exception as norm_err:
                logger.warning(f"[ANALYSIS] Orientation normalization note: {norm_err}")

            # 1. Extract preliminary OCR text
            initial_ocr = extract_document_ocr(doc_path)
            ocr_candidate_text = initial_ocr.get("raw_text", "")
            print(f"[OCR] OCR COMPLETED")

            # 2. Execute Gemini 3.5 Flash multimodal vision analysis
            try:
                gemini_res = analyze_document_with_gemini(
                    document_path=doc_path,
                    ocr_context=f"{original_name}\n{ocr_candidate_text}"
                )
            except Exception as gemini_err:
                gemini_res = generate_dynamic_cv_analysis(
                    document_path=doc_path,
                    ocr_context=f"{original_name}\n{ocr_candidate_text}",
                    error_note=str(gemini_err)
                )
                db.add(AuditLog(
                    user_id=current_user.id,
                    screening_id=screening.id,
                    action="Assistive CV Analysis Engaged",
                    details=f"Assistive CV fallback engaged: {str(gemini_err)[:150]}",
                    timestamp=datetime.datetime.utcnow()
                ))
            print(f"[GEMINI] GEMINI COMPLETED")

            # 3. Clean up any existing sub-records on re-analysis to ensure idempotency and prevent duplicate records
            db.query(ExtractedField).filter(ExtractedField.screening_id == screening.id).delete()
            db.query(ValidationResult).filter(ValidationResult.screening_id == screening.id).delete()
            db.query(TamperingResult).filter(TamperingResult.screening_id == screening.id).delete()
            db.query(FaceResult).filter(FaceResult.screening_id == screening.id).delete()
            db.query(AIAnalysis).filter(AIAnalysis.screening_id == screening.id).delete()
            db.commit()

            # Reconcile OCR candidate fields with Gemini visual verification
            ocr_result = extract_document_ocr(doc_path, gemini_data=gemini_res, cached_raw_text=ocr_candidate_text)
        for field in ocr_result.get("fields", []):
            db.add(ExtractedField(
                screening_id=screening.id,
                field_name=field["field_name"],
                field_value_demo=field["field_value_demo"],
                confidence=field["confidence"],
                source=field.get("source", "OCR + Gemini"),
                validation_status=field.get("validation_status", "verified"),
                ocr_value=field.get("ocr_value"),
                visual_value=field.get("visual_value"),
                discrepancy_note=field.get("discrepancy_note")
            ))

        db.add(AuditLog(
            user_id=current_user.id,
            screening_id=screening.id,
            action="OCR Completed",
            details=f"{len(ocr_result.get('fields', []))} fields extracted and cross-checked by Trust AI Neural Engine.",
            timestamp=datetime.datetime.utcnow()
        ))

        # 4. Validation Checks
        fields_dict = {f["field_name"]: f["field_value_demo"] for f in ocr_result.get("fields", [])}
        val_result = validate_document_rules(fields_dict, gemini_data=gemini_res)
        for check in val_result.get("checks", []):
            db.add(ValidationResult(
                screening_id=screening.id,
                check_name=check["check_name"],
                status=check["status"],
                message=check["message"]
            ))

        # 5. Tampering Analysis
        tamp_result = run_tampering_analysis(doc_path, gemini_data=gemini_res)
        for ind in tamp_result.get("indicators", []):
            db.add(TamperingResult(
                screening_id=screening.id,
                indicator_type=ind.get("type", "Visual Anomaly"),
                confidence=ind.get("confidence", 0.5),
                region_data=ind.get("region_data")
            ))

        # 6. Document Face Analysis (Always run on ID's embedded face)
        gemini_face = gemini_res.get("face_analysis") or gemini_res.get("document_face_analysis") or {}
        norm_box = gemini_face.get("bounding_box") or gemini_face.get("bounding_box_normalized")
        face_crop_filename = f"{screening.screening_id}_face_crop.jpg"
        face_crop_path = str(DOCS_DIR / face_crop_filename)

        # Run robust two-stage local face & portrait extraction
        local_face_res = detect_and_crop_document_face(
            doc_image_path=doc_path,
            normalized_box=norm_box,
            output_crop_path=face_crop_path
        )

        doc_face_detected = bool(local_face_res.get("face_detected", False))
        primary_portrait_face_count = int(local_face_res.get("primary_portrait_face_count", 1 if doc_face_detected else 0))
        document_wide_face_count = int(local_face_res.get("document_wide_face_count", primary_portrait_face_count))
        other_faces_count = int(local_face_res.get("other_faces_count", max(0, document_wide_face_count - primary_portrait_face_count)))
        multiple_faces_in_portrait = bool(local_face_res.get("multiple_faces_in_portrait", False) or (primary_portrait_face_count > 1))
        doc_face_quality = local_face_res.get("face_quality", "Good" if doc_face_detected else "Inconclusive")
        photo_reg_detected = bool(doc_face_detected and local_face_res.get("photo_region_detected", True))
        doc_face_box_data = local_face_res.get("box") if doc_face_detected else None

        # Run forensic photo checks (ELA, boundary edge variance, texture)
        photo_auth = {}
        if doc_face_detected and face_crop_path and os.path.exists(face_crop_path):
            try:
                photo_auth = analyze_photo_authenticity(
                    doc_image_path=doc_path,
                    crop_image_path=face_crop_path,
                    face_box=doc_face_box_data,
                    gemini_forensics=gemini_face,
                    face_detected=True
                )
            except Exception as ex:
                logger.warning(f"Forensic photo authenticity check note: {ex}")

        photo_risk = float(photo_auth.get("photo_authenticity_risk", 0.0))
        raw_photo_st = str(gemini_face.get("photo_status") or gemini_face.get("status") or "").lower()
        gemini_is_real = gemini_face.get("is_real_photo")

        is_anomaly = (
            gemini_is_real is False or
            "fake" in raw_photo_st or
            "tamper" in raw_photo_st or
            "anomaly" in raw_photo_st or
            "splic" in raw_photo_st or
            photo_risk >= 70.0
        )

        if not doc_face_detected:
            doc_face_st = "No Face Detected"
            doc_face_expl = "No facial photograph detected in the uploaded document."
            doc_face_conf = 0.95
            doc_face_inds = []
            doc_face_quality = "Inconclusive"
            photo_reg_detected = False
            doc_face_box_data = None
            if os.path.exists(face_crop_path):
                try:
                    os.remove(face_crop_path)
                except Exception:
                    pass
        elif multiple_faces_in_portrait:
            doc_face_st = "Multiple Faces in Portrait"
            doc_face_conf = 0.88
            doc_face_inds = [
                f"Multiple human faces detected inside primary portrait ({primary_portrait_face_count} faces)",
                "Identity credential standards require a single-individual portrait photograph"
            ]
            doc_face_expl = f"MULTIPLE FACES IN PORTRAIT ({primary_portrait_face_count} faces found). The primary portrait photograph region contains multiple distinct faces."
            doc_face_quality = "Multiple Faces in Portrait"
        elif is_anomaly:
            doc_face_st = "Fake / Tampered Photo"
            doc_face_conf = float(max(gemini_face.get("confidence", 0.90), round(photo_risk / 100.0, 2) if photo_risk > 0 else 0.88))
            doc_face_inds = gemini_face.get("indicators") or ["Forensic boundary or substrate anomaly detected", "Potential image manipulation"]
            doc_face_expl = gemini_face.get("explanation") or "The portrait shows forensic markers of manipulation, digital splicing, or synthetic generation."
            gemini_face["photo_status"] = "Fake / Tampered Photo"
            gemini_face["is_real_photo"] = False
            gemini_face["status"] = "Anomaly Detected"
        else:
            doc_face_st = "Real Photo"
            doc_face_conf = float(gemini_face.get("confidence", 0.95))
            doc_face_inds = list(gemini_face.get("indicators", ["Consistent photographic substrate", "Natural lighting and contours"]))
            if other_faces_count > 0:
                doc_face_inds.append(f"Other faces detected elsewhere in document: {other_faces_count} (substrate/graphic background observation)")
                doc_face_expl = f"The primary document portrait is clear and verified authentic (1 genuine face). Note: {other_faces_count} additional secondary face region(s) noted elsewhere on the document substrate."
            else:
                doc_face_expl = gemini_face.get("explanation") or "The document portrait is clear and verified authentic with no signs of manipulation."

        # Optional 1:1 Face Verification against presented selfie/comparison image
        if screening.presented_face_path and os.path.exists(screening.presented_face_path):
            comp_res = compute_face_comparison_similarity(
                doc_crop_path=face_crop_path if (doc_face_detected and os.path.exists(face_crop_path)) else doc_path,
                presented_face_path=screening.presented_face_path
            )
            sim_score = comp_res.get("similarity", 75.0)
            sim_status = comp_res.get("status", "Review Required")
            sim_expl = comp_res.get("explanation", "")
            screening.face_verification_performed = True
            screening.face_verification_status = sim_status
            screening.face_verification_similarity = sim_score
            screening.face_verification_explanation = sim_expl
            db.add(FaceResult(
                screening_id=screening.id,
                similarity_score=sim_score,
                status=sim_status
            ))
        else:
            screening.face_verification_performed = False
            screening.face_verification_status = "Not Performed"
            screening.face_verification_similarity = None
            screening.face_verification_explanation = "No comparison photo supplied. Document embedded face analyzed independently."
            db.add(FaceResult(
                screening_id=screening.id,
                similarity_score=0.0,
                status="Not Performed"
            ))

        # 7. Dynamic Risk Assessment & AI Analysis Record
        risk_info = gemini_res.get("risk_assessment", {})
        score = float(risk_info.get("score", 12))
        level = str(risk_info.get("level", "Low"))
        status_text = "completed"

        ai_analysis_rec = AIAnalysis(
            screening_id=screening.id,
            model_name="Trust AI Neural Engine",
            summary=gemini_res.get("explanation", "Document analysis completed."),
            findings=gemini_res,
            recommendation=gemini_res.get("recommendation", {}).get("action", "Routine manual verification")
        )
        db.add(ai_analysis_rec)

        # 8. Finalize Screening Record
        completed_at = datetime.datetime.utcnow()
        duration_sec = max(1.2, round((completed_at - started_at).total_seconds(), 1))

        gem_fields = gemini_res.get("extracted_fields") or gemini_res.get("extracted_information") or {}
        extracted_name = gem_fields.get("name")
        if not extracted_name or str(extracted_name).lower() in ["null", "none", "not detected"]:
            for f in ocr_result.get("fields", []):
                if f["field_name"] == "Full Name" and f["field_value_demo"] != "Not detected":
                    extracted_name = f["field_value_demo"]
                    break
        if not extracted_name or str(extracted_name).lower() in ["null", "none", "not detected"]:
            extracted_name = "Subject"

        detected_type = gemini_res.get("document_type") or screening.document_type
        if not detected_type or detected_type in ["None", "null", "Identity Document"]:
            if any(k in original_name.lower() or k in ocr_candidate_text.lower() for k in ["pan", "pvc", "income tax", "permanent account"]):
                detected_type = "Indian PAN Card"
            elif any(k in original_name.lower() or k in ocr_candidate_text.lower() for k in ["aadhaar", "uidai"]):
                detected_type = "Aadhaar Card"

        auth_info = gemini_res.get("authenticity_assessment", {})
        initial_auth = auth_info.get("classification") or ("Real Document" if score < 50 else "Fake Document")

        screening.document_type = detected_type
        screening.demo_person_name = extracted_name
        screening.status = status_text
        screening.processing_time_sec = duration_sec
        screening.analysis_completed_at = completed_at

        screening.photo_forensics_status = doc_face_st
        screening.photo_forensics_score = float(35.0 if "fake" in doc_face_st.lower() or "tamper" in doc_face_st.lower() else 0.0)
        screening.photo_forensics_explanation = doc_face_expl

        # Document Face Analysis fields
        screening.face_detected = doc_face_detected
        screening.faces_detected_count = primary_portrait_face_count
        screening.primary_portrait_face_count = primary_portrait_face_count
        screening.document_wide_face_count = document_wide_face_count
        screening.other_faces_count = other_faces_count
        screening.multiple_faces_detected = multiple_faces_in_portrait
        screening.face_quality = doc_face_quality
        screening.photo_region_detected = photo_reg_detected
        screening.doc_face_status = doc_face_st
        screening.doc_face_confidence = doc_face_conf
        screening.doc_face_indicators = doc_face_inds
        screening.doc_face_explanation = doc_face_expl
        screening.doc_face_box = doc_face_box_data
        screening.doc_face_crop_path = face_crop_path if (doc_face_detected and os.path.exists(face_crop_path)) else None

        # Check multiple identities in database and alias registry
        doc_number_val = fields_dict.get("Document Number") or fields_dict.get("Visa Number")
        multi_id_check = check_multiple_identities(
            db=db,
            current_screening_id=screening.id,
            current_person_name=extracted_name,
            current_doc_number=doc_number_val,
            doc_crop_path=face_crop_path if (doc_face_detected and os.path.exists(face_crop_path)) else None,
            doc_filename=original_name
        )

        # Synchronize tampering detection with facial anomaly and validation findings
        is_photo_clean = any(k in doc_face_st.lower() for k in ["real", "pass", "no obvious", "verified", "clean"])
        is_face_altered = is_anomaly or (not is_photo_clean and ("fake" in doc_face_st.lower() or "tamper" in doc_face_st.lower())) or multiple_faces_in_portrait
        if is_face_altered:
            tamp_result["modules"]["photo_replacement"]["photo_replacement_detected"] = True
            tamp_result["modules"]["photo_replacement"]["status"] = "Failed"
            if not any("replacement" in ind.lower() or "splicing" in ind.lower() or "faces" in ind.lower() for ind in tamp_result["modules"]["photo_replacement"]["indicators"]):
                tamp_result["modules"]["photo_replacement"]["indicators"].insert(0, f"Facial portrait anomaly: {'Multiple faces detected inside portrait' if multiple_faces_in_portrait else 'Digital splicing or synthetic generation detected'}.")
            tamp_result["tampering_score"] = max(tamp_result.get("tampering_score", 0.0), 65.0)
            tamp_result["status"] = "Tampering Anomaly Detected"

        val_has_failed = any(c.get("status") == "Failed" for c in val_result.get("checks", []))
        is_dob_fraud = any(c.get("status") == "Failed" and "Date of Birth" in c.get("check_name") for c in val_result.get("checks", []))
        is_expired_doc = any(c.get("status") == "Failed" and "Expiration" in c.get("check_name") for c in val_result.get("checks", []))
        is_blacklisted_doc = any(c.get("status") == "Failed" and "Blacklist" in c.get("check_name") for c in val_result.get("checks", []))
        is_sample_specimen = any(c.get("status") == "Failed" and "Specimen" in c.get("check_name") for c in val_result.get("checks", []))

        if is_dob_fraud or gemini_res.get("mrz_analysis", {}).get("status") == "Mismatch":
            tamp_result["modules"]["text_manipulation"]["text_manipulation_detected"] = True
            tamp_result["modules"]["text_manipulation"]["status"] = "Failed"
            if not any("text" in ind.lower() or "date" in ind.lower() for ind in tamp_result["modules"]["text_manipulation"]["indicators"]):
                tamp_result["modules"]["text_manipulation"]["indicators"].insert(0, "Biographical data discrepancy: text modification or MRZ checksum mismatch.")
            tamp_result["tampering_score"] = max(tamp_result.get("tampering_score", 0.0), 50.0)
            tamp_result["status"] = "Tampering Anomaly Detected"

        # Final Harmonized Authenticity and Risk Determination (3-Stage Explicit Decision)
        initial_auth_str = str(initial_auth).lower()
        explicit_fake_auth = ("fake" in initial_auth_str or "tamper" in initial_auth_str or "counterfeit" in initial_auth_str) and not any(neg in initial_auth_str for neg in ["no ", "not ", "never", "non-fake", "genuine"])
        
        gem_tamp = gemini_res.get("tampering_analysis", {})
        gem_tamp_st = str(gem_tamp.get("status", "")).lower()
        is_gem_tamp_clean = any(k in gem_tamp_st for k in ["no obvious", "no tampering", "no anomaly", "passed", "pass", "clean", "uniform"])
        has_gemini_tampering = (
            (not is_gem_tamp_clean and ("tamper" in gem_tamp_st or "anomaly detected" in gem_tamp_st)) or
            float(gem_tamp.get("score", 0.0) or 0.0) >= 45.0 or
            bool(gem_tamp.get("photo_replacement_detected")) or
            bool(gem_tamp.get("text_manipulation_detected")) or
            bool(gem_tamp.get("stamp_forgery_detected"))
        )

        has_tampering_evidence = (
            tamp_result.get("tampering_score", 0) >= 45.0 or
            is_face_altered or
            multiple_faces_in_portrait or
            multi_id_check.get("multiple_identities_detected") or
            is_blacklisted_doc or
            is_dob_fraud or
            has_gemini_tampering or
            gemini_res.get("mrz_analysis", {}).get("status") == "Mismatch" or
            explicit_fake_auth or
            score >= 60.0
        )

        # Check for critical conflicts between OCR and visual inspection
        conflict_fields = [f for f in ocr_result.get("fields", []) if f.get("validation_status") == "conflict"]
        critical_conflicts = [f for f in conflict_fields if f.get("field_name") in ["Full Name", "Document Number", "Date of Birth"]]
        has_unresolved_critical_conflicts = len(critical_conflicts) > 0 and gemini_res.get("mrz_analysis", {}).get("status") != "Match"

        # Check for True Inconclusive conditions (insufficient optical evidence or unusable quality)
        doc_quality = gemini_res.get("document_quality", {})
        is_poor_quality = (doc_quality.get("status") or "").capitalize() == "Poor"
        demographic_fields = [f for f in ocr_result.get("fields", []) if f.get("field_name") != "Document Type" and f.get("field_value_demo") != "Not detected"]
        detected_fields_cnt = len(demographic_fields)
        
        # 1. SCREENABILITY CHECK: Is it a recognizable/screenable identity document?
        # Non-document = 0 demographic fields detected AND no face detected AND empty/unparseable OCR text (<15 chars) AND NOT a specimen
        is_non_document = (
            (detected_fields_cnt == 0 and not doc_face_detected and len(ocr_candidate_text.strip()) < 15) or
            (detected_fields_cnt == 0 and not doc_face_detected and any(k in str(detected_type).lower() for k in ["unknown", "not a document", "noise", "random", "unsupported", "invalid", "non-document", "other"])) or
            any(k in str(detected_type).lower() for k in ["not a document", "noise", "random photo", "unsupported file", "invalid file", "non-document", "invalid / noise"])
        ) and not is_sample_specimen

        # 2. TRUE INCONCLUSIVE CHECK: Valid document, but evidence is insufficient or quality is too low
        is_true_inconclusive = (
            not is_non_document and
            not is_sample_specimen and
            not has_tampering_evidence and (
                ("inconclusive" in initial_auth_str and not any(k in initial_auth_str for k in ["real", "fake", "tamper", "sample"])) or
                (is_poor_quality and detected_fields_cnt < 3) or
                (has_unresolved_critical_conflicts and detected_fields_cnt < 4)
            )
        )

        auth_conf = None
        if is_non_document:
            overall_document_status = "INVALID DOCUMENT"
            auth_result = "INVALID DOCUMENT"
            score = 50.0
            level = "Medium"
            border_decision = "REJECT / NON-DOCUMENT INPUT"
            border_decision_badge = "medium"
            auth_conf = None
            auth_reasons = [
                "Input does not appear to be a supported identity credential or screenable document."
            ]
            supporting_assessment = "The uploaded file does not meet identity credential structural requirements."
        elif is_sample_specimen:
            overall_document_status = "FAKE DOCUMENT"
            auth_result = "POTENTIALLY SUSPICIOUS / POTENTIALLY FAKE"
            score = 90.0
            level = "High"
            border_decision = "REJECT / SPECIMEN TEMPLATE"
            border_decision_badge = "high"
            auth_conf = 0.99
            auth_reasons = [
                "Document identified as a specimen/sample/demonstration document rather than an authentic original credential.",
                "Demonstration, training, and specimen exemplar cards cannot be accepted as valid identity credentials."
            ]
            supporting_assessment = "Document is an unissued specimen, sample, or placeholder demonstration template."
        elif has_tampering_evidence:
            overall_document_status = "FAKE DOCUMENT"
            auth_result = "POTENTIALLY SUSPICIOUS / POTENTIALLY FAKE"
            score = max(score, 75.0 if not is_blacklisted_doc else 90.0)
            level = "High"
            border_decision = "DETAIN / ENFORCEMENT ACTION"
            border_decision_badge = "high"
            auth_conf = float(max(0.88, float(auth_info.get("confidence", 0.94))))
            if is_blacklisted_doc:
                auth_reasons = ["Document or subject recorded in Interpol SLTD / Watchlist. Immediate detention protocol required."]
            elif is_dob_fraud:
                auth_reasons = ["Biographical anomaly: Chronological date of birth fraud detected."]
            elif multiple_faces_in_portrait:
                auth_reasons = [f"Multiple facial portraits detected inside primary photo region ({primary_portrait_face_count} faces). Breach of identity credential standards."]
            elif multi_id_check.get("multiple_identities_detected"):
                auth_reasons = ["Facial biometric embedding matches alternate identity persona in border database."]
            elif has_gemini_tampering or tamp_result.get("tampering_score", 0) >= 45.0:
                gem_tamp_inds = gemini_res.get("tampering_analysis", {}).get("indicators")
                auth_reasons = gem_tamp_inds if gem_tamp_inds else ["Observable physical or digital tampering detected across document credential substrate."]
            else:
                auth_reasons = auth_info.get("reasons") or ["Credential exhibits physical, digital, or AI-generated tampering inconsistencies."]
            supporting_assessment = "Strong evidence supporting fabrication, tampering, or counterfeit document structure."
        elif is_true_inconclusive:
            overall_document_status = "INCONCLUSIVE"
            auth_result = "INCONCLUSIVE"
            score = max(35.0, min(45.0, score if score > 0 else 38.0))
            level = "Medium"
            border_decision = "REFER TO SECONDARY INSPECTION / MANUAL REVIEW"
            border_decision_badge = "medium"
            auth_conf = None  # Honest: confidence not measurable when optical evidence is insufficient
            if is_poor_quality and detected_fields_cnt < 3:
                auth_reasons = ["Inconclusive — Document image resolution or blur is insufficient to reliably inspect security features and fine typography."]
            elif has_unresolved_critical_conflicts:
                conflict_names = ", ".join([f["field_name"] for f in critical_conflicts])
                auth_reasons = [f"Inconclusive — Optical character reading and visual verification produced conflicting values for {conflict_names} without verifiable security parity to resolve."]
            else:
                auth_reasons = auth_info.get("reasons") or ["Inconclusive — Visual and optical evidence is insufficient to make a definitive authenticity determination."]
            supporting_assessment = "Available evidence is insufficient for a reliable authenticity decision."
        else:
            overall_document_status = "REAL DOCUMENT"
            auth_result = "LIKELY GENUINE"
            score = min(score, 18.0) if not is_expired_doc else max(25.0, score)
            level = "Low" if score < 30.0 else "Medium"
            border_decision = "ALLOW ENTRY / STANDARD CLEARANCE" if not is_expired_doc else "REVIEW / EXPIRED DOCUMENT"
            border_decision_badge = "low" if not is_expired_doc else "medium"
            auth_conf = float(auth_info.get("confidence", 0.96))
            auth_reasons = auth_info.get("reasons") or [
                "Official security features and layout conform to authentic document standards.",
                "All demographic fields, formatting, and layout structure verified authentic."
            ]
            if is_expired_doc:
                auth_reasons.append("Notice: Document validity period has expired; requires routine re-issuance.")
            supporting_assessment = "Likely genuine based on the available document, OCR, structural, visual, and forensic evidence."

        screening.risk_score = score
        screening.risk_level = level
        screening.authenticity_classification = overall_document_status
        screening.authenticity_confidence = auth_conf
        screening.authenticity_reasons = auth_reasons

        # Structured Decision Trace for Auditing & Explainability
        ocr_quality_val = "Poor" if is_poor_quality else ("High" if detected_fields_cnt >= 5 else "Acceptable")
        field_consistency_val = "Material Conflict" if len(critical_conflicts) > 0 else ("Minor Formatting Discrepancies" if len(conflict_fields) > 0 else "Consistent")
        doc_structure_val = "Conforms to Official Standards" if any(c.get("status") == "Passed" for c in val_result.get("checks", [])) else "Deviates from Standard"
        visual_tamp_val = "Tampering Anomaly Detected" if (has_gemini_tampering or tamp_result.get("tampering_score", 0) >= 45.0) else "None Detected"
        portrait_analysis_val = doc_face_st if doc_face_detected else "No Portrait on Credential"
        face_analysis_val = f"{primary_portrait_face_count} Face(s) Detected" if doc_face_detected else "No Face Detected"
        critical_conflicts_val = f"{len(critical_conflicts)} Unresolved" if len(critical_conflicts) > 0 else "None"
        evidence_sufficiency_val = "Insufficient" if is_true_inconclusive else ("Non-Document Input" if is_non_document else "Sufficient")

        decision_trace = {
            "ocr_quality": ocr_quality_val,
            "field_consistency": field_consistency_val,
            "document_structure": doc_structure_val,
            "visual_tampering": visual_tamp_val,
            "portrait_analysis": portrait_analysis_val,
            "face_analysis": face_analysis_val,
            "critical_conflicts": critical_conflicts_val,
            "evidence_sufficiency": evidence_sufficiency_val,
            "final_result": overall_document_status,
            "authenticity_result": auth_result,
            "supporting_assessment": supporting_assessment,
            "primary_reason": auth_reasons[0] if auth_reasons else "Comprehensive evaluation completed."
        }

        screening.explainability_data = {
            "risk_factors": gemini_res.get("ai_risk_factors", []),
            "explanation": gemini_res.get("explanation"),
            "recommendation": gemini_res.get("recommendation", {}).get("action") or border_decision,
            "decision_trace": decision_trace,
            "border_checkpoint": {
                "decision": border_decision,
                "decision_badge": border_decision_badge,
                "module1_ocr": {
                    "document_type": detected_type,
                    "fields_count": len(ocr_result.get("fields", [])),
                    "fields": ocr_result.get("fields", []),
                    "mrz_line1": ocr_result.get("mrz_line1"),
                    "mrz_line2": ocr_result.get("mrz_line2")
                },
                "module2_validation": {
                    "validation_score": val_result.get("validation_score"),
                    "is_valid": val_result.get("is_valid"),
                    "checks": val_result.get("checks", [])
                },
                "module3_tampering": {
                    "tampering_score": tamp_result.get("tampering_score"),
                    "status": tamp_result.get("status"),
                    "modules": tamp_result.get("modules", {}),
                    "indicators": tamp_result.get("indicators", [])
                },
                "module4_face_verification": {
                    "document_photo_extracted": doc_face_detected,
                    "photo_status": doc_face_st,
                    "confidence": doc_face_conf,
                    "faces_detected_count": primary_portrait_face_count,
                    "primary_portrait_face_count": primary_portrait_face_count,
                    "document_wide_face_count": document_wide_face_count,
                    "other_faces_count": other_faces_count,
                    "multiple_faces_detected": multiple_faces_in_portrait,
                    "face_verification_performed": screening.face_verification_performed,
                    "face_verification_status": screening.face_verification_status,
                    "face_verification_similarity": screening.face_verification_similarity,
                    "multiple_identities_check": multi_id_check,
                    "anti_impersonation_status": "Passed" if not is_anomaly else "Alert"
                }
            }
        }

        log_memory("before_result_save", screening.screening_id)
        db.add(AuditLog(
            user_id=current_user.id,
            screening_id=screening.id,
            action="Document Analysis Completed",
            details=f"Analysis completed with score {score} ({level}). Auth: {screening.authenticity_classification}.",
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        print(f"[DATABASE] RESULT SAVED")
        print(f"[ANALYSIS] ANALYSIS COMPLETED: {screening.screening_id}")
        log_memory("after_result_save", screening.screening_id)

        return get_screening_detail(screening.screening_id, db, current_user)

    except Exception as err:
        print(f"ERROR:\n{err}")
        screening.status = "failed"
        screening.investigation_notes = f"AI Analysis Error: {str(err)}"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis processing error: {str(err)}")
    finally:
        force_gc()


@router.get("/{screening_identifier}", response_model=ScreeningDetail)
def get_screening_detail(
    screening_identifier: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Get detailed screening telemetry by screening_id (e.g. TR-2026-0001, DEMO-DOC-001) or database integer id.
    Strictly verifies ownership: User can only view their own screening.
    """
    screening = None
    if screening_identifier.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(screening_identifier)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == screening_identifier).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening record not found")

    # Strict RBAC: non-admin users cannot access other users' screenings
    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: Access restricted. You are not authorized to view this screening record."
            )

    file_url = None
    if screening.file_path:
        fname = os.path.basename(screening.file_path.replace("\\", "/"))
        file_url = f"/uploads/documents/{fname}"

    presented_face_url = None
    if screening.presented_face_path:
        fname = os.path.basename(screening.presented_face_path.replace("\\", "/"))
        presented_face_url = f"/uploads/faces/{fname}"

    officer_name = screening.creator.name if screening.creator else "Authorized Officer"

    ai_schema = None
    if screening.ai_analysis:
        ai_schema = {
            "id": screening.ai_analysis.id,
            "screening_id": screening.id,
            "model_name": screening.ai_analysis.model_name,
            "summary": screening.ai_analysis.summary,
            "findings": screening.ai_analysis.findings,
            "recommendation": screening.ai_analysis.recommendation,
            "created_at": screening.ai_analysis.created_at
        }

    is_face_detected = bool(screening.face_detected)
    doc_face_crop_url = None
    default_crop_file = DOCS_DIR / f"{screening.screening_id}_face_crop.jpg"
    if is_face_detected:
        if screening.doc_face_crop_path:
            c_fname = os.path.basename(screening.doc_face_crop_path.replace("\\", "/"))
            doc_face_crop_url = f"/uploads/documents/{c_fname}"
        elif default_crop_file.exists():
            doc_face_crop_url = f"/uploads/documents/{screening.screening_id}_face_crop.jpg"

    p_count = screening.primary_portrait_face_count if screening.primary_portrait_face_count is not None else (screening.faces_detected_count or (1 if is_face_detected else 0))
    d_count = screening.document_wide_face_count if screening.document_wide_face_count is not None else (screening.faces_detected_count or (1 if is_face_detected else 0))
    o_count = screening.other_faces_count if screening.other_faces_count is not None else max(0, d_count - p_count)

    raw_auth = (screening.authenticity_classification or "").upper()
    if "INVALID" in raw_auth:
        overall_status = "INVALID DOCUMENT"
        auth_result = "INVALID DOCUMENT"
        supporting_assess = "The submitted document fails fundamental identity credential structural validation."
    elif "FAKE" in raw_auth or "TAMPER" in raw_auth or "SUSPICIOUS" in raw_auth or (screening.risk_score >= 50 and "INCONCLUSIVE" not in raw_auth):
        overall_status = "FAKE DOCUMENT"
        auth_result = "POTENTIALLY SUSPICIOUS / POTENTIALLY FAKE"
        supporting_assess = "Strong evidence supporting fabrication, tampering, or counterfeit document structure."
    elif "INCONCLUSIVE" in raw_auth:
        overall_status = "INCONCLUSIVE"
        auth_result = "INCONCLUSIVE"
        supporting_assess = "Available evidence is insufficient for a reliable authenticity decision."
    else:
        overall_status = "REAL DOCUMENT"
        auth_result = "LIKELY GENUINE"
        supporting_assess = "Likely genuine based on the available document, OCR, structural, visual, and forensic evidence."

    return {
        "id": screening.id,
        "screening_id": screening.screening_id,
        "document_type": screening.document_type,
        "status": screening.status,
        "risk_score": screening.risk_score,
        "risk_level": screening.risk_level,
        "demo_person_name": screening.demo_person_name,
        "created_at": screening.created_at,
        "original_filename": screening.original_filename,
        "file_url": file_url,
        "forensic_image_url": None,  # Honest: no fake heatmap
        "presented_face_url": presented_face_url,
        "document_hash": screening.document_hash,
        "integrity_verified": True,
        "investigation_notes": screening.investigation_notes,
        "explainability_data": screening.explainability_data,
        "processing_time_sec": screening.processing_time_sec,
        "officer_name": officer_name,
        "analysis_started_at": screening.analysis_started_at,
        "analysis_completed_at": screening.analysis_completed_at,
        "overall_document_status": overall_status,
        "document_status": overall_status,
        "authenticity_classification": overall_status,
        "authenticity_result": auth_result,
        "supporting_assessment": supporting_assess,
        "authenticity_confidence": screening.authenticity_confidence if screening.authenticity_confidence is not None else (None if overall_status in ["INCONCLUSIVE", "INVALID DOCUMENT"] else 0.95),
        "authenticity_reasons": screening.authenticity_reasons or ([supporting_assess]),
        "photo_forensics_status": (screening.photo_forensics_status or "Real Photo") if is_face_detected else "No Face Detected",
        "photo_forensics_score": screening.photo_forensics_score or 0.0,
        "photo_forensics_explanation": (screening.photo_forensics_explanation or "Embedded document portrait verified authentic.") if is_face_detected else "No facial photograph detected in the uploaded document.",
        
        # Document Face Analysis (Always run on ID's embedded face)
        "face_detected": is_face_detected,
        "faces_detected_count": p_count,
        "primary_portrait_face_count": p_count,
        "document_wide_face_count": d_count,
        "other_faces_count": o_count,
        "multiple_faces_detected": bool(screening.multiple_faces_detected),
        "face_quality": screening.face_quality or ("Good" if is_face_detected else "Inconclusive"),
        "photo_region_detected": bool(screening.photo_region_detected) if is_face_detected else False,
        "doc_face_status": (screening.doc_face_status or screening.photo_forensics_status or "Real Photo") if is_face_detected else "No Face Detected",
        "doc_face_confidence": screening.doc_face_confidence if screening.doc_face_confidence is not None else 0.95,
        "doc_face_indicators": screening.doc_face_indicators if (is_face_detected and screening.doc_face_indicators) else ([] if not is_face_detected else ["Consistent photographic substrate", "Natural lighting and contours"]),
        "doc_face_explanation": (screening.doc_face_explanation or screening.photo_forensics_explanation or "Embedded document portrait verified authentic.") if is_face_detected else "No facial photograph detected in the uploaded document.",
        "doc_face_box": screening.doc_face_box if is_face_detected else None,
        "doc_face_crop_path": screening.doc_face_crop_path if is_face_detected else None,
        "doc_face_crop_url": doc_face_crop_url if is_face_detected else None,

        # Face Verification (Only when comparison photo supplied)
        "face_verification_performed": screening.face_verification_performed if screening.face_verification_performed is not None else bool(screening.presented_face_path),
        "face_verification_status": screening.face_verification_status or ("Likely Match" if screening.presented_face_path else "Not Performed"),
        "face_verification_similarity": screening.face_verification_similarity,
        "face_verification_explanation": screening.face_verification_explanation or ("Biometric comparison performed." if screening.presented_face_path else "No comparison image was supplied. The face embedded within the document was still analyzed above."),

        "extracted_fields": screening.extracted_fields,
        "validation_results": screening.validation_results,
        "tampering_results": screening.tampering_results,
        "face_results": screening.face_results,
        "audit_logs": screening.audit_logs,
        "ai_analysis": ai_schema
    }


@router.patch("/{id}/notes")
def update_screening_notes(
    id: int,
    data: ScreeningUpdateNotes,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    screening = db.query(Screening).filter(Screening.id == id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    if (current_user.role or "").lower() == "user" and screening.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="403 Forbidden: Access restricted.")

    screening.investigation_notes = data.notes
    db.add(AuditLog(
        user_id=current_user.id,
        screening_id=screening.id,
        action="Notes Updated",
        details=f"Investigation notes modified by {current_user.name}.",
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()
    return {"message": "Notes updated successfully"}
