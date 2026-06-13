import asyncio
import random
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CivicVoice ML Service")

# Allow React app running on port 5173 to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Lightweight ML Service loaded!")

class UrgencyRequest(BaseModel):
    description: str

@app.post("/predict-category")
async def predict_category(file: UploadFile = File(...)):
    """
    Mock endpoint for image classification.
    Reads an uploaded image and returns a random category and confidence.
    Replace the sleep and random choice with a real CV model (e.g., PyTorch ResNet, YOLO)
    """
    # Simulate processing time
    await asyncio.sleep(1.0)
    
    categories = ["road", "water", "garbage", "light"]
    
    # In a real scenario, you would do:
    # image_bytes = await file.read()
    # tensor = preprocess(image_bytes)
    # prediction = model(tensor)
    
    predicted = random.choice(categories)
    confidence = round(random.uniform(0.65, 0.98), 2)
    
    return {
        "category": predicted,
        "confidence": confidence,
        "filename": file.filename
    }

@app.post("/predict-urgency")
async def predict_urgency(req: UrgencyRequest):
    """
    Lightweight endpoint for urgency detection using keyword matching.
    Avoids 512MB RAM OOM limits on Render's free tier.
    """
    text = req.description.lower()
    if not text.strip():
        return {"urgency_level": "Low", "urgency_score": 0.0}

    # Keyword-based mock brain
    high_keywords = ["fire", "blood", "die", "crash", "immediate", "urgent", "danger", "burst", "leak", "accident"]
    medium_keywords = ["broken", "pothole", "garbage", "trash", "smell", "fix", "pipe", "animal"]
    
    if any(word in text for word in high_keywords):
        return {"urgency_level": "High", "urgency_score": round(random.uniform(0.85, 0.99), 2)}
    elif any(word in text for word in medium_keywords):
        return {"urgency_level": "Medium", "urgency_score": round(random.uniform(0.60, 0.84), 2)}
    else:
        return {"urgency_level": "Low", "urgency_score": round(random.uniform(0.20, 0.59), 2)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
