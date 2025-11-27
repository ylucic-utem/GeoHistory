import pandas as pd

# 1. Read your semicolon-delimited CSV
df = pd.read_csv('hced_data.csv', delimiter=';')

# 2. Select only useful columns and rename them
df_clean = df[['Battle', 'Year', 'Latitude', 'Longitude', 'War']].rename(columns={
    'Battle': 'name',
    'Year': 'year',
    'Latitude': 'lat',
    'Longitude': 'lng',
    'War': 'context'
})

# 3. Save as JSON (Orientation 'records' creates a simple list of objects)
df_clean.to_json('conflicts.json', orient='records')

print("Data cleaned and saved to conflicts.json")