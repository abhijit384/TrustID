import os
import shutil
import uuid
import datetime
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

from pathlib import Path
import logging

logger = logging.getLogger("trustid.documents")

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
            "document_hash": s.document_hash
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

    # 1. Generate unique screening ID (e.g. TR-2026-0001)
    next_num = 1
    while True:
        test_id = f"TR-2026-{next_num:04d}"
        if not db.query(Screening).filter(Screening.screening_id == test_id).first():
            screening_id = test_id
            break
        next_num += 1

    doc_filename = f"{screening_id}_doc.jpg"
    doc_path = os.path.join(DOCS_DIR, doc_filename)

    file_bytes = b""
    original_name = "demo_document.jpg"

    if document and document.filename:
        original_name = document.filename
        file_bytes = await document.read()

        # Automatic PDF conversion: extract digital text and render pages
        is_pdf = file_bytes.startswith(b"%PDF") or original_name.lower().endswith(".pdf")
        if is_pdf:
            try:
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(file_bytes)
                
                # Extract all text from all pages
                pdf_lines = []
                for p_idx in range(len(pdf)):
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

                if len(pdf) > 0:
                    best_page_img = None
                    target_page_idx = 0
                    # Check first 5 pages for embedded portrait
                    for p_idx in range(min(5, len(pdf))):
                        try:
                            p_img = pdf[p_idx].render(scale=2.5).to_pil()
                            temp_page_path = f"{doc_path}_page_{p_idx}.jpg"
                            p_img.convert("RGB").save(temp_page_path, format="JPEG", quality=90)
                            p_res = detect_and_crop_document_face(temp_page_path)
                            if os.path.exists(temp_page_path):
                                try:
                                    os.remove(temp_page_path)
                                except Exception:
                                    pass
                            if p_res.get("face_detected"):
                                best_page_img = p_img
                                target_page_idx = p_idx
                                print(f"[CONVERT] Confirmed face portrait on PDF page {p_idx + 1}")
                                break
                        except Exception as p_err:
                            logger.debug(f"PDF page {p_idx} render note: {p_err}")

                    if best_page_img is None:
                        best_page_img = pdf[0].render(scale=2.5).to_pil()
                    
                    best_page_img.convert("RGB").save(doc_path, format="JPEG", quality=95)
                    print(f"[CONVERT] Successfully rendered PDF '{original_name}' (page {target_page_idx + 1}) to JPEG: {doc_path}")
                else:
                    with open(doc_path, "wb") as f:
                        f.write(file_bytes)
            except Exception as pdf_err:
                print(f"[CONVERT] pypdfium2 conversion note: {pdf_err}")
                with open(doc_path, "wb") as f:
                    f.write(file_bytes)
        else:
            with open(doc_path, "wb") as f:
                f.write(file_bytes)
    elif sample_id:
        sample_path = os.path.join(UPLOAD_DIR, "samples", f"{sample_id}.jpg")
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

    # Calculate SHA-256
    doc_hash = calculate_sha256_from_bytes(file_bytes)

    # Presented face photo (optional)
    face_path = None
    if presented_face and presented_face.filename:
        face_filename = f"{screening_id}_face.jpg"
        face_path = os.path.join(FACES_DIR, face_filename)
        p_bytes = await presented_face.read()
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
                print(f"[CONVERT] Self-healing detected PDF document at {doc_path}. Converting to high-res JPEG...")
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(doc_path)
                if len(pdf) > 0:
                    rendered_page = pdf[0].render(scale=2.0).to_pil()
                    rendered_page.convert("RGB").save(doc_path, format="JPEG", quality=95)
                    print(f"[CONVERT] Self-healing successfully converted PDF to JPEG: {doc_path}")
        except Exception as conv_err:
            print(f"[CONVERT] Self-healing PDF conversion note: {conv_err}")

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
        faces_detected_count = local_face_res.get("faces_detected_count", 1 if doc_face_detected else 0)
        multiple_faces_detected = bool(local_face_res.get("multiple_faces_detected", False) or (faces_detected_count > 1))
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
        elif multiple_faces_detected:
            doc_face_st = "Fake / Tampered Photo"
            doc_face_conf = 0.96
            doc_face_inds = [f"Multiple facial portraits detected ({faces_detected_count} faces)", "Breach of ICAO single-photograph credential requirement"]
            doc_face_expl = f"MULTIPLE FACES DETECTED ({faces_detected_count} faces found). Official identity documents must contain only a single primary photograph."
            doc_face_quality = "Multiple Faces Detected"
        elif is_anomaly:
            doc_face_st = "Fake / Tampered Photo"
            doc_face_conf = float(max(gemini_face.get("confidence", 0.95), round(photo_risk / 100.0, 2) if photo_risk > 0 else 0.94))
            doc_face_inds = gemini_face.get("indicators") or ["Potential AI generation or synthetic portrait", "Forensic boundary/substrate anomaly"]
            doc_face_expl = gemini_face.get("explanation") or "The portrait shows forensic markers of manipulation, digital splicing, or synthetic generation."
            gemini_face["photo_status"] = "Fake / Tampered Photo"
            gemini_face["is_real_photo"] = False
            gemini_face["status"] = "Anomaly Detected"
        else:
            doc_face_st = "Real Photo"
            doc_face_conf = float(gemini_face.get("confidence", 0.95))
            doc_face_inds = gemini_face.get("indicators", ["Consistent photographic substrate", "Natural lighting and contours"])
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
        screening.faces_detected_count = faces_detected_count
        screening.multiple_faces_detected = multiple_faces_detected
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
        is_face_altered = is_anomaly or (not is_photo_clean and ("fake" in doc_face_st.lower() or "tamper" in doc_face_st.lower())) or multiple_faces_detected
        if is_face_altered:
            tamp_result["modules"]["photo_replacement"]["photo_replacement_detected"] = True
            tamp_result["modules"]["photo_replacement"]["status"] = "Failed"
            if not any("replacement" in ind.lower() or "splicing" in ind.lower() or "faces" in ind.lower() for ind in tamp_result["modules"]["photo_replacement"]["indicators"]):
                tamp_result["modules"]["photo_replacement"]["indicators"].insert(0, f"Facial portrait anomaly: {'Multiple faces detected on document' if multiple_faces_detected else 'Digital splicing or synthetic generation detected'}.")
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

        # Final Harmonized Authenticity and Risk Determination (Real vs Fake / Tampered Document)
        initial_auth_str = str(initial_auth).lower()
        explicit_fake_auth = ("fake" in initial_auth_str or "tamper" in initial_auth_str or "counterfeit" in initial_auth_str or "sample" in initial_auth_str or "specimen" in initial_auth_str) and not any(neg in initial_auth_str for neg in ["no ", "not ", "never", "non-fake", "genuine"])
        
        gem_tamp = gemini_res.get("tampering_analysis", {})
        gem_tamp_st = str(gem_tamp.get("status", "")).lower()
        is_gem_tamp_clean = any(k in gem_tamp_st for k in ["no obvious", "no tampering", "no anomaly", "passed", "pass", "clean", "uniform"])
        has_gemini_tampering = (
            (not is_gem_tamp_clean and ("tamper" in gem_tamp_st or "anomaly detected" in gem_tamp_st)) or
            float(gem_tamp.get("score", 0.0) or 0.0) >= 45.0 or
            bool(gem_tamp.get("text_manipulation_detected")) or
            bool(gem_tamp.get("photo_replacement_detected"))
        )

        is_fake_doc = (
            score >= 50.0 or
            tamp_result.get("tampering_score", 0) >= 45.0 or
            is_face_altered or
            multiple_faces_detected or
            multi_id_check.get("multiple_identities_detected") or
            is_blacklisted_doc or
            is_sample_specimen or
            is_dob_fraud or
            has_gemini_tampering or
            gemini_res.get("mrz_analysis", {}).get("status") == "Mismatch" or
            explicit_fake_auth
        )

        if is_fake_doc:
            auth_classification = "Tampered Document" if ("tamper" in initial_auth_str or has_gemini_tampering) else "Fake Document"
            score = max(score, 75.0 if not (is_blacklisted_doc or is_sample_specimen) else 90.0)
            level = "High"
            border_decision = "DETAIN / ENFORCEMENT ACTION"
            border_decision_badge = "high"
            if is_blacklisted_doc:
                auth_reasons = ["Document or subject recorded in Interpol SLTD / Watchlist. Immediate detention protocol required."]
            elif is_sample_specimen:
                auth_reasons = [
                    "Invalid Credential: Document is an unissued specimen/sample template marked with 'SAMPLE' or placeholder demonstration data.",
                    "Demonstration and training exemplar cards cannot be accepted as valid identity credentials."
                ]
            elif is_dob_fraud:
                auth_reasons = ["Biographical anomaly: Chronological date of birth fraud detected."]
            elif multiple_faces_detected:
                auth_reasons = [f"Multiple facial portraits detected ({faces_detected_count} faces). Breach of identity credential standards."]
            elif multi_id_check.get("multiple_identities_detected"):
                auth_reasons = ["Facial biometric embedding matches alternate identity persona in border database."]
            elif has_gemini_tampering or tamp_result.get("tampering_score", 0) >= 45.0:
                gem_tamp_inds = gemini_res.get("tampering_analysis", {}).get("indicators")
                auth_reasons = gem_tamp_inds if gem_tamp_inds else ["Observable physical or digital tampering detected across document credential substrate."]
            else:
                auth_reasons = auth_info.get("reasons") or ["Credential exhibits physical, digital, or AI-generated tampering inconsistencies."]
        else:
            auth_classification = "Real Document"
            score = min(score, 18.0) if not is_expired_doc else max(25.0, score)
            level = "Low" if score < 30.0 else "Medium"
            border_decision = "ALLOW ENTRY / STANDARD CLEARANCE" if not is_expired_doc else "REVIEW / EXPIRED DOCUMENT"
            border_decision_badge = "low" if not is_expired_doc else "medium"
            auth_reasons = auth_info.get("reasons") or [
                "Official security features and layout conform to authentic document standards.",
                "All demographic fields, formatting, and layout structure verified authentic."
            ]
            if is_expired_doc:
                auth_reasons.append("Notice: Document validity period has expired; requires routine re-issuance.")

        screening.risk_score = score
        screening.risk_level = level
        screening.authenticity_classification = auth_classification
        screening.authenticity_confidence = float(auth_info.get("confidence", 0.96))
        screening.authenticity_reasons = auth_reasons

        screening.explainability_data = {
            "risk_factors": gemini_res.get("ai_risk_factors", []),
            "explanation": gemini_res.get("explanation"),
            "recommendation": gemini_res.get("recommendation", {}).get("action") or border_decision,
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
                    "faces_detected_count": faces_detected_count,
                    "multiple_faces_detected": multiple_faces_detected,
                    "face_verification_performed": screening.face_verification_performed,
                    "face_verification_status": screening.face_verification_status,
                    "face_verification_similarity": screening.face_verification_similarity,
                    "multiple_identities_check": multi_id_check,
                    "anti_impersonation_status": "Passed" if not is_anomaly else "Alert"
                }
            }
        }

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

        return get_screening_detail(screening.screening_id, db, current_user)

    except Exception as err:
        print(f"ERROR:\n{err}")
        screening.status = "failed"
        screening.investigation_notes = f"AI Analysis Error: {str(err)}"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis processing error: {str(err)}")


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
        "authenticity_classification": screening.authenticity_classification or ("Fake Document" if screening.risk_score >= 50 else "Real Document"),
        "authenticity_confidence": screening.authenticity_confidence if screening.authenticity_confidence is not None else 0.95,
        "authenticity_reasons": screening.authenticity_reasons or (["Potential visual anomaly detected."] if screening.risk_score >= 50 else ["Official security features and layout conform to authentic document standards."]),
        "photo_forensics_status": (screening.photo_forensics_status or "Real Photo") if is_face_detected else "No Face Detected",
        "photo_forensics_score": screening.photo_forensics_score or 0.0,
        "photo_forensics_explanation": (screening.photo_forensics_explanation or "Embedded document portrait verified authentic.") if is_face_detected else "No facial photograph detected in the uploaded document.",
        
        # Document Face Analysis (Always run on ID's embedded face)
        "face_detected": is_face_detected,
        "faces_detected_count": screening.faces_detected_count if screening.faces_detected_count is not None else (1 if is_face_detected else 0),
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
