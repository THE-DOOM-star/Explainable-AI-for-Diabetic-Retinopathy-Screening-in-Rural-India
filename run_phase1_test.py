import os
import cv2
import pandas as pd
import matplotlib.pyplot as plt
from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus

MANIFEST_PATH = os.path.join("data", "test_samples", "manifest.csv")
SAMPLES_DIR = os.path.join("data", "test_samples")

df = pd.read_csv(MANIFEST_PATH)
print(f"Loaded manifest with {len(df)} images.")

# Pick one sample from each grade (Level 0 through 4) to test
test_samples = df.groupby("dr_grade").first().reset_index()

fig, axes = plt.subplots(len(test_samples), 3, figsize=(12, 16))
fig.suptitle("Phase 1 Verification: IQA & Adaptive Preprocessing", fontsize=14, fontweight="bold")

for idx, row in test_samples.iterrows():
    grade = int(row["dr_grade"])
    filename = row["filename"]
    img_path = os.path.join(SAMPLES_DIR, filename)

    img_bgr = cv2.imread(img_path)
    status, metrics, mask = assess_image_quality(img_bgr)

    # Convert to RGB for matplotlib display
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    if mask is not None:
        enhanced_bgr = enhance_fundus(img_bgr, mask)
        enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
    else:
        enhanced_rgb = img_rgb

    # Column 1: Raw input
    axes[idx, 0].imshow(img_rgb)
    axes[idx, 0].set_title(f"Grade {grade} (Raw)\nStatus: {status}", fontsize=10)
    axes[idx, 0].axis("off")

    # Column 2: Extracted Retinal Mask
    axes[idx, 1].imshow(mask if mask is not None else np.zeros((100, 100)), cmap="gray")
    axes[idx, 1].set_title(f"Retina Mask\nBlur: {metrics['blur_score']} | Lum: {metrics['mean_intensity']}", fontsize=9)
    axes[idx, 1].axis("off")

    # Column 3: Enhanced image
    axes[idx, 2].imshow(enhanced_rgb)
    axes[idx, 2].set_title("Standardized (CLAHE + BG)", fontsize=10)
    axes[idx, 2].axis("off")

plt.tight_layout()
output_fig = os.path.join("reports", "phase1_verification.png")
plt.savefig(output_fig, dpi=150)
print(f"\nPhase 1 verification complete! Summary image saved to '{output_fig}'")
plt.show()