import pandas as pd
import sys

csv_path = r"ATLASY_DANE_260412(Arkusz1).csv"

try:
    df = pd.read_csv(csv_path, sep=';', encoding='cp1250', header=None, dtype=str)
except:
    df = pd.read_csv(csv_path, sep=';', encoding='latin-1', header=None, dtype=str)

print(f"Shape: {df.shape}")
print(f"Columns: {df.shape[1]}")

# Rows 5, 6, 7 are Elephant, Garnizon, Hudson
city_rows = {
    "Elephant and Castle": 5,
    "Garnizon": 6,
    "Hudson Yards": 7
}

for city_name, row_idx in city_rows.items():
    print(f"\n{'='*80}")
    print(f"  {city_name} (row {row_idx})")
    print(f"{'='*80}")
    row = df.iloc[row_idx]
    for col_idx in range(min(220, df.shape[1])):
        val = row.iloc[col_idx]
        if pd.notna(val) and str(val).strip():
            val_str = str(val).strip()
            # Truncate long values
            display = val_str[:100] + "..." if len(val_str) > 100 else val_str
            print(f"  Col {col_idx:3d}: {display}")

# Also dump row 3 and 4 to see headers
print(f"\n{'='*80}")
print(f"  HEADER ROWS")
print(f"{'='*80}")
for row_idx in [0, 1, 2, 3, 4]:
    print(f"\n--- Row {row_idx} ---")
    row = df.iloc[row_idx]
    for col_idx in range(min(220, df.shape[1])):
        val = row.iloc[col_idx]
        if pd.notna(val) and str(val).strip():
            val_str = str(val).strip()
            display = val_str[:120] + "..." if len(val_str) > 120 else val_str
            print(f"  Col {col_idx:3d}: {display}")
