"""MedNexus_Intelligence — upload routes. Copyright © 2026 Ayush Anand. All rights reserved."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import uuid
import os
import shutil

# Ensure uploads folder exists
os.makedirs("uploads", exist_ok=True)

router = APIRouter()


class UploadResponse(BaseModel):
    file_id: str
    filename: str


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a PDF file.
    
    - Validates file type (must be PDF)
    - Saves file with unique ID
    - Returns file_id and filename
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Filename is required"
            )
        
        if not file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="File must have .pdf extension"
            )
        
        if file.content_type and file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Expected PDF, got {file.content_type}"
            )
        
        # Generate unique file ID and file path
        file_id = str(uuid.uuid4())
        file_path = f"uploads/{file_id}.pdf"
        
        # Save file using shutil for proper handling
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return UploadResponse(
            file_id=file_id,
            filename=file.filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )
