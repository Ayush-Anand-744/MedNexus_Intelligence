# MedNexus_Intelligence Backend - Quick Start Guide

## 🚀 Get Running in 2 Minutes

### 1. Install Dependencies
Use Python 3.11 or 3.12 for this backend setup.

```bash
cd backend
<<<<<<< HEAD
py -3.11 -m venv venv
venv\Scripts\activate  # Windows
=======
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows
>>>>>>> 64b82592e2a16e59c2fbcfb50e63c8964730d012
python -m pip install -r requirements.txt
```

### 2. Configure AI Service Connection
Create or update `.env` in `backend/`:

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

### 3. Start the AI Pipeline Service (port 8001)
From repository root (`Pipeline/`):

```bash
source .venv/bin/activate
uvicorn src.mediscout.main:app --reload --port 8001
```

Verify AI service:

```bash
curl http://localhost:8001/api/v1/health
```

### 4. Start the Dashboard Backend (port 8000)
```bash
uvicorn main:app --reload
```

### 5. Test the API
- Open browser: **http://localhost:8000/docs**
- You'll see interactive API documentation (Swagger UI)
- Test endpoints directly from the browser

---

## 📋 Complete Workflow (curl commands)

### Upload a PDF
```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@your_file.pdf"
```
**Save the `file_id` from response**

### Process the Report
```bash
curl -X POST http://localhost:8000/api/process \
  -H "Content-Type: application/json" \
  -d '{"file_id": "PASTE_FILE_ID_HERE"}'
```

This endpoint now forwards the uploaded PDF to the AI model FastAPI service,
maps the model output to the dashboard report schema, and returns JSON for frontend rendering.

### Download Template-Based PDF
This downloads the PDF rendered by the pipeline backend using `templates/report.html`.

```bash
curl -L -o medical-report.pdf "http://localhost:8000/api/report/pdf?file_id=PASTE_FILE_ID_HERE"
```

---

## 🔗 Frontend Integration

Add this to your frontend `.env.local`:
```
REACT_APP_API_URL=http://localhost:8000
```

Then use in React:
```javascript
const API_URL = process.env.REACT_APP_API_URL;

// Upload
const formData = new FormData();
formData.append("file", file);
const res = await fetch(`${API_URL}/api/upload`, {
  method: "POST",
  body: formData
});
const { file_id } = await res.json();

// Process
await fetch(`${API_URL}/api/process`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ file_id })
});

// Download
window.location.href = `${API_URL}/api/report/pdf?file_id=${file_id}`;
```

---

## 📁 File Locations

- **Uploads**: `backend/uploads/`
- **Template PDF Endpoint**: `GET /api/report/pdf?file_id=...`
- **Legacy Report JSON Endpoint**: `GET /api/report?file_id=...`
- **API Docs**: http://localhost:8000/docs

---

## ⚠️ Troubleshooting

**AI service not reachable (502)?**
```bash
curl http://localhost:8001/api/v1/health
```

If this fails, start pipeline service on port 8001 first.

**AI inference timeout (504)?**
- Increase `AI_SERVICE_TIMEOUT_SECONDS` in backend `.env`
- Ensure model service is not overloaded

**Port 8000 in use?**
```bash
uvicorn main:app --reload --port 8001
```

If using port 8001 for backend, run AI service on another port and update `AI_SERVICE_BASE_URL`.

**Module not found?**
```bash
pip install -r requirements.txt
```

**venv not found?**
```bash
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**`subprocess-exited-with-error` / Rust or Cargo error while installing?**
This usually means you are using Python 3.13 with package pins that do not have prebuilt wheels.

```bash
deactivate
rmdir /s /q venv
py -3.11 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

Done! Your API is ready to go. 🎉
