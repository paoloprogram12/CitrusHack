from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = genai.Client(api_key="AIzaSyAtOUpJ3dZ31D0kR4HryMRTurloydAu5z4")

@app.post("/scan")
async def scan_room(file: UploadFile):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    
    # 转成bytes发给Gemini
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            """You are a hotel room security expert. 
            Analyze this room image and look for:
            1. Hidden camera indicators (lens reflections, unusual devices, small holes)
            2. Security risks (exposed wiring, blocked fire exits)
            3. Suspicious objects that don't belong
            
            Return your response in this exact format:
            RISK_LEVEL: (LOW/MEDIUM/HIGH)
            FINDINGS:
            - finding 1
            - finding 2
            SAFE_ITEMS:
            - safe item 1
            RECOMMENDATION: one sentence advice
            """
        ]
    )
    
    return {
        "analysis": response.text,
        "status": "success"
    }

@app.get("/")
def read_root():
    return {"message": "EyeSpy API is running"}
