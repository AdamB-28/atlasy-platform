import pandas as pd

# Load CSV
csv_file = 'ATLASY_DANE_260412(Arkusz1).csv'
try:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='cp1250')
except:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='latin-1')

# Get Elephant and Castle row (row 5, 0-indexed)
row = df.iloc[5]

# Find columns containing specific keywords
print("Finding key column positions for Elephant and Castle:\n")

for i, val in enumerate(row):
    if pd.notna(val):
        val_str = str(val)
        if 'kwartal' in val_str.lower() or 'quarter' in val_str.lower():
            print(f"Col {i}: {val_str[:80]}")
        elif 'elephant' in val_str.lower() and ('schwarzplan' in val_str.lower() or 'model' in val_str.lower() or 'lokalizacja' in val_str.lower()):
            print(f"Col {i}: {val_str[:80]}")
        elif 'sun_hours' in val_str.lower() or 'daylight_potential' in val_str.lower() or 'solar_energy' in val_str.lower():
            print(f"Col {i}: {val_str[:80]}")
        elif 'df' in val_str.lower() and 'elephant' in val_str.lower():
            print(f"Col {i}: {val_str[:80]}")
        elif 'sda' in val_str.lower() and 'elephant' in val_str.lower():
            print(f"Col {i}: {val_str[:80]}")
        elif 'udi' in val_str.lower() and 'elephant' in val_str.lower():
            print(f"Col {i}: {val_str[:80]}")
        elif i in [3, 4, 5, 6, 7, 8, 9, 10]:
            print(f"Col {i}: {val_str[:80]}")

print("\n\nChecking specific columns around quarter data:")
for i in range(42, 100):
    if pd.notna(row[i]):
        val = str(row[i])[:60]
        if val and val.lower() not in ['no data', 'brak']:
            print(f"Col {i}: {val}")
