import os
import sys
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms

from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus
from src.features.vessel_extractor import extract_vessels
from src.xai.gradcam import RetinalGradCAM

app = FastAPI(title="Netra-AI Screening API")

# Enable CORS for standard Node.js localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained ResNet-18 classifier
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "best_dr_model.pth")
model = models.resnet18(weights=None)
model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(model.fc.in_features, 5))
model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
model.eval()
grad_cam = RetinalGradCAM(model, target_layer=model.layer4[-1])

def to_base64(img_rgb):
    _, buffer = cv2.imencode('.png', cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR))
    return f"data:image/png;base64,{base64.b64encode(buffer).decode('utf-8')}"

@app.post("/api/screen")
async def screen_retina(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 1. Quality Assessment
    status, metrics, mask = assess_image_quality(img_bgr)
    if status == "UNGRADABLE":
        return {
            "status": "UNGRADABLE",
            "metrics": metrics,
            "reason": metrics.get("reason", "Severely degraded image.")
        }

    # 2. Adaptive Enhancement
    if mask is not None:
        enhanced_bgr = enhance_fundus(img_bgr, mask, target_size=(256, 256))
    else:
        enhanced_bgr = cv2.resize(img_bgr, (256, 256))
    enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)

    # 3. Retinal Structure Extraction (Vessels)
    _, enh_mask = cv2.threshold(cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY), 5, 255, cv2.THRESH_BINARY)
    vessels, density = extract_vessels(enhanced_bgr, enh_mask)

    # 4. Deep Learning Inference & Grad-CAM
    transform = transforms.Compose([
        transforms.ToPILImage(),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    tensor_in = transform(enhanced_rgb).unsqueeze(0)
    heatmap, pred_grade, logits = grad_cam.generate_heatmap(tensor_in)
    probs = torch.softmax(logits, dim=1).squeeze().detach().numpy()
    confidence = float(probs[pred_grade] * 100)

    overlay_rgb, resized_cam = RetinalGradCAM.overlay_heatmap(heatmap, enhanced_rgb, alpha=0.45)

    # 5. Attention-to-Pathology Overlap
    attn_mask = resized_cam > 0.4
    overlap = np.sum(attn_mask & (vessels > 0))
    tot_attn = np.sum(attn_mask)
    alignment_score = float((overlap / tot_attn * 100) if tot_attn > 0 else 0.0)

    return {
        "status": status,
        "metrics": metrics,
        "dr_grade": int(pred_grade),
        "confidence": round(confidence, 1),
        "is_referable": bool(pred_grade >= 2),
        "alignment_score": round(alignment_score, 1),
        "vessel_density": round(density, 3),
        "images": {
            "enhanced": to_base64(enhanced_rgb),
            "vessels": to_base64(cv2.cvtColor(vessels, cv2.COLOR_GRAY2RGB)),
            "gradcam": to_base64(overlay_rgb)
        }
    }