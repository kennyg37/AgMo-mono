"""Authentication routes."""

from datetime import timedelta, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from agmo.core.auth import (
    verify_password, get_password_hash, create_access_token, 
    get_current_active_user
)
from agmo.core.database import get_db
from agmo.models.user import User
from agmo.core.config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])


class UserCreate(BaseModel):
    """User registration model."""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = 0
    farm_size: Optional[int] = None
    primary_crops: Optional[str] = None
    role: str = "farmer"  # farmer, consultant (admin not allowed in registration)
    expertise_proof: Optional[str] = None  # For consultants


class UserLogin(BaseModel):
    """User login model."""
    email: str
    password: str


class UserResponse(BaseModel):
    """User response model."""
    id: int
    email: str
    username: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    expertise_proof: Optional[str]
    location: Optional[str]
    experience_years: int
    farm_size: Optional[int]
    primary_crops: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Validate role - admin cannot be registered through this endpoint
    if user_data.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin role cannot be registered through this endpoint"
        )
    
    # Validate consultant role requires expertise proof
    if user_data.role == "consultant" and not user_data.expertise_proof:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultants must provide proof of expertise"
        )
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        location=user_data.location,
        experience_years=user_data.experience_years,
        farm_size=user_data.farm_size,
        primary_crops=user_data.primary_crops,
        role=user_data.role,
        expertise_proof=user_data.expertise_proof
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(db_user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(db_user)
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token."""
    # Find user by email or username
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user_id: int = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Get current user information."""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user information."""
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user fields
    for field, value in user_data.dict(exclude_unset=True).items():
        if field == "password":
            setattr(user, "hashed_password", get_password_hash(value))
        elif field != "email":  # Don't allow email changes for now
            setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user) 