import os
import sys
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal
from backend.models import User, Screening, AIAnalysis, AuditLog
from backend.services.gemini_service import (
    generate_deterministic_demo_analysis, 
    analyze_screening_with_gemini
)

client = TestClient(app)

def run_tests():
    print("=== STARTING TRUSTID VERIFICATION SUITE ===")
    
    # 1. Test Admin Login
    admin_login_res = client.post("/api/auth/login", json={
        "email": "demo.admin@example.com",
        "password": "Demo@123"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_data = admin_login_res.json()
    admin_token = admin_data["access_token"]
    assert admin_data["user"]["role"] == "admin"
    assert admin_data["user"]["name"] == "Subhashree Saha"
    print("[OK] 1. Admin login verified (Subhashree Saha / Administrator)")

    # 2. Test User Login
    user_login_res = client.post("/api/auth/login", json={
        "email": "demo.user@example.com",
        "password": "Demo@123"
    })
    assert user_login_res.status_code == 200, f"User login failed: {user_login_res.text}"
    user_data = user_login_res.json()
    user_token = user_data["access_token"]
    assert user_data["user"]["role"] == "user"
    assert user_data["user"]["name"] == "User"
    print("[PASS] 2. User login verified (User / User)")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 3. Test RBAC: Admin vs User on /api/analytics
    admin_analytics_res = client.get("/api/analytics", headers=admin_headers)
    assert admin_analytics_res.status_code == 200, f"Admin analytics failed: {admin_analytics_res.text}"
    
    user_analytics_res = client.get("/api/analytics", headers=user_headers)
    assert user_analytics_res.status_code == 403, f"User should be blocked from /api/analytics with 403, got {user_analytics_res.status_code}"
    print("[PASS] 3. RBAC on /api/analytics verified (Admin: 200 OK, User: 403 Forbidden)")

    # 4. Test RBAC: Admin vs User on /api/users
    admin_users_res = client.get("/api/users", headers=admin_headers)
    assert admin_users_res.status_code == 200, f"Admin users failed: {admin_users_res.text}"
    
    user_users_res = client.get("/api/users", headers=user_headers)
    assert user_users_res.status_code == 403, f"User should be blocked from /api/users with 403, got {user_users_res.status_code}"
    print("[PASS] 4. RBAC on /api/users verified (Admin: 200 OK, User: 403 Forbidden)")

    # 5. Test Role-Based Dashboard Metrics
    admin_dash = client.get("/api/dashboard", headers=admin_headers).json()
    assert admin_dash["role"] == "admin"
    assert "total_users" in admin_dash
    assert "screening_trend" in admin_dash

    user_dash = client.get("/api/dashboard", headers=user_headers).json()
    assert user_dash["role"] == "user"
    assert "my_screenings" in user_dash
    assert "my_recent_documents" in user_dash
    assert "total_users" not in user_dash  # Org-wide metrics withheld from user
    print("[PASS] 5. Dashboard scoping verified (Admin has org-wide, User has personal only)")

    # 6. Test User Scope on Screenings List
    user_screenings_res = client.get("/api/screenings", headers=user_headers)
    assert user_screenings_res.status_code == 200
    user_scr_list = user_screenings_res.json()
    
    admin_screenings_res = client.get("/api/screenings", headers=admin_headers)
    assert admin_screenings_res.status_code == 200
    admin_scr_list = admin_screenings_res.json()
    assert len(admin_scr_list) >= len(user_scr_list)
    print(f"[PASS] 6. Screenings list scoping verified (Admin sees {len(admin_scr_list)} records, User sees {len(user_scr_list)} records)")

    # 7. Test User Accessing Admin's Screening -> 403 Forbidden
    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "demo.admin@example.com").first()
    admin_screening = db.query(Screening).filter(Screening.created_by == admin_user.id).first()
    db.close()
    
    if admin_screening:
        user_forbidden_res = client.get(f"/api/screenings/{admin_screening.id}", headers=user_headers)
        assert user_forbidden_res.status_code == 403, f"User accessing admin screening should be 403, got {user_forbidden_res.status_code}"
        print(f"[PASS] 7. Restricted screening access verified (User access to Screening #{admin_screening.id} returned 403 Forbidden)")

    # 8. Test AI Analysis Endpoints
    # Find a screening owned by user
    db = SessionLocal()
    user_db_obj = db.query(User).filter(User.email == "demo.user@example.com").first()
    user_scr = db.query(Screening).filter(Screening.created_by == user_db_obj.id).first()
    target_id = user_scr.id if user_scr else 6
    db.close()

    # Test GET /api/ai/analyze/{target_id}
    get_ai_res = client.get(f"/api/ai/analyze/{target_id}", headers=user_headers)
    assert get_ai_res.status_code == 200, f"GET /api/ai/analyze failed: {get_ai_res.text}"
    ai_data = get_ai_res.json()
    assert "summary" in ai_data
    assert "recommendation" in ai_data
    assert "model_name" in ai_data
    print(f"[PASS] 8. GET /api/ai/analyze/{target_id} verified (Model: {ai_data['model_name']})")

    # Test POST /api/ai/analyze/{target_id}
    post_ai_res = client.post(f"/api/ai/analyze/{target_id}", headers=user_headers)
    assert post_ai_res.status_code == 200, f"POST /api/ai/analyze failed: {post_ai_res.text}"
    post_data = post_ai_res.json()
    assert "summary" in post_data
    assert "recommendation" in post_data
    print(f"[PASS] 9. POST /api/ai/analyze/{target_id} verified (Summary generated)")

    # 9. Verify Audit Trail Contains AI Events
    audit_res = client.get("/api/audit", headers=admin_headers)
    assert audit_res.status_code == 200
    actions = [a["action"] for a in audit_res.json()]
    assert any("AI Analysis" in act for act in actions)
    print("[PASS] 10. Audit trail verified with AI Analysis events")

    # 10. Test Gemini Graceful Fallback & Guardrails
    sample_payload = {
        "document_type": "Demo Passport",
        "ocr_confidence": 94.6,
        "validation_score": 92.0,
        "mrz_status": "match",
        "tampering_indicator": 0.68,
        "face_similarity": 0.94,
        "risk_score": 62.0,
        "risk_level": "medium",
        "warnings": ["possible image-region anomaly", "metadata anomaly"]
    }
    fallback_res = generate_deterministic_demo_analysis(sample_payload, is_fallback=True)
    assert "model_name" in fallback_res
    assert fallback_res["is_fallback"] is True
    assert "criminal" not in fallback_res["summary"].lower()
    assert "definitely fake" not in fallback_res["summary"].lower()
    assert "arrest" not in fallback_res["recommendation"].lower()
    print("[PASS] 11. Decision-support guardrails & fallback safety verified")

    print("\nALL 11 VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
