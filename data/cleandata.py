import pandas as pd
import json
import unicodedata

def remove_accents(text):
    if isinstance(text, str):
        return unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('ascii')
    return text

# 1. Read your comma-delimited CSV
df = pd.read_csv('World Important Dates.csv', delimiter=',')

# 2. Select only useful columns and create new ones
df_clean = df[['Name of Incident', 'Year', 'Country', 'Place Name']].copy()
df_clean['lat'] = ''
df_clean['lng'] = ''
df_clean['context'] = df['Type of Event'] + ' ' + df['Impact']

# Rename columns
df_clean = df_clean.rename(columns={
    'Name of Incident': 'name',
    'Year': 'year',
    'Country': 'country',
    'Place Name': 'place'
})

# Clean accents from string columns
for col in ['name', 'country', 'place', 'context']:
    df_clean[col] = df_clean[col].apply(remove_accents)

# 3. Save as JSON (Orientation 'records' creates a simple list of objects)
with open('../public/events.json', 'w', encoding='utf-8') as f:
    json.dump(df_clean.to_dict(orient='records'), f, ensure_ascii=False)

print("Data cleaned and saved to ../public/events.json")