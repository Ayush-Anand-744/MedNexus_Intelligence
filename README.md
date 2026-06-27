# MedNexus_Intelligence™

**Owner:** Ayush Anand  
**Copyright:** © 2026 Ayush Anand. All rights reserved.

MedNexus_Intelligence™ is a full-stack medical report intelligence dashboard. It allows users to upload a PDF medical report, trigger backend analysis, preview a generated report, and download a report summary.

This repository is published for portfolio demonstration, academic review, and professional evaluation only. Rebranding, redistribution, republication, or submission of this project under another identity is not permitted.

## What it includes

- **Frontend:** Next.js dashboard with PDF upload, analysis states, report preview and download controls.
- **Backend:** FastAPI service with upload, process, report and health endpoints.
- **AI integration:** Optional external AI pipeline through environment variables.
- **Deployment-safe fallback:** If the external AI service is not configured, the backend returns a clearly marked demo decision-support report instead of crashing.
- **Ownership protection:** License, notice, provenance metadata and visible footer branding.

## Local setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend local URL:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend local URL:

```text
http://localhost:3000
```

Create `frontend/.env.local` for local frontend-to-backend connection:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Render deployment

Deploy this as two Render Web Services:

### Backend service

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Backend environment variables:

```env
PORT=8000
CORS_ORIGINS=https://your-frontend-render-url.onrender.com,http://localhost:3000
ENABLE_DEMO_FALLBACK=true
AI_SERVICE_BASE_URL=https://your-optional-ai-pipeline-url.com
```

`AI_SERVICE_BASE_URL` is optional. Without it, the app still runs using the safe demo fallback.

### Frontend service

```text
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
```

Frontend environment variables:

```env
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://your-backend-render-url.onrender.com
```

## GitHub Pages note

This is a full-stack project. GitHub Pages can only host a landing page or redirect page. The actual working application should be hosted on Render because the project requires a live FastAPI backend for uploads and report generation.

## Important disclaimer

MedNexus_Intelligence™ is a portfolio-grade decision-support demonstration. It is not a medical device and must not be used as a replacement for professional diagnosis or treatment.
