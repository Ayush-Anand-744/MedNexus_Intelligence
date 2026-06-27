"""
MedNexus_Intelligence
Copyright © 2026 Ayush Anand. All rights reserved.

Backend API entrypoint for the medical report intelligence dashboard.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.upload import router as upload_router
from routes.process import router as process_router
from routes.report import router as report_router
from services.ai_service import check_ai_service_health


def _cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    origins = [item.strip().rstrip("/") for item in raw.split(",") if item.strip()]
    return origins or ["http://localhost:3000"]


app = FastAPI(
    title="MedNexus_Intelligence API",
    description="Medical report intelligence backend with upload, analysis and report preview endpoints.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX") or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(process_router, prefix="/api", tags=["process"])
app.include_router(report_router, prefix="/api", tags=["report"])


@app.get("/")
async def root():
    return {
        "message": "MedNexus_Intelligence API is running",
        "version": "1.0.0",
        "status": "healthy",
    }


@app.get("/health")
async def health():
    ai_health = await check_ai_service_health()
    return {
        "status": "ok",
        "service": "MedNexus_Intelligence API",
        "ai_service": ai_health,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
    )
