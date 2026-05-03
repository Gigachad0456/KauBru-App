from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import aiofiles
from pathlib import Path

from app.services.tts_service import generate_tts_response, GENERATED_AUDIO_DIR
from app.services.pronunciation_service import add_or_update_pronunciation

router = APIRouter(prefix="/api/tts", tags=["TTS"])

@router.get("/pronounce")
async def get_pronunciation_audio(request: Request, text: str):
    """
    Returns the TTS response for the given KauBru text.
    Uses recorded audio if available, otherwise returns the phonetic spelling.
    """
    base_url = str(request.base_url).rstrip("/")
    response = generate_tts_response(text, base_url)
    return response

@router.post("/upload-audio")
async def upload_pronunciation_audio(
    text: str = Form(...),
    meaning: str = Form(...),
    phonetic: str = Form(...),
    audio_file: UploadFile = File(...)
):
    """
    Uploads a pronunciation audio file for a KauBru word or sentence.
    Automatically updates the pronunciation dictionary.
    """
    if not audio_file.filename.lower().endswith((".mp3", ".wav", ".m4a", ".ogg", ".aac")):
        raise HTTPException(status_code=400, detail=f"Invalid audio file format: {audio_file.filename}")

    # Save the audio file
    safe_text = text.lower().strip().replace(" ", "_")
    _, ext = os.path.splitext(audio_file.filename)
    filename = f"{safe_text}{ext}"
    file_path = GENERATED_AUDIO_DIR / filename
    
    # Ensure directory exists
    GENERATED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await audio_file.read()
        await out_file.write(content)
        
    # Update the dictionary
    updated_entry = add_or_update_pronunciation(
        word=text,
        meaning=meaning,
        phonetic=phonetic,
        audio_file=filename
    )
    
    return {
        "message": "Audio uploaded and dictionary updated successfully.",
        "entry": updated_entry
    }
