import urllib.request
import urllib.parse
import json

def test_system():
    results = {}
    
    # 1. Health check
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/health")
        with urllib.request.urlopen(req) as resp:
            results["health"] = (resp.status, json.loads(resp.read().decode()))
    except Exception as e:
        results["health"] = str(e)

    # 2. Login as Officer
    token = None
    try:
        login_data = json.dumps({"email": "demo.officer@example.com", "password": "Demo@123"}).encode()
        req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login", data=login_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            token = data["access_token"]
            results["auth_officer"] = (resp.status, data["user"]["name"], data["user"]["role"])
    except Exception as e:
        results["auth_officer"] = str(e)

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 3. Dashboard Metrics
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/dashboard", headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            results["dashboard"] = (resp.status, data["documents_screened"], data["flagged_for_review"])
    except Exception as e:
        results["dashboard"] = str(e)

    # 4. List Screenings
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/screenings", headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            results["screenings_count"] = (resp.status, len(data))
    except Exception as e:
        results["screenings_count"] = str(e)

    # 5. Screening Detail
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/screenings/1", headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            results["screening_detail"] = (resp.status, data["screening_id"], data["risk_score"], data["risk_level"])
    except Exception as e:
        results["screening_detail"] = str(e)

    # 6. PDF Report Generation
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/reports/1/pdf", headers=headers)
        with urllib.request.urlopen(req) as resp:
            pdf_bytes = resp.read()
            results["pdf_report"] = (resp.status, len(pdf_bytes), pdf_bytes[:4] == b"%PDF")
    except Exception as e:
        results["pdf_report"] = str(e)

    # 7. Audit Trail
    try:
        req = urllib.request.Request("http://127.0.0.1:8000/api/audit", headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            results["audit_trail"] = (resp.status, len(data))
    except Exception as e:
        results["audit_trail"] = str(e)

    # 8. Frontend Dev Server Root
    try:
        req = urllib.request.Request("http://127.0.0.1:5173/")
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode()
            results["frontend_server"] = (resp.status, "TRUSTID" in html or "id=\"root\"" in html)
    except Exception as e:
        results["frontend_server"] = str(e)

    print("=== AUTOMATED VERIFICATION SUITE RESULTS ===")
    for k, v in results.items():
        print(f"[{k}]: {v}")

if __name__ == "__main__":
    test_system()
