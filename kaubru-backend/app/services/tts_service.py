import os
from pathlib import Path
from app.services.pronunciation_service import get_pronunciation

GENERATED_AUDIO_DIR = Path(__file__).parent.parent.parent / "generated_audio"

# Ensure the generated audio directory exists
GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

def generate_tts_response(text: str, base_url: str) -> dict:
    """
    Generates the TTS response for a given text.
    Implements Stage 1 & 2 of the audio generation strategy.
    """
    word_data = get_pronunciation(text)
    
    if not word_data:
        # Fallback if the word is not in our dictionary
        return {
            "text": text,
            "phonetic": None,
            "audio_url": None,
            "source": "not_found"
        }
        
    phonetic = word_data.get("phonetic")
    audio_file = word_data.get("audio_file")
    
    # Stage 1: Check if recorded audio exists
    if audio_file:
        audio_path = GENERATED_AUDIO_DIR / audio_file
        if audio_path.exists():
            return {
                "text": text,
                "phonetic": phonetic,
                "audio_url": f"{base_url}/generated_audio/{audio_file}",
                "source": "recorded_audio"
            }
            
    # Stage 2: Return phonetic pronunciation if no audio file exists
    return {
        "text": text,
        "phonetic": phonetic,
        "audio_url": None,
        "source": "phonetic_only"
    }

# ---------------------------------------------------------------------------
# Stage 3: Future Coqui TTS Integration Placeholder
# ---------------------------------------------------------------------------

def load_custom_tts_model():
    """
    Placeholder to load a custom trained Coqui TTS model.
    """
    # model = TTS(model_path="path/to/kaubru_tts_model", config_path="path/to/config.json")
    # return model
    pass

def generate_audio_with_custom_model(text: str, output_path: str):
    """
    Placeholder to generate audio using a trained Coqui TTS model.
    """
    # model = load_custom_tts_model()
    # model.tts_to_file(text=text, file_path=output_path)
    pass

def save_generated_audio(text: str, audio_bytes: bytes) -> str:
    """
    Saves generated audio bytes to the generated_audio directory.
    Returns the filename.
    """
    filename = f"{text.lower().replace(' ', '_')}.wav"
    output_path = GENERATED_AUDIO_DIR / filename
    with open(output_path, "wb") as f:
        f.write(audio_bytes)
    return filename
