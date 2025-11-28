import json
import csv
import os

# Configuration
JSON_INPUT_FILE = '../public/events_geocoded_strict.json' # The file resulting from the previous step
CSV_INPUT_FILE = '../data/World_Important_Dates.csv'      # Your source data
JSON_OUTPUT_FILE = '../public/events_final.json'          # The final result

def load_csv_data(csv_path):
    """
    Reads the CSV and builds a dictionary for identifying events.
    It indexes each row by THREE keys to ensure we match the JSON 
    regardless of how the name was fixed (Raw, Hyphenated, or Spaced).
    """
    lookup = {}
    
    print(f"Reading CSV from: {csv_path}")
    try:
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                raw_name = row['Name of Incident']
                date_val = row['Date']
                month_val = row['Month']
                
                # Store data packet
                data_packet = {'date': date_val, 'month': month_val}
                
                # KEY 1: Raw Name (as it appears in CSV)
                lookup[raw_name] = data_packet
                
                # KEY 2: Fix 'Unknown' -> Hyphen (Matches your geocode script logic)
                if "Unknown" in raw_name:
                    hyphen_name = raw_name.replace("Unknown", "-")
                    lookup[hyphen_name] = data_packet
                    
                    # KEY 3: Fix 'Unknown' -> Space
                    space_name = raw_name.replace("Unknown", " ")
                    lookup[space_name] = data_packet
                    
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_path}")
        return None

    print(f"   -> Loaded {len(lookup)} lookup keys (including variations).")
    return lookup

def main():
    # 1. Load the CSV Data
    csv_data = load_csv_data(CSV_INPUT_FILE)
    if not csv_data:
        return

    # 2. Load the JSON Data
    print(f"Loading JSON from: {JSON_INPUT_FILE}")
    try:
        with open(JSON_INPUT_FILE, 'r', encoding='utf-8') as f:
            events = json.load(f)
    except FileNotFoundError:
        print(f"Error: JSON file not found at {JSON_INPUT_FILE}")
        return

    # 3. Merge Data
    print("Merging dates and months...")
    match_count = 0
    
    for event in events:
        name = event.get('name')
        
        # Look for the name in our smart lookup dictionary
        if name in csv_data:
            match_data = csv_data[name]
            
            # Update the event object
            event['date'] = match_data['date']
            event['month'] = match_data['month']
            
            match_count += 1
        else:
            print(f"   Warning: Could not find CSV match for '{name}'")

    # 4. Save Result
    print(f"--------------------------------------------------")
    print(f"Merged {match_count} events out of {len(events)}.")
    print(f"Saving final file to: {JSON_OUTPUT_FILE}")
    
    with open(JSON_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=4, ensure_ascii=False)
    print("Done.")

if __name__ == "__main__":
    main()