#!/usr/bin/env python3
"""
Script to create an admin account for the AgMo application.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agmo.core.database import get_db
from agmo.models.user import User
from agmo.core.auth import get_password_hash
from sqlalchemy.orm import Session

def create_admin_account():
    """Create an admin account with the following credentials:
    Email: admin@agmo.com
    Username: admin
    Password: admin123
    Role: admin
    """
    
    db = next(get_db())
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(
        (User.email == "admin@agmo.com") | (User.username == "admin")
    ).first()
    
    if existing_admin:
        print(f"❌ Admin account already exists!")
        print(f"   Email: {existing_admin.email}")
        print(f"   Username: {existing_admin.username}")
        print(f"   Role: {existing_admin.role}")
        return
    
    # Create admin user
    admin_user = User(
        email="admin@agmo.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        phone="+1234567890",
        is_active=True,
        is_verified=True,
        role="admin",
        bio="System Administrator for AgMo Agricultural Management Platform",
        location="System",
        experience_years=10,
        farm_size="N/A",
        primary_crops="N/A",
        expertise_proof="System Administrator - No proof required"
    )
    
    try:
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin account created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Password: admin123")
        print(f"   Role: {admin_user.role}")
        print("\n🔐 You can now log in with these credentials.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin account: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Creating admin account...")
    create_admin_account() 