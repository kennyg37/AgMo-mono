# 🌱 Plant Detection Session Endpoint

## 📋 Overview

This endpoint handles plant detection sessions with the following features:
1. **Creates database entries** for session tracking
2. **Generates alerts** for the frontend dashboard
3. **Simple JSON input/output** format

## 🚀 API Endpoints

### POST `/api/sessions/plant-detection`

Creates a new plant detection session and generates an alert.

#### Request Body:
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "plantId": "maize_blight_1",
  "label": "Blight",
  "location": {
    "x": 150.5,
    "y": 0.0,
    "z": 200.3
  },
  "healthStatus": "diseased",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Response:
```json
{
  "success": true,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Plant detection session created successfully",
  "alert_created": true
}
```

### GET `/api/sessions/plant-detection/{session_id}`

Retrieves a specific session by session ID.

### GET `/api/sessions/plant-detection`

Retrieves all sessions with optional filtering:
- `plant_id`: Filter by plant ID
- `health_status`: Filter by health status
- `limit`: Maximum number of results (default: 100)

## 🗄️ Database Schema

### `plant_detection_sessions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `session_id` | String | Unique session identifier |
| `plant_id` | String | Plant identifier |
| `label` | String | Detection label (e.g., "Blight") |
| `health_status` | String | Health status (healthy, diseased, etc.) |
| `location_x` | Float | X coordinate |
| `location_y` | Float | Y coordinate |
| `location_z` | Float | Z coordinate |
| `metadata` | JSON | Additional data |
| `notes` | Text | Optional notes |
| `detected_at` | DateTime | When detection occurred |
| `created_at` | DateTime | Record creation time |
| `updated_at` | DateTime | Last update time |

## 🚨 Alert System

When a session is created, an alert is automatically generated:

- **Diseased plants**: Creates a disease alert with HIGH severity
- **Healthy plants**: Creates a health decline alert with LOW severity
- **Alert includes**: Plant ID, label, health status, location, session ID

## 🧪 Testing

Run the test script to verify the endpoint:

```bash
python test_session_endpoint.py
```

## 📝 Usage Examples

### Create a Session (Python)
```python
import requests

data = {
    "sessionId": "test-session-123",
    "plantId": "maize_healthy_1",
    "label": "Healthy",
    "location": {"x": 100.0, "y": 0.0, "z": 150.0},
    "healthStatus": "healthy",
    "timestamp": "2024-01-15T10:30:00Z"
}

response = requests.post(
    "http://localhost:8000/api/sessions/plant-detection",
    json=data
)
print(response.json())
```

### Create a Session (cURL)
```bash
curl -X POST "http://localhost:8000/api/sessions/plant-detection" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "plantId": "maize_healthy_1",
    "label": "Healthy",
    "location": {"x": 100.0, "y": 0.0, "z": 150.0},
    "healthStatus": "healthy",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

## 🔧 Next Steps

This is a **baseline implementation**. Future enhancements could include:

1. **Field association** - Link sessions to specific fields
2. **Image storage** - Store detection images
3. **Confidence scores** - Add ML confidence to sessions
4. **Batch processing** - Handle multiple detections
5. **Real-time notifications** - WebSocket alerts
6. **Analytics** - Session statistics and trends

## ✅ Status

- ✅ **Database model** created
- ✅ **API endpoint** implemented
- ✅ **Alert generation** working
- ✅ **Basic validation** included
- ✅ **Error handling** implemented
- ✅ **Documentation** provided

**Ready for use!** 🚀 