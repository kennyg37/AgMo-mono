#!/usr/bin/env python3
"""
Test script to verify database history saving and retrieval.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from agmo.core.database import get_db, engine
from agmo.models.disease_history import DiseaseDetectionHistory
from agmo.services.disease_history_service import disease_history_service
from sqlalchemy.orm import Session
from datetime import datetime

def test_database_connection():
    """Test database connection and table existence."""
    print("🔍 Testing Database Connection...")
    print("=" * 50)
    
    try:
        # Test database connection
        db = next(get_db())
        print("✅ Database connection successful")
        
        # Check if disease history table exists
        result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='disease_detection_history'")
        table_exists = result.fetchone() is not None
        
        if table_exists:
            print("✅ Disease history table exists")
            
            # Count existing records
            count = db.query(DiseaseDetectionHistory).count()
            print(f"📊 Current history records: {count}")
            
            # Show recent records
            recent = db.query(DiseaseDetectionHistory).order_by(DiseaseDetectionHistory.created_at.desc()).limit(5).all()
            if recent:
                print("📋 Recent records:")
                for record in recent:
                    print(f"  - {record.prediction} (confidence: {record.confidence:.3f}) at {record.created_at}")
            else:
                print("📋 No recent records found")
                
        else:
            print("❌ Disease history table does not exist")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        import traceback
        traceback.print_exc()

def test_history_service():
    """Test the history service directly."""
    print("\n🧪 Testing History Service...")
    print("=" * 50)
    
    try:
        db = next(get_db())
        
        # Test saving a detection
        test_prediction = {
            "prediction": "blight",
            "confidence": 0.85,
            "is_sick": True,
            "description": "Test blight detection",
            "class_id": 0,
            "probabilities": [0.85, 0.05, 0.05, 0.05],
            "timestamp": datetime.utcnow().isoformat(),
            "model_loaded": True
        }
        
        print("💾 Saving test detection...")
        result = disease_history_service.save_detection_history(
            db=db,
            user_id=1,
            field_id=None,
            prediction_data=test_prediction,
            image_filename="test.jpg",
            image_size=1024,
            image_dimensions="128x128"
        )
        
        if result:
            print("✅ Test detection saved successfully")
        else:
            print("❌ Failed to save test detection")
            
        # Test retrieving history
        print("\n📊 Testing history retrieval...")
        history = disease_history_service.get_detection_history(db=db, user_id=1, limit=10)
        
        if history:
            print(f"✅ Retrieved {len(history)} history records")
            for record in history[:3]:
                print(f"  - {record.disease_type} (confidence: {record.confidence:.3f})")
        else:
            print("❌ No history records found")
            
        # Test statistics
        print("\n📈 Testing statistics...")
        stats = disease_history_service.get_detection_statistics(db=db, user_id=1)
        
        if stats:
            print("✅ Statistics retrieved:")
            print(f"  Total: {stats.get('total_detections', 0)}")
            print(f"  Healthy: {stats.get('healthy_count', 0)}")
            print(f"  Sick: {stats.get('sick_count', 0)}")
            print(f"  Disease Rate: {stats.get('disease_rate', 0):.1f}%")
        else:
            print("❌ Failed to retrieve statistics")
            
    except Exception as e:
        print(f"❌ History service error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database_connection()
    test_history_service() 