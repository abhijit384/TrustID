from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, AuditLog, Screening
from backend.schemas import AuditLogSchema
from backend.dependencies import get_current_user, require_user_or_admin

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])

@router.get("", response_model=List[AuditLogSchema])
def get_audit_trail(
    screening_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_user_or_admin)
):
    """
    Cryptographic audit ledger.
    - Admin: Full visibility into all system operations, Gemini AI calls, and officer reviews.
    - User: Filtered strictly to audit events associated with their own authorized screening records.
    """
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    # User role is restricted to their own screening records
    if (current_user.role or "").lower() == "user":
        user_screening_ids = [s[0] for s in db.query(Screening.id).filter(Screening.created_by == current_user.id).all()]
        query = query.filter((AuditLog.screening_id.in_(user_screening_ids)) | (AuditLog.user_id == current_user.id))

    if screening_id:
        query = query.filter(AuditLog.screening_id == screening_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.limit(limit).all()
    results = []
    for log in logs:
        results.append({
            "id": log.id,
            "user_id": log.user_id,
            "screening_id": log.screening_id,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp,
            "user_name": log.user.name if log.user else "System Agent",
            "user_role": log.user.role if log.user else "automated"
        })
    return results
