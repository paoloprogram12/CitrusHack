from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from google import genai
from google.genai import types
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field, ValidationError
from typing import List, Literal
from dotenv import load_dotenv
import io
import os
import json
import logging
import traceback

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="EyeSpy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# API KEY LOADING / CLEANING
# -----------------------------
google_api_key = os.getenv("GOOGLE_API_KEY")
gemini_api_key_raw = os.getenv("GEMINI_API_KEY")

if google_api_key:
    raise RuntimeError(
        "GOOGLE_API_KEY is set in your environment. Remove it and keep only GEMINI_API_KEY."
    )

if not gemini_api_key_raw:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Put it in your .env file."
    )

api_key = gemini_api_key_raw.replace("\ufeff", "").strip()

print("GEMINI_API_KEY repr:", repr(api_key[:20]))
print("GEMINI_API_KEY codepoints:", [ord(c) for c in api_key[:10]])
print("GEMINI_API_KEY has non-ascii:", any(ord(c) > 127 for c in api_key))
print("GOOGLE_API_KEY exists:", google_api_key is not None)

if any(ord(c) > 127 for c in api_key):
    raise RuntimeError(
        "GEMINI_API_KEY contains non-ASCII characters. Re-type it manually in .env."
    )

client = genai.Client(api_key=api_key)

SECURITY_PROMPT = """
Analyze this hotel or rental room image for traveler safety.

Return valid JSON only in this format:
{
  "risk_level": "LOW",
  "risk_score": 20,
  "threats": [
    {
      "type": "Suspicious device",
      "description": "A small object appears unusually placed and may need manual inspection.",
      "location": "Near the bed",
      "severity": "MEDIUM"
    }
  ],
  "safe_items": ["No exposed wiring visible"],
  "recommendation": "Inspect suspicious objects manually and verify the room locks.",
  "summary": "The room appears mostly normal, but one object may require closer inspection."
}
"""


class ThreatItem(BaseModel):
    type: str
    description: str
    location: str
    severity: Literal["LOW", "MEDIUM", "HIGH"]


class ScanResult(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_score: int = Field(ge=0, le=100)
    threats: List[ThreatItem]
    safe_items: List[str]
    recommendation: str
    summary: str


class ErrorResponse(BaseModel):
    error: str
    detail: str


def extract_json_from_text(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end <= start:
            raise ValueError("Model response does not contain valid JSON.")
        return json.loads(text[start:end])


def prepare_image_bytes(file_bytes: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(file_bytes))
        img = img.convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")
    except Exception as e:
        logger.exception("Failed to process image.")
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    output = io.BytesIO()
    img.save(output, format="JPEG", quality=95)
    return output.getvalue()


def analyze_room_with_gemini(img_bytes: bytes) -> ScanResult:
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                SECURITY_PROMPT,
            ],
        )
    except Exception as e:
        logger.exception("Gemini API call failed.")
        raise HTTPException(status_code=502, detail=f"Gemini API call failed: {str(e)}")

    response_text = getattr(response, "text", None)
    if not response_text:
        raise HTTPException(status_code=502, detail="Gemini returned an empty response.")

    try:
        parsed = extract_json_from_text(response_text)
    except Exception as e:
        logger.exception("Failed to parse Gemini response as JSON.")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini JSON response: {str(e)}"
        )

    try:
        return ScanResult(**parsed)
    except ValidationError as e:
        logger.exception("Gemini response failed schema validation.")
        raise HTTPException(
            status_code=502,
            detail=f"Gemini response schema invalid: {e.errors()}"
        )


@app.get("/")
def read_root():
    return {"message": "EyeSpy API is running"}


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "EyeSpy API",
        "version": "1.0.0"
    }


@app.get("/debug-env")
def debug_env():
    gemini_key = os.getenv("GEMINI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")

    def inspect_value(name, value):
        if value is None:
            return {"name": name, "exists": False}
        cleaned = value.replace("\ufeff", "")
        return {
            "name": name,
            "exists": True,
            "repr_prefix": repr(value[:20]),
            "cleaned_repr_prefix": repr(cleaned[:20]),
            "length": len(value),
            "first_10_codepoints": [ord(c) for c in value[:10]],
            "has_non_ascii": any(ord(c) > 127 for c in value),
        }

    return {
        "GEMINI_API_KEY": inspect_value("GEMINI_API_KEY", gemini_key),
        "GOOGLE_API_KEY": inspect_value("GOOGLE_API_KEY", google_key),
    }


@app.get("/test-gemini")
def test_gemini():
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents='Say hello in JSON: {"message":"hello"}'
        )
        return {"ok": True, "text": response.text}
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }


@app.post(
    "/scan",
    response_model=ScanResult,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
async def scan_room(file: UploadFile = File(...)):
    logger.info("Received scan request: filename=%s content_type=%s", file.filename, file.content_type)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed.")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        img_bytes = prepare_image_bytes(contents)
        result = analyze_room_with_gemini(img_bytes)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected server error during /scan.")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, str) else json.dumps(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "request_failed",
            "detail": detail
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.exception("Unhandled exception occurred.")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "detail": str(exc)
        },
    )
