# TRUSTID — AI-Based Fake Identity & Document Screening System

> **Intelligent, Explainable & Secure Identity Verification**

[![Python: FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-3776AB.svg)](https://fastapi.tiangolo.com/)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![AI: Gemini 3.5 Flash](https://img.shields.io/badge/AI-Google%20Gemini%203.5%20Flash-4285F4.svg)](https://ai.google.dev/)
[![Database: PostgreSQL / SQLite](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791.svg)](https://www.sqlalchemy.org/)

---

## 1. Executive Summary

**TRUSTID** is an enterprise-grade identity and document screening platform developed to assist authorized screening officers in detecting forged, manipulated, or synthetic identity credentials. 

By combining automated OCR data extraction, cryptographic MRZ checksum verification, border security watchlists, and Google Gemini 3.5 Flash multimodal vision analysis, TRUSTID provides instant, explainable forensic rationales and risk assessments while keeping human reviewers strictly in control of all final decisions.

### Crucial Operational Principles:
- **Decision-Support Architecture:** The system assists human reviewers with forensic evidence rather than replacing them.
- **No Autonomous Enforcement:** Enforcement and verification decisions remain with authorized officers.
- **Explainable Evidence:** Provides detailed visual reasons (e.g. inconsistent lighting, digital redaction artifacts, specimen watermarks) rather than opaque black-box labels.
- **Audit Integrity:** Maintains an immutable cryptographic SHA-256 audit ledger of all screened documents and officer actions.

---

## 2. 10-Stage Screening Pipeline

```text
01 — Upload          Secure intake of document image or PDF
02 — Quality         Resolution, clarity, and image integrity check
03 — OCR             Automated demographic and document text extraction
04 — Validate        Format rules, checksum parity, and blacklist lookup
05 — MRZ Check       ICAO 9303 MRZ vs visual text cross-verification
06 — Tampering       Visual anomaly, redaction box, and digital splicing detection
07 — Face Match      Document-embedded portrait detection and integrity analysis
08 — Risk Engine     Multi-factor Bayesian scoring (0 - 100% Risk)
09 — Gemini AI       Natural language forensic rationale generation
10 — Review & Report Officer verification dossier and tamper-evident audit log
```

---

## 3. Production Architecture

```text
                       [ User / Officer Browser ]
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │  React 18 Frontend (Vite) │  (Hosted on Vercel)
                      └───────────────────────────┘
                                    │
                         HTTPS REST API / JSON
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    FastAPI Backend API    │  (Hosted on Render)
                      └───────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
│ Google Gemini Vision  │ │ PostgreSQL / DB   │ │ Supabase Cloud Storage│
│ (gemini-3.5-flash)    │ │ (Supabase/Render) │ │ (Uploaded Credentials)│
└───────────────────────┘ └───────────────────┘ └───────────────────────┘
```

---

## 4. Repository Structure

```text
AI Fake Identity/
├── backend/
│   ├── routes/
│   │   ├── admin.py          # Admin management & system health
│   │   ├── ai.py             # Dedicated Gemini AI analysis endpoints
│   │   ├── analytics.py      # Screening telemetry & metrics
│   │   ├── audit.py          # Cryptographic audit trail logs
│   │   ├── auth.py           # JWT authentication & login/register
│   │   ├── documents.py      # Uploads & document screening lifecycle
│   │   ├── reports.py        # PDF & dossier report generation
│   │   └── users.py          # User management & RBAC controls
│   ├── services/
│   │   ├── gemini_service.py # Gemini 3.5 Flash multimodal vision & rationales
│   │   ├── ocr_service.py    # Optical character recognition & text extraction
│   │   ├── validation_service.py # MRZ, checksums, specimen & watchlist checks
│   │   ├── tampering_service.py  # Forensic visual & redaction analysis
│   │   ├── face_service.py       # Document embedded portrait detection
│   │   └── email_service.py      # SMTP OTP verification
│   ├── database.py           # SQLAlchemy engine (SQLite + PostgreSQL support)
│   ├── models.py             # Relational database models
│   ├── schemas.py            # Pydantic validation schemas
│   ├── dependencies.py       # JWT verification & RBAC dependencies
│   ├── seed_data.py          # Default demo users & baseline dataset
│   ├── main.py               # FastAPI application entry point & CORS
│   ├── requirements.txt      # Python production dependencies
│   └── .env.example          # Backend environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components (Sidebar, Navbar, UploadBox, etc.)
│   │   ├── pages/            # Page views (Dashboard, NewScreening, Analysis, Reports, etc.)
│   │   ├── services/         # Axios API client (api.js)
│   │   ├── context/          # Auth & Theme context providers
│   │   ├── App.jsx           # Main router & layout configuration
│   │   ├── index.css         # Tailwind & custom CSS design system
│   │   └── main.jsx          # React DOM entry point
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.js        # Vite build configuration
│   └── .env.example          # Frontend environment variables template
├── .gitignore                # Git exclusion rules
├── .env.example              # Root environment template
└── README.md                 # Project documentation
```

---

## 5. Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Open a terminal and navigate to the project root:
   ```bash
   cd "AI Fake Identity"
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Configure backend environment variables:
   ```bash
   cp backend/.env.example .env
   # Edit .env and supply your GEMINI_API_KEY
   ```
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup
1. In a new terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 6. Environment Variables

### Backend (`.env` or `backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection URI (SQLite locally, PostgreSQL in prod) | `sqlite:///./trustid.db` |
| `GEMINI_API_KEY` | Google Gemini API Key for Multimodal Vision Analysis | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini Model Identifier | `gemini-3.5-flash` |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173,https://your-app.vercel.app` |
| `JWT_SECRET` | Secret key used to sign session tokens | `your-secure-random-secret-key` |
| `DEMO_MODE` | Enable demo fallback accounts for demonstrations | `true` |
| `SUPABASE_URL` | Supabase project URL for cloud storage (optional) | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (optional) | `eyJ...` |

### Frontend (`frontend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Production Backend API Base URL | `https://your-backend.onrender.com` (leave blank for local proxy) |

---

## 7. Deployment Notes

### Deploying Backend to Render
1. Create a new **Web Service** connected to your repository.
2. Configure the build and start settings:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables in Render Dashboard:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (PostgreSQL connection string from Supabase or Render Postgres)
   - `CORS_ORIGINS` (Your Vercel frontend URL)
   - `JWT_SECRET`
   - `DEMO_MODE` (`false` in production)

### Deploying Frontend to Vercel
1. Import the repository in Vercel.
2. Set the **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
4. Deploy!

---

## 8. Technology Stack Summary

| Category | Technology | Role in System |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Interactive screening console & user interface |
| **Styling** | Tailwind CSS | Dark cybersecurity theme & responsive styling |
| **Backend API** | Python, FastAPI | High-concurrency async REST API |
| **AI Neural Engine** | Google Gemini 3.5 Flash | Multimodal forensic analysis & natural language explanations |
| **Database** | SQLAlchemy, SQLite / PostgreSQL | Relational screening data & audit log persistence |
| **Analytics** | Recharts | Identity risk distribution & trend visualization |
| **Security** | JWT, PBKDF2/Bcrypt, SHA-256 | Authentication, RBAC, and file integrity hashing |
| **Containerization** | Docker, Uvicorn | Production deployment & process orchestration |

---

## 9. Security & Compliance Notice

TRUSTID is designed strictly as a forensic decision-support and integrity-verification aid. Final identity verification, admission, clearance, or detention decisions are strictly reserved for authorized human personnel. No real personal identifiable information (PII) is included in version control.
