import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import torch.nn as nn
import torchvision.models as models

def export_model():
    MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "best_dr_model.pth")
    ONNX_PATH = os.path.join(PROJECT_ROOT, "models", "dr_classifier.onnx")

    print("============================================================")
    print("  PHASE 3: EXPORTING WEIGHTS TO ONNX (STABLE EXPORTER)     ")
    print("============================================================")

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Weights file not found at {MODEL_PATH}.")

    # 1. Rebuild architecture
    model = models.resnet18(weights=None)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, 5)
    )

    # 2. Load trained parameters
    state_dict = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
    model.load_state_dict(state_dict)
    model.eval()

    # 3. Dummy input: [Batch=1, Channels=3, Height=256, Width=256]
    dummy_input = torch.randn(1, 3, 256, 256, requires_grad=False)

    # 4. Export using the rock-solid classic exporter (dynamo=False)
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_PATH,
        export_params=True,        # Embed all trained weights
        opset_version=14,          # Stable opset fully supported by MATLAB
        do_constant_folding=True,  # Optimize constants
        input_names=['retina_input'],
        output_names=['dr_logits'],
        dynamo=False               # Bypasses experimental dynamo converter
    )

    file_size_mb = os.path.getsize(ONNX_PATH) / (1024 * 1024)
    print(f"\n Export successful!")
    print(f" File path: {ONNX_PATH}")
    print(f" Validated File Size: {file_size_mb:.2f} MB (Expected: ~43-45 MB)")

if __name__ == "__main__":
    export_model()