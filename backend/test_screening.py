import os
import sys

# Ensure backend path
sys.path.insert(0, r"d:\AI Fake Identity")

from backend.database import SessionLocal, run_migrations
from backend.models import User, Screening
from backend.routes.documents import analyze_screening, create_screening_upload
from backend.services.face_service import detect_and_crop_document_face
import cv2
import numpy as np

import asyncio

async def run_tests_async():
    run_migrations()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.like("%admin%")).first()
        if not user:
            user = db.query(User).first()
        print(f"Using officer user: {user.email} (ID: {user.id})")

        # 1. Test sample_blacklisted_doc upload & analysis
        print("\n--- TEST 1: Screening sample_blacklisted_doc ---")
        screening_summary = await create_screening_upload(
            document=None,
            presented_face=None,
            document_type="Passport",
            sample_id="sample_blacklisted_doc",
            db=db,
            current_user=user
        )
        scr_id = screening_summary["screening_id"]
        print(f"Created screening: {scr_id}")

        result = analyze_screening(screening_identifier=scr_id, db=db, current_user=user)
        print(f"Classification: {result.get('authenticity_classification')}")
        print(f"Risk Score: {result.get('risk_score')} ({result.get('risk_level')})")
        print(f"Decision: {result.get('explainability_data', {}).get('border_checkpoint', {}).get('decision')}")
        print(f"Photo status: {result.get('photo_forensics_status')}")
        print(f"Faces detected: {result.get('faces_detected_count')}, Multiple faces: {result.get('multiple_faces_detected')}")

        assert result.get('authenticity_classification') in ["FAKE DOCUMENT", "Fake Document", "Tampered Document"], f"Expected FAKE DOCUMENT, got {result.get('authenticity_classification')}"
        assert result.get('overall_document_status') == "FAKE DOCUMENT", f"Expected FAKE DOCUMENT, got {result.get('overall_document_status')}"
        assert result.get('risk_score') >= 80, f"Expected risk >= 80, got {result.get('risk_score')}"
        print(">>> TEST 1 PASSED: Blacklisted document correctly detected and detained without error!")

        # 2. Test sample_passport_clean
        print("\n--- TEST 2: Screening sample_passport_clean ---")
        clean_scr = await create_screening_upload(
            document=None,
            presented_face=None,
            document_type="Passport",
            sample_id="sample_passport_clean",
            db=db,
            current_user=user
        )
        clean_id = clean_scr["screening_id"]
        clean_res = analyze_screening(screening_identifier=clean_id, db=db, current_user=user)
        print(f"Classification: {clean_res.get('authenticity_classification')}")
        print(f"Overall Status: {clean_res.get('overall_document_status')}")
        print(f"Authenticity Result: {clean_res.get('authenticity_result')}")
        print(f"Risk Score: {clean_res.get('risk_score')} ({clean_res.get('risk_level')})")
        print(f"Decision: {clean_res.get('explainability_data', {}).get('border_checkpoint', {}).get('decision')}")
        print(f"Photo status: {clean_res.get('photo_forensics_status')}")
        print("Validation checks:", clean_res.get('explainability_data', {}).get('border_checkpoint', {}).get('module2_validation', {}).get('checks'))
        print("Tampering result:", clean_res.get('explainability_data', {}).get('border_checkpoint', {}).get('module3_tampering'))
        print("Authenticity reasons:", clean_res.get('authenticity_reasons'))

        assert clean_res.get('authenticity_classification') in ["REAL DOCUMENT", "Real Document"], f"Expected REAL DOCUMENT, got {clean_res.get('authenticity_classification')}"
        assert clean_res.get('overall_document_status') == "REAL DOCUMENT", f"Expected REAL DOCUMENT, got {clean_res.get('overall_document_status')}"
        assert clean_res.get('risk_score') <= 30, f"Expected low risk, got {clean_res.get('risk_score')}"
        print(">>> TEST 2 PASSED: Clean passport correctly verified as Real Document!")

        # 3. Test Multi-face detection on synthetic two-face image
        print("\n--- TEST 3: Multiple Face Detection ---")
        h, w = 600, 800
        canvas = np.ones((h, w, 3), dtype=np.uint8) * 230
        sample_path = r"d:\AI Fake Identity\backend\uploads\samples\sample_blacklisted_doc.jpg"
        if os.path.exists(sample_path):
            sample_img = cv2.imread(sample_path)
            portrait = sample_img[120:380, 50:230]
            ph, pw = portrait.shape[:2]
            canvas[150:150+ph, 60:60+pw] = portrait
            canvas[150:150+ph, 450:450+pw] = portrait

            two_face_path = r"d:\AI Fake Identity\backend\uploads\test_two_faces.jpg"
            cv2.imwrite(two_face_path, canvas)

            det_res = detect_and_crop_document_face(two_face_path)
            print(f"Multi-face detection result: detected={det_res['face_detected']}, portrait_faces={det_res['primary_portrait_face_count']}, doc_wide={det_res['document_wide_face_count']}, other_faces={det_res['other_faces_count']}")
            assert det_res['document_wide_face_count'] >= 2 or det_res['multiple_faces_detected'] is True, "Expected multiple faces detected across document"
            print(">>> TEST 3 PASSED: Multiple faces correctly detected and separated across document!")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_tests_async())
