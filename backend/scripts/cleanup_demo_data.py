import os
import shutil
import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Screening, ExtractedField, ValidationResult, TamperingResult, FaceResult, AuditLog, AIAnalysis
from backend.auth import get_password_hash
from backend.utils.hashing import calculate_sha256_from_file
from backend.services.face_service import detect_and_crop_document_face

def run_cleanup():
    print("[CLEANUP] Initializing TRUSTID database cleanup...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Preserve / ensure demo users
        admin = db.query(User).filter(User.email == "demo.admin@example.com").first()
        if not admin:
            admin = User(
                name="Subhashree Saha",
                email="demo.admin@example.com",
                password_hash=get_password_hash("Demo@123"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            admin.name = "Subhashree Saha"
            admin.password_hash = get_password_hash("Demo@123")
            admin.role = "admin"
            admin.is_active = True
            db.commit()

        user = db.query(User).filter(User.email == "demo.user@example.com").first()
        if not user:
            user = User(
                name="User",
                email="demo.user@example.com",
                password_hash=get_password_hash("Demo@123"),
                role="user",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.name = "User"
            user.password_hash = get_password_hash("Demo@123")
            user.role = "user"
            user.is_active = True
            db.commit()

        # Remove deprecated users
        db.query(User).filter(~User.email.in_(["demo.admin@example.com", "demo.user@example.com"])).delete(synchronize_session=False)
        db.commit()
        print("[CLEANUP] Preserved exactly two users: Subhashree Saha (Admin) and User (User).")

        # 2. Delete all existing screenings and associated records
        db.query(ExtractedField).delete()
        db.query(ValidationResult).delete()
        db.query(TamperingResult).delete()
        db.query(FaceResult).delete()
        db.query(AIAnalysis).delete()
        db.query(AuditLog).delete()
        db.query(Screening).delete()
        db.commit()
        print("[CLEANUP] Purged all previous screenings, orphaned records, and audit logs.")

        # 3. Clean up physical upload files except sample files
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        uploads_dir = os.path.join(base_dir, "uploads")
        docs_dir = os.path.join(uploads_dir, "documents")
        forensics_dir = os.path.join(uploads_dir, "forensics")
        faces_dir = os.path.join(uploads_dir, "faces")
        samples_dir = os.path.join(uploads_dir, "samples")

        for d in [docs_dir, forensics_dir, faces_dir]:
            if os.path.exists(d):
                shutil.rmtree(d)
            os.makedirs(d, exist_ok=True)

        # 4. Prepare the single clean demo document: DEMO-DOC-001
        sample_src = os.path.join(samples_dir, "sample_passport_clean.jpg")
        target_doc = os.path.join(docs_dir, "DEMO-DOC-001_doc.jpg")
        if os.path.exists(sample_src):
            shutil.copy(sample_src, target_doc)
        else:
            # Create a simple valid placeholder image if sample missing
            from PIL import Image
            img = Image.new("RGB", (600, 400), color=(15, 23, 42))
            img.save(target_doc, "JPEG")

        doc_hash = calculate_sha256_from_file(target_doc) if os.path.exists(target_doc) else "8f434346e91a0b38c29188e02d91acb54209df3402ba818274a27498c8191ac"

        demo_crop_path = os.path.join(docs_dir, "DEMO-DOC-001_face_crop.jpg")
        detect_and_crop_document_face(
            doc_image_path=target_doc,
            normalized_box={"ymin": 0.23, "xmin": 0.065, "ymax": 0.70, "xmax": 0.31},
            output_crop_path=demo_crop_path
        )

        created_ts = datetime.datetime.utcnow() - datetime.timedelta(hours=2)

        demo_screening = Screening(
            screening_id="DEMO-DOC-001",
            document_type="Passport",
            status="Completed",
            risk_score=12.0,
            risk_level="Low",
            created_by=admin.id,
            created_at=created_ts,
            original_filename="demo_passport_clean.jpg",
            file_path=target_doc,
            presented_face_path=None,  # No comparison photo provided
            document_hash=doc_hash,
            demo_person_name="Alex Morgan",
            processing_time_sec=2.4,
            authenticity_classification="Likely Genuine",
            authenticity_confidence=0.94,
            authenticity_reasons=[
                "Document structure conforms to standard ICAO passport specifications.",
                "No signs of image-region manipulation or font inconsistency."
            ],
            photo_forensics_status="No Obvious Anomaly",
            photo_forensics_score=0.0,
            photo_forensics_explanation="Document portrait texture and borders blend uniformly with background.",
            # Document Face Analysis (Section 4 & 19)
            face_detected=True,
            face_quality="Good",
            photo_region_detected=True,
            doc_face_status="No Obvious Anomaly",
            doc_face_confidence=0.94,
            doc_face_indicators=[],
            doc_face_explanation="Document portrait photograph is clearly printed with uniform borders and natural texture.",
            doc_face_box={"x": 60, "y": 140, "width": 240, "height": 300, "ymin": 0.23, "xmin": 0.065, "ymax": 0.70, "xmax": 0.31},
            doc_face_crop_path=os.path.join(docs_dir, "DEMO-DOC-001_face_crop.jpg"),
            # Face Verification (Section 7 & 19)
            face_verification_performed=False,
            face_verification_status="Not Performed",
            face_verification_similarity=None,
            face_verification_explanation="No comparison image was supplied. The face embedded within the document was still analyzed above.",
            investigation_notes="Initial baseline demo document record. Visual verification and fields verified.",
            explainability_data={
                "risk_factors": [
                    {"feature": "Document Quality", "impact": -5, "direction": "protective", "description": "High resolution, sharp contrast, clear text"},
                    {"feature": "Field Consistency", "impact": -10, "direction": "protective", "description": "All fields consistent across OCR and visual checks"},
                    {"feature": "MRZ Verification", "impact": -8, "direction": "protective", "description": "ICAO 9303 checksum parity verified"},
                    {"feature": "Photo Integrity", "impact": -10, "direction": "protective", "description": "Embedded portrait substrate uniform and consistent"}
                ],
                "explanation": "No significant verification anomalies detected. The document structure conforms to standard ICAO passport specifications.",
                "recommendation": "Routine verification check. Standard low-risk identity screening."
            }
        )
        db.add(demo_screening)
        db.commit()
        db.refresh(demo_screening)

        # Extracted fields for DEMO-DOC-001
        fields_data = [
            ("Full Name", "Alex Morgan", 0.98),
            ("Document Number", "DEMO-P8492014", 0.99),
            ("Nationality", "United States (Fictional Demo)", 0.99),
            ("Date of Birth", "1991-07-02", 0.97),
            ("Gender", "Female", 0.99),
            ("Issue Date", "2020-03-15", 0.96),
            ("Expiry Date", "2030-03-14", 0.98),
            ("Document Type", "Passport", 0.99)
        ]
        for name, val, conf in fields_data:
            db.add(ExtractedField(
                screening_id=demo_screening.id,
                field_name=name,
                field_value_demo=val,
                confidence=conf,
                source="OCR + Gemini",
                validation_status="verified",
                ocr_value=val,
                visual_value=val
            ))

        # Validations for DEMO-DOC-001
        validations_data = [
            ("Required fields", "Passed", "All mandatory identity fields present and formatted."),
            ("Date consistency", "Passed", "Issue date precedes expiry date and birth date is valid."),
            ("MRZ Checksum", "Passed", "ICAO 9303 checksums match biographical fields."),
            ("Document validity", "Passed", "Document is within its active validity window.")
        ]
        for check, stat, msg in validations_data:
            db.add(ValidationResult(
                screening_id=demo_screening.id,
                check_name=check,
                status=stat,
                message=msg
            ))

        # Tampering Analysis for DEMO-DOC-001
        db.add(TamperingResult(
            screening_id=demo_screening.id,
            indicator_type="Visual Inspection",
            confidence=0.08,
            region_data={"explanation": "No obvious image-region anomaly or alteration detected."}
        ))

        # Face Result: Not Performed (no comparison image provided)
        db.add(FaceResult(
            screening_id=demo_screening.id,
            similarity_score=0.0,
            status="Not Performed"
        ))

        # AI Analysis for DEMO-DOC-001 (Gemini 3.5 Flash)
        db.add(AIAnalysis(
            screening_id=demo_screening.id,
            model_name="gemini-3.5-flash",
            summary="The document passed structural and optical verification. Optical character recognition exhibits high fidelity, and no visual manipulation anomalies were detected. Routine manual verification recommended.",
            findings={
                "document_type": "Passport",
                "document_quality": {"status": "Good", "confidence": 0.98, "reason": "High resolution and readable text."},
                "extracted_information": {
                    "name": "Alex Morgan",
                    "document_number": "DEMO-P8492014",
                    "nationality": "USA",
                    "date_of_birth": "1991-07-02",
                    "gender": "F",
                    "issue_date": "2020-03-15",
                    "expiry_date": "2030-03-14"
                },
                "mrz_analysis": {
                    "present": True,
                    "consistency": "Match",
                    "details": ["Name matches MRZ", "Document number matches MRZ", "DOB matches MRZ", "Expiry matches MRZ"]
                },
                "validation": {
                    "overall_status": "Pass",
                    "checks": [
                        {"name": "Required fields", "status": "Pass", "explanation": "All mandatory identity fields present."},
                        {"name": "Date consistency", "status": "Pass", "explanation": "Issue and expiry dates are chronologically valid."}
                    ]
                },
                "tampering_analysis": {
                    "status": "No Obvious Anomaly",
                    "score": 8,
                    "indicators": [],
                    "explanation": "No signs of image-region manipulation, text replacement, or font inconsistency."
                },
                "document_photo_forensics": {
                    "status": "No Obvious Anomaly",
                    "score": 0,
                    "indicators": [],
                    "explanation": "Document portrait texture and borders blend uniformly with background."
                },
                "authenticity_assessment": {
                    "classification": "Likely Genuine",
                    "confidence": 0.94,
                    "reasons": [
                        "Document structure conforms to standard ICAO passport specifications.",
                        "No signs of image-region manipulation or font inconsistency."
                    ]
                },
                "document_face_analysis": {
                    "face_detected": True,
                    "face_quality": "Good",
                    "photo_region_detected": True,
                    "status": "No Obvious Anomaly",
                    "confidence": 0.94,
                    "indicators": [],
                    "explanation": "Document portrait photograph is clearly printed with uniform borders and natural texture."
                },
                "face_verification": {
                    "comparison_image_provided": False,
                    "status": "Not Performed",
                    "similarity": None,
                    "explanation": "No comparison image was supplied. The face embedded within the document was still analyzed above."
                },
                "face_analysis": {
                    "status": "Not Performed",
                    "similarity": None,
                    "explanation": "No comparison image was supplied. The face embedded within the document was still analyzed above."
                },
                "risk_assessment": {
                    "score": 12,
                    "level": "Low",
                    "reasons": ["No significant consistency issues detected.", "Valid document format and dates."]
                },
                "recommendation": {
                    "action": "Routine manual verification",
                    "reason": "Standard verification check. Low risk profile."
                },
                "explanation": "The document structure conforms to standard ICAO passport specifications with no observable anomalies."
            },
            recommendation="Routine manual verification check. Standard low risk indicator.",
            created_at=created_ts
        ))

        # Audit Logs for DEMO-DOC-001
        audit_events = [
            ("Document Uploaded", f"Demo document uploaded with SHA-256: {doc_hash[:16]}..."),
            ("OCR Completed", "8 structured fields extracted and cross-checked."),
            ("Gemini 3.5 Flash Analysis Completed", "Structured multimodal analysis generated by gemini-3.5-flash."),
            ("Risk Assessment Generated", "Dynamic composite risk calculated as Low (12/100).")
        ]
        for action, details in audit_events:
            db.add(AuditLog(
                user_id=admin.id,
                screening_id=demo_screening.id,
                action=action,
                details=details,
                timestamp=created_ts
            ))

        db.commit()
        print("[CLEANUP] Successfully created exactly ONE clean demo screening: DEMO-DOC-001.")
        print(f"[CLEANUP] Total screenings in database: {db.query(Screening).count()}")

    except Exception as e:
        db.rollback()
        print(f"[CLEANUP ERROR] {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_cleanup()
