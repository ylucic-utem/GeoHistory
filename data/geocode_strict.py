import json
import requests
import time

# Configuration
INPUT_FILE = '../public/events.json'
OUTPUT_FILE = '../public/events_geocoded_strict.json'
WIKI_API_URL = "https://en.wikipedia.org/w/api.php"
# Wikipedia requires a User-Agent. You can change this to your email if you want.
USER_AGENT = "EventGeocodio/1.0 (ylucic@utem.cl)"

def get_wiki_event_coordinates(search_term):
    """
    Searches Wikipedia for the specific Event Name.
    Returns (lat, lng) ONLY if the event page itself has coordinates.
    """
    if not search_term:
        return None

    try:
        # Step 1: Search for the page title corresponding to the event
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": search_term,
            "srlimit": 1
        }
        response = requests.get(WIKI_API_URL, params=search_params, headers={"User-Agent": USER_AGENT})
        data = response.json()

        # If no results found, return None
        if not data.get("query", {}).get("search"):
            return None
        
        # Get the exact title of the first result
        title = data["query"]["search"][0]["title"]

        # Step 2: Request coordinates for that specific page title
        coord_params = {
            "action": "query",
            "format": "json",
            "prop": "coordinates",
            "titles": title
        }
        response = requests.get(WIKI_API_URL, params=coord_params, headers={"User-Agent": USER_AGENT})
        data = response.json()
        
        pages = data.get("query", {}).get("pages", {})
        
        # Iterate through pages (usually just one) to find coordinates
        for _, page_data in pages.items():
            if "coordinates" in page_data:
                lat = page_data["coordinates"][0]["lat"]
                lon = page_data["coordinates"][0]["lon"]
                return lat, lon
            else:
                # The page exists, but has no coordinates (e.g. "Industrial Revolution")
                # We return None to avoid generic placement.
                return None
                
    except Exception as e:
        print(f"   ! Error processing '{search_term}': {e}")
        return None

def main():
    print(f"Loading {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            events = json.load(f)
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found.")
        return

    count = 0
    total = len(events)
    found_count = 0

    print("--- Starting Strict Geocoding ---")
    print("Only adding coordinates if the specific EVENT has a location.")
    
    for event in events:
        count += 1
        event_name = event.get('name', 'Unknown')
        
        # Skip if already has data
        if event.get('lat') and event.get('lng'):
            print(f"[{count}/{total}] '{event_name}' - Already has coords.")
            continue

        print(f"[{count}/{total}] Searching for '{event_name}'...")

        # ONLY perform Strategy 1 (Event Name Search)
        coords = get_wiki_event_coordinates(event_name)

        if coords:
            event['lat'] = coords[0]
            event['lng'] = coords[1]
            print(f"   -> SUCCESS: Found specific event location {coords}")
            found_count += 1
        else:
            print("   -> SKIPPED: No specific event coordinates found.")

        # Sleep to be polite to Wikipedia API
        time.sleep(1) 

    print("--------------------------------------------------")
    print(f"Finished! Geocoded {found_count} out of {total} events.")
    print(f"Saving to {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(events, f, indent=4, ensure_ascii=False)
    print("Done.")

if __name__ == "__main__":
    main()