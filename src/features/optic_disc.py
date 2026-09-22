import cv2
import numpy as np

def locate_optic_disc(img_bgr, mask=None):
    """
    Locates the Optic Disc (OD) and generates its spatial mask.
    Returns:
        od_mask (np.ndarray): Binary mask enclosing the Optic Disc
        od_center (tuple): (x, y) coordinates of the OD center
        od_radius (int): Estimated radius of the OD
    """
    # 1. Optic disc has highest reflectance in the Red channel
    red = img_bgr[:, :, 2]
    
    # 2. Smooth to eliminate vessel interference inside the disc
    blurred = cv2.GaussianBlur(red, (25, 25), 0)

    # Apply retinal mask to avoid border false detections
    if mask is not None:
        eroded_mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35)))
        blurred[eroded_mask == 0] = 0

    # 3. Locate pixel with maximum brightness
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(blurred)
    od_center = max_loc  # (x, y)

    # 4. Standard approximate radius (typically ~7-10% of retinal diameter)
    h, w = img_bgr.shape[:2]
    od_radius = int(min(h, w) * 0.08)

    # 5. Create binary mask for Optic Disc
    od_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(od_mask, od_center, od_radius, 255, -1)

    return od_mask, od_center, od_radius