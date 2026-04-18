from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
from PIL import Image
import io
import os
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SECURITY_PROMPT = """
You are a hotel room security expert analyzing a room photo for travelers.

Carefully examine the image and identify:
1. Hidden camera indicators:
   - Unusual lens reflections or glints
   - Small holes in walls, smoke detectors, clocks, or decorations
   - Devices that seem out of place (modified alarm clocks, air purifiers, USB chargers)

2. Security risks:
   - Broken or unsecured door locks
   - Blocked fire exits
   - Exposed wiring

3. Suspicious objects:
   - Devices you wouldn't normally find in a hotel room
   - Items positioned unusually (facing the bed or bathroom)

Respond ONLY with a valid JSON object in this exact format, no other text:
{
    "risk_level": "LOW" or "MEDIUM" or "HIGH",
    "risk_score": number from 0 to 100,
    "threats": [
        {
            "type": "threat type",
            "description": "what you found",
            "location": "where in the image",
            "severity": "LOW" or "MEDIUM" or "HIGH"
        }
    ],
    "safe_items": ["item 1", "item 2"],
    "recommendation": "one clear action for the traveler",
    "summary": "2 sentence overview of the room security"
}
"""

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class Threat(BaseModel):
    type: str
    description: str
    location: str
    severity: str


class ScanResult(BaseModel):
    risk_level: str
    risk_score: int
    threats: list[Threat]
    safe_items: list[str]
    recommendation: str
    summary: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def read_root():
    return {"message": "EyeSpy API is running"}


@app.post("/scan", response_model=ScanResult)
async def scan_room(file: UploadFile):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG, PNG, WebP, or GIF.",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    img = Image.open(io.BytesIO(contents))
    img = img.convert("RGB")

    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format="JPEG")
    img_bytes = img_bytes_io.getvalue()

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                SECURITY_PROMPT,
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    try:
        result = json.loads(response.text)
    except json.JSONDecodeError:
        text = response.text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start == -1 or end == 0:
            raise HTTPException(status_code=502, detail="Gemini returned unparseable response.")
        result = json.loads(text[start:end])

    return result
