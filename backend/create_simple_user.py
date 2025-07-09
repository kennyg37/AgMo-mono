"""Create a simple test user."""

from sqlalchemy.orm import Session
from agmo.core.database import SessionLocal
from agmo.core.auth import get_password_hash
from agmo.models.user import User

def create_simple_user():
    """Create a simple test user."""
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "farmer@agmo.com").first()
        
        if existing_user:
            print(f"✅ User already exists: {existing_user.username}")
            print(f"   Email: {existing_user.email}")
            print(f"   Role: {existing_user.role}")
            return existing_user
        
        # Create new user with minimal fields
        hashed_password = get_password_hash("farmer123")
        
        new_user = User(
            email="farmer@agmo.com",
            username="farmer",
            hashed_password=hashed_password,
            full_name="John Farmer",
            role="farmer",
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"✅ User created successfully!")
        print(f"   ID: {new_user.id}")
        print(f"   Username: {new_user.username}")
        print(f"   Email: {new_user.email}")
        
        return new_user
        
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    create_simple_user() 