import cv2
import numpy as np

def assess_image_quality(img_bgr):
    """
    Evaluates retinal image gradeability.
    Returns:
        status (str): 'GOOD', 'BORDERLINE', or 'UNGRADABLE'
        metrics (dict): Numeric values for blur, luminance, FOV ratio
        mask (np.ndarray): Binary mask of retinal foreground
    """
    # 1. Green Channel isolation (highest contrast for retinal structures)
    green_channel = img_bgr[:, :, 1]
    total_pixels = img_bgr.shape[0] * img_bgr.shape[1]

    # 2. Retinal Foreground Mask Extraction
    # Filter out black camera borders
    _, mask = cv2.threshold(green_channel, 15, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    # Find the largest connected component (the circular retina)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return "UNGRADABLE", {"reason": "No retinal structure found"}, None

    largest_cnt = max(contours, key=cv2.contourArea)
    clean_mask = np.zeros_like(mask)
    cv2.drawContours(clean_mask, [largest_cnt], -1, 255, -1)

    retinal_pixels = np.sum(clean_mask == 255)
    fov_ratio = retinal_pixels / total_pixels

    # 3. Focus / Blur Metric: Variance of the Laplacian within the retina
    laplacian = cv2.Laplacian(green_channel, cv2.CV_64F)
    # Measure variance only over valid retinal pixels
    retina_lap = laplacian[clean_mask == 255]
    blur_score = float(np.var(retina_lap)) if len(retina_lap) > 0 else 0.0

    # 4. Illumination / Exposure Check
    retina_intensities = green_channel[clean_mask == 255]
    mean_intensity = float(np.mean(retina_intensities)) if len(retina_intensities) > 0 else 0.0
    saturation_ratio = float(np.sum(retina_intensities >= 245) / retinal_pixels) if retinal_pixels > 0 else 0.0

    metrics = {
        "fov_ratio": round(fov_ratio, 3),
        "blur_score": round(blur_score, 1),
        "mean_intensity": round(mean_intensity, 1),
        "saturation_ratio": round(saturation_ratio, 3)
    }

    # Clinical Decision Logic
    is_severely_blurry = blur_score < 80.0
    is_underexposed = mean_intensity < 28.0
    is_overexposed = saturation_ratio > 0.18
    is_poor_fov = fov_ratio < 0.40

    if is_severely_blurry or is_underexposed or is_overexposed or is_poor_fov:
        status = "UNGRADABLE"
        if is_severely_blurry:
            metrics["reason"] = "Severe optical defocus or motion blur."
        elif is_underexposed:
            metrics["reason"] = "Critical underexposure (retinal detail lost)."
        elif is_overexposed:
            metrics["reason"] = "Flash saturation / glare artifact."
        else:
            metrics["reason"] = "Retinal cutoff (<40% sensor coverage)."
    elif (blur_score < 130.0) or (mean_intensity < 45.0) or (saturation_ratio > 0.08):
        status = "BORDERLINE"
        metrics["reason"] = "Sub-optimal illumination. Suitable for adaptive enhancement."
    else:
        status = "GOOD"
        metrics["reason"] = "Optimal diagnostic quality verified."

    return status, metrics, clean_mask