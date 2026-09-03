import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Screening, AIAnalysis, AuditLog
from backend.schemas import AIAnalysisSchema
from backend.dependencies import get_current_user, require_user_or_admin
from backend.services.gemini_service import analyze_document_with_gemini

router = APIRouter(prefix="/api/ai", tags=["TRUSTID AI Analysis"])

@router.post("/analyze/{screening_id}", response_model=AIAnalysisSchema)
def trigger_ai_analysis(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Execute Google Gemini 3.5 Flash document analysis on the actual uploaded document.
    Stores result in ai_analysis table and generates audit logs.
    """
    screening = None
    if screening_id.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(screening_id)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()

    if not screening:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    # RBAC check: User can only analyze their own screenings; Admin can analyze any
    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: You do not have permission to analyze another user's screening record."
            )

    if not screening.file_path:
        raise HTTPException(status_code=400, detail="Document file path not recorded.")

    # Audit log: User requested analysis
    db.add(AuditLog(
        user_id=current_user.id,
        screening_id=screening.id,
        action="User → AI Analysis Requested",
        details=f"{current_user.name} ({current_user.role}) initiated Gemini 3.5 Flash analysis for {screening.screening_id}.",
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()

    # Invoke Gemini 3.5 Flash with actual document file
    try:
        ai_result = analyze_document_with_gemini(
            document_path=screening.file_path,
            comparison_face_path=screening.presented_face_path
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini 3.5 Flash analysis failed: {exc}"
        )

    # Store / update ai_analysis in database
    existing_analysis = db.query(AIAnalysis).filter(AIAnalysis.screening_id == screening.id).first()
    summary_text = ai_result.get("explanation", "Document analysis completed.")
    recommendation_text = ai_result.get("recommendation", {}).get("action", "Routine manual verification")

    if existing_analysis:
        existing_analysis.model_name = "gemini-3.5-flash"
        existing_analysis.summary = summary_text
        existing_analysis.findings = ai_result
        existing_analysis.recommendation = recommendation_text
        existing_analysis.created_at = datetime.datetime.utcnow()
        db_record = existing_analysis
    else:
        db_record = AIAnalysis(
            screening_id=screening.id,
            model_name="gemini-3.5-flash",
            summary=summary_text,
            findings=ai_result,
            recommendation=recommendation_text,
            created_at=datetime.datetime.utcnow()
        )
        db.add(db_record)

    # Sync recommendation onto screening record
    risk_info = ai_result.get("risk_assessment", {})
    if "score" in risk_info:
        screening.risk_score = float(risk_info["score"])
        screening.risk_level = str(risk_info.get("level", "Low"))
        screening.status = "Completed" if screening.risk_score < 30 else "Review Required"

    db.add(AuditLog(
        user_id=current_user.id,
        screening_id=screening.id,
        action="System → Gemini 3.5 Flash Completed",
        details=f"Analysis computed via gemini-3.5-flash. Risk: {screening.risk_level} ({screening.risk_score:.0f}/100).",
        timestamp=datetime.datetime.utcnow()
    ))

    db.commit()
    db.refresh(db_record)

    return {
        "id": db_record.id,
        "screening_id": screening.id,
        "model_name": db_record.model_name,
        "summary": db_record.summary,
        "findings": db_record.findings,
        "recommendation": db_record.recommendation,
        "created_at": db_record.created_at,
        "is_fallback": False,
        "fallback_message": None
    }


@router.get("/analyze/{screening_id}", response_model=AIAnalysisSchema)
def get_saved_ai_analysis(
    screening_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Retrieve persisted AI analysis for a screening record.
    """
    screening = None
    if screening_id.isdigit():
        screening = db.query(Screening).filter(Screening.id == int(screening_id)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == screening_id).first()

    if not screening:
        raise HTTPException(status_code=404, detail="Screening record not found.")

    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: You do not have permission to view this screening's AI analysis."
            )

    analysis = db.query(AIAnalysis).filter(AIAnalysis.screening_id == screening.id).first()
    if not analysis:
        return trigger_ai_analysis(screening_id=screening_id, db=db, current_user=current_user)

    return analysis
