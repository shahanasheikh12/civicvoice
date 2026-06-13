# CivicVoice ML Service

This is the Python FastAPI microservice powering the AI features of the CivicVoice platform.

## Features
1. **`/predict-category` (Image Classification):** Currently uses a mocked endpoint returning random predictions with confidence scores. This is a placeholder for a real computer vision model.
2. **`/predict-urgency` (Text Classification):** Uses a pre-trained zero-shot classification pipeline from Hugging Face (`typeform/distilbert-base-uncased-mnli`) to analyze the description and score it as Low, Medium, or High urgency.

## Setup & Running Locally

1. **Create and activate the virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: This will download PyTorch and Transformers, which are large dependencies).*

3. **Start the server:**
   ```bash
   uvicorn main:app --reload
   ```
   The server will start on `http://localhost:8000`. The first time you make a request to `/predict-urgency` (or start the app depending on lazy-loading), it will download the Hugging Face model (~260MB).

## Plugging in a Real Computer Vision Model
To replace the mock image categorization with a real model (like a PyTorch ResNet, MobileNet, or YOLO model), locate the `predict_category` function in `main.py`.

You will need to:
1. Load your `.pt` or `.onnx` model globally at the top of the file alongside the Hugging Face pipeline.
2. Inside `predict_category`, read the image bytes: `image_bytes = await file.read()`.
3. Preprocess the bytes (e.g., using `PIL` or `cv2` to resize and normalize).
4. Run inference through your model and map the output tensor back to one of the four classes: `road`, `water`, `garbage`, `light`.
5. Return the resulting category and confidence.
