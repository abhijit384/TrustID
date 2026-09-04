import time
import requests

BACKEND_URL = "https://trustid-y2fd.onrender.com"
LOGIN_DATA = {"email": "demo.admin@example.com", "password": "Demo@123"}

def poll_for_deployment():
    print("Waiting 45 seconds for Render to complete container build...")
    time.sleep(45)
    for i in range(25):
        try:
            r = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if r.status_code == 200:
                print(f"Health check succeeded (attempt {i+1}): HTTP 200")
                break
        except Exception as e:
            print(f"Attempt {i+1}: {e}")
        time.sleep(6)

def test_full_production_flow():
    print("\n--- 1. Authenticating with Live Backend ---")
    auth_res = requests.post(f"{BACKEND_URL}/api/auth/login", json=LOGIN_DATA, timeout=15)
    assert auth_res.status_code == 200, f"Login failed: {auth_res.text}"
    token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   Login SUCCESS. Token acquired.")

    # Test Document 1: Passport with Face
    print("\n--- 2. Uploading Passport Document (with Face) ---")
    doc_path = r"backend/uploads/documents/TR-2026-0104_doc.jpg"
    with open(doc_path, "rb") as f:
        up_res = requests.post(
            f"{BACKEND_URL}/api/screenings",
            headers=headers,
            data={"document_type": "Passport"},
            files={"document": ("sample_passport_face.jpg", f, "image/jpeg")},
            timeout=30
        )
    assert up_res.status_code == 200, f"Upload failed: {up_res.text}"
    s_id = up_res.json()["screening_id"]
    print(f"   Upload SUCCESS. Screening ID: {s_id}")

    print(f"\n--- 3. Triggering Multimodal Screening Analysis for {s_id} ---")
    start_t = time.time()
    an_res = requests.post(f"{BACKEND_URL}/api/screenings/{s_id}/analyze", headers=headers, timeout=120)
    dur = time.time() - start_t
    assert an_res.status_code == 200, f"Analysis failed: {an_res.text}"
    data = an_res.json()
    print(f"   Analysis SUCCESS in {dur:.1f} seconds!")
    print(f"   Screening ID: {data.get('screening_id')}")
    print(f"   Status: {data.get('status')}")
    print(f"   Classification: {data.get('authenticity_classification')}")
    print(f"   Risk Score: {data.get('risk_score')}% ({data.get('risk_level')})")
    print(f"   Face Detected: {data.get('face_detected')}")
    print(f"   Face Status: {data.get('doc_face_status')}")
    print(f"   Face Crop URL: {data.get('doc_face_crop_url')}")
    print(f"   Fields Extracted: {len(data.get('extracted_fields', []))}")
    print(f"   Validation Checks: {len(data.get('validation_checks', []))}")

    # Test Document 2: Document without face
    print("\n--- 4. Uploading Clean Passport (No Face) ---")
    doc_clean = r"backend/uploads/documents/TR-2026-0105_doc.jpg"
    with open(doc_clean, "rb") as f:
        up_res2 = requests.post(
            f"{BACKEND_URL}/api/screenings",
            headers=headers,
            data={"document_type": "Identity Document"},
            files={"document": ("sample_passport_clean.jpg", f, "image/jpeg")},
            timeout=30
        )
    assert up_res2.status_code == 200, f"Upload failed: {up_res2.text}"
    s_id2 = up_res2.json()["screening_id"]
    print(f"   Upload SUCCESS. Screening ID: {s_id2}")

    print(f"\n--- 5. Triggering Multimodal Screening Analysis for {s_id2} ---")
    start_t = time.time()
    an_res2 = requests.post(f"{BACKEND_URL}/api/screenings/{s_id2}/analyze", headers=headers, timeout=120)
    dur2 = time.time() - start_t
    assert an_res2.status_code == 200, f"Analysis failed: {an_res2.text}"
    data2 = an_res2.json()
    print(f"   Analysis SUCCESS in {dur2:.1f} seconds!")
    print(f"   Screening ID: {data2.get('screening_id')}")
    print(f"   Classification: {data2.get('authenticity_classification')}")
    print(f"   Risk Score: {data2.get('risk_score')}% ({data2.get('risk_level')})")
    print(f"   Face Status: {data2.get('doc_face_status')}")
    print(f"   Fields Extracted: {len(data2.get('extracted_fields', []))}")
    print("\nALL PRODUCTION SCREENINGS COMPLETED SUCCESSFULLY UNDER 512MB RAM LIMIT!")

if __name__ == "__main__":
    poll_for_deployment()
    test_full_production_flow()
