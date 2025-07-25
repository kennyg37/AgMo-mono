#!/usr/bin/env python3
"""
Script to fix the database schema for disease history.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from agmo.core.database import engine
from sqlalchemy import text

def fix_database_schema():
    """Fix the database schema for disease history."""
    print("🔧 Fixing Database Schema...")
    print("=" * 50)
    
    try:
        with engine.connect() as conn:
            # Check if the table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'disease_detection_history'
                );
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("✅ Disease history table exists")
                
                # Check current constraints
                result = conn.execute(text("""
                    SELECT column_name, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'disease_detection_history' 
                    AND column_name = 'field_id';
                """))
                column_info = result.fetchone()
                
                if column_info:
                    print(f"📊 Current field_id constraint: nullable = {column_info[1]}")
                    
                    if column_info[1] == 'NO':
                        print("🔧 Making field_id nullable...")
                        
                        # Drop the foreign key constraint first
                        conn.execute(text("""
                            ALTER TABLE disease_detection_history 
                            DROP CONSTRAINT IF EXISTS disease_detection_history_field_id_fkey;
                        """))
                        
                        # Make the column nullable
                        conn.execute(text("""
                            ALTER TABLE disease_detection_history 
                            ALTER COLUMN field_id DROP NOT NULL;
                        """))
                        
                        # Re-add the foreign key constraint
                        conn.execute(text("""
                            ALTER TABLE disease_detection_history 
                            ADD CONSTRAINT disease_detection_history_field_id_fkey 
                            FOREIGN KEY (field_id) REFERENCES fields(id);
                        """))
                        
                        conn.commit()
                        print("✅ Successfully made field_id nullable")
                    else:
                        print("✅ field_id is already nullable")
                else:
                    print("❌ field_id column not found")
            else:
                print("❌ Disease history table does not exist")
                
    except Exception as e:
        print(f"❌ Error fixing schema: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    fix_database_schema() 