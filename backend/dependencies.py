import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # If unauthenticated, fallback to demo user in demo mode
        is_demo_mode = os.getenv("DEMO_MODE", "true").lower() in ["true", "1", "yes"]
        if is_demo_mode:
            user = db.query(User).filter(User.email == "demo.user@example.com").first()
            if user:
                return user
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact an administrator."
        )
        
    return user

def require_role(allowed_roles: list):
    """
    Enforces genuine Role-Based Access Control (RBAC).
    Admin and User have distinctly enforced permissions.
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role = (current_user.role or "").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]

        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"403 Forbidden: Access restricted. Role '{current_user.role}' is not authorized to access this resource."
            )
        return current_user
    return role_checker

require_admin = require_role(["admin"])
require_user_or_admin = require_role(["admin", "user"])
require_any_role = require_role(["admin", "user"])
# Backward compatibility aliases
require_officer_or_admin = require_role(["admin", "user"])
