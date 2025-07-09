"""Check database tables and create them if needed."""

from sqlalchemy import create_engine, text, inspect
from agmo.core.config import settings

def check_database_tables():
    """Check if database tables exist and create them if needed."""
    print("Checking database tables...")
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        # Check if tables exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        print(f"Existing tables: {existing_tables}")
        
        # Expected tables
        expected_tables = [
            "users", "farms", "fields", "crops", 
            "plant_health", "weather_data", "sensor_data",
            "crop_analytics", "decision_logs", "chat_messages"
        ]
        
        missing_tables = [table for table in expected_tables if table not in existing_tables]
        
        if missing_tables:
            print(f"Missing tables: {missing_tables}")
            print("Creating missing tables...")
            
            # Import and create tables
            from agmo.core.database import create_tables
            create_tables()
            
            # Check again
            inspector = inspect(engine)
            existing_tables = inspector.get_table_names()
            print(f"Tables after creation: {existing_tables}")
            
        else:
            print("✅ All expected tables exist!")
            
        # Test user table structure
        if "users" in existing_tables:
            columns = inspector.get_columns("users")
            print(f"\nUsers table columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
                
    except Exception as e:
        print(f"❌ Error checking tables: {e}")

if __name__ == "__main__":
    check_database_tables() 