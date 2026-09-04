import os
import sqlite3
from sqlalchemy import create_engine, inspect, text
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
    """Ensure newly added columns exist in both PostgreSQL and SQLite databases automatically."""
    try:
        # Create all tables first if they don't exist
        Base.metadata.create_all(bind=engine)

        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        is_pg = not DATABASE_URL.startswith("sqlite")
        json_type = "JSON"
        text_type = "TEXT"

        with engine.connect() as conn:
            # 1. Users table
            if "users" in table_names:
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                if "is_active" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE" if is_pg else "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                    conn.commit()

            # 2. Screenings table
            if "screenings" in table_names:
                s_cols = [c["name"] for c in inspector.get_columns("screenings")]

                new_cols = [
                    ("authenticity_classification", "VARCHAR(50) DEFAULT 'Likely Genuine'"),
                    ("authenticity_confidence", "FLOAT DEFAULT 0.91"),
                    ("authenticity_reasons", json_type),
                    ("photo_forensics_status", "VARCHAR(50) DEFAULT 'No Obvious Anomaly'"),
                    ("photo_forensics_score", "FLOAT DEFAULT 0.0"),
                    ("photo_forensics_explanation", text_type),
                    ("analysis_started_at", "TIMESTAMP" if is_pg else "DATETIME"),
                    ("analysis_completed_at", "TIMESTAMP" if is_pg else "DATETIME"),
                    ("face_detected", "BOOLEAN DEFAULT TRUE" if is_pg else "BOOLEAN DEFAULT 1"),
                    ("faces_detected_count", "INTEGER DEFAULT 1"),
                    ("primary_portrait_face_count", "INTEGER DEFAULT 1"),
                    ("document_wide_face_count", "INTEGER DEFAULT 1"),
                    ("other_faces_count", "INTEGER DEFAULT 0"),
                    ("multiple_faces_detected", "BOOLEAN DEFAULT FALSE" if is_pg else "BOOLEAN DEFAULT 0"),
                    ("face_quality", "VARCHAR(50) DEFAULT 'Good'"),
                    ("photo_region_detected", "BOOLEAN DEFAULT TRUE" if is_pg else "BOOLEAN DEFAULT 1"),
                    ("doc_face_status", "VARCHAR(50) DEFAULT 'No Obvious Anomaly'"),
                    ("doc_face_confidence", "FLOAT DEFAULT 0.91"),
                    ("doc_face_indicators", json_type),
                    ("doc_face_explanation", text_type),
                    ("doc_face_box", json_type),
                    ("doc_face_crop_path", "VARCHAR(500)"),
                    ("face_verification_performed", "BOOLEAN DEFAULT FALSE" if is_pg else "BOOLEAN DEFAULT 0"),
                    ("face_verification_status", "VARCHAR(50) DEFAULT 'Not Performed'"),
                    ("face_verification_similarity", "FLOAT"),
                    ("face_verification_explanation", text_type)
                ]

                for col_name, col_type in new_cols:
                    if col_name not in s_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE screenings ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception as col_err:
                            print(f"[TRUSTID DB Migration] Column {col_name} note: {col_err}")

            # 3. Extracted Fields table
            if "extracted_fields" in table_names:
                ef_cols = [c["name"] for c in inspector.get_columns("extracted_fields")]
                ef_new_cols = [
                    ("source", "VARCHAR(50) DEFAULT 'OCR + Trust AI'"),
                    ("validation_status", "VARCHAR(50) DEFAULT 'verified'"),
                    ("ocr_value", "VARCHAR(255)"),
                    ("visual_value", "VARCHAR(255)"),
                    ("discrepancy_note", "VARCHAR(255)")
                ]
                for col_name, col_type in ef_new_cols:
                    if col_name not in ef_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE extracted_fields ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception as ef_err:
                            print(f"[TRUSTID DB Migration] Column {col_name} note: {ef_err}")

    except Exception as e:
        print(f"[TRUSTID DB Migration] Note: {e}")

run_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
