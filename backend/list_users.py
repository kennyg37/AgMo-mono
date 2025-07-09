"""List all users in the database."""

from sqlalchemy import create_engine, text

def list_users():
    """List all users in the database."""
    from agmo.core.config import settings
    
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT id, username, email, full_name, role, is_active, farm_size, experience_years
                FROM users
                ORDER BY id
            """))
            
            print("Users in database:")
            print("-" * 80)
            for row in result:
                print(f"ID: {row[0]}")
                print(f"Username: {row[1]}")
                print(f"Email: {row[2]}")
                print(f"Name: {row[3]}")
                print(f"Role: {row[4]}")
                print(f"Active: {row[5]}")
                print(f"Farm Size: {row[6]} acres")
                print(f"Experience: {row[7]} years")
                print("-" * 80)
                
    except Exception as e:
        print(f"❌ Error listing users: {e}")

if __name__ == "__main__":
    list_users() 