from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class SendOTPRequest(BaseModel):
    email: str
    name: Optional[str] = "User"
    purpose: Optional[str] = "registration"

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    preview_otp: Optional[str] = None

class RegisterWithOTPRequest(BaseModel):
    name: str
    email: str
    password: str
    otp: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserManagementSchema(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None
    screenings_count: Optional[int] = 0

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    is_active: bool

class ScreeningUploadResponse(BaseModel):
    success: bool = True
    screening_id: str
    database_id: int
    id: int
    status: str

# --- Analysis Sub-Schemas ---
class ExtractedFieldSchema(BaseModel):
    id: Optional[int] = None
    field_name: str
    field_value_demo: Optional[str] = None
    confidence: float
    source: Optional[str] = "OCR + Gemini"
    validation_status: Optional[str] = "verified"
    ocr_value: Optional[str] = None
    visual_value: Optional[str] = None
    discrepancy_note: Optional[str] = None

    class Config:
        from_attributes = True

class ValidationResultSchema(BaseModel):
    id: Optional[int] = None
    check_name: str
    status: str
    message: str

    class Config:
        from_attributes = True

class TamperingResultSchema(BaseModel):
    id: Optional[int] = None
    indicator_type: str
    confidence: float
    region_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class FaceResultSchema(BaseModel):
    id: Optional[int] = None
    similarity_score: float
    status: str

    class Config:
        from_attributes = True

class AuditLogSchema(BaseModel):
    id: int
    user_id: Optional[int] = None
    screening_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime
    user_name: Optional[str] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True

# --- AI Analysis Schemas ---
class AIAnalysisSchema(BaseModel):
    id: Optional[int] = None
    screening_id: int
    model_name: str
    summary: str
    findings: Optional[Dict[str, Any]] = None
    recommendation: str
    created_at: Optional[datetime] = None
    is_fallback: Optional[bool] = False
    fallback_message: Optional[str] = None

    class Config:
        from_attributes = True

# --- Screening Schemas ---
class ScreeningCreate(BaseModel):
    document_type: str = "Passport"
    sample_id: Optional[str] = None
    demo_person_name: Optional[str] = None

class ScreeningUpdateNotes(BaseModel):
    notes: str

class ScreeningSummary(BaseModel):
    id: int
    screening_id: str
    document_type: str
    status: str
    risk_score: float
    risk_level: str
    demo_person_name: Optional[str] = None
    created_at: datetime
    officer_name: Optional[str] = None
    document_hash: Optional[str] = None
    authenticity_classification: Optional[str] = "Likely Genuine"
    authenticity_confidence: Optional[float] = 0.91

    class Config:
        from_attributes = True

class ScreeningDetail(BaseModel):
    id: int
    screening_id: str
    document_type: str
    status: str
    risk_score: float
    risk_level: str
    demo_person_name: Optional[str] = None
    created_at: datetime
    original_filename: Optional[str] = None
    file_url: Optional[str] = None
    forensic_image_url: Optional[str] = None
    presented_face_url: Optional[str] = None
    document_hash: Optional[str] = None
    integrity_verified: bool = True
    investigation_notes: Optional[str] = None
    explainability_data: Optional[Dict[str, Any]] = None
    processing_time_sec: float = 3.8
    officer_name: Optional[str] = None
    analysis_started_at: Optional[datetime] = None
    analysis_completed_at: Optional[datetime] = None

    # Authenticity & Forensics
    authenticity_classification: Optional[str] = "Likely Genuine"
    authenticity_confidence: Optional[float] = 0.91
    authenticity_reasons: Optional[List[str]] = []
    photo_forensics_status: Optional[str] = "No Obvious Anomaly"
    photo_forensics_score: Optional[float] = 0.0
    photo_forensics_explanation: Optional[str] = None

    # Document Face Analysis (Always run on ID's embedded face)
    face_detected: Optional[bool] = True
    faces_detected_count: Optional[int] = 1
    multiple_faces_detected: Optional[bool] = False
    face_quality: Optional[str] = "Good"
    photo_region_detected: Optional[bool] = True
    doc_face_status: Optional[str] = "No Obvious Anomaly"
    doc_face_confidence: Optional[float] = 0.91
    doc_face_indicators: Optional[List[str]] = []
    doc_face_explanation: Optional[str] = None
    doc_face_box: Optional[Dict[str, Any]] = None
    doc_face_crop_path: Optional[str] = None
    doc_face_crop_url: Optional[str] = None

    # Optional 1:1 Face Verification
    face_verification_performed: Optional[bool] = False
    face_verification_status: Optional[str] = "Not Performed"
    face_verification_similarity: Optional[float] = None
    face_verification_explanation: Optional[str] = None

    extracted_fields: List[ExtractedFieldSchema] = []
    validation_results: List[ValidationResultSchema] = []
    tampering_results: List[TamperingResultSchema] = []
    face_results: List[FaceResultSchema] = []
    audit_logs: List[AuditLogSchema] = []
    ai_analysis: Optional[AIAnalysisSchema] = None

    class Config:
        from_attributes = True

class AdminAnalyticsSchema(BaseModel):
    total_screenings: int
    low_risk: int
    medium_risk: int
    high_risk: int
    likely_genuine: int
    potentially_suspicious: int
    inconclusive: int
    average_processing_seconds: float
    daily_screenings: List[Dict[str, Any]] = []
    risk_distribution: List[Dict[str, Any]] = []
    top_indicators: List[Dict[str, Any]] = []
    authenticity_distribution: Optional[List[Dict[str, Any]]] = []
    processing_time_trend: Optional[List[Dict[str, Any]]] = []
    recent_flagged: Optional[List[Dict[str, Any]]] = []
    common_anomalies: Optional[List[Dict[str, Any]]] = []

    # Face Intelligence Metrics (Section 16, 17, 24)
    total_doc_face_analyses: Optional[int] = 0
    faces_detected: Optional[int] = 0
    faces_not_detected: Optional[int] = 0
    face_detected: Optional[int] = 0
    face_inconclusive: Optional[int] = 0
    photo_anomalies: Optional[int] = 0
    potential_photo_anomalies: Optional[int] = 0
    face_verifications_performed: Optional[int] = 0
    face_verification_matches: Optional[int] = 0
    face_verification_reviews: Optional[int] = 0

# --- Dashboard & Analytics Schemas ---
class DashboardStats(BaseModel):
    documents_screened: int
    total_users: Optional[int] = 2
    flagged_for_review: int
    low_risk: int
    average_processing_time: float
    screening_trend: List[Dict[str, Any]]
    risk_distribution: List[Dict[str, Any]]
    detection_indicators: List[Dict[str, Any]]
    recent_screenings: List[ScreeningSummary]
    system_health: Optional[str] = "All Services Operational"
    ai_stats: Optional[Dict[str, Any]] = None

class UserDashboardStats(BaseModel):
    my_screenings: int
    my_pending_reviews: int
    my_completed: int
    my_recent_documents: List[ScreeningSummary]
    my_reports_count: int
    personal_activity: List[Dict[str, Any]]

class AnalyticsStats(BaseModel):
    total_screenings: int
    flag_rate_pct: float
    avg_processing_time: float
    analysis_success_rate_pct: float
    indicator_breakdown: List[Dict[str, Any]]
    daily_volume: List[Dict[str, Any]]
    officer_activity: List[Dict[str, Any]]
    doc_type_distribution: List[Dict[str, Any]]
