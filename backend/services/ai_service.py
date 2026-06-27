"""AI integration service for dashboard backend.

This module calls the external MedNexus_Intelligence pipeline FastAPI service and maps
its FinalReport response to the dashboard's ReportData contract.
"""

from __future__ import annotations

import logging
import os
import re
import time
from datetime import date
from pathlib import Path
from typing import Any, Literal

import httpx
from pydantic import BaseModel, Field, ValidationError


logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Domain error raised by AI service operations."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class ProfileSummary(BaseModel):
    patient_name: str
    age: int | None = None
    gender: str | None = None
    date: str
    blood_pressure: str | None = None
    heart_rate: str | None = None
    bmi: str | None = None


class RiskItem(BaseModel):
    title: str
    description: str


class RiskIndicator(BaseModel):
    label: str
    level: Literal["high", "medium", "low"]


class Interpretation(BaseModel):
    high: list[RiskItem] = Field(default_factory=list)
    medium: list[RiskItem] = Field(default_factory=list)
    low: list[RiskItem] = Field(default_factory=list)


class ReportData(BaseModel):
    profile_summary: ProfileSummary
    observations: str
    interpretation: Interpretation
    risk_indicators: list[RiskIndicator]
    insights: str
    recommendations: list[str]
    lifestyle: list[str]


class PipelineSyncResponse(BaseModel):
    request_id: str
    status: str
    data: dict[str, Any] | None = None
    error: str | None = None


def _env_str(name: str, default: str) -> str:
    return os.getenv(name, default).strip() or default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


AI_SERVICE_BASE_URL = _env_str("AI_SERVICE_BASE_URL", "http://localhost:8001")
AI_SERVICE_PROCESS_PATH = _env_str("AI_SERVICE_PROCESS_PATH", "/api/v1/reports/process/sync")
AI_SERVICE_HEALTH_PATH = _env_str("AI_SERVICE_HEALTH_PATH", "/api/v1/health")
AI_SERVICE_REPORT_PDF_PATH_TEMPLATE = _env_str(
    "AI_SERVICE_REPORT_PDF_PATH_TEMPLATE",
    "/api/v1/reports/{request_id}/pdf",
)
AI_SERVICE_TIMEOUT_SECONDS = _env_int("AI_SERVICE_TIMEOUT_SECONDS", 300)
AI_SERVICE_CONNECT_TIMEOUT_SECONDS = _env_int("AI_SERVICE_CONNECT_TIMEOUT_SECONDS", 10)
AI_SERVICE_RETRIES = _env_int("AI_SERVICE_RETRIES", 2)
AI_SERVICE_HEALTH_TIMEOUT_SECONDS = _env_int("AI_SERVICE_HEALTH_TIMEOUT_SECONDS", 3)
ENABLE_DEMO_FALLBACK = _env_bool("ENABLE_DEMO_FALLBACK", True)

# In-memory mapping in dashboard backend process: file_id -> pipeline request_id
_PIPELINE_REQUEST_MAP: dict[str, str] = {}


def _classify_upstream_error(message: str, default_status: int = 502) -> tuple[int, str]:
    """Map upstream provider errors to actionable dashboard responses."""
    normalized = _safe_text(message)
    lowered = normalized.lower()

    # Common HF router failure when account credits are exhausted.
    if "error code: 402" in lowered or "depleted your monthly included credits" in lowered:
        return (
            402,
            (
                "Hugging Face credits are exhausted for the configured token. "
                "Add credits or upgrade the HF plan, then retry report generation."
            ),
        )

    if "error code: 429" in lowered or "rate limit" in lowered:
        return 503, "Hugging Face rate limit reached. Please wait and retry."

    match = re.search(r"error code\s*:\s*(\d{3})", lowered)
    if match:
        code = int(match.group(1))
        if code == 401:
            return 502, "Hugging Face authentication failed. Check API token configuration."
        if code == 403:
            return 502, "Hugging Face access denied for this model/token combination."

    return default_status, normalized or "AI service request failed"


def _safe_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def _as_int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _as_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _normalize_risk_level(level: Any) -> Literal["high", "medium", "low"]:
    text = _safe_text(level).lower()
    if text in {"critical", "high", "urgent", "severe"}:
        return "high"
    if text in {"moderate", "medium", "attention", "warning", "caution"}:
        return "medium"
    return "low"


def _is_lifestyle_category(category: str) -> bool:
    keywords = (
        "lifestyle",
        "diet",
        "nutrition",
        "exercise",
        "fitness",
        "wellness",
        "sleep",
        "stress",
        "weight",
    )
    lowered = category.lower()
    return any(token in lowered for token in keywords)


def _build_profile_summary(final_report: dict[str, Any]) -> ProfileSummary:
    profile = final_report.get("profile_summary") or {}
    vitals = final_report.get("vitals") or {}

    systolic = _as_int(vitals.get("blood_pressure_systolic"))
    diastolic = _as_int(vitals.get("blood_pressure_diastolic"))
    blood_pressure = f"{systolic}/{diastolic} mmHg" if systolic and diastolic else None

    heart_rate = _as_int(vitals.get("heart_rate"))
    bmi = _as_float(vitals.get("bmi"))

    return ProfileSummary(
        patient_name=_safe_text(profile.get("patient_name"), "Unknown"),
        age=_as_int(profile.get("age")),
        gender=_safe_text(profile.get("gender"), None),
        date=_safe_text(profile.get("report_date"), "N/A"),
        blood_pressure=blood_pressure,
        heart_rate=f"{heart_rate} bpm" if heart_rate is not None else None,
        bmi=f"{bmi:.2f}" if bmi is not None else None,
    )


def _build_observations(final_report: dict[str, Any]) -> str:
    observations = []
    for item in final_report.get("key_observations", []) or []:
        if not isinstance(item, dict):
            continue
        category = _safe_text(item.get("category"), "General")
        text = _safe_text(item.get("observation"))
        if text:
            observations.append(f"{category}: {text}")
    return " ".join(observations)


def _build_recommendations(final_report: dict[str, Any]) -> tuple[list[str], list[str]]:
    recommendations: list[str] = []
    lifestyle: list[str] = []

    for item in final_report.get("recommendations", []) or []:
        if isinstance(item, dict):
            rec_text = _safe_text(item.get("recommendation"))
            category = _safe_text(item.get("category"), "general")
        else:
            rec_text = _safe_text(item)
            category = "general"

        if not rec_text:
            continue
        recommendations.append(rec_text)
        if _is_lifestyle_category(category):
            lifestyle.append(rec_text)

    if not lifestyle:
        lifestyle = recommendations[:5]

    return recommendations, lifestyle


def _build_interpretation(final_report: dict[str, Any]) -> tuple[Interpretation, list[RiskIndicator]]:
    high: list[RiskItem] = []
    medium: list[RiskItem] = []
    low: list[RiskItem] = []
    indicators: list[RiskIndicator] = []

    for risk in final_report.get("risks", []) or []:
        if not isinstance(risk, dict):
            continue

        condition = _safe_text(risk.get("condition"), "Unnamed risk")
        action = _safe_text(risk.get("action_required"), "Follow medical advice and monitor this condition.")
        level = _normalize_risk_level(risk.get("level"))

        risk_item = RiskItem(title=condition, description=action)
        indicators.append(RiskIndicator(label=condition, level=level))

        if level == "high":
            high.append(risk_item)
        elif level == "medium":
            medium.append(risk_item)
        else:
            low.append(risk_item)

    if not indicators:
        for item in final_report.get("key_observations", []) or []:
            if not isinstance(item, dict):
                continue
            category = _safe_text(item.get("category"), "Observation")
            status = _normalize_risk_level(item.get("status"))
            observation_text = _safe_text(item.get("observation"), "No details provided")
            risk_item = RiskItem(title=category, description=observation_text)
            indicators.append(RiskIndicator(label=category, level=status))

            if status == "high":
                high.append(risk_item)
            elif status == "medium":
                medium.append(risk_item)
            else:
                low.append(risk_item)

    return Interpretation(high=high, medium=medium, low=low), indicators


def _to_dashboard_report_data(final_report: dict[str, Any]) -> ReportData:
    profile_summary = _build_profile_summary(final_report)
    interpretation, risk_indicators = _build_interpretation(final_report)
    recommendations, lifestyle = _build_recommendations(final_report)

    insights_raw = final_report.get("insights", []) or []
    if isinstance(insights_raw, list):
        insights = " ".join(_safe_text(item) for item in insights_raw if _safe_text(item))
    else:
        insights = _safe_text(insights_raw)

    return ReportData(
        profile_summary=profile_summary,
        observations=_build_observations(final_report),
        interpretation=interpretation,
        risk_indicators=risk_indicators,
        insights=insights,
        recommendations=recommendations,
        lifestyle=lifestyle,
    )


def _build_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def _demo_report_data(file_id: str, reason: str = "") -> ReportData:
    """Return a safe demo report so deployed portfolio demos never crash when the external AI pipeline is offline.

    The demo report is clearly generic and must not be treated as medical advice.
    """
    today = date.today().isoformat()
    suffix = file_id[:8] if file_id else "demo"
    note = (
        "The live external AI pipeline is not configured or is temporarily unreachable. "
        "This fallback keeps the portfolio demo usable while preserving the upload, analysis, "
        "preview and download flow."
    )
    if reason:
        note = f"{note} Upstream detail: {reason[:180]}"

    return ReportData(
        profile_summary=ProfileSummary(
            patient_name=f"Demo Patient {suffix}",
            age=42,
            gender="Not specified",
            date=today,
            blood_pressure="122/78 mmHg",
            heart_rate="74 bpm",
            bmi="23.80",
        ),
        observations=(
            "Vital signs are represented within a normal-to-borderline demonstration range. "
            "Uploaded report flow completed successfully. " + note
        ),
        interpretation=Interpretation(
            high=[
                RiskItem(
                    title="Clinical validation required",
                    description="A qualified clinician should review the uploaded report and confirm all findings.",
                )
            ],
            medium=[
                RiskItem(
                    title="Lifestyle monitoring",
                    description="Monitor sleep, hydration, diet quality and activity level for preventive health tracking.",
                )
            ],
            low=[
                RiskItem(
                    title="Routine follow-up",
                    description="Continue routine checkups and compare future reports against historical values.",
                )
            ],
        ),
        risk_indicators=[
            RiskIndicator(label="Clinical review", level="high"),
            RiskIndicator(label="Lifestyle trend", level="medium"),
            RiskIndicator(label="Routine follow-up", level="low"),
        ],
        insights=(
            "MedNexus_Intelligence converts a medical-report upload into a structured dashboard-style summary. "
            "This deployed fallback proves the complete frontend-backend workflow even when the optional AI pipeline is absent."
        ),
        recommendations=[
            "Consult a registered medical professional before making health decisions.",
            "Maintain a consistent health-report history for longitudinal tracking.",
            "Re-check abnormal values with a verified laboratory or clinician.",
            "Use the application as decision-support, not as a diagnostic replacement.",
        ],
        lifestyle=[
            "Stay hydrated and maintain a balanced diet.",
            "Aim for regular physical activity as medically appropriate.",
            "Prioritize sleep and stress management.",
        ],
    )


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _minimal_pdf(report: ReportData) -> bytes:
    """Generate a tiny dependency-free PDF summary for portfolio deployment fallback."""
    lines = [
        "MedNexus_Intelligence Report",
        "Owner: Ayush Anand",
        f"Patient: {report.profile_summary.patient_name}",
        f"Date: {report.profile_summary.date}",
        "",
        "Observations:",
        report.observations[:420],
        "",
        "Insights:",
        report.insights[:420],
        "",
        "Recommendations:",
        *[f"- {item[:90]}" for item in report.recommendations[:5]],
        "",
        "Note: Demo decision-support output. Not a medical diagnosis.",
    ]

    text_ops = ["BT", "/F1 12 Tf", "50 780 Td", "16 TL"]
    for idx, line in enumerate(lines[:42]):
        safe = _escape_pdf_text(line)
        if idx == 0:
            text_ops.append(f"({safe}) Tj")
        else:
            text_ops.append(f"T* ({safe}) Tj")
    text_ops.append("ET")
    stream = "\n".join(text_ops).encode("latin-1", "ignore")

    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for number, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{number} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects)+1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode()
    )
    return bytes(pdf)


async def analyze_pdf(file_path: Path, file_id: str) -> ReportData:
    """Send PDF to external AI service and return dashboard-compatible report data."""
    if not file_path.exists():
        raise AIServiceError(404, f"Uploaded file not found for file_id: {file_id}")

    process_url = _build_url(AI_SERVICE_BASE_URL, AI_SERVICE_PROCESS_PATH)
    timeout = httpx.Timeout(
        timeout=AI_SERVICE_TIMEOUT_SECONDS,
        connect=AI_SERVICE_CONNECT_TIMEOUT_SECONDS,
    )

    last_exc: Exception | None = None

    for attempt in range(AI_SERVICE_RETRIES + 1):
        try:
            start = time.perf_counter()
            async with httpx.AsyncClient(timeout=timeout) as client:
                with file_path.open("rb") as fp:
                    response = await client.post(
                        process_url,
                        files={"file": (f"{file_id}.pdf", fp, "application/pdf")},
                    )

            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "AI process call completed",
                extra={
                    "file_id": file_id,
                    "ai_status_code": response.status_code,
                    "ai_latency_ms": latency_ms,
                    "ai_attempt": attempt + 1,
                    "ai_url": process_url,
                },
            )

            if response.status_code >= 500 and attempt < AI_SERVICE_RETRIES:
                continue

            if response.status_code >= 400:
                status_code, detail = _classify_upstream_error(
                    response.text[:300],
                    default_status=502,
                )
                raise AIServiceError(
                    status_code,
                    f"AI service returned {response.status_code}: {detail}",
                )

            payload = response.json()
            parsed = PipelineSyncResponse.model_validate(payload)
            if parsed.status != "completed" or parsed.data is None:
                message = parsed.error or f"Unexpected AI status: {parsed.status}"
                status_code, detail = _classify_upstream_error(message, default_status=502)
                raise AIServiceError(
                    status_code,
                    f"AI service did not complete successfully: {detail}",
                )

            report_data = _to_dashboard_report_data(parsed.data)
            _PIPELINE_REQUEST_MAP[file_id] = parsed.request_id
            logger.info(
                "AI payload mapped to dashboard schema",
                extra={
                    "file_id": file_id,
                    "ai_request_id": parsed.request_id,
                    "risk_count": len(report_data.risk_indicators),
                    "recommendation_count": len(report_data.recommendations),
                },
            )
            return report_data

        except AIServiceError:
            raise
        except httpx.TimeoutException as exc:
            last_exc = exc
            if attempt < AI_SERVICE_RETRIES:
                continue
            raise AIServiceError(504, "AI service timed out while processing the PDF") from exc
        except (httpx.NetworkError, httpx.ConnectError, httpx.RemoteProtocolError) as exc:
            last_exc = exc
            if attempt < AI_SERVICE_RETRIES:
                continue
            raise AIServiceError(502, "AI service is unreachable") from exc
        except ValidationError as exc:
            raise AIServiceError(502, f"AI response validation failed: {exc}") from exc
        except ValueError as exc:
            raise AIServiceError(502, f"Invalid AI response format: {exc}") from exc
        except Exception as exc:
            last_exc = exc
            break

    if last_exc is not None:
        raise AIServiceError(502, f"Unexpected AI integration error: {last_exc}") from last_exc

    raise AIServiceError(502, "Unknown AI integration error")


async def generate_report(file_id: str) -> ReportData:
    """Load uploaded file and generate report via external AI service or safe demo fallback."""
    file_path = Path("uploads") / f"{file_id}.pdf"
    try:
        return await analyze_pdf(file_path=file_path, file_id=file_id)
    except AIServiceError as exc:
        if ENABLE_DEMO_FALLBACK:
            logger.warning(
                "AI service unavailable; returning demo fallback report",
                extra={"file_id": file_id, "status_code": exc.status_code, "detail": exc.detail},
            )
            return _demo_report_data(file_id, exc.detail)
        raise


def _extract_filename(content_disposition: str | None, fallback_request_id: str) -> str:
    if content_disposition:
        marker = "filename="
        if marker in content_disposition:
            raw_name = content_disposition.split(marker, 1)[1].strip().strip('"')
            if raw_name:
                return raw_name
    return f"health_report_{fallback_request_id[:8]}.pdf"


async def _fetch_pipeline_pdf(request_id: str) -> tuple[bytes, str]:
    pdf_path = AI_SERVICE_REPORT_PDF_PATH_TEMPLATE.format(request_id=request_id)
    pdf_url = _build_url(AI_SERVICE_BASE_URL, pdf_path)
    timeout = httpx.Timeout(
        timeout=AI_SERVICE_TIMEOUT_SECONDS,
        connect=AI_SERVICE_CONNECT_TIMEOUT_SECONDS,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(pdf_url)

    if response.status_code == 404:
        raise AIServiceError(404, f"Pipeline PDF not found for request_id: {request_id}")

    if response.status_code >= 400:
        raise AIServiceError(
            502,
            f"AI PDF endpoint returned {response.status_code}: {response.text[:300]}",
        )

    filename = _extract_filename(response.headers.get("content-disposition"), request_id)
    return response.content, filename


async def download_report_pdf(file_id: str) -> tuple[bytes, str]:
    """Return pipeline-generated PDF bytes, or a dependency-free demo PDF when fallback is enabled."""
    request_id = _PIPELINE_REQUEST_MAP.get(file_id)

    try:
        if not request_id:
            await generate_report(file_id)
            request_id = _PIPELINE_REQUEST_MAP.get(file_id)

        if not request_id:
            raise AIServiceError(502, "Could not resolve pipeline request id for PDF retrieval")

        try:
            return await _fetch_pipeline_pdf(request_id)
        except AIServiceError as exc:
            if exc.status_code != 404:
                raise

        await generate_report(file_id)
        refreshed_request_id = _PIPELINE_REQUEST_MAP.get(file_id)
        if not refreshed_request_id:
            raise AIServiceError(502, "Failed to regenerate report for PDF retrieval")

        return await _fetch_pipeline_pdf(refreshed_request_id)
    except AIServiceError as exc:
        if not ENABLE_DEMO_FALLBACK:
            raise
        report = _demo_report_data(file_id, exc.detail)
        return _minimal_pdf(report), f"mednexus_intelligence_{file_id[:8] if file_id else 'demo'}.pdf"


async def check_ai_service_health() -> dict[str, Any]:
    """Check AI service health endpoint."""
    health_url = _build_url(AI_SERVICE_BASE_URL, AI_SERVICE_HEALTH_PATH)
    timeout = httpx.Timeout(timeout=AI_SERVICE_HEALTH_TIMEOUT_SECONDS)

    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(health_url)
        latency_ms = round((time.perf_counter() - start) * 1000, 2)

        return {
            "reachable": response.status_code < 500,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "base_url": AI_SERVICE_BASE_URL,
        }
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {
            "reachable": False,
            "status_code": None,
            "latency_ms": latency_ms,
            "base_url": AI_SERVICE_BASE_URL,
            "error": str(exc),
        }
