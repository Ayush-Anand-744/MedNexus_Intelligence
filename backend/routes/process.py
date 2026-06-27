"""MedNexus_Intelligence — process routes. Copyright © 2026 Ayush Anand. All rights reserved."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import AIServiceError, ReportData, generate_report

router = APIRouter()
logger = logging.getLogger(__name__)


class ProcessRequest(BaseModel):
    file_id: str


class ProcessResponse(BaseModel):
    file_id: str
    report: ReportData

@router.post("/process", response_model=ProcessResponse)
async def process_report(request: ProcessRequest):
    """
    Process a medical report file and return structured JSON data.
    
    - Accepts file_id from upload endpoint
    - Generates AI report with structured data
    - Returns JSON report (PDF generation is handled on frontend)
    
    Response includes:
    - file_id: Unique identifier for the uploaded file
    - report: Structured medical report data with all findings and recommendations
    """
    file_id = request.file_id
    
    if not file_id:
        raise HTTPException(
            status_code=400,
            detail="file_id is required"
        )
    
    try:
        report_data = await generate_report(file_id)
        
        return ProcessResponse(
            file_id=file_id,
            report=report_data
        )
    except AIServiceError as e:
        logger.error(
            "Report generation failed",
            extra={"file_id": file_id, "status_code": e.status_code, "detail": e.detail},
        )
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.exception("Unexpected error while generating report", extra={"file_id": file_id})
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )
