"""
Utility Functions Module
Contains helper functions for formatting, validation, and other utilities.
"""

from typing import Tuple


# Month names for formatting
MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]


def format_coordinates(lat: float, lng: float) -> str:
    """
    Format coordinates in a human-readable format.
    
    Args:
        lat: Latitude (-90 to 90)
        lng: Longitude (-180 to 180)
        
    Returns:
        Formatted string like "31.7785° N, 35.2296° E"
    """
    lat_dir = "N" if lat >= 0 else "S"
    lng_dir = "E" if lng >= 0 else "W"
    return f"{abs(lat):.4f}° {lat_dir}, {abs(lng):.4f}° {lng_dir}"


def format_date(month: int, day: int, year: int) -> str:
    """
    Format date in a human-readable format.
    
    Args:
        month: Month (1-12)
        day: Day (1-31)
        year: Year (negative for BCE)
        
    Returns:
        Formatted string like "April 3, 33 CE" or "March 15, 44 BCE"
    """
    era = "CE" if year > 0 else "BCE"
    year_abs = abs(year)
    month_name = MONTH_NAMES[month - 1]
    return f"{month_name} {day}, {year_abs} {era}"


def build_historical_prompt(lat: float, lng: float, month: int, day: int, year: int, hour: int) -> str:
    """
    Build a prompt for historical image generation.
    
    Args:
        lat: Latitude
        lng: Longitude
        month: Month (1-12)
        day: Day (1-31)
        year: Year (negative for BCE)
        hour: Hour (0-23)
        
    Returns:
        Formatted prompt string
    """
    coords = format_coordinates(lat, lng)
    date_str = format_date(month, day, year)
    return f"Create an image at {coords}, {date_str}, {hour:02d}:00 hours."


def validate_coordinates(lat: float, lng: float) -> Tuple[bool, str]:
    """
    Validate latitude and longitude values.
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not (-90 <= lat <= 90):
        return False, "Latitude must be between -90 and 90"
    if not (-180 <= lng <= 180):
        return False, "Longitude must be between -180 and 180"
    return True, ""


def validate_date(month: int, day: int) -> Tuple[bool, str]:
    """
    Validate month and day values.
    
    Args:
        month: Month (1-12)
        day: Day (1-31)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not (1 <= month <= 12):
        return False, "Month must be between 1 and 12"
    if not (1 <= day <= 31):
        return False, "Day must be between 1 and 31"
    return True, ""


def validate_hour(hour: int) -> Tuple[bool, str]:
    """
    Validate hour value.
    
    Args:
        hour: Hour (0-23)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not (0 <= hour <= 23):
        return False, "Hour must be between 0 and 23"
    return True, ""


def calculate_timezone_offset(lng: float) -> int:
    """
    Calculate approximate timezone offset from longitude.
    
    Args:
        lng: Longitude (-180 to 180)
        
    Returns:
        Timezone offset in hours from UTC
    """
    return round(lng / 15)
