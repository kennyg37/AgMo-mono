"""Consultation API endpoints."""

import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from agmo.core.database import get_db
from agmo.core.auth import get_current_active_user
from agmo.models.consultation import Consultation, ConsultationMessage
from agmo.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/consultations", tags=["consultations"])


# Pydantic models
class ConsultationCreate(BaseModel):
    consultant_id: int
    subject: str


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    attachments: Optional[List[str]] = None


class ConsultationResponse(BaseModel):
    id: str
    consultant_id: int
    farmer_id: int
    status: str
    subject: str
    created_at: str
    updated_at: str
    messages: List[dict]
    consultant: Optional[dict] = None


class MessageResponse(BaseModel):
    id: str
    consultation_id: str
    sender: str
    content: str
    message_type: str
    attachments: Optional[List[str]]
    is_read: bool
    timestamp: str


@router.get("/", response_model=List[ConsultationResponse])
async def get_consultations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all consultations for the current user."""
    try:
        consultations = db.query(Consultation).filter(
            Consultation.farmer_id == current_user.id
        ).order_by(Consultation.updated_at.desc()).all()
        
        return [consultation.to_dict() for consultation in consultations]
        
    except Exception as e:
        logger.error(f"Failed to get consultations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultations")


@router.get("/test/", response_model=List[ConsultationResponse])
async def get_consultations_test(
    db: Session = Depends(get_db)
):
    """Get all consultations for testing (no authentication required)."""
    try:
        consultations = db.query(Consultation).order_by(Consultation.updated_at.desc()).all()
        
        return [consultation.to_dict() for consultation in consultations]
        
    except Exception as e:
        logger.error(f"Failed to get consultations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultations")


@router.post("/", response_model=ConsultationResponse)
async def create_consultation(
    consultation_data: ConsultationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new consultation."""
    try:
        # Verify consultant exists in users table
        consultant_user = db.query(User).filter(
            User.id == consultation_data.consultant_id,
            User.role == "consultant",
            User.is_active == True
        ).first()
        if not consultant_user:
            raise HTTPException(status_code=404, detail="Consultant not found")
        
        # Create consultation
        consultation = Consultation(
            id=str(uuid.uuid4()),
            consultant_id=consultation_data.consultant_id,
            farmer_id=current_user.id,
            subject=consultation_data.subject,
            status="pending"
        )
        
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        
        logger.info(f"Created consultation: {consultation.id}")
        return consultation.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create consultation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create consultation")


@router.post("/test/", response_model=ConsultationResponse)
async def create_consultation_test(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db)
):
    """Create a new consultation for testing (no authentication required)."""
    try:
        # Verify consultant exists in users table using raw SQL
        from sqlalchemy import text
        
        result = db.execute(text("""
            SELECT id FROM users 
            WHERE id = :consultant_id AND role = 'consultant' AND is_active = true
        """), {"consultant_id": consultation_data.consultant_id})
        
        consultant_user = result.fetchone()
        if not consultant_user:
            raise HTTPException(status_code=404, detail="Consultant not found")
        
        # Create consultation with a default farmer ID (for testing)
        consultation = Consultation(
            id=str(uuid.uuid4()),
            consultant_id=consultation_data.consultant_id,
            farmer_id=1,  # Default farmer ID for testing
            subject=consultation_data.subject,
            status="pending"
        )
        
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        
        logger.info(f"Created test consultation: {consultation.id}")
        return consultation.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create test consultation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create consultation")


@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific consultation."""
    try:
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.farmer_id == current_user.id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        return consultation.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get consultation: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultation")


@router.post("/{consultation_id}/messages", response_model=MessageResponse)
async def send_message(
    consultation_id: str,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message in a consultation."""
    try:
        # Verify consultation exists and user has access
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.farmer_id == current_user.id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        # Update consultation status to active if it was pending
        if consultation.status == "pending":
            consultation.status = "active"
        
        # Create message
        message = ConsultationMessage(
            id=str(uuid.uuid4()),
            consultation_id=consultation_id,
            sender="farmer",
            content=message_data.content,
            message_type=message_data.message_type,
            attachments=message_data.attachments,
            is_read=False
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        logger.info(f"Sent message in consultation: {consultation_id}")
        return message.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.post("/test/{consultation_id}/messages", response_model=MessageResponse)
async def send_message_test(
    consultation_id: str,
    message_data: MessageCreate,
    db: Session = Depends(get_db)
):
    """Send a message in a consultation for testing (no authentication required)."""
    try:
        # Verify consultation exists
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        # Update consultation status to active if it was pending
        if consultation.status == "pending":
            consultation.status = "active"
        
        # Create message
        message = ConsultationMessage(
            id=str(uuid.uuid4()),
            consultation_id=consultation_id,
            sender="farmer",
            content=message_data.content,
            message_type=message_data.message_type,
            attachments=message_data.attachments,
            is_read=False
        )
        
        db.add(message)
        db.commit()
        db.refresh(message)
        
        # Update consultation timestamp
        consultation.updated_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Sent test message in consultation: {consultation_id}")
        return message.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send test message: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.put("/{consultation_id}/close")
async def close_consultation(
    consultation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Close a consultation."""
    try:
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.farmer_id == current_user.id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        consultation.status = "closed"
        db.commit()
        
        logger.info(f"Closed consultation: {consultation_id}")
        return {"message": "Consultation closed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to close consultation: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to close consultation")


# Consultant endpoints
@router.get("/consultants/", response_model=List[dict])
async def get_consultants(
    db: Session = Depends(get_db)
):
    """Get all available consultants from users table."""
    try:
        # Use raw SQL to avoid SQLAlchemy relationship issues
        from sqlalchemy import text
        
        result = db.execute(text("""
            SELECT id, full_name, email, role, is_active, bio, experience_years, expertise_proof
            FROM users 
            WHERE role = 'consultant' AND is_active = true
        """))
        
        users = result.fetchall()
        consultants = []
        
        for user in users:
            # Convert user to consultant format
            expertise_proof = user[7] or ""
            specialization = expertise_proof.split('\n')[0].replace('Specialization: ', '') if expertise_proof else "Agricultural Consulting"
            certifications = expertise_proof.split('\n')[1].replace('Certifications: ', '').split(', ') if expertise_proof and '\n' in expertise_proof else ["Certified Agricultural Consultant"]
            
            consultant_data = {
                "id": user[0],
                "name": user[1],
                "specialization": specialization,
                "bio": user[5] or "Expert agricultural consultant",
                "experience_years": user[6] or 5,
                "rating": 4.8,  # Default rating
                "response_time": "4h",  # Default response time
                "is_online": True,  # Default online status
                "certifications": certifications
            }
            consultants.append(consultant_data)
        
        return consultants
        
    except Exception as e:
        logger.error(f"Failed to get consultants: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultants")


@router.get("/consultants/{consultant_id}", response_model=dict)
async def get_consultant(
    consultant_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific consultant from users table."""
    try:
        # Use raw SQL to avoid SQLAlchemy relationship issues
        from sqlalchemy import text
        
        result = db.execute(text("""
            SELECT id, full_name, email, role, is_active, bio, experience_years, expertise_proof
            FROM users 
            WHERE id = :consultant_id AND role = 'consultant' AND is_active = true
        """), {"consultant_id": consultant_id})
        
        user = result.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="Consultant not found")
        
        # Convert user to consultant format
        expertise_proof = user[7] or ""
        specialization = expertise_proof.split('\n')[0].replace('Specialization: ', '') if expertise_proof else "Agricultural Consulting"
        certifications = expertise_proof.split('\n')[1].replace('Certifications: ', '').split(', ') if expertise_proof and '\n' in expertise_proof else ["Certified Agricultural Consultant"]
        
        consultant_data = {
            "id": user[0],
            "name": user[1],
            "specialization": specialization,
            "bio": user[5] or "Expert agricultural consultant",
            "experience_years": user[6] or 5,
            "rating": 4.8,  # Default rating
            "response_time": "4h",  # Default response time
            "is_online": True,  # Default online status
            "certifications": certifications
        }
        
        return consultant_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get consultant: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultant")


@router.get("/consultant/", response_model=List[ConsultationResponse])
async def get_consultant_consultations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all consultations for the current consultant."""
    try:
        # Verify the current user is a consultant
        if current_user.role != "consultant":
            raise HTTPException(status_code=403, detail="Only consultants can access this endpoint")
        
        consultations = db.query(Consultation).filter(
            Consultation.consultant_id == current_user.id
        ).order_by(Consultation.updated_at.desc()).all()
        
        # Add farmer information to each consultation
        consultation_data = []
        for consultation in consultations:
            consultation_dict = consultation.to_dict()
            
            # Get farmer information
            farmer = db.query(User).filter(User.id == consultation.farmer_id).first()
            if farmer:
                consultation_dict["farmer"] = {
                    "id": farmer.id,
                    "full_name": farmer.full_name,
                    "email": farmer.email
                }
            
            consultation_data.append(consultation_dict)
        
        return consultation_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get consultant consultations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get consultant consultations") 