"""AI Chatbot routes for farming advice and decision support."""

import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import openai

from agmo.core.auth import get_current_active_user
from agmo.core.database import get_db
from agmo.core.config import settings
from agmo.models import User, ChatMessage, Farm, Field, Crop

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize OpenAI client
if settings.OPENAI_API_KEY:
    openai.api_key = settings.OPENAI_API_KEY


class ChatMessageCreate(BaseModel):
    """Chat message creation model."""
    content: str
    session_id: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Chat message response model."""
    id: int
    user_id: int
    session_id: str
    role: str
    content: str
    message_type: str
    model_used: Optional[str]
    tokens_used: Optional[int]
    response_time: Optional[float]
    intent: Optional[str]
    confidence: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSession(BaseModel):
    """Chat session model."""
    session_id: str
    messages: List[ChatMessageResponse]
    created_at: datetime


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    message_data: ChatMessageCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message to the AI chatbot."""
    session_id = message_data.session_id or str(uuid.uuid4())
    
    # Save user message
    user_message = ChatMessage(
        user_id=current_user_id,
        session_id=session_id,
        role="user",
        content=message_data.content,
        message_type="text"
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Get user context for AI
    user = db.query(User).filter(User.id == current_user_id).first()
    farms = db.query(Farm).filter(Farm.owner_id == current_user_id).all()
    
    # Build context for AI
    context = build_farming_context(user, farms, db)
    
    # Generate AI response
    ai_response = await generate_ai_response(message_data.content, context)
    
    # Save AI response
    ai_message = ChatMessage(
        user_id=current_user_id,
        session_id=session_id,
        role="assistant",
        content=ai_response["content"],
        message_type="text",
        model_used=ai_response.get("model"),
        tokens_used=ai_response.get("tokens"),
        response_time=ai_response.get("response_time"),
        intent=ai_response.get("intent"),
        confidence=ai_response.get("confidence")
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return ChatMessageResponse.from_orm(ai_message)


@router.get("/sessions", response_model=List[ChatSession])
async def get_chat_sessions(
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for the current user."""
    # Get unique session IDs
    sessions = db.query(ChatMessage.session_id).filter(
        ChatMessage.user_id == current_user_id
    ).distinct().all()
    
    chat_sessions = []
    for (session_id,) in sessions:
        messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user_id,
            ChatMessage.session_id == session_id
        ).order_by(ChatMessage.created_at).all()
        
        chat_sessions.append(ChatSession(
            session_id=session_id,
            messages=[ChatMessageResponse.from_orm(msg) for msg in messages],
            created_at=messages[0].created_at if messages else datetime.utcnow()
        ))
    
    return chat_sessions


@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_chat_session(
    session_id: str,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat session."""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user_id,
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    if not messages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    return ChatSession(
        session_id=session_id,
        messages=[ChatMessageResponse.from_orm(msg) for msg in messages],
        created_at=messages[0].created_at
    )


@router.post("/feedback/{message_id}")
async def provide_feedback(
    message_id: int,
    rating: int,
    comment: Optional[str] = None,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Provide feedback for a chat message."""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user_id,
        ChatMessage.role == "assistant"
    ).first()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    message.helpful_rating = rating
    message.feedback_comment = comment
    db.commit()
    
    return {"message": "Feedback submitted successfully"}


def build_farming_context(user: User, farms: List[Farm], db: Session) -> str:
    """Build farming context for AI."""
    context_parts = []
    
    # User information
    context_parts.append(f"Farmer: {user.full_name or user.username}")
    context_parts.append(f"Location: {user.location or 'Not specified'}")
    context_parts.append(f"Experience: {user.experience_years} years")
    context_parts.append(f"Farm size: {user.farm_size or 'Not specified'} acres")
    context_parts.append(f"Primary crops: {user.primary_crops or 'Not specified'}")
    
    # Farm information
    for farm in farms:
        context_parts.append(f"\nFarm: {farm.name}")
        context_parts.append(f"Location: {farm.location or 'Not specified'}")
        context_parts.append(f"Total acres: {farm.total_acres or 'Not specified'}")
        
        # Get fields and crops
        fields = db.query(Field).filter(Field.farm_id == farm.id).all()
        for field in fields:
            context_parts.append(f"  Field: {field.name} ({field.acres} acres)")
            crops = db.query(Crop).filter(Crop.field_id == field.id).all()
            for crop in crops:
                context_parts.append(f"    Crop: {crop.crop_type.value} - {crop.growth_stage.value}")
    
    return "\n".join(context_parts)


async def generate_ai_response(user_message: str, context: str) -> dict:
    """Generate AI response using OpenAI."""
    if not settings.OPENAI_API_KEY:
        # Return mock response if no API key
        return {
            "content": "I'm here to help with your farming questions! Please provide your OpenAI API key to enable AI-powered responses.",
            "model": "mock",
            "tokens": 0,
            "response_time": 0.1,
            "intent": "general_inquiry",
            "confidence": 0.8
        }
    
    try:
        system_prompt = f"""You are an expert farming assistant with deep knowledge of agriculture, crop management, pest control, soil health, and sustainable farming practices. 

Context about the farmer:
{context}

Provide helpful, practical advice based on the farmer's specific situation. Be concise but thorough. If you need more information to give better advice, ask for it.

Focus on:
- Crop management and health
- Pest and disease control
- Soil health and fertility
- Weather considerations
- Sustainable practices
- Cost-effective solutions"""

        start_time = datetime.utcnow()
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        response_time = (datetime.utcnow() - start_time).total_seconds()
        
        return {
            "content": response.choices[0].message.content,
            "model": "gpt-3.5-turbo",
            "tokens": response.usage.total_tokens,
            "response_time": response_time,
            "intent": "farming_advice",
            "confidence": 0.9
        }
        
    except Exception as e:
        return {
            "content": f"I apologize, but I'm having trouble processing your request right now. Please try again later. Error: {str(e)}",
            "model": "error",
            "tokens": 0,
            "response_time": 0,
            "intent": "error",
            "confidence": 0.0
        } 