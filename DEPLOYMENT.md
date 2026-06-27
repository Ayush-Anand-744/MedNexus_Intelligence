# Render Deployment Guide — MedNexus_Intelligence™

This project should be deployed as two Render Web Services: one backend and one frontend.

## 1. Backend Render Service

Create a new Render Web Service from the GitHub repository.

```text
Name: mednexus-intelligence-api
Language: Python
Branch: main
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```env
PORT=8000
CORS_ORIGINS=https://mednexus-intelligence-web.onrender.com,http://localhost:3000
ENABLE_DEMO_FALLBACK=true
```

Optional external AI pipeline variables:

```env
AI_SERVICE_BASE_URL=https://your-ai-pipeline-service.onrender.com
AI_SERVICE_PROCESS_PATH=/api/v1/reports/process/sync
AI_SERVICE_HEALTH_PATH=/api/v1/health
AI_SERVICE_REPORT_PDF_PATH_TEMPLATE=/api/v1/reports/{request_id}/pdf
AI_SERVICE_TIMEOUT_SECONDS=300
AI_SERVICE_CONNECT_TIMEOUT_SECONDS=10
AI_SERVICE_RETRIES=2
AI_SERVICE_HEALTH_TIMEOUT_SECONDS=3
```

The optional AI pipeline is not required for portfolio deployment because the backend includes a safe demo fallback.

## 2. Frontend Render Service

Create another Render Web Service from the same GitHub repository.

```text
Name: mednexus-intelligence-web
Language: Node
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm start
```

Environment variables:

```env
NODE_VERSION=20
NEXT_PUBLIC_API_URL=https://mednexus-intelligence-api.onrender.com
```

Replace the API URL with your actual backend Render URL.

## 3. Final live link

Use the frontend Render URL as the real live project link.

```text
https://mednexus-intelligence-web.onrender.com
```

## 4. GitHub Pages

GitHub Pages is only suitable for the static landing page in the repository root. It cannot run the FastAPI backend, upload handling or report generation flow.
