"""
AI Chat route — uses Groq (cloud) when GROQ_API_KEY is set,
falls back to local Ollama otherwise.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
import httpx
import os
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/chat", tags=["AI Chat"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _build_system_prompt(db: Session) -> dict:
    """Build system prompt injecting real KauBru vocabulary from the database."""
    # Load all words grouped by category
    words = db.query(models.Word).order_by(models.Word.category, models.Word.english).all()

    # Build a compact vocabulary reference
    vocab_lines = []
    current_cat = None
    for w in words:
        if w.category != current_cat:
            current_cat = w.category
            vocab_lines.append(f"\n[{current_cat.upper()}]")
        vocab_lines.append(f"  {w.english} = {w.kaubru}")

    vocab_text = "\n".join(vocab_lines)

    return {
        "role": "system",
        "content": (
            "You are the KauBru AI Assistant, built specifically for the KauBru "
            "Language Translation App. KauBru (also called Bru or Reang) is a "
            "Tibeto-Burman language spoken by the Reang community in Tripura, India.\n\n"
            "IMPORTANT RULES:\n"
            "1. ONLY use the vocabulary list below for KauBru translations. Never guess.\n"
            "2. If a word is not in the list, say 'I don't have that word yet' — do NOT invent translations.\n"
            "3. KauBru sentence structure is Subject-Object-Verb (SOV) — verb comes last.\n"
            "4. Tense markers: 'ha' = completed, 'tong ou' = ongoing, 'nai' = future.\n"
            "5. Possessives: ang→aini (my), nung→nini (your), bung→bini (his/her).\n"
            "6. Be friendly, encouraging, and culturally respectful.\n\n"
            "VERIFIED KAUBRU VOCABULARY:\n"
            f"{vocab_text}\n\n"
            "Use only these verified words. For sentences, combine words using SOV order "
            "and add the appropriate tense marker at the end."
        )
    }


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


async def _groq_chat(messages: list[dict]) -> str:
    """Send chat to Groq cloud API (OpenAI-compatible)."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _ollama_chat(messages: list[dict]) -> str:
    """Send chat to local Ollama instance."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


@router.post("")
async def ai_chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Build system prompt with real vocabulary from DB
    system_prompt = _build_system_prompt(db)

    messages = [system_prompt] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    try:
        if GROQ_API_KEY:
            content = await _groq_chat(messages)
        else:
            content = await _ollama_chat(messages)

        return {"message": content, "role": "assistant"}

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="AI service is not reachable. Please try again later."
        )
    except httpx.HTTPStatusError as e:
        try:
            error_body = e.response.json()
            error_detail = error_body.get("error", {}).get("message", str(e))
        except Exception:
            error_detail = e.response.text[:200]
        print(f"[CHAT ERROR] Status {e.response.status_code}: {error_detail}")
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {error_detail}"
        )
    except Exception as e:
        print(f"[CHAT ERROR] Unexpected: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with AI: {str(e)}"
        )


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


async def _groq_chat(messages: list[dict]) -> str:
    """Send chat to Groq cloud API (OpenAI-compatible)."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _ollama_chat(messages: list[dict]) -> str:
    """Send chat to local Ollama instance."""
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


@router.post("")
async def ai_chat(request: ChatRequest):
    # Build messages with system prompt
    messages = [SYSTEM_PROMPT] + [
        {"role": m.role, "content": m.content} for m in request.messages
    ]

    try:
        if GROQ_API_KEY:
            # Production: use Groq cloud
            content = await _groq_chat(messages)
        else:
            # Local dev: use Ollama
            content = await _ollama_chat(messages)

        return {"message": content, "role": "assistant"}

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="AI service is not reachable. Please try again later."
        )
    except httpx.HTTPStatusError as e:
        # Log the actual error body for debugging
        try:
            error_body = e.response.json()
            error_detail = error_body.get("error", {}).get("message", str(e))
        except Exception:
            error_detail = e.response.text[:200]
        print(f"[CHAT ERROR] Status {e.response.status_code}: {error_detail}")
        raise HTTPException(
            status_code=502,
            detail=f"AI service error: {error_detail}"
        )
    except Exception as e:
        print(f"[CHAT ERROR] Unexpected: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with AI: {str(e)}"
        )
