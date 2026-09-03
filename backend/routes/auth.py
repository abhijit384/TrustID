from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, AuditLog, EmailOTP
from backend.schemas import Token, UserLogin, UserResponse, SendOTPRequest, SendOTPResponse, RegisterWithOTPRequest
from backend.auth import verify_password, create_access_token, get_password_hash
from backend.dependencies import get_current_user
from backend.services.email_service import send_otp_email
import datetime
import random
import os

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/send-otp", response_model=SendOTPResponse)
def send_registration_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Generate and dispatch a real-time 6-digit OTP code to the requested email.
    Stops duplicate account creation if email already exists in the system.
    """
    clean_email = request.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # 1. Check whether email is already signed up to avoid duplicate account creation
    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already registered. Please sign in with your password instead."
        )

    # 2. Generate secure 6-digit code
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)

    # 3. Store in database
    otp_entry = EmailOTP(
        email=clean_email,
        otp_code=otp_code,
        purpose=request.purpose or "registration",
        is_verified=False,
        expires_at=expires_at,
        created_at=datetime.datetime.utcnow()
    )
    db.add(otp_entry)
    db.commit()

    # 4. Dispatch email in real-time
    dispatch_res = send_otp_email(
        recipient_email=clean_email,
        otp_code=otp_code,
        user_name=request.name or "User"
    )

    is_demo = os.getenv("DEMO_MODE", "true").lower() == "true"
    preview = otp_code if (is_demo or not dispatch_res.get("delivered")) else None

    return {
        "success": True,
        "message": f"Security verification code dispatched to {clean_email}.",
        "preview_otp": preview
    }


@router.post("/verify-register", response_model=Token)
def verify_otp_and_register(request: RegisterWithOTPRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and complete user account registration.
    Authenticates immediately and returns persistent access token.
    """
    clean_email = request.email.strip().lower()
    clean_name = request.name.strip()
    clean_code = request.otp.strip()

    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your full official name."
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters in length."
        )

    # Re-verify uniqueness
    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    # Verify latest unexpired OTP
    now = datetime.datetime.utcnow()
    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email.ilike(clean_email),
            EmailOTP.is_verified == False,
            EmailOTP.expires_at > now
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record or otp_record.otp_code.strip() != clean_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check your code or request a new OTP."
        )

    # Hash password & create user
    hashed_pwd = get_password_hash(request.password)
    new_user = User(
        name=clean_name,
        email=clean_email,
        password_hash=hashed_pwd,
        role="user",
        is_active=True,
        created_at=now
    )
    db.add(new_user)
    
    # Mark OTP as verified
    otp_record.is_verified = True
    db.commit()
    db.refresh(new_user)

    # Create session token
    token = create_access_token(data={"sub": new_user.email, "role": new_user.role, "name": new_user.name})

    # Add audit log
    db.add(AuditLog(
        user_id=new_user.id,
        action="User Account Created",
        details=f"User {new_user.name} ({new_user.email}) registered and verified email via OTP.",
        timestamp=now
    ))
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify credentials or use demo buttons.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator."
        )

    # Generate token
    token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.name})

    # Log login action in audit trail
    log = AuditLog(
        user_id=user.id,
        action="User Signed In",
        details=f"{user.name} ({user.role}) authenticated successfully.",
        timestamp=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

