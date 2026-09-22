import cv2
import numpy as np

def extract_vessels(img_bgr, mask=None):
    """
    Extracts retinal blood vessel tree using morphology and adaptive thresholding.
    Returns:
        vessel_mask (np.ndarray): Binary mask of blood vessels (0 or 255)
        vessel_density (float): Ratio of vessel area to retinal area
    """
    # 1. Green channel has the highest vessel-to-background contrast
    green = img_bgr[:, :, 1]

    # 2. Contrast enhancement via CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    contrast_green = clahe.apply(green)

    # 3. Morphological Top-Hat Transform (isolates dark vessels)
    # Using disk-shaped structural element
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    top_hat = cv2.morphologyEx(contrast_green, cv2.MORPH_BLACKHAT, kernel)

    # 4. Adaptive thresholding to segment tubular structures
    vessels = cv2.adaptiveThreshold(
        top_hat, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, -3
    )

    # 5. Clean up noise: remove tiny disconnected specks
    clean_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    vessels = cv2.morphologyEx(vessels, cv2.MORPH_OPEN, clean_kernel)

    # Apply retinal field mask if provided
    if mask is not None:
        # Erode mask slightly to eliminate peripheral border artifacts
        eroded_mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        vessels[eroded_mask == 0] = 0
        retina_area = np.sum(eroded_mask == 255)
    else:
        retina_area = vessels.size

    vessel_density = float(np.sum(vessels == 255) / retina_area) if retina_area > 0 else 0.0

    return vessels, round(vessel_density, 4)