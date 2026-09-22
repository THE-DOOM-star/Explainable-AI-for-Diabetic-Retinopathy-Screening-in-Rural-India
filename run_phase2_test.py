import os
import cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus
from src.features.vessel_extractor import extract_vessels
from src.features.optic_disc import locate_optic_disc

MANIFEST_PATH = os.path.join("data", "test_samples", "manifest.csv")
SAMPLES_DIR = os.path.join("data", "test_samples")

df = pd.read_csv(MANIFEST_PATH)
# Select one Level 0 (Normal) and one Level 4 (Proliferative DR) to compare anatomy
sample_cases = [
    df[df['dr_grade'] == 0].iloc[0],
    df[df['dr_grade'] == 4].iloc[0]
]

fig, axes = plt.subplots(2, 4, figsize=(16, 8))
fig.suptitle("Phase 2: Anatomical Structure Extraction (Vessels & Optic Disc)", fontsize=14, fontweight="bold")

for row_idx, case in enumerate(sample_cases):
    grade = int(case["dr_grade"])
    img_path = os.path.join(SAMPLES_DIR, case["filename"])
    
    raw = cv2.imread(img_path)
    status, metrics, mask = assess_image_quality(raw)
    enhanced = enhance_fundus(raw, mask, target_size=(512, 512))
    
    # 512x512 mask for enhanced image
    _, enhanced_mask = cv2.threshold(cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY), 5, 255, cv2.THRESH_BINARY)

    # 1. Extract Blood Vessels
    vessels, density = extract_vessels(enhanced, enhanced_mask)

    # 2. Locate Optic Disc
    od_mask, od_center, od_radius = locate_optic_disc(enhanced, enhanced_mask)

    # 3. Composite Overlay (Vessels in cyan, Optic Disc in yellow circle)
    overlay = enhanced.copy()
    overlay[vessels == 255] = [255, 255, 0]  # Cyan tint for vessels
    cv2.circle(overlay, od_center, od_radius, (0, 165, 255), 3) # Orange/Yellow ring for OD

    # Plotting
    rgb_enhanced = cv2.cvtColor(enhanced, cv2.COLOR_BGR2RGB)
    rgb_overlay = cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB)

    axes[row_idx, 0].imshow(rgb_enhanced)
    axes[row_idx, 0].set_title(f"Grade {grade} Enhanced Fundus", fontsize=10)
    axes[row_idx, 0].axis("off")

    axes[row_idx, 1].imshow(vessels, cmap="gray")
    axes[row_idx, 1].set_title(f"Vessel Tree\nDensity: {density:.3f}", fontsize=10)
    axes[row_idx, 1].axis("off")

    axes[row_idx, 2].imshow(od_mask, cmap="inferno")
    axes[row_idx, 2].set_title(f"Optic Disc Mask\nCenter: {od_center}", fontsize=10)
    axes[row_idx, 2].axis("off")

    axes[row_idx, 3].imshow(rgb_overlay)
    axes[row_idx, 3].set_title(f"Anatomical Landmark Map\n(Vessels + OD boundary)", fontsize=10)
    axes[row_idx, 3].axis("off")

plt.tight_layout()
output_fig = os.path.join("reports", "phase2_features.png")
plt.savefig(output_fig, dpi=150)
print(f"Phase 2 verification complete! Saved to '{output_fig}'")
plt.show()
