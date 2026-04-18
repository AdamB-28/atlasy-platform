import pandas as pd

# Load CSV
csv_file = 'ATLASY_DANE_260412(Arkusz1).csv'
try:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='cp1250')
except:
    df = pd.read_csv(csv_file, sep=';', header=None, encoding='latin-1')

# Garnizon row (row 6, 0-indexed)
print("=" * 80)
print("GARNIZON COLUMNS")
print("=" * 80)
row = df.iloc[6]

for i, val in enumerate(row):
    if pd.notna(val):
        val_str = str(val)
        if 'garnizon' in val_str.lower() and ('kwartal' in val_str.lower() or 'rzut' in val_str.lower() or 'forma' in val_str.lower() or 'schwarzplan' in val_str.lower() or 'lokalizacja' in val_str.lower() or 'sun_hours' in val_str.lower() or 'daylight' in val_str.lower() or 'solar' in val_str.lower()):
            print(f"Col {i}: {val_str[:80]}")

print("\n" + "=" * 80)
print("HUDSON YARDS COLUMNS")
print("=" * 80)
# Hudson Yards row (row 7, 0-indexed)
row = df.iloc[7]

for i, val in enumerate(row):
    if pd.notna(val):
        val_str = str(val)
        if 'hudson' in val_str.lower() and ('kwartal' in val_str.lower() or 'rzut' in val_str.lower() or 'forma' in val_str.lower() or 'schwarzplan' in val_str.lower() or 'lokalizacja' in val_str.lower() or 'da_' in val_str.lower() or 'df_' in val_str.lower() or 'udi_' in val_str.lower() or '21' in val_str.lower()):
            print(f"Col {i}: {val_str[:80]}")
