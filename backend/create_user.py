"""Create a test user directly in the database."""

from sqlalchemy.orm import Session
from agmo.core.database import SessionLocal
from agmo.core.auth import get_password_hash
from agmo.models.user import User

def create_test_user():
    """Create a test user directly in the database."""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "farmer@agmo.com").first()
        
        if existing_user:
            print(f"User already exists: {existing_user.username} ({existing_user.email})")
            print(f"User ID: {existing_user.id}")
            print(f"Role: {existing_user.role}")
            print(f"Farm Size: {existing_user.farm_size} acres")
            return existing_user
        
        # Create new user
        hashed_password = get_password_hash("farmer123")
        
        new_user = User(
            email="farmer@agmo.com",
            username="farmer",
            hashed_password=hashed_password,
            full_name="John Farmer",
            phone="+1234567890",
            location="Iowa, USA",
            experience_years=15,
            farm_size=500,
            primary_crops="Corn, Soybeans, Wheat",
            role="farmer",
            is_active=True,
            is_verified=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ User created successfully!")
        print(f"User ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Email: {new_user.email}")
        print(f"Role: {new_user.role}")
        print(f"Farm Size: {new_user.farm_size} acres")
        
        return new_user
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 