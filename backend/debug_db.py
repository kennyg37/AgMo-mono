"""Debug database connection and User model."""

from sqlalchemy import create_engine, text
from agmo.core.config import settings

def debug_database():
    """Debug database connection and User model."""
    print("Debugging database connection...")
    
    # Test basic connection
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # Test basic query
            result = connection.execute(text("SELECT 1 as test"))
            print("✅ Basic database connection successful")
            
            # Check if users table exists
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            print(f"✅ Users table exists with {count} records")
            
            # Check table structure
            result = connection.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position
            """))
            
            print("\nUsers table structure:")
            for row in result:
                print(f"  - {row[0]}: {row[1]} ({'NULL' if row[2] == 'YES' else 'NOT NULL'})")
                
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_database() 