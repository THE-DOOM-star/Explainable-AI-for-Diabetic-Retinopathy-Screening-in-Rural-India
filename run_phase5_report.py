import sys
import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms
import pandas as pd
import numpy as np
import cv2

from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus
from src.features.vessel_extractor import extract_vessels
from src.xai.gradcam import RetinalGradCAM
from src.xai.report_generator import create_clinical_report

# 1. Load Trained Classifier
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "best_dr_model.pth")
MANIFEST_PATH = os.path.join(PROJECT_ROOT, "data", "test_samples", "manifest.csv")
SAMPLES_DIR = os.path.join(PROJECT_ROOT, "data", "test_samples")

model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(num_ftrs, 5))
model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
model.eval()

grad_cam = RetinalGradCAM(model, target_layer=model.layer4[-1])

# 2. Pick a test patient from the dataset
df = pd.read_csv(MANIFEST_PATH)
sample_case = df[df['dr_grade'] >= 2].iloc[0]  # Select a referable DR case

raw_path = os.path.join(SAMPLES_DIR, sample_case['filename'])
raw_bgr = cv2.imread(raw_path)

print(f"\nProcessing screening pipeline for Image: {sample_case['filename']}...")

# Step A: IQA Check
status, metrics, mask = assess_image_quality(raw_bgr)
print(f"IQA Status: {status} (Blur: {metrics['blur_score']}, Lum: {metrics['mean_intensity']})")

# Step B: Enhancement
if mask is not None:
    enhanced_bgr = enhance_fundus(raw_bgr, mask, target_size=(256, 256))
else:
    enhanced_bgr = cv2.resize(raw_bgr, (256, 256))
enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)

# Step C: Anatomical Feature Extraction
_, enh_mask = cv2.threshold(cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY), 5, 255, cv2.THRESH_BINARY)
vessels, _ = extract_vessels(enhanced_bgr, enh_mask)

# Step D: Inference & Grad-CAM
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
tensor_in = transform(enhanced_rgb).unsqueeze(0)
heatmap, pred_grade, logits = grad_cam.generate_heatmap(tensor_in)

probs = torch.softmax(logits, dim=1).squeeze().numpy()
confidence = float(probs[pred_grade] * 100)

overlay_rgb, resized_cam = RetinalGradCAM.overlay_heatmap(heatmap, enhanced_rgb, alpha=0.45)

# Calculate Vascular Alignment Score
attn_mask = resized_cam > 0.4
overlap = np.sum(attn_mask & (vessels > 0))
tot_attn = np.sum(attn_mask)
alignment_score = float((overlap / tot_attn * 100) if tot_attn > 0 else 0.0)

# Step E: Generate Official Screening Report
patient_meta = {
    "id": f"IND-MH-2026-{sample_case['id_code'][:6].upper()}",
    "age": 58,
    "gender": "Female",
    "centre": "Primary Health Centre, Shirur (Pune District)",
    "eye": "Right Eye (OD)"
}

output_report_path = os.path.join(PROJECT_ROOT, "reports", "screening_report_sample.png")
create_clinical_report(
    patient_meta=patient_meta,
    iqa_metrics=metrics,
    iqa_status=status,
    pred_grade=pred_grade,
    confidence=confidence,
    alignment_score=alignment_score,
    raw_rgb=enhanced_rgb,
    vessel_map=vessels,
    overlay_rgb=overlay_rgb,
    output_path=output_report_path
)

print(f"\n============================================================")
print(f" PIPELINE COMPLETE: View the final report in:")
print(f" -> {output_report_path}")
print(f"============================================================")