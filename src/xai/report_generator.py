import sys
import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import cv2
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from datetime import datetime

ICDR_STAGES = {
    0: ("Level 0 - No Diabetic Retinopathy", "ROUTINE ANNUAL SCREENING", "#2ecc71"),
    1: ("Level 1 - Mild Non-Proliferative DR (NPDR)", "ROUTINE 6-12 MONTH MONITORING", "#f1c40f"),
    2: ("Level 2 - Moderate Non-Proliferative DR (NPDR)", "REFERRAL REQUIRED: Ophthalmology Review (4-6 Wks)", "#e67e22"),
    3: ("Level 3 - Severe Non-Proliferative DR (NPDR)", "URGENT REFERRAL: Specialist Clinic (2-4 Wks)", "#e74c3c"),
    4: ("Level 4 - Proliferative Diabetic Retinopathy (PDR)", "CRITICAL: Immediate Specialist Intervention (<2 Wks)", "#c0392b")
}

def create_clinical_report(patient_meta, iqa_metrics, iqa_status, 
                           pred_grade, confidence, alignment_score,
                           raw_rgb, vessel_map, overlay_rgb, output_path):
    """
    Generates a structured, publication-grade clinical screening report image.
    """
    stage_name, recommendation, alert_color = ICDR_STAGES.get(pred_grade, ("Unknown", "Manual Review", "#333"))
    is_referable = pred_grade >= 2

    # Set up publication figure canvas (A4 landscape ratio)
    fig = plt.figure(figsize=(15, 9), facecolor="#f8f9fa")
    gs = gridspec.GridSpec(2, 3, height_ratios=[1.1, 1.9], hspace=0.3, wspace=0.25)

    # -------------------------------------------------------------
    # 1. Header & Patient Info Block (Top Left & Center)
    # -------------------------------------------------------------
    ax_info = fig.add_subplot(gs[0, :2])
    ax_info.axis("off")
    
    header_text = (
        "AI-ASSISTED DIABETIC RETINOPATHY SCREENING REPORT\n"
        "Rural Tele-Ophthalmology Decision Support System | CDSS Prototype\n"
        "--------------------------------------------------------------------------------------------------"
    )
    ax_info.text(0.01, 0.95, header_text, fontsize=12, fontweight="bold", color="#1a252f", va="top")

    meta_text = (
        f"Patient ID      : {patient_meta.get('id', 'N/A')}\n"
        f"Age / Gender    : {patient_meta.get('age', '52')} Yrs / {patient_meta.get('gender', 'M')}\n"
        f"Screening PHC   : {patient_meta.get('centre', 'District Rural Health Centre')}\n"
        f"Exam Date       : {datetime.now().strftime('%d-%b-%Y %H:%M')}\n"
        f"Eye Evaluated   : {patient_meta.get('eye', 'Right Eye (OD)')}"
    )
    ax_info.text(0.01, 0.65, meta_text, fontsize=9.5, fontfamily="monospace", color="#2c3e50", va="top")

    iqa_text = (
        f"Image Quality   : {iqa_status}\n"
        f"Focus (Blur)    : {iqa_metrics.get('blur_score', 0):.1f} (Threshold: 80.0)\n"
        f"Mean Luminance  : {iqa_metrics.get('mean_intensity', 0):.1f} / 255\n"
        f"FOV Ratio       : {iqa_metrics.get('fov_ratio', 0)*100:.1f}%\n"
        f"IQA Action      : {'Adaptive CLAHE Applied' if iqa_status == 'BORDERLINE' else 'Direct Grading'}"
    )
    ax_info.text(0.50, 0.65, iqa_text, fontsize=9.5, fontfamily="monospace", color="#2c3e50", va="top")

    # -------------------------------------------------------------
    # 2. Clinical Recommendation Badge (Top Right)
    # -------------------------------------------------------------
    ax_badge = fig.add_subplot(gs[0, 2])
    ax_badge.axis("off")
    
    badge_bg = "#fde8e8" if is_referable else "#e8f8f0"
    border_col = alert_color
    
    ax_badge.text(0.5, 0.85, "SCREENING VERDICT", ha="center", fontsize=11, fontweight="bold", color="#333")
    
    verdict_badge = "[ ! ] REFERRAL REQUIRED" if is_referable else "[ OK ] ROUTINE MONITORING"
    ax_badge.text(0.5, 0.60, verdict_badge, ha="center", fontsize=11.5, fontweight="bold", 
                  color=border_col, bbox=dict(boxstyle="round,pad=0.5", facecolor=badge_bg, edgecolor=border_col, lw=2))
    
    ax_badge.text(0.5, 0.35, f"Diagnosis: {stage_name}", ha="center", fontsize=9, fontweight="bold", color="#2c3e50")
    ax_badge.text(0.5, 0.18, f"Calibrated Confidence: {confidence:.1f}%", ha="center", fontsize=9, color="#555")
    ax_badge.text(0.5, 0.05, f"Vascular Overlap: {alignment_score:.1f}%", ha="center", fontsize=8.5, color="#777")

    # -------------------------------------------------------------
    # 3. Visual Diagnostics Panel (Bottom 3 Panels)
    # -------------------------------------------------------------
    # Panel A: Original Input
    ax_img = fig.add_subplot(gs[1, 0])
    ax_img.imshow(raw_rgb)
    ax_img.set_title("1. Standardized Input Fundus", fontsize=10, fontweight="bold")
    ax_img.axis("off")

    # Panel B: Vascular Tree & Landmarks
    ax_vessels = fig.add_subplot(gs[1, 1])
    ax_vessels.imshow(vessel_map, cmap="bone")
    ax_vessels.set_title("2. Extracted Retinal Vascular Tree", fontsize=10, fontweight="bold")
    ax_vessels.axis("off")

    # Panel C: Grad-CAM Explainability Heatmap
    ax_xai = fig.add_subplot(gs[1, 2])
    ax_xai.imshow(overlay_rgb)
    ax_xai.set_title("3. Grad-CAM Pathology Attention Overlay", fontsize=10, fontweight="bold")
    ax_xai.axis("off")

    # Disclaimer Footer
    fig.text(0.5, 0.02, 
             "* DISCLAIMER: This automated decision-support report is generated for rural screening triage under human-in-the-loop oversight. "
             "Final clinical diagnosis must be validated by an ophthalmologist.",
             ha="center", fontsize=8, style="italic", color="#7f8c8d")

    plt.savefig(output_path, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f" Clinical Screening Report generated at: {output_path}")