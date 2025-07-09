"""Test database connection and create database if needed."""

import psycopg2
from sqlalchemy import create_engine, text
from agmo.core.config import settings

def test_database_connection():
    """Test database connection and create database if needed."""
    print("Testing database connection...")
    
    # Extract connection details from DATABASE_URL
    # Format: postgresql://username:password@host:port/database
    url_parts = settings.DATABASE_URL.replace("postgresql://", "").split("@")
    auth_part = url_parts[0]
    host_db_part = url_parts[1]
    
    username, password = auth_part.split(":")
    host_port, database = host_db_part.split("/")
    host, port = host_port.split(":")
    
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Username: {username}")
    print(f"Database: {database}")
    
    try:
        # Try to connect to PostgreSQL server (without specifying database)
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=username,
            password=password,
            database="postgres"  # Connect to default postgres database
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if our database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database,))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Database '{database}' does not exist. Creating it...")
            cursor.execute(f"CREATE DATABASE {database}")
            print(f"Database '{database}' created successfully!")
        else:
            print(f"Database '{database}' already exists.")
        
        cursor.close()
        conn.close()
        
        # Now test connection to our database
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\nPossible solutions:")
        print("1. Make sure PostgreSQL is installed and running")
        print("2. Create the database manually:")
        print(f"   - Connect to PostgreSQL: psql -U {username}")
        print(f"   - Create database: CREATE DATABASE {database};")
        print("3. Or use SQLite instead by changing DATABASE_URL in .env to:")
        print("   DATABASE_URL=sqlite:///./agmo_farm.db")

if __name__ == "__main__":
    test_database_connection() 