import os
import aiofiles
from pathlib import Path
from typing import Optional


UPLOADS_DIR = "uploads"
REPORTS_DIR = "reports"


def ensure_directories():
    """Ensure upload and report directories exist."""
    Path(UPLOADS_DIR).mkdir(exist_ok=True)
    Path(REPORTS_DIR).mkdir(exist_ok=True)


async def save_upload_file(file_content: bytes, file_id: str, original_filename: str) -> str:
    """
    Save uploaded file to uploads directory.
    
    Args:
        file_content: Binary file content
        file_id: Unique file identifier (uuid)
        original_filename: Original filename for reference
        
    Returns:
        Path to saved file
    """
    ensure_directories()
    
    # Create filename with uuid prefix for uniqueness
    filename = f"{file_id}_{original_filename}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(file_content)
    
    return filename


async def read_upload_file(file_id: str) -> Optional[bytes]:
    """
    Read uploaded file from uploads directory.
    
    Args:
        file_id: Unique file identifier
        
    Returns:
        File content as bytes or None if not found
    """
    uploads_path = Path(UPLOADS_DIR)
    
    # Find file matching the file_id prefix
    for file in uploads_path.glob(f"{file_id}_*"):
        async with aiofiles.open(file, "rb") as f:
            return await f.read()
    
    return None


def get_report_path(file_id: str) -> str:
    """
    Get the path where report PDF should be saved.
    
    Args:
        file_id: Unique file identifier
        
    Returns:
        Full path to report PDF
    """
    ensure_directories()
    return os.path.join(REPORTS_DIR, f"{file_id}_report.pdf")


def report_exists(file_id: str) -> bool:
    """
    Check if report PDF exists for given file_id.
    
    Args:
        file_id: Unique file identifier
        
    Returns:
        True if report exists, False otherwise
    """
    report_path = get_report_path(file_id)
    return os.path.exists(report_path)
