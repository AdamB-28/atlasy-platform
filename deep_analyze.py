"""Deep analysis of CSV data, mapping every column to its value for each city."""
import pandas as pd
import json

csv_file = 'ATLASY_DANE_260412(Arkusz1).csv'
try:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='cp1250')
except:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='latin-1')

print(f"Total rows: {df.shape[0]}, Total columns: {df.shape[1]}")
print()

# Print header rows (0-4)
for header_row in range(5):
    print(f"=== HEADER ROW {header_row} ===")
    for i in range(min(df.shape[1], 220)):
        val = df.iloc[header_row, i]
        if pd.notna(val) and str(val).strip():
            print(f"  Col {i}: {str(val).strip()[:100]}")

# Data rows (5, 6, 7)
city_names = ['Elephant and Castle', 'Garnizon', 'Hudson Yards']
for city_idx, row_idx in enumerate([5, 6, 7]):
    print(f"\n{'='*80}")
    print(f"CITY: {city_names[city_idx]} (row {row_idx})")
    print(f"{'='*80}")
    row = df.iloc[row_idx]
    for i in range(min(df.shape[1], 220)):
        val = row[i]
        if pd.notna(val):
            val_str = str(val).strip()
            if val_str and val_str.lower() not in ['no data', 'brak']:
                print(f"  Col {i}: {val_str[:120]}")
