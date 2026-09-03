import os
import json
from PIL import Image

with open('.env') as f:
    for line in f:
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            os.environ[k.strip()] = v.strip()

from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))
doc_path = r'backend\uploads\documents\TR-2026-0078_doc.jpg'
img = Image.open(doc_path)
if img.width > 1000 or img.height > 1000:
    img.thumbnail((1000, 1000), Image.Resampling.LANCZOS)

prompt = """You are an expert Forensic Document Examiner and Border Control Officer.
Carefully analyze this identity document.

Perform a thorough visual and security feature inspection:
1. Document Identification: What exact credential is this?
2. Authenticity Analysis:
   - Is it a genuine official document, or does it have signs of being a specimen/sample, digital forgery, template, synthetic generation, or physical/digital tampering?
   - State clearly WHY you are declaring this document Real or Fake / Tampered. Give detailed forensic observations.
3. Embedded Face / Portrait Photo Analysis:
   - Detect the portrait photo on the document. Provide normalized bounding box [ymin, xmin, ymax, xmax] (between 0.0 and 1.0).
   - Evaluate if the photograph is a Real Photo or Fake / Tampered / Spliced Photo.
   - State clearly WHY the photograph is Real or Fake.
4. Field Extraction:
   - Extract Full Name, Document Number, Date of Birth, Address, Expiry Date.

Return strictly valid JSON with this structure:
{
  "document_type": "string",
  "authenticity_assessment": {
    "classification": "Real Document | Fake Document | Tampered Document",
    "is_real_document": boolean,
    "confidence": float,
    "reasons": ["detailed string reasons with specific visual evidence"]
  },
  "face_analysis": {
    "face_detected": boolean,
    "photo_status": "Real Photo | Fake / Tampered Photo",
    "is_real_photo": boolean,
    "quality": "Good | Fair | Poor",
    "explanation": "detailed string explaining why photo is real or fake",
    "indicators": ["forensic photo markers"],
    "bounding_box": [ymin, xmin, ymax, xmax]
  },
  "tampering_analysis": {
    "status": "No Obvious Anomaly | Tampering Anomaly Detected",
    "score": float,
    "explanation": "detailed explanation",
    "photo_replacement_detected": boolean,
    "text_manipulation_detected": boolean,
    "indicators": []
  },
  "extracted_fields": {
    "name": "string or null",
    "document_number": "string or null",
    "date_of_birth": "string or null",
    "address": "string or null",
    "expiry_date": "string or null"
  }
}
"""

cfg = types.GenerateContentConfig(
    temperature=0.1,
    response_mime_type='application/json',
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
)

res = client.models.generate_content(
    model='gemini-3.5-flash',
    contents=[img, prompt],
    config=cfg
)

print("GEMINI 3.5 FLASH RESPONSE:\n")
print(res.text)
