from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Screening, AuditLog
from backend.schemas import UserManagementSchema, UserRoleUpdate, UserStatusUpdate
from backend.dependencies import require_admin
import datetime

router = APIRouter(prefix="/api/users", tags=["User Management (Admin Only)"])

@router.get("", response_model=List[UserManagementSchema])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    List all platform users with roles, screening counts, and active status. Admin only.
    """
    users = db.query(User).all()
    results = []
    for u in users:
        count = db.query(Screening).filter(Screening.created_by == u.id).count()
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": getattr(u, "is_active", True),
            "created_at": u.created_at,
            "screenings_count": count
        })
    return results

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update a user's role (admin or user). Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = payload.role.lower().strip()
    if new_role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'.")
    
    old_role = user.role
    user.role = new_role

    db.add(AuditLog(
        user_id=current_user.id,
        action="Admin → User Role Updated",
        details=f"Admin {current_user.name} changed role for {user.name} from '{old_role}' to '{new_role}'.",
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()
    return {"message": f"User {user.name} role updated to {new_role}", "role": new_role}

@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Toggle user active status. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    status_str = "active" if payload.is_active else "deactivated"

    db.add(AuditLog(
        user_id=current_user.id,
        action="Admin → User Status Changed",
        details=f"Admin {current_user.name} set status of {user.name} to {status_str}.",
        timestamp=datetime.datetime.utcnow()
    ))
    db.commit()
    return {"message": f"User {user.name} status updated to {status_str}", "is_active": user.is_active}
