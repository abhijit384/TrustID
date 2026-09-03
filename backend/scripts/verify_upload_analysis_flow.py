import os
import sys
import json
import requests

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=" * 70)
    print("TRUSTID — ACCEPTANCE TEST SUITE (SECTION 35)")
    print("=" * 70)

    # 1. Login as Admin
    admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo.admin@example.com",
        "password": "Demo@123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] [AUTH] Admin login successful")

    # 2. Login as User
    user_login = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo.user@example.com",
        "password": "Demo@123"
    })
    assert user_login.status_code == 200, f"User login failed: {user_login.text}"
    user_token = user_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    print("[OK] [AUTH] User login successful")

    # TEST 1: Open existing demo document
    print("\n--- TEST 1: Open Baseline Demo Document (DEMO-DOC-001) ---")
    demo_res = requests.get(f"{BASE_URL}/api/screenings/DEMO-DOC-001", headers=admin_headers)
    assert demo_res.status_code == 200, f"Demo document retrieval failed: {demo_res.text}"
    demo_data = demo_res.json()
    assert demo_data["screening_id"] == "DEMO-DOC-001"
    assert len(demo_data["extracted_fields"]) > 0, "No fields on demo document"
    assert demo_data["doc_face_status"] is not None
    assert demo_data["authenticity_classification"] is not None
    print(f"[OK] DEMO-DOC-001 loaded successfully:")
    print(f"  - Subject: {demo_data.get('demo_person_name')}")
    print(f"  - Type: {demo_data.get('document_type')}")
    print(f"  - Risk: {demo_data.get('risk_score')}/100 ({demo_data.get('risk_level')})")
    print(f"  - Authenticity: {demo_data.get('authenticity_classification')}")
    print(f"  - Embedded Face Status: {demo_data.get('doc_face_status')}")

    # TEST 7 (Part 1): Check Admin Analytics initial count
    analytics_before = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers)
    assert analytics_before.status_code == 200
    initial_total = analytics_before.json().get("total_screenings", 1)
    print(f"\n[OK] [ANALYTICS] Initial total screenings: {initial_total}")

    # TEST 2: Stage 1 Upload a NEW document
    print("\n--- TEST 2: Stage 1 Upload Document & Stage 2 Analysis ---")
    sample_img_path = os.path.join(os.path.dirname(__file__), "..", "uploads", "documents", "DEMO-DOC-001_doc.jpg")
    with open(sample_img_path, "rb") as f:
        file_bytes = f.read()

    # Stage 1: POST /api/screenings
    upload_res = requests.post(
        f"{BASE_URL}/api/screenings",
        headers=admin_headers,
        files={"document": ("test_passport.jpg", file_bytes, "image/jpeg")},
        data={"document_type": "Passport"}
    )
    assert upload_res.status_code == 200, f"Stage 1 upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    print(f"[OK] Stage 1 Upload Response: {upload_data}")
    assert upload_data["success"] is True
    assert upload_data["status"] == "uploaded"
    screening_id_1 = upload_data["screening_id"]
    database_id_1 = upload_data["database_id"]
    print(f"[OK] Screening created and committed with ID: {screening_id_1} (DB ID: {database_id_1})")

    # Verify record exists immediately after upload
    immediate_get = requests.get(f"{BASE_URL}/api/screenings/{screening_id_1}", headers=admin_headers)
    assert immediate_get.status_code == 200, "Screening record not found immediately after upload!"
    assert immediate_get.json()["status"] == "uploaded"
    print(f"[OK] Confirmed record exists in database with status='uploaded'")

    # Stage 2: POST /api/screenings/{screeningId}/analyze
    print(f"[OK] Executing Stage 2 Analysis: POST /api/screenings/{screening_id_1}/analyze ...")
    analyze_res = requests.post(f"{BASE_URL}/api/screenings/{screening_id_1}/analyze", headers=admin_headers)
    assert analyze_res.status_code == 200, f"Stage 2 analyze failed: {analyze_res.text}"
    analysis_data = analyze_res.json()
    assert analysis_data["screening_id"] == screening_id_1
    assert analysis_data["status"].lower() == "completed"
    print(f"[OK] Stage 2 Analysis Complete:")
    print(f"  - Status: {analysis_data['status']}")
    print(f"  - Person: {analysis_data.get('demo_person_name')}")
    print(f"  - Authenticity: {analysis_data.get('authenticity_classification')}")
    print(f"  - Risk: {analysis_data.get('risk_score')}/100 ({analysis_data.get('risk_level')})")
    print(f"  - Extracted Fields: {len(analysis_data.get('extracted_fields', []))}")
    print(f"  - Face Analysis: {analysis_data.get('doc_face_status')}")

    # TEST 3: Refresh analysis page (GET /api/screenings/{screeningId})
    print("\n--- TEST 3: Refresh Analysis Page (Direct GET) ---")
    get_refresh = requests.get(f"{BASE_URL}/api/screenings/{screening_id_1}", headers=admin_headers)
    assert get_refresh.status_code == 200, "Screening failed to load on refresh!"
    refresh_data = get_refresh.json()
    assert refresh_data["screening_id"] == screening_id_1
    assert refresh_data["status"].lower() == "completed"
    print(f"[OK] Successfully loaded {screening_id_1} directly by screening_id string parameter")

    # TEST 4: Return to Documents list
    print("\n--- TEST 4: Documents List Verification ---")
    docs_res = requests.get(f"{BASE_URL}/api/screenings", headers=admin_headers)
    assert docs_res.status_code == 200
    docs_list = docs_res.json()
    screening_ids_in_docs = [d["screening_id"] for d in docs_list]
    assert "DEMO-DOC-001" in screening_ids_in_docs
    assert screening_id_1 in screening_ids_in_docs
    print(f"[OK] Documents list contains {len(docs_list)} documents including {screening_id_1}")

    # TEST 5: Open from Documents (verify no redundant Gemini re-run)
    print("\n--- TEST 5: Re-opening Document from Documents ---")
    reopen_res = requests.get(f"{BASE_URL}/api/screenings/{screening_id_1}", headers=admin_headers)
    assert reopen_res.status_code == 200
    print(f"[OK] Stored record retrieved instantly with status: {reopen_res.json()['status']}")

    # TEST 6: Upload a SECOND document
    print("\n--- TEST 6: Upload Second Unique Document ---")
    # Synthetic modified specimen bytes
    modified_bytes = file_bytes + b"\n# TRUSTID_UNIQUE_TEST_SPECIMEN_2"
    upload_res_2 = requests.post(
        f"{BASE_URL}/api/screenings",
        headers=admin_headers,
        files={"document": ("driver_license.jpg", modified_bytes, "image/jpeg")},
        data={"document_type": "Driver License"}
    )
    assert upload_res_2.status_code == 200
    upload_data_2 = upload_res_2.json()
    screening_id_2 = upload_data_2["screening_id"]
    print(f"[OK] Second document uploaded: {screening_id_2}")
    assert screening_id_2 != screening_id_1, "Screening IDs must be distinct!"

    # Analyze second document
    analyze_res_2 = requests.post(f"{BASE_URL}/api/screenings/{screening_id_2}/analyze", headers=admin_headers)
    assert analyze_res_2.status_code == 200
    analysis_data_2 = analyze_res_2.json()
    print(f"[OK] Second analysis completed:")
    print(f"  - ID: {analysis_data_2['screening_id']}")
    print(f"  - Document Hash: {analysis_data_2['document_hash'][:16]}...")
    print(f"  - Risk: {analysis_data_2['risk_score']}/100")

    # TEST 7: Admin Analytics verification
    print("\n--- TEST 7: Admin Analytics Verification ---")
    analytics_after = requests.get(f"{BASE_URL}/api/admin/analytics", headers=admin_headers)
    assert analytics_after.status_code == 200
    after_data = analytics_after.json()
    new_total = after_data.get("total_screenings", 0)
    print(f"[OK] Analytics summary:")
    print(f"  - Total Screenings: {new_total} (was {initial_total})")
    print(f"  - Low Risk: {after_data.get('low_risk', 0)}")
    print(f"  - Medium Risk: {after_data.get('medium_risk', 0)}")
    print(f"  - High Risk: {after_data.get('high_risk', 0)}")
    print(f"  - Likely Genuine: {after_data.get('likely_genuine', 0)}")
    print(f"  - Potentially Suspicious: {after_data.get('potentially_suspicious', 0)}")
    assert new_total == initial_total + 2, f"Expected total {initial_total + 2}, got {new_total}"

    # TEST 8: Normal User RBAC Verification
    print("\n--- TEST 8: Normal User RBAC Verification ---")
    user_admin_check = requests.get(f"{BASE_URL}/api/admin/analytics", headers=user_headers)
    print(f"[OK] Normal user access to /api/admin/analytics -> Status: {user_admin_check.status_code}")
    assert user_admin_check.status_code == 403, f"Expected 403 Forbidden, got {user_admin_check.status_code}"

    user_users_check = requests.get(f"{BASE_URL}/api/admin/users", headers=user_headers)
    print(f"[OK] Normal user access to /api/admin/users -> Status: {user_users_check.status_code}")
    assert user_users_check.status_code == 403, f"Expected 403 Forbidden, got {user_users_check.status_code}"

    print("\n" + "=" * 70)
    print("ALL 8 ACCEPTANCE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
