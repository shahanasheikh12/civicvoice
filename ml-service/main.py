import asyncio
import random
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="CivicVoice ML Service")

# Allow React app running on port 5173 to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load zero-shot classification pipeline (downloads on first run)
# typeform/distilbert-base-uncased-mnli is a fast zero-shot model
print("Loading model...")
classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
print("Model loaded!")

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
    Real endpoint for urgency detection using a Hugging Face zero-shot classifier.
    Maps the description text to Low, Medium, or High urgency.
    """
    if not req.description.strip():
        return {"urgency_level": "Low", "urgency_score": 0.0}

    candidate_labels = ["high urgency emergency", "medium urgency issue", "low urgency minor problem"]
    
    # The model returns a dictionary with 'labels' and 'scores' sorted by score descending
    result = classifier(req.description, candidate_labels)
    
    top_label = result['labels'][0]
    top_score = result['scores'][0]
    
    # Map the textual label back to our app's format
    if "high" in top_label:
        urgency_level = "High"
    elif "medium" in top_label:
        urgency_level = "Medium"
    else:
        urgency_level = "Low"
        
    return {
        "urgency_level": urgency_level,
        "urgency_score": round(top_score, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
