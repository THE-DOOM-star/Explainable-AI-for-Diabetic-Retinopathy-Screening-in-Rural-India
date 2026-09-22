import os
import zipfile
import csv
import random
from collections import defaultdict

ZIP_PATH = "aptos2019-blindness-detection.zip"
OUTPUT_DIR = os.path.join("data", "test_samples")
SAMPLES_PER_GRADE = 20  # 20 images x 5 grades = 100 images total

os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"Opening '{ZIP_PATH}'...")
with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    # 1. Read train.csv directly from the zip
    if 'train.csv' not in z.namelist():
        print("[ERROR] train.csv not found inside zip!")
        exit()
        
    print("Reading train.csv labels...")
    with z.open('train.csv') as f:
        reader = csv.DictReader(f.read().decode('utf-8').splitlines())
        rows = list(reader)

    # 2. Group image IDs by DR grade (0 to 4)
    grade_groups = defaultdict(list)
    for row in rows:
        grade = int(row['diagnosis'])
        img_id = row['id_code']
        grade_groups[grade].append(img_id)

    print("\nDataset Distribution in train.csv:")
    for grade in sorted(grade_groups.keys()):
        print(f"  Level {grade}: {len(grade_groups[grade])} images")

    # 3. Select 20 balanced samples per grade
    random.seed(42)  # For reproducible sampling
    selected_samples = []
    
    for grade in range(5):
        available = grade_groups[grade]
        sampled_ids = random.sample(available, min(len(available), SAMPLES_PER_GRADE))
        for img_id in sampled_ids:
            selected_samples.append({'id_code': img_id, 'diagnosis': grade})

    print(f"\nExtracting {len(selected_samples)} balanced images to '{OUTPUT_DIR}'...")

    # 4. Extract only those 100 images
    extracted_records = []
    for item in selected_samples:
        img_id = item['id_code']
        grade = item['diagnosis']
        
        # APTOS stores train images under train_images/<id>.png
        zip_img_path = f"train_images/{img_id}.png"
        target_filename = f"grade_{grade}_{img_id}.png"
        target_path = os.path.join(OUTPUT_DIR, target_filename)

        try:
            with z.open(zip_img_path) as src, open(target_path, 'wb') as dst:
                dst.write(src.read())
                
            extracted_records.append({
                'filename': target_filename,
                'id_code': img_id,
                'dr_grade': grade,
                'referable_dr': 1 if grade >= 2 else 0
            })
        except KeyError:
            print(f"[WARNING] Could not find '{zip_img_path}' in zip archive.")

# 5. Save the metadata manifest CSV for MATLAB
manifest_path = os.path.join(OUTPUT_DIR, "manifest.csv")
with open(manifest_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['filename', 'id_code', 'dr_grade', 'referable_dr'])
    writer.writeheader()
    writer.writerows(extracted_records)

print("\n Extraction complete!")
print(f" Successfully saved {len(extracted_records)} images in: {OUTPUT_DIR}")
print(f" Saved metadata manifest to: {manifest_path}")