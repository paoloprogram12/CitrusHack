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
import tempfile
import time
import logging

load_dotenv()

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

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SECURITY_PROMPT = """
You are a hotel room security expert analyzing a room for travelers.

Carefully examine the content and identify:
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

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}

VIDEO_POLL_INTERVAL = 2   # seconds between state checks
VIDEO_POLL_TIMEOUT = 120  # seconds before giving up


class Threat(BaseModel):
    type: str
    description: str
    location: str
    severity: str
    bbox: list[int] | None = None


class ScanResult(BaseModel):
    risk_level: str
    risk_score: int
    threats: list[Threat]
    safe_items: list[str]
    recommendation: str
    summary: str


DETECTION_PROMPT_TEMPLATE = """Locate each of these specific items/threats in the image: {items}

Return ONLY a JSON array. Each entry must have:
- "label": exactly one of the item names listed above
- "box_2d": [ymin, xmin, ymax, xmax] as integers 0-1000 (0=top/left edge, 1000=bottom/right edge)

Example: [{{"label": "hidden camera lens", "box_2d": [120, 450, 160, 490]}}]

Only include items you can visually confirm and precisely locate. Return [] if nothing found."""


def _word_overlap(a: str, b: str) -> int:
    return len(set(a.split()) & set(b.split()))


def run_bbox_detection(client, contents: list, threat_types: list[str]) -> dict[str, list[list[int]]]:
    if not threat_types:
        return {}
    prompt = DETECTION_PROMPT_TEMPLATE.format(items=", ".join(threat_types))
    try:
        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents + [prompt],
        )
        print("[bbox] raw response:", resp.text[:300])
        detections = parse_gemini_json(resp.text)
        if not isinstance(detections, list):
            print("[bbox] response was not a list:", type(detections))
            return {}
        result: dict[str, list[list[int]]] = {}
        for d in detections:
            if "label" in d and "box_2d" in d and isinstance(d["box_2d"], list) and len(d["box_2d"]) >= 4:
                coords = [int(v) for v in d["box_2d"][:4]]
                ymin, xmin, ymax, xmax = coords
                if ymin >= ymax or xmin >= xmax:
                    print(f"[bbox] rejected inverted coords: {coords}")
                    continue
                result.setdefault(d["label"].lower(), []).append([ymin, xmin, ymax, xmax])
        print("[bbox] detections:", result)
        return result
    except Exception as e:
        print("[bbox] exception:", e)
        return {}


def merge_bboxes(threats: list[dict], bboxes: dict[str, list[list[int]]]) -> list[dict]:
    # Make mutable copies of each bbox list so we can pop as we assign
    remaining = {k: list(v) for k, v in bboxes.items()}
    for threat in threats:
        ttype = threat.get("type", "").lower()
        matched_key = next((k for k in remaining if k in ttype or ttype in k), None)
        if matched_key is None:
            best_k, best_score = None, 0
            for k in remaining:
                score = _word_overlap(k, ttype)
                if score > best_score:
                    best_k, best_score = k, score
            if best_k and best_score > 0:
                matched_key = best_k
        if matched_key and remaining[matched_key]:
            threat["bbox"] = remaining[matched_key].pop(0)
            if not remaining[matched_key]:
                del remaining[matched_key]
        else:
            threat["bbox"] = None
        print(f"[merge] '{ttype}' -> bbox={threat['bbox']}")
    return threats


def parse_gemini_json(text: str):
    # Strip markdown code fences (```json ... ``` or ``` ... ```)
    stripped = text.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        inner = []
        for line in lines[1:]:
            if line.strip() == "```":
                break
            inner.append(line)
        stripped = "\n".join(inner).strip()

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    # Try to extract array first, then object
    for open_c, close_c in [("[", "]"), ("{", "}")]:
        start = text.find(open_c)
        if start == -1:
            continue
        end = text.rfind(close_c) + 1
        if end <= start:
            continue
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            continue

    raise HTTPException(status_code=502, detail="Gemini returned unparseable response.")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def read_root():
    return {"message": "EyeSpy API is running"}


@app.post("/scan", response_model=ScanResult)
async def scan_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG, PNG, WebP, or GIF.",
        )

    contents = await file.read()

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image exceeds 10 MB limit.")

    img = Image.open(io.BytesIO(contents))
    img = img.convert("RGB")

    img_bytes_io = io.BytesIO()
    img.save(img_bytes_io, format="JPEG")
    img_bytes = img_bytes_io.getvalue()

    img_part = types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[img_part, SECURITY_PROMPT],
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    data = parse_gemini_json(response.text)
    threat_types = [t.get("type", "") for t in data.get("threats", [])]
    bboxes = run_bbox_detection(client, [img_part], threat_types)
    data["threats"] = merge_bboxes(data.get("threats", []), bboxes)
    return data


@app.post("/scan/video", response_model=ScanResult)
async def scan_video(file: UploadFile):
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload an MP4, MOV, WebM, or AVI.",
        )

    contents = await file.read()

    if len(contents) > MAX_VIDEO_SIZE:
        raise HTTPException(status_code=413, detail="Video exceeds 100 MB limit.")

    # Write to a temp file so the Gemini Files API can upload it
    suffix = "." + (file.filename or "video.mp4").rsplit(".", 1)[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    gemini_file = None
    try:
        # Upload to Gemini Files API
        try:
            gemini_file = client.files.upload(
                file=tmp_path,
                config=types.UploadFileConfig(mime_type=file.content_type),
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Gemini file upload error: {str(e)}")

        # Poll until the file is ready
        elapsed = 0
        while gemini_file.state.name == "PROCESSING":
            if elapsed >= VIDEO_POLL_TIMEOUT:
                raise HTTPException(status_code=504, detail="Timed out waiting for Gemini to process video.")
            time.sleep(VIDEO_POLL_INTERVAL)
            elapsed += VIDEO_POLL_INTERVAL
            gemini_file = client.files.get(name=gemini_file.name)

        if gemini_file.state.name == "FAILED":
            raise HTTPException(status_code=502, detail="Gemini failed to process the video.")

        video_part = types.Part.from_uri(file_uri=gemini_file.uri, mime_type=file.content_type)
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[video_part, SECURITY_PROMPT],
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")

    finally:
        os.unlink(tmp_path)
        if gemini_file:
            try:
                client.files.delete(name=gemini_file.name)
            except Exception:
                pass  # non-fatal cleanup failure

    data = parse_gemini_json(response.text)
    threat_types = [t.get("type", "") for t in data.get("threats", [])]
    bboxes = run_bbox_detection(client, [video_part], threat_types)
    data["threats"] = merge_bboxes(data.get("threats", []), bboxes)
    return data
