import pandas as pd

df = pd.read_excel('ATLASY_DANE_260207.xlsx', sheet_name='Arkusz1', header=None)

print('\n=== HEADERS (Row 7) ===')
for i in range(0, 20):
    print(f'Col {i}: [{df.iloc[7, i]}]')

print('\n=== Elephant Data (Row 8) ===')
for i in range(0, 20):
    print(f'Col {i}: [{df.iloc[8, i]}]')
