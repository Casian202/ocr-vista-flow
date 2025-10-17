from __future__ import annotations

from typing import Optional

from mistralai import Mistral

from ..config import get_settings


def generate_summary(prompt: str) -> Optional[str]:
    settings = get_settings()
    if not settings.mistral_api_key:
        return None

    client = Mistral(api_key=settings.mistral_api_key)
    chat_response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that summarizes OCR extracted text into concise Romanian summaries.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
        max_tokens=300,
    )
    if chat_response.choices:
        return chat_response.choices[0].message.content
    return None
