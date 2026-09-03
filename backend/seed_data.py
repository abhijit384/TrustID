import os
import datetime
from PIL import Image, ImageDraw
from backend.database import SessionLocal, engine, Base
from backend.models import User, Screening, ExtractedField, ValidationResult, TamperingResult, FaceResult, AuditLog, AIAnalysis
from backend.auth import get_password_hash
from backend.utils.hashing import calculate_sha256_from_file

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
SAMPLES_DIR = os.path.join(UPLOAD_DIR, "samples")
DOCS_DIR = os.path.join(UPLOAD_DIR, "documents")
FORENSICS_DIR = os.path.join(UPLOAD_DIR, "forensics")
FACES_DIR = os.path.join(UPLOAD_DIR, "faces")

for d in [SAMPLES_DIR, DOCS_DIR, FORENSICS_DIR, FACES_DIR]:
    os.makedirs(d, exist_ok=True)

def create_synthetic_doc_image(filename: str, title: str, name: str, doc_num: str, country: str, is_tampered: bool = False):
    path = os.path.join(SAMPLES_DIR, filename)
    if os.path.exists(path):
        return path
    width, height = 900, 600
    bg_color = (235, 243, 250) if not is_tampered else (238, 240, 245)
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    for i in range(0, width, 25):
        draw.line([(i, 0), (i + 150, height)], fill=(215, 228, 242), width=1)
        draw.line([(i, height), (i + 150, 0)], fill=(220, 232, 245), width=1)

    draw.rounded_rectangle([20, 20, width - 20, height - 20], radius=15, outline=(30, 58, 138), width=4)
    draw.rectangle([24, 24, width - 24, 100], fill=(15, 23, 42))

    draw.text((40, 38), f"FICTIONAL SPECIMEN — {country.upper()}", fill=(248, 250, 252))
    draw.text((40, 64), f"{title.upper()} • FOR DEMONSTRATION PURPOSES ONLY", fill=(56, 189, 248))
    draw.text((width - 240, 50), "BORDER INTELLIGENCE", fill=(56, 189, 248))

    photo_box = [60, 140, 280, 420]
    draw.rectangle(photo_box, fill=(195, 210, 225), outline=(59, 130, 246), width=2)
    draw.ellipse([125, 200, 215, 290], fill=(100, 116, 139))
    draw.ellipse([90, 295, 250, 420], fill=(71, 85, 105))

    col_x = 320
    draw.text((col_x, 140), "SURNAME / NOM", fill=(100, 116, 139))
    draw.text((col_x, 160), name.upper(), fill=(15, 23, 42))
    draw.text((col_x, 210), "DOC NO / NO DU DOC", fill=(100, 116, 139))
    draw.text((col_x, 230), doc_num, fill=(15, 23, 42))
    draw.text((col_x, 280), "NATIONALITY / NATIONALITE", fill=(100, 116, 139))
    draw.text((col_x, 300), country.upper(), fill=(15, 23, 42))
    draw.text((col_x, 350), "DATE OF BIRTH", fill=(100, 116, 139))
    draw.text((col_x, 370), "02 JUL 1991", fill=(15, 23, 42))

    mrz_bg = [24, height - 120, width - 24, height - 24]
    draw.rectangle(mrz_bg, fill=(241, 245, 249), outline=(203, 213, 225), width=1)
    draw.text((40, height - 105), f"P<USA{name.split()[-1].upper()}<<{name.split()[0].upper()}<<<<<<<<<<<<<<<<<<<<<<<<<<<", fill=(30, 41, 59))
    draw.text((40, height - 65), f"{doc_num[:9]}0USA9107028F3003142<<<<<<<<<<<<<<04", fill=(30, 41, 59))

    img.save(path, "JPEG", quality=95)
    return path

def seed_database():
    """Ensure database has the exact required demo users and ONLY ONE demo document."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Users
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

        # Generate sample specimens for testing
        create_synthetic_doc_image("sample_passport_clean.jpg", "Official Passport", "Alex Morgan", "DEMO-P8492014", "United States (Demo)", is_tampered=False)
        create_synthetic_doc_image("sample_passport_tampered.jpg", "Official Passport", "Daniel Carter", "DEMO-GBR77219", "United Kingdom (Demo)", is_tampered=True)
        create_synthetic_doc_image("sample_id_mrz_mismatch.jpg", "National Identity Card", "Priya Sharma", "DEMO-ID993821", "India (Demo)", is_tampered=False)
        create_synthetic_doc_image("sample_dl_expired.jpg", "Driving Licence", "Arjun Mehta", "DEMO-DL440192", "India (Demo)", is_tampered=False)

        # 2. Prototype starts clean: No demo documents are pre-seeded.
        # Only documents explicitly uploaded by the user will be stored.
        pass

    except Exception as e:
        db.rollback()
        print(f"[Seed Warning] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
