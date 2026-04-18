import pandas as pd
import json

# Load the Excel file
excel_file = 'ATLASY_DANE_260207.xlsx'
xl = pd.ExcelFile(excel_file)

print("Sheet names:")
print(xl.sheet_names)
print("\n" + "="*60 + "\n")

# Examine each sheet
for sheet_name in xl.sheet_names:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    print(f"Sheet: {sheet_name}")
    print(f"Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print("\nFirst few rows:")
    print(df.head())
    print("\n" + "="*60 + "\n")
