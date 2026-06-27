# MedNexus_Intelligence Backend API

FastAPI backend for the dashboard that keeps existing `/api/*` endpoints unchanged and integrates with the MedNexus_Intelligence model pipeline service running separately.

## Architecture

- Dashboard backend (this folder): `http://localhost:8000`
- Pipeline AI service (model API): `http://localhost:8001`
- Dashboard frontend: `http://localhost:3000`

Flow:
1. Frontend uploads PDF to `POST /api/upload`
2. Frontend calls `POST /api/process` with `file_id`
3. Backend reads `uploads/{file_id}.pdf`, calls AI service `POST /api/v1/reports/process/sync`
4. Backend maps pipeline `FinalReport` to dashboard report schema
5. Frontend renders JSON and downloads template-based PDF via `GET /api/report/pdf`

## Existing Endpoints (Preserved)

- `POST /api/upload`
- `POST /api/process`
- `GET /api/report` (legacy JSON compatibility endpoint)
- `GET /health`
- `GET /`

## Setup

### 1. Install backend dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 2. Configure AI connectivity

Create `.env` in `backend/`:

```env
AI_SERVICE_BASE_URL=http://localhost:8001
AI_SERVICE_PROCESS_PATH=/api/v1/reports/process/sync
AI_SERVICE_HEALTH_PATH=/api/v1/health
AI_SERVICE_REPORT_PDF_PATH_TEMPLATE=/api/v1/reports/{request_id}/pdf
AI_SERVICE_TIMEOUT_SECONDS=300
AI_SERVICE_CONNECT_TIMEOUT_SECONDS=10
AI_SERVICE_RETRIES=2
AI_SERVICE_HEALTH_TIMEOUT_SECONDS=3
```

### 3. Start AI pipeline service (port 8001)

From repository root:

```bash
source .venv/bin/activate
uvicorn src.mediscout.main:app --reload --port 8001
```

### 4. Start dashboard backend (port 8000)

```bash
cd dashboard/MedNexus_Intelligence-dashboard/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 5. Verify health

```bash
curl http://localhost:8000/health
curl http://localhost:8001/api/v1/health
```

## API Usage

### Upload PDF

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@your_file.pdf"
```

### Process Report

```bash
curl -X POST http://localhost:8000/api/process \
  -H "Content-Type: application/json" \
  -d '{"file_id": "PASTE_FILE_ID_HERE"}'
```

Response shape:

```json
{
  "file_id": "...",
  "report": {
    "profile_summary": {
      "patient_name": "...",
      "age": 19,
      "gender": "male",
      "date": "2026-01-16",
      "blood_pressure": "130/80 mmHg",
      "heart_rate": "72 bpm",
      "bmi": "25.23"
    },
    "observations": "...",
    "interpretation": {
      "high": [],
      "medium": [],
      "low": []
    },
    "risk_indicators": [],
    "insights": "...",
    "recommendations": [],
    "lifestyle": []
  }
}
```

### Legacy report endpoint

```bash
curl "http://localhost:8000/api/report?file_id=PASTE_FILE_ID_HERE"
```

### Template-based PDF download endpoint

```bash
curl -L -o medical-report.pdf "http://localhost:8000/api/report/pdf?file_id=PASTE_FILE_ID_HERE"
```

## Error Semantics

- `400`: Missing/invalid request input
- `404`: Uploaded file not found for `file_id`
- `502`: AI service unreachable or invalid upstream payload
- `504`: AI service timeout

## Notes

- Frontend uses backend `/api/report/pdf` for downloads so the PDF follows pipeline `templates/report.html`.
- Backend validates and normalizes AI output before returning to frontend.
- Health endpoint now includes downstream AI connectivity details.
