import pandas as pd
import numpy as np

# Load the Excel file without headers
excel_file = 'ATLASY_DANE_260207.xlsx'
df = pd.read_excel(excel_file, sheet_name='Arkusz1', header=None)

print(f"Full shape: {df.shape}")
print("\nFull dataframe (all rows and columns):")
print("="*100)

# Print with all rows and columns visible
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', None)

print(df.to_string())
