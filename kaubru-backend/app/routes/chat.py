from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import os

router = APIRouter(prefix="/chat", tags=["AI Chat"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

@router.post("")
async def ai_chat(request: ChatRequest):
    try:
        # Prepend a system prompt to give the AI context about the app
        system_prompt = {
            "role": "system",
            "content": "You are the KauBru AI Assistant, built specifically for the KauBru Language Translation App. Your purpose is to help users translate between English and KauBru (a language from Tripura, India, spoken by the Reang community), teach them vocabulary, and explain cultural nuances. You are friendly, encouraging, and knowledgeable. Always acknowledge that you are part of the KauBru App."
        }
        
        ollama_messages = [system_prompt] + [{"role": m.role, "content": m.content} for m in request.messages]

        payload = {
            "model": OLLAMA_MODEL,
            "messages": ollama_messages,
            "stream": False
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return {
                "message": data.get("message", {}).get("content", ""),
                "role": "assistant"
            }
            
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503, 
            detail="Ollama service is not reachable. Ensure Ollama is running locally."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error communicating with AI: {str(e)}"
        )
