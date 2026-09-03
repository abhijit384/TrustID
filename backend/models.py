import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user")  # admin, user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    screenings = relationship("Screening", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(50), default="registration")
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(String(50), unique=True, index=True, nullable=False)
    document_type = Column(String(50), default="Passport")  # Passport, ID Card, Driver License
    status = Column(String(50), default="Pending")  # Completed, Review Required, Flagged, In Progress
    risk_score = Column(Float, default=0.0)  # 0 to 100
    risk_level = Column(String(20), default="Low")  # Low, Medium, High
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Document details & files
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    forensic_image_path = Column(String(500), nullable=True)
    presented_face_path = Column(String(500), nullable=True)
    document_hash = Column(String(64), nullable=True)  # SHA-256
    demo_person_name = Column(String(100), nullable=True)
    investigation_notes = Column(Text, nullable=True)
    explainability_data = Column(JSON, nullable=True)
    processing_time_sec = Column(Float, default=3.8)
    analysis_started_at = Column(DateTime, nullable=True)
    analysis_completed_at = Column(DateTime, nullable=True)

    # Authenticity Assessment (Section 4 & 15)
    authenticity_classification = Column(String(50), default="Likely Genuine")  # Likely Genuine, Potentially Fake / Suspicious, Inconclusive
    authenticity_confidence = Column(Float, default=0.91)
    authenticity_reasons = Column(JSON, nullable=True)

    # Document Photo Forensics (Section 6 & 16)
    photo_forensics_status = Column(String(50), default="No Obvious Anomaly")
    photo_forensics_score = Column(Float, default=0.0)
    photo_forensics_explanation = Column(Text, nullable=True)

    # Document Face Analysis (Always run on ID's embedded face)
    face_detected = Column(Boolean, default=True)
    faces_detected_count = Column(Integer, default=1)
    multiple_faces_detected = Column(Boolean, default=False)
    face_quality = Column(String(50), default="Good")  # Good, Fair, Insufficient
    photo_region_detected = Column(Boolean, default=True)
    doc_face_status = Column(String(50), default="No Obvious Anomaly")  # No Obvious Anomaly, Potential Anomaly, Inconclusive
    doc_face_confidence = Column(Float, default=0.91)
    doc_face_indicators = Column(JSON, nullable=True)
    doc_face_explanation = Column(Text, nullable=True)
    doc_face_box = Column(JSON, nullable=True)
    doc_face_crop_path = Column(String(500), nullable=True)

    # Optional 1:1 Face Verification (Only when comparison photo supplied)
    face_verification_performed = Column(Boolean, default=False)
    face_verification_status = Column(String(50), default="Not Performed")  # Not Performed, Likely Match, Review Required
    face_verification_similarity = Column(Float, nullable=True)
    face_verification_explanation = Column(Text, nullable=True)

    creator = relationship("User", back_populates="screenings")
    extracted_fields = relationship("ExtractedField", back_populates="screening", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="screening", cascade="all, delete-orphan")
    tampering_results = relationship("TamperingResult", back_populates="screening", cascade="all, delete-orphan")
    face_results = relationship("FaceResult", back_populates="screening", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="screening", cascade="all, delete-orphan")
    ai_analysis = relationship("AIAnalysis", back_populates="screening", uselist=False, cascade="all, delete-orphan")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_value_demo = Column(String(255), nullable=True)
    confidence = Column(Float, default=0.95)
    source = Column(String(50), default="OCR + Gemini")  # "OCR + Gemini", "OCR", "Gemini Visual"
    validation_status = Column(String(50), default="verified")  # "verified", "review", "conflict", "not_detected"
    ocr_value = Column(String(255), nullable=True)
    visual_value = Column(String(255), nullable=True)
    discrepancy_note = Column(String(255), nullable=True)

    screening = relationship("Screening", back_populates="extracted_fields")


class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False)
    check_name = Column(String(100), nullable=False)
    status = Column(String(20), default="Passed")  # Passed, Warning, Failed
    message = Column(String(255), nullable=False)

    screening = relationship("Screening", back_populates="validation_results")


class TamperingResult(Base):
    __tablename__ = "tampering_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False)
    indicator_type = Column(String(100), nullable=False)
    confidence = Column(Float, default=0.0)
    region_data = Column(JSON, nullable=True)  # x, y, width, height, explanation

    screening = relationship("Screening", back_populates="tampering_results")


class FaceResult(Base):
    __tablename__ = "face_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False)
    similarity_score = Column(Float, default=0.0)
    status = Column(String(50), default="Likely Match")  # Likely Match, Review Required, Inconclusive

    screening = relationship("Screening", back_populates="face_results")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
    screening = relationship("Screening", back_populates="audit_logs")


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), nullable=False, unique=True)
    model_name = Column(String(100), default="DEMO AI MODE")
    summary = Column(Text, nullable=False)
    findings = Column(JSON, nullable=True)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    screening = relationship("Screening", back_populates="ai_analysis")
