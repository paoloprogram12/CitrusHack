from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from PIL import Image
import io
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

client = genai.Client(api_key="AIzaSyBLbVRiuPi3P_tBD0bRx1SMfU2cNdWrkOw")

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

@app.post("/scan")
async def scan_room(file: UploadFile):
    # 读取图片
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    img = img.convert('RGB')
    img = img.convert('RGB')  # 去掉透明通道
    
    # 转成JPEG bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    # 发给Gemini
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            SECURITY_PROMPT
        ]
    )
    
    # 解析JSON结果
    try:
        result = json.loads(response.text)
    except:
        # 如果Gemini没有返回纯JSON，清理一下
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        result = json.loads(text[start:end])
    
    return result

@app.get("/")
def read_root():
    return {"message": "EyeSpy API is running"}
