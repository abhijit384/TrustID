import os
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./trustid.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs check_same_thread=False; PostgreSQL uses pool_pre_ping
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """Ensure newly added columns exist in SQLite database without requiring external alembic."""
    if DATABASE_URL.startswith("sqlite"):
        db_path = DATABASE_URL.replace("sqlite:///", "").replace("./", "")
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                # Check users table
                cursor.execute("PRAGMA table_info(users)")
                u_cols = [row[1] for row in cursor.fetchall()]
                if u_cols and "is_active" not in u_cols:
                    cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
                    conn.commit()

                # Check screenings table
                cursor.execute("PRAGMA table_info(screenings)")
                s_cols = [row[1] for row in cursor.fetchall()]
                if s_cols:
                    new_cols = [
                        ("authenticity_classification", "VARCHAR(50) DEFAULT 'Likely Genuine'"),
                        ("authenticity_confidence", "FLOAT DEFAULT 0.91"),
                        ("authenticity_reasons", "JSON"),
                        ("photo_forensics_status", "VARCHAR(50) DEFAULT 'No Obvious Anomaly'"),
                        ("photo_forensics_score", "FLOAT DEFAULT 0.0"),
                        ("photo_forensics_explanation", "TEXT"),
                        ("analysis_started_at", "DATETIME"),
                        ("analysis_completed_at", "DATETIME"),
                        ("face_detected", "BOOLEAN DEFAULT 1"),
                        ("faces_detected_count", "INTEGER DEFAULT 1"),
                        ("primary_portrait_face_count", "INTEGER DEFAULT 1"),
                        ("document_wide_face_count", "INTEGER DEFAULT 1"),
                        ("other_faces_count", "INTEGER DEFAULT 0"),
                        ("multiple_faces_detected", "BOOLEAN DEFAULT 0"),
                        ("face_quality", "VARCHAR(50) DEFAULT 'Good'"),
                        ("photo_region_detected", "BOOLEAN DEFAULT 1"),
                        ("doc_face_status", "VARCHAR(50) DEFAULT 'No Obvious Anomaly'"),
                        ("doc_face_confidence", "FLOAT DEFAULT 0.91"),
                        ("doc_face_indicators", "JSON"),
                        ("doc_face_explanation", "TEXT"),
                        ("doc_face_box", "JSON"),
                        ("doc_face_crop_path", "VARCHAR(500)"),
                        ("face_verification_performed", "BOOLEAN DEFAULT 0"),
                        ("face_verification_status", "VARCHAR(50) DEFAULT 'Not Performed'"),
                        ("face_verification_similarity", "FLOAT"),
                        ("face_verification_explanation", "TEXT")
                    ]
                    for col_name, col_type in new_cols:
                        if col_name not in s_cols:
                            cursor.execute(f"ALTER TABLE screenings ADD COLUMN {col_name} {col_type}")
                    
                    # Migrate extracted_fields table
                    cursor.execute("PRAGMA table_info(extracted_fields)")
                    ef_cols = [row[1] for row in cursor.fetchall()]
                    ef_new_cols = [
                        ("source", "VARCHAR(50) DEFAULT 'OCR + Trust AI'"),
                        ("validation_status", "VARCHAR(50) DEFAULT 'verified'"),
                        ("ocr_value", "VARCHAR(255)"),
                        ("visual_value", "VARCHAR(255)"),
                        ("discrepancy_note", "VARCHAR(255)")
                    ]
                    for col_name, col_type in ef_new_cols:
                        if col_name not in ef_cols:
                            cursor.execute(f"ALTER TABLE extracted_fields ADD COLUMN {col_name} {col_type}")

                    conn.commit()
                conn.close()
            except Exception as e:
                print(f"[TRUSTID DB Migration] Note: {e}")

run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
