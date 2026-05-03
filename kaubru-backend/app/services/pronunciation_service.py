import json
import os
from pathlib import Path

# Path to the pronunciation dictionary
DATA_DIR = Path(__file__).parent.parent / "data"
DICT_PATH = DATA_DIR / "pronunciation_dictionary.json"

def load_dictionary() -> dict:
    """Loads the pronunciation dictionary from JSON."""
    if not DICT_PATH.exists():
        return {}
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_dictionary(data: dict):
    """Saves the pronunciation dictionary to JSON."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DICT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_pronunciation(word: str) -> dict:
    """Retrieves pronunciation data for a given word."""
    word = word.lower().strip()
    dictionary = load_dictionary()
    return dictionary.get(word)

def add_or_update_pronunciation(word: str, meaning: str, phonetic: str, audio_file: str = None):
    """Adds or updates a word in the pronunciation dictionary."""
    word = word.lower().strip()
    dictionary = load_dictionary()
    
    dictionary[word] = {
        "meaning": meaning,
        "phonetic": phonetic,
    }
    if audio_file:
        dictionary[word]["audio_file"] = audio_file
        
    save_dictionary(dictionary)
    return dictionary[word]
