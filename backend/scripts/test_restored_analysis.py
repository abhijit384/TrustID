import os
import requests
import json
import numpy as np
import cv2

API_BASE = "http://127.0.0.1:8000"

def create_synthetic_test_documents():
    os.makedirs("test_assets", exist_ok=True)

    # 1. Document A: Synthetic Passport with Portrait & MRZ
    doc_a = np.full((600, 900, 3), (240, 245, 250), dtype=np.uint8)
    cv2.rectangle(doc_a, (20, 20), (880, 580), (60, 70, 80), 3)
    cv2.putText(doc_a, "PASSPORT OF FICTIONAL REPUBLIC", (250, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 30), 2)
    # Photo box
    cv2.rectangle(doc_a, (60, 130), (280, 420), (210, 215, 220), -1)
    cv2.rectangle(doc_a, (60, 130), (280, 420), (50, 50, 50), 2)
    # Face in box
    cv2.circle(doc_a, (170, 230), 65, (175, 200, 230), -1)
    cv2.circle(doc_a, (145, 215), 8, (60, 40, 30), -1)
    cv2.circle(doc_a, (195, 215), 8, (60, 40, 30), -1)
    cv2.ellipse(doc_a, (170, 260), (25, 12), 0, 0, 180, (40, 40, 180), 3)
    # Text fields
    cv2.putText(doc_a, "Name: JANE DOE", (320, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(doc_a, "Passport No: P7821094", (320, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(doc_a, "Nationality: UTOPIA", (320, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(doc_a, "Date of Birth: 12/08/1994", (320, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(doc_a, "Sex: F", (320, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(doc_a, "Expiry: 11/08/2034", (320, 410), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    # MRZ lines
    cv2.putText(doc_a, "P<UTOEXAMPLE<<JANE<<<<<<<<<<<<<<<<<<<<<<<<<<<", (40, 520), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (10, 10, 10), 2)
    cv2.putText(doc_a, "P7821094<2UTO9408128F3408112<<<<<<<<<<<<<<<04", (40, 555), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (10, 10, 10), 2)
    path_a = "test_assets/test_passport_with_face.jpg"
    cv2.imwrite(path_a, doc_a)

    # 2. Document B: Tax Clearance Certificate (NO Portrait, distinct fields)
    doc_b = np.full((600, 900, 3), (250, 250, 245), dtype=np.uint8)
    cv2.rectangle(doc_b, (20, 20), (880, 580), (120, 100, 60), 3)
    cv2.putText(doc_b, "CERTIFICATE OF TAX REGISTRATION", (220, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    cv2.putText(doc_b, "Name: Apex Innovations LLC", (100, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 40, 40), 2)
    cv2.putText(doc_b, "Document No: TAX-9948201", (100, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 40, 40), 2)
    cv2.putText(doc_b, "Registration Date: 2023-01-10", (100, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 40, 40), 2)
    cv2.putText(doc_b, "Valid Until: 2026-12-31", (100, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40, 40, 40), 2)
    cv2.putText(doc_b, "Status: Active / Good Standing", (100, 420), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (20, 120, 20), 2)
    path_b = "test_assets/test_tax_no_face.jpg"
    cv2.imwrite(path_b, doc_b)

    return path_a, path_b


def run_tests():
    print("=" * 70)
    print("TRUSTID — RESTORED ANALYSIS & SINGLE FACE VERIFICATION TEST SUITE")
    print("=" * 70)

    # 1. Login as Admin
    admin_login = requests.post(f"{API_BASE}/api/auth/login", json={"email": "demo.admin@example.com", "password": "Demo@123"})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 1. Admin login successful.")

    # 2. Login as User
    user_login = requests.post(f"{API_BASE}/api/auth/login", json={"email": "demo.user@example.com", "password": "Demo@123"})
    assert user_login.status_code == 200, f"User login failed: {user_login.text}"
    user_token = user_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    print("[PASS] 2. User login successful.")

    # 3. RBAC Test: User cannot access Admin Analytics
    user_rbac_res = requests.get(f"{API_BASE}/api/admin/analytics", headers=user_headers)
    assert user_rbac_res.status_code == 403, f"Expected 403 for user on admin endpoint, got: {user_rbac_res.status_code}"
    print("[PASS] 3. RBAC enforced: User correctly blocked (403 Forbidden) from Admin Analytics.")

    # 4. Check initial baseline Demo Document (DEMO-DOC-001)
    demo_doc = requests.get(f"{API_BASE}/api/screenings/1", headers=admin_headers)
    assert demo_doc.status_code == 200, f"Could not fetch baseline demo: {demo_doc.text}"
    demo_data = demo_doc.json()
    assert demo_data["screening_id"] == "DEMO-DOC-001", f"Expected DEMO-DOC-001, got {demo_data['screening_id']}"
    assert demo_data["face_detected"] is True, "Demo document must have face_detected = True"
    assert len(demo_data["extracted_fields"]) >= 5, "Demo document must have extracted fields"
    assert demo_data["authenticity_classification"] == "Likely Genuine", "Demo document must be Likely Genuine"
    print(f"[PASS] 4. Baseline Demo Document verified: {demo_data['screening_id']} (Fields: {len(demo_data['extracted_fields'])}, Face: Detected, Auth: {demo_data['authenticity_classification']})")

    # 5. Check Admin Analytics before upload (should have total_screenings == 1)
    analytics_before = requests.get(f"{API_BASE}/api/admin/analytics", headers=admin_headers)
    assert analytics_before.status_code == 200, f"Admin analytics error: {analytics_before.text}"
    data_before = analytics_before.json()
    assert data_before["total_screenings"] == 1, f"Expected total_screenings == 1, got {data_before['total_screenings']}"
    print(f"[PASS] 5. Admin Analytics (1 document) verified: Total={data_before['total_screenings']}, Genuine={data_before['likely_genuine']}, Faces={data_before['face_detected']}")

    # 6. Upload Document A (Passport with Face & MRZ)
    path_a, path_b = create_synthetic_test_documents()
    with open(path_a, "rb") as f:
        upload_a = requests.post(
            f"{API_BASE}/api/screenings",
            headers=admin_headers,
            files={"document": ("passport_with_face.jpg", f, "image/jpeg")},
            data={"document_type": "Passport"}
        )
    assert upload_a.status_code == 200, f"Upload A failed: {upload_a.text}"
    res_a = upload_a.json()
    assert res_a["screening_id"] != "DEMO-DOC-001", "New upload must have a unique screening ID"
    assert res_a["face_detected"] is True, "Document A must detect embedded face"
    assert res_a["photo_region_detected"] is True, "Photo region must be detected"
    assert len(res_a["extracted_fields"]) > 0, "Document A must have extracted fields"
    print(f"[PASS] 6. Upload Document A successful: ID={res_a['screening_id']}, Face Detected={res_a['face_detected']}, Quality={res_a['face_quality']}, Risk={res_a['risk_score']} ({res_a['risk_level']})")

    # Check field reconciliation in Document A
    detected_fields_a = [f for f in res_a["extracted_fields"] if f["field_value_demo"] != "Not detected"]
    print(f"       -> Reconciled Fields: {len(detected_fields_a)} detected (Sources: {set(f['source'] for f in detected_fields_a)})")

    # 7. Upload Document B (Certificate WITHOUT face)
    with open(path_b, "rb") as f:
        upload_b = requests.post(
            f"{API_BASE}/api/screenings",
            headers=admin_headers,
            files={"document": ("tax_cert_no_face.jpg", f, "image/jpeg")},
            data={"document_type": "Permit"}
        )
    assert upload_b.status_code == 200, f"Upload B failed: {upload_b.text}"
    res_b = upload_b.json()
    assert res_b["screening_id"] != res_a["screening_id"], "Document B must have distinct screening ID"
    assert res_b["face_detected"] is False, "Document B must report face_detected = False"
    assert res_b["doc_face_status"] == "Inconclusive", "Document B must report face status = Inconclusive"
    print(f"[PASS] 7. Upload Document B successful: ID={res_b['screening_id']}, Face Detected={res_b['face_detected']}, Status={res_b['doc_face_status']}")

    # Verify Document A != Document B
    assert res_a["screening_id"] != res_b["screening_id"], "Screening IDs must differ"
    assert res_a["face_detected"] != res_b["face_detected"], "Face detection must differ"
    print("[PASS] 8. Evidence-dependence verified: Document A != Document B across face detection and fields.")

    # 8. Check Admin Analytics after new uploads (should now be 3)
    analytics_after = requests.get(f"{API_BASE}/api/admin/analytics", headers=admin_headers)
    assert analytics_after.status_code == 200
    data_after = analytics_after.json()
    assert data_after["total_screenings"] == 3, f"Expected total_screenings == 3, got {data_after['total_screenings']}"
    assert data_after["faces_detected"] >= 2, "Should have at least 2 faces detected"
    print(f"[PASS] 9. Admin Analytics updated: Total Screenings={data_after['total_screenings']}, Faces Detected={data_after['faces_detected']}")

    print("=" * 70)
    print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
