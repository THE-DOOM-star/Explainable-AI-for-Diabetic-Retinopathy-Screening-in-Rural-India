import os
import zipfile

# 1. Automatically find any .zip file in the current folder
zip_files = [f for f in os.listdir('.') if f.endswith('.zip')]

if not zip_files:
    print("[ERROR] No .zip file found in the current folder!")
    print("Please place your 10 GB zip file inside this folder, or specify its path.")
    exit()

zip_name = zip_files[0]
file_size_gb = os.path.getsize(zip_name) / (1024 ** 3)
print(f"Found archive: '{zip_name}' ({file_size_gb:.2f} GB)")

# 2. Inspect contents without unzipping the 10 GB
print("Reading archive contents (please wait a few seconds)...")
with zipfile.ZipFile(zip_name, 'r') as z:
    all_files = z.namelist()
    print(f"Total files inside archive: {len(all_files)}")

    # Check for CSV label files
    csv_files = [f for f in all_files if f.endswith('.csv')]
    print("\n--- Found CSV / Annotation Files ---")
    for c in csv_files:
        print(f" -> {c}")

    # Check for image samples
    image_files = [f for f in all_files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    print(f"\nTotal image files detected: {len(image_files)}")
    print("\n--- First 5 sample image paths ---")
    for img in image_files[:5]:
        print(f" -> {img}")