import json
import os
from pathlib import Path
import csv
import shutil

# Paths
BASE_DIR = Path(__file__).parent.parent
DICT_PATH = BASE_DIR / "app" / "data" / "pronunciation_dictionary.json"
GENERATED_AUDIO_DIR = BASE_DIR / "generated_audio"
DATASET_DIR = BASE_DIR / "tts_dataset"
WAVS_DIR = DATASET_DIR / "wavs"
METADATA_PATH = DATASET_DIR / "metadata.csv"

def export_dataset():
    """
    Reads pronunciation_dictionary.json and exports metadata.csv
    along with copying the corresponding audio files to the wavs directory
    for future Coqui TTS model training.
    """
    if not DICT_PATH.exists():
        print("Error: Pronunciation dictionary not found.")
        return

    # Create dataset directories
    WAVS_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(DICT_PATH, "r", encoding="utf-8") as f:
        dictionary = json.load(f)
        
    records = []
    
    for word, data in dictionary.items():
        audio_file = data.get("audio_file")
        phonetic = data.get("phonetic")
        
        if audio_file and phonetic:
            source_audio_path = GENERATED_AUDIO_DIR / audio_file
            
            if source_audio_path.exists():
                # Copy audio to the wavs directory
                dest_audio_path = WAVS_DIR / audio_file
                shutil.copy2(source_audio_path, dest_audio_path)
                
                # Append to records: format: filename|word|phonetic
                records.append([audio_file, word.capitalize(), phonetic])
            else:
                print(f"Warning: Audio file {audio_file} for word '{word}' not found.")
                
    if not records:
        print("No valid entries with audio found to export.")
        return
        
    # Write metadata.csv
    with open(METADATA_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="|")
        writer.writerows(records)
        
    print(f"Successfully exported {len(records)} entries to {METADATA_PATH}.")
    print("Dataset is ready for TTS training.")

if __name__ == "__main__":
    export_dataset()
