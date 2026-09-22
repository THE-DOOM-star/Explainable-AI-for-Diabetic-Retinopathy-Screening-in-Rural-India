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
import matplotlib.pyplot as plt

from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus
from src.features.vessel_extractor import extract_vessels
from src.xai.gradcam import RetinalGradCAM

MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "best_dr_model.pth")
MANIFEST_PATH = os.path.join(PROJECT_ROOT, "data", "test_samples", "manifest.csv")
SAMPLES_DIR = os.path.join(PROJECT_ROOT, "data", "test_samples")

# 1. Load Trained ResNet-18 Model
model = models.resnet18(weights=None)
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.3),
    nn.Linear(num_ftrs, 5)
)
model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
model.eval()

# Hook into the last convolutional block of ResNet-18
grad_cam = RetinalGradCAM(model, target_layer=model.layer4[-1])

# 2. Select Test Cases: Grade 0 (No DR) vs Grade 3 (Severe NPDR)
df = pd.read_csv(MANIFEST_PATH)
test_cases = [
    df[df['dr_grade'] == 0].iloc[0],
    df[df['dr_grade'] == 3].iloc[0]
]

DR_CLASSES = ["0 - No DR", "1 - Mild NPDR", "2 - Moderate NPDR", "3 - Severe NPDR", "4 - Proliferative DR"]

transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
fig.suptitle("Phase 4: Clinically Grounded Explainable AI (Grad-CAM Attention Maps)", fontsize=14, fontweight="bold")

for row_idx, case in enumerate(test_cases):
    img_path = os.path.join(SAMPLES_DIR, case['filename'])
    raw_bgr = cv2.imread(img_path)
    
    # Preprocess
    _, _, mask = assess_image_quality(raw_bgr)
    enhanced_bgr = enhance_fundus(raw_bgr, mask, target_size=(256, 256))
    enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
    
    # Blood vessels for anatomical comparison
    _, enh_mask = cv2.threshold(cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY), 5, 255, cv2.THRESH_BINARY)
    vessels, _ = extract_vessels(enhanced_bgr, enh_mask)

    # Inference & Grad-CAM
    input_tensor = transform(enhanced_rgb).unsqueeze(0)
    heatmap, pred_class, logits = grad_cam.generate_heatmap(input_tensor)
    
    # Softmax probabilities
    probs = torch.softmax(logits, dim=1).squeeze().numpy()
    confidence = probs[pred_class] * 100
    
    # Generate Overlay
    overlay_rgb, resized_cam = RetinalGradCAM.overlay_heatmap(heatmap, enhanced_rgb, alpha=0.45)

    # Calculate Alignment Metric: Fraction of AI attention on retinal vessels & lesions
    vascular_pixels = vessels > 0
    attention_mask = resized_cam > 0.4  # Top 60% activation
    overlap = np.sum(attention_mask & vascular_pixels)
    total_attn = np.sum(attention_mask)
    alignment_score = (overlap / total_attn * 100) if total_attn > 0 else 0.0

    # Plotting
    axes[row_idx, 0].imshow(enhanced_rgb)
    axes[row_idx, 0].set_title(f"True Label: Level {case['dr_grade']}\nPred: Level {pred_class} ({confidence:.1f}%)", fontsize=10)
    axes[row_idx, 0].axis("off")

    axes[row_idx, 1].imshow(vessels, cmap="gray")
    axes[row_idx, 1].set_title("Vascular Anatomy", fontsize=10)
    axes[row_idx, 1].axis("off")

    axes[row_idx, 2].imshow(resized_cam, cmap="jet")
    axes[row_idx, 2].set_title("Grad-CAM Attention Map", fontsize=10)
    axes[row_idx, 2].axis("off")

    axes[row_idx, 3].imshow(overlay_rgb)
    axes[row_idx, 3].set_title(f"Diagnostic Overlay\nVascular Alignment: {alignment_score:.1f}%", fontsize=10)
    axes[row_idx, 3].axis("off")

plt.tight_layout()
output_path = os.path.join(PROJECT_ROOT, "reports", "phase4_explainability.png")
plt.savefig(output_path, dpi=150)
print(f"Phase 4 complete! Explainability report saved to: {output_path}")
plt.show()