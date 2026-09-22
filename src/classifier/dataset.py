import os
import cv2
import torch
from torch.utils.data import Dataset
from torchvision import transforms
from PIL import Image

from src.iqa.assess_quality import assess_image_quality
from src.iqa.enhance_retina import enhance_fundus

class RetinalDataset(Dataset):
    def __init__(self, df, img_dir, is_train=True):
        self.df = df.reset_index(drop=True)
        self.img_dir = img_dir
        self.is_train = is_train

        # PyTorch normalization standard for ImageNet backbones
        if self.is_train:
            self.transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomVerticalFlip(p=0.5),
                transforms.RandomRotation(degrees=20),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])
            ])
        else:
            self.transform = transforms.Compose([
                transforms.ToPILImage(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                     std=[0.229, 0.224, 0.225])
            ])

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.img_dir, row['filename'])
        raw_bgr = cv2.imread(img_path)

        # Apply Phase 1 Quality & Adaptive Enhancement
        _, _, mask = assess_image_quality(raw_bgr)
        if mask is not None:
            enhanced_bgr = enhance_fundus(raw_bgr, mask, target_size=(256, 256))
        else:
            enhanced_bgr = cv2.resize(raw_bgr, (256, 256))

        # Convert BGR to RGB
        enhanced_rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
        tensor_img = self.transform(enhanced_rgb)

        label = int(row['dr_grade'])
        return tensor_img, label