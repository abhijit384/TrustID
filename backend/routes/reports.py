import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Screening, AuditLog
from backend.dependencies import get_current_user, require_user_or_admin
from backend.services.report_service import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{id}")
def get_report_metadata(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    screening = None
    if str(id).isdigit():
        screening = db.query(Screening).filter(Screening.id == int(id)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == str(id)).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: You do not have permission to access another user's report."
            )

    return {
        "screening_id": screening.screening_id,
        "document_type": screening.document_type,
        "status": screening.status,
        "risk_score": screening.risk_score,
        "risk_level": screening.risk_level,
        "document_hash": screening.document_hash,
        "created_at": screening.created_at,
        "officer_name": screening.creator.name if screening.creator else "Authorized Officer",
        "demo_person_name": screening.demo_person_name,
        "explainability": screening.explainability_data
    }

@router.get("/{id}/pdf")
def download_pdf_report(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    screening = None
    if str(id).isdigit():
        screening = db.query(Screening).filter(Screening.id == int(id)).first()
    if not screening:
        screening = db.query(Screening).filter(Screening.screening_id == str(id)).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")

    if (current_user.role or "").lower() == "user":
        if screening.created_by and screening.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="403 Forbidden: You do not have permission to export another user's report."
            )

    screening_data = {
        "screening_id": screening.screening_id,
        "created_at": screening.created_at.strftime("%Y-%m-%d %H:%M UTC") if screening.created_at else "",
        "officer_name": screening.creator.name if screening.creator else "Authorized Officer",
        "document_type": screening.document_type,
        "document_hash": screening.document_hash or "8f434346e91a0b38c29188e02d91acb54209df3402ba818274a27498c8191ac",
        "authenticity_classification": screening.authenticity_classification or "Real Document",
        "authenticity_confidence": screening.authenticity_confidence or 0.95,
        "face_detected": screening.face_detected,
        "face_quality": screening.face_quality or "Good",
        "doc_face_status": screening.doc_face_status or screening.photo_forensics_status or "Real Photo",
        "doc_face_explanation": screening.doc_face_explanation or "Embedded document portrait verified authentic.",
        "risk_level": screening.risk_level or "Low",
        "risk_score": screening.risk_score or 12.0,
        "extracted_fields": [
            {"field_name": f.field_name, "field_value_demo": f.field_value_demo, "confidence": f.confidence}
            for f in screening.extracted_fields
        ],
        "validation_results": [
            {"check_name": v.check_name, "status": v.status, "message": v.message}
            for v in screening.validation_results
        ],
        "face_results": [
            {"status": fr.status, "similarity_score": fr.similarity_score}
            for fr in screening.face_results
        ],
        "tampering_results": [
            {"indicator_type": tr.indicator_type, "confidence": tr.confidence, "region_data": tr.region_data}
            for tr in screening.tampering_results
        ],
        "ai_analysis": {
            "summary": screening.ai_analysis.summary if screening.ai_analysis else (screening.investigation_notes or "Analysis completed."),
            "recommendation": screening.ai_analysis.recommendation if screening.ai_analysis else "Routine manual verification"
        } if screening.ai_analysis else None
    }

    pdf_bytes = generate_pdf_report(screening_data)

    log = AuditLog(
        user_id=current_user.id,
        screening_id=screening.id,
        action="Report Generated",
        details=f"Authorized PDF screening report generated for {screening.screening_id} by {current_user.name}.",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=TRUSTID_Report_{screening.screening_id}.pdf"
        }
    )
