%% run_matlab_gradcam.m
% Imports ONNX model into MATLAB and computes Grad-CAM heatmaps

clear; clc; close all;

% 1. Load the ONNX model into MATLAB Deep Learning Toolbox
onnxPath = fullfile('..', '..', 'models', 'dr_classifier.onnx');
if ~exist(onnxPath, 'file')
    error('ONNX model not found. Ensure Phase 3 export succeeded.');
end

fprintf('Importing ONNX network into MATLAB workspace...\n');
net = importNetworkFromONNX(onnxPath);
disp('Network successfully imported into MATLAB:');
disp(net);

% 2. Read and preprocess a sample image
imgPath = fullfile('..', '..', 'data', 'test_samples');
imgFiles = dir(fullfile(imgPath, '*.png'));
testImgRaw = imread(fullfile(imgPath, imgFiles(1).name));
testImg = imresize(testImgRaw, [256, 256]);

% 3. Run Inference in MATLAB
inputTensor = im2single(testImg);
% Normalize according to ImageNet standard
inputTensor = (inputTensor - reshape([0.485, 0.456, 0.406], [1 1 3])) ./ reshape([0.229, 0.224, 0.225], [1 1 3]);

scores = predict(net, dlarray(inputTensor, 'SSC'));
[maxScore, predIdx] = max(extractdata(scores));

fprintf('\nMATLAB Prediction:\n');
fprintf('  Predicted Grade: Level %d\n', predIdx - 1);

% 4. Compute Grad-CAM Map using MATLAB
featureLayer = 'resnet18_layer4_1_conv2'; % Last conv layer in ONNX graph
cam = gradCAM(net, inputTensor, predIdx, 'FeatureLayer', featureLayer);

% 5. Display Explainability Overlay
figure('Name', 'MATLAB Native Grad-CAM', 'Position', [200, 200, 800, 400]);
subplot(1, 2, 1);
imshow(testImg);
title(sprintf('Original Retina (Pred: Level %d)', predIdx - 1));

subplot(1, 2, 2);
imshow(testImg);
hold on;
imagesc(cam, 'AlphaData', 0.45);
colormap jet;
colorbar;
title('MATLAB Deep Learning Toolbox: Grad-CAM Overlay');