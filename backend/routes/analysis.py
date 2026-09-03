import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Screening, ExtractedField, ValidationResult, TamperingResult, FaceResult, AuditLog, AIAnalysis
from backend.dependencies import get_current_user, require_user_or_admin
from backend.services.gemini_service import analyze_document_with_gemini
from backend.services.ocr_service import extract_document_ocr
from backend.services.validation_service import validate_document_rules
from backend.services.tampering_service import run_tampering_analysis
from backend.services.face_service import verify_face_similarity
from backend.services.risk_service import calculate_composite_risk

router = APIRouter(prefix="/api/screenings", tags=["Analysis Pipeline"])

def verify_screening_access(screening: Screening, current_user: User):
    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: Access restricted. You cannot run analysis on another user's document."
            )

@router.post("/{id}/analyze")
def run_full_pipeline(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    """
    Run complete multimodal analysis pipeline via Gemini 3.5 Flash:
    OCR -> Validation -> Tampering -> Face (if provided) -> Dynamic Risk Assessment.
    """
    screening = db.query(Screening).filter(Screening.id == id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    verify_screening_access(screening, current_user)

    if not screening.file_path or not os.path.exists(screening.file_path):
        raise HTTPException(status_code=400, detail="Document file does not exist on server.")

    # 1. Execute Gemini 3.5 Flash Analysis
    try:
        gemini_res = analyze_document_with_gemini(
            document_path=screening.file_path,
            comparison_face_path=screening.presented_face_path
        )
    except Exception as gemini_err:
        screening.status = "Analysis Failed"
        screening.investigation_notes = f"AI ANALYSIS FAILED: {gemini_err}"
        db.add(AuditLog(
            user_id=current_user.id,
            screening_id=screening.id,
            action="Gemini Analysis Failed",
            details=f"Error executing Gemini 3.5 Flash: {str(gemini_err)[:200]}",
            timestamp=datetime.datetime.utcnow()
        ))
        db.commit()
        raise HTTPException(status_code=502, detail=f"Gemini 3.5 Flash analysis failed: {gemini_err}")

    # 2. Reset and update ExtractedField records
    db.query(ExtractedField).filter(ExtractedField.screening_id == screening.id).delete()
    ocr_result = extract_document_ocr(screening.file_path, gemini_data=gemini_res)
    for field in ocr_result.get("fields", []):
        db.add(ExtractedField(
            screening_id=screening.id,
            field_name=field["field_name"],
            field_value_demo=field["field_value_demo"],
            confidence=field["confidence"]
        ))

    # 3. Reset and update ValidationResult records
    db.query(ValidationResult).filter(ValidationResult.screening_id == screening.id).delete()
    fields_dict = {f["field_name"]: f["field_value_demo"] for f in ocr_result.get("fields", [])}
    val_result = validate_document_rules(fields_dict, gemini_data=gemini_res)
    for check in val_result.get("checks", []):
        db.add(ValidationResult(
            screening_id=screening.id,
            check_name=check["check_name"],
            status=check["status"],
            message=check["message"]
        ))

    # 4. Reset and update TamperingResult records
    db.query(TamperingResult).filter(TamperingResult.screening_id == screening.id).delete()
    tamp_result = run_tampering_analysis(screening.file_path, gemini_data=gemini_res)
    for ind in tamp_result.get("indicators", []):
        db.add(TamperingResult(
            screening_id=screening.id,
            indicator_type=ind.get("type", "Visual Anomaly"),
            confidence=ind.get("confidence", 0.5),
            region_data=ind.get("region_data")
        ))

    # 5. Reset and update FaceResult records
    db.query(FaceResult).filter(FaceResult.screening_id == screening.id).delete()
    face_result = verify_face_similarity(
        screening.file_path,
        presented_face_path=screening.presented_face_path,
        gemini_data=gemini_res
    )
    db.add(FaceResult(
        screening_id=screening.id,
        similarity_score=face_result.get("similarity_score", 0.0),
        status=face_result.get("status", "Not Evaluated")
    ))

    # 6. Dynamic Risk Assessment
    risk_res = calculate_composite_risk(gemini_res)
    screening.risk_score = risk_res["overall_score"]
    screening.risk_level = risk_res["risk_level"]
    screening.status = "Completed" if risk_res["overall_score"] < 30 else "Review Required"
    screening.explainability_data = risk_res

    extracted_name = gemini_res.get("extracted_information", {}).get("name")
    if extracted_name and str(extracted_name).lower() not in ["null", "not detected"]:
        screening.demo_person_name = extracted_name

    detected_type = gemini_res.get("document_type")
    if detected_type:
        screening.document_type = detected_type

    # 7. Update AIAnalysis record
    db.query(AIAnalysis).filter(AIAnalysis.screening_id == screening.id).delete()
    db.add(AIAnalysis(
        screening_id=screening.id,
        model_name="gemini-3.5-flash",
        summary=gemini_res.get("explanation", "Analysis completed."),
        findings=gemini_res,
        recommendation=gemini_res.get("recommendation", {}).get("action", "Routine manual verification")
    ))

    db.add(AuditLog(
        user_id=current_user.id,
        screening_id=screening.id,
        action="Gemini 3.5 Flash Pipeline Completed",
        details=f"Pipeline executed. Risk: {risk_res['risk_level']} ({risk_res['overall_score']}/100).",
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()

    return {
        "message": "Complete TRUSTID Gemini 3.5 Flash analysis pipeline executed successfully",
        "risk": risk_res,
        "ai_analysis": gemini_res
    }

@router.post("/{id}/ocr")
def run_ocr_step(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    return run_full_pipeline(id, db, current_user)

@router.post("/{id}/validate")
def run_validation_step(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    return run_full_pipeline(id, db, current_user)

@router.post("/{id}/tampering")
def run_tampering_step(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    return run_full_pipeline(id, db, current_user)

@router.post("/{id}/face")
def run_face_step(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    return run_full_pipeline(id, db, current_user)

@router.post("/{id}/risk")
def run_risk_step(id: int, db: Session = Depends(get_db), current_user: User = Depends(require_user_or_admin)):
    return run_full_pipeline(id, db, current_user)
