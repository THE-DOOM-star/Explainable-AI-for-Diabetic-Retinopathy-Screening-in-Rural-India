import sys
import os

# 1. Guarantee that the project root is in the Python search path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision.models as models
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import cohen_kappa_score, confusion_matrix

from src.classifier.dataset import RetinalDataset

def main():
    # Configuration
    EPOCHS = 8
    BATCH_SIZE = 8
    LR = 3e-4
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    MANIFEST_PATH = os.path.join(PROJECT_ROOT, "data", "test_samples", "manifest.csv")
    SAMPLES_DIR = os.path.join(PROJECT_ROOT, "data", "test_samples")
    MODELS_DIR = os.path.join(PROJECT_ROOT, "models")
    os.makedirs(MODELS_DIR, exist_ok=True)
    MODEL_SAVE_PATH = os.path.join(MODELS_DIR, "best_dr_model.pth")

    print(f"============================================================")
    print(f"  PHASE 3: TRAINING DR CLASSIFIER (5-CLASS RESNET-18)      ")
    print(f"============================================================")
    print(f"Compute Device : {DEVICE}")
    print(f"Manifest Path  : {MANIFEST_PATH}")
    print(f"Save Path      : {MODEL_SAVE_PATH}\n")

    if not os.path.exists(MANIFEST_PATH):
        raise FileNotFoundError(f"Manifest not found at {MANIFEST_PATH}. Run extract_subset.py first.")

    # 2. Stratified 80/20 Split across all 5 DR grades
    df = pd.read_csv(MANIFEST_PATH)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    train_idx, val_idx = next(skf.split(df, df['dr_grade']))

    train_df = df.iloc[train_idx].reset_index(drop=True)
    val_df = df.iloc[val_idx].reset_index(drop=True)

    print(f"Dataset Split: {len(train_df)} Training images | {len(val_df)} Validation images")
    print(f"Training Class Distribution:\n{train_df['dr_grade'].value_counts().sort_index().to_dict()}\n")

    train_dataset = RetinalDataset(train_df, SAMPLES_DIR, is_train=True)
    val_dataset = RetinalDataset(val_df, SAMPLES_DIR, is_train=False)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 3. Model Architecture (Pretrained ResNet-18)
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(num_ftrs, 5)  # 5 severity levels (0, 1, 2, 3, 4)
    )
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-3)

    best_kappa = -1.0
    best_sens = 0.0
    best_spec = 0.0

    print("--- Starting Training Loop ---")
    for epoch in range(1, EPOCHS + 1):
        # Training Phase
        model.train()
        total_train_loss = 0.0
        
        for images, labels in train_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_train_loss += loss.item() * images.size(0)

        epoch_loss = total_train_loss / len(train_df)

        # Validation Phase
        model.eval()
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(DEVICE)
                outputs = model(images)
                preds = torch.argmax(outputs, dim=1)

                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.numpy())

        all_preds = np.array(all_preds)
        all_labels = np.array(all_labels)

        # Clinical Metrics
        kappa = cohen_kappa_score(all_labels, all_preds, weights='quadratic')

        # Referable DR Metrics (Grade >= 2)
        ref_true = (all_labels >= 2).astype(int)
        ref_pred = (all_preds >= 2).astype(int)
        cm = confusion_matrix(ref_true, ref_pred, labels=[0, 1])

        if cm.size == 4:
            tn, fp, fn, tp = cm.ravel()
            sens = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            spec = (tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        else:
            sens, spec = 0.0, 0.0

        print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] "
              f"| Loss: {epoch_loss:.4f} "
              f"| QWK: {kappa:.3f} "
              f"| Referable Sens: {sens*100:5.1f}% "
              f"| Spec: {spec*100:5.1f}%")

        # Checkpointing based on Quadratic Weighted Kappa
        if kappa >= best_kappa:
            best_kappa = kappa
            best_sens = sens
            best_spec = spec
            torch.save(model.state_dict(), MODEL_SAVE_PATH)

    print("\n============================================================")
    print("  TRAINING COMPLETE                                         ")
    print("============================================================")
    print(f"Best Model Saved To : {MODEL_SAVE_PATH}")
    print(f"Peak QWK Metric     : {best_kappa:.3f}")
    print(f"Referable Sens / Spec: {best_sens*100:.1f}% / {best_spec*100:.1f}%\n")

if __name__ == "__main__":
    main()