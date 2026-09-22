import cv2
import numpy as np

def crop_to_retina(img_bgr, mask):
    """Crops the image tightly around the segmented retina."""
    x, y, w, h = cv2.boundingRect(mask)
    return img_bgr[y:y+h, x:x+w], mask[y:y+h, x:x+w]

def apply_ben_graham_enhancement(img_bgr, sigma=30):
    """
    Ben Graham's local illumination normalization:
    Subtracts local Gaussian blur to remove uneven lighting.
    """
    img_float = img_bgr.astype(np.float32)
    local_mean = cv2.GaussianBlur(img_float, (0, 0), sigma)
    # Weighted subtraction
    enhanced = cv2.addWeighted(img_float, 4.0, local_mean, -4.0, 128.0)
    return np.clip(enhanced, 0, 255).astype(np.uint8)

def apply_clahe_lab(img_bgr, clip_limit=2.0, tile_grid_size=(8, 8)):
    """Applies CLAHE to the L* (Luminance) channel in LAB color space."""
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_clahe = clahe.apply(l)
    
    enhanced_lab = cv2.merge((l_clahe, a, b))
    return cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

def enhance_fundus(img_bgr, mask, target_size=(512, 512)):
    """Full enhancement pipeline: Crop -> Ben Graham -> CLAHE -> Resize."""
    # 1. Tight crop
    cropped_img, cropped_mask = crop_to_retina(img_bgr, mask)
    
    # 2. Ben Graham illumination equalization
    bg_enhanced = apply_ben_graham_enhancement(cropped_img)
    
    # 3. Clean circular border
    bg_enhanced[cropped_mask == 0] = 0
    
    # 4. Selective CLAHE for contrast enhancement
    final_enhanced = apply_clahe_lab(bg_enhanced)
    final_enhanced[cropped_mask == 0] = 0
    
    # 5. Standardize spatial dimensions for CNN pipeline
    resized_img = cv2.resize(final_enhanced, target_size, interpolation=cv2.INTER_AREA)
    return resized_img