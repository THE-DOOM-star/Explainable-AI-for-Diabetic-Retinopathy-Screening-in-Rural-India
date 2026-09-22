import sys
import os
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import torch
import torch.nn.functional as F
import numpy as np
import cv2

class RetinalGradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register forward and backward hooks
        self.target_layer.register_forward_hook(self._save_activations)
        self.target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_heatmap(self, input_tensor, target_class=None):
        self.model.eval()
        output = self.model(input_tensor)

        if target_class is None:
            target_class = torch.argmax(output, dim=1).item()

        # Backward pass for the target class logit
        self.model.zero_grad()
        score = output[0, target_class]
        score.backward()

        # Global average pooling of gradients
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])

        # Weight the activation feature maps
        for i in range(self.activations.shape[1]):
            self.activations[:, i, :, :] *= pooled_gradients[i]

        # Compute heatmap via ReLU on channel-wise mean
        heatmap = torch.mean(self.activations, dim=1).squeeze().cpu().numpy()
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize between 0 and 1
        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap /= max_val

        return heatmap, target_class, output.detach()

    @staticmethod
    def overlay_heatmap(heatmap, original_img_rgb, alpha=0.4):
        """Resizes heatmap and blends it over the RGB retina."""
        h, w = original_img_rgb.shape[:2]
        heatmap_resized = cv2.resize(heatmap, (w, h))
        
        # Convert grayscale heatmap to Jet colormap
        heatmap_uint8 = np.uint8(255 * heatmap_resized)
        color_heatmap = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        color_heatmap = cv2.cvtColor(color_heatmap, cv2.COLOR_BGR2RGB)

        # Blend
        blended = np.float32(color_heatmap) * alpha + np.float32(original_img_rgb) * (1 - alpha)
        blended = np.clip(blended, 0, 255).astype(np.uint8)
        return blended, heatmap_resized