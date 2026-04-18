"""Cross-check: verify all image names in cities.json have corresponding .PNG files."""
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('urban-daylight-platform/public/data/cities.json', 'r', encoding='utf-8') as f:
    cities = json.load(f)

PUBLIC = 'urban-daylight-platform/public'
FOLDERS = {
    'Elephant and Castle': 'ELEPHANT_AND_CASTLE',
    'Garnizon': 'GARNIZON',
    'Hudson Yards': 'HUDSON_YARDS',
}

def collect_images(obj, prefix=''):
    """Recursively find all string values that look like image names."""
    images = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ('country', 'years', 'description', 'buildingTypes', 'transport',
                     'avgValue', 'autonomy', 'interpretation', 'conclusions',
                     'id', 'name', 'lat', 'lng', 'zoom', 'far', 'function',
                     'buildingIntensity', 'greenSpacePercentage', 'greenSpaceRatio',
                     'buildingCoverage', 'avgFloors', 'treeCount',
                     'heightToWidthRatio', 'streetWidth'):
                continue
            if isinstance(v, str) and v and not v.startswith(('http', '/')):
                images.append((f"{prefix}.{k}", v))
            elif isinstance(v, (dict, list)):
                images.extend(collect_images(v, f"{prefix}.{k}"))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            images.extend(collect_images(item, f"{prefix}[{i}]"))
    return images

all_ok = True
for city in cities:
    folder = FOLDERS[city['name']]
    folder_path = os.path.join(PUBLIC, folder)
    existing_files = set(os.listdir(folder_path)) if os.path.isdir(folder_path) else set()
    existing_basenames = {os.path.splitext(f)[0] for f in existing_files}

    print(f"\n=== {city['name']} ({folder}) ===")
    print(f"  Files in folder: {len(existing_files)}")

    images = collect_images(city)
    for path, img_name in images:
        expected_file = f"{img_name}.PNG"
        if expected_file in existing_files:
            print(f"  ✓ {path}: {img_name}")
        elif img_name in existing_basenames:
            # Different extension
            actual = [f for f in existing_files if os.path.splitext(f)[0] == img_name][0]
            print(f"  ⚠ {path}: {img_name} (found as {actual})")
        else:
            print(f"  ✗ MISSING: {path}: {img_name}")
            all_ok = False

    # Check for unused files
    referenced = {img for _, img in images}
    for f in sorted(existing_files):
        basename = os.path.splitext(f)[0]
        if basename not in referenced:
            print(f"  ? UNUSED: {f}")

if all_ok:
    print("\n✓ All referenced images exist!")
else:
    print("\n✗ Some images are missing!")
