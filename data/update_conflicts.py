import json
import csv

# Load conflicts.json
with open('../public/conflicts.json', 'r') as f:
    conflicts = json.load(f)

# Load hced_data.csv and create a lookup dict
country_lookup = {}
with open('hced_data.csv', 'r', newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        key = (row['Battle'], row['Year'])
        country_lookup[key] = row['Country']

# Update each conflict
for conflict in conflicts:
    name = conflict['name']
    year = conflict['year']
    # Get country
    country = country_lookup.get((name, year), 'Unknown')
    conflict['country'] = country
    # Set place to name (assuming name is the place)
    conflict['place'] = name
    # Set date and month to Unknown
    conflict['date'] = 'Unknown'
    conflict['month'] = 'Unknown'

print("First conflict after update:", conflicts[0])

# Save the updated conflicts.json
with open('../public/conflicts_updated.json', 'w') as f:
    json.dump(conflicts, f, indent=4)

print("Updated conflicts_updated.json successfully.")