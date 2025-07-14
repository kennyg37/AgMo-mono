"""
CNN Server for Maize Disease Detection

This server provides WebSocket-based image classification using the trained
maize disease detection CNN model.
"""

import asyncio
import json
import logging
import base64
from datetime import datetime
from typing import Dict, Any, List
import websockets
from websockets.server import WebSocketServerProtocol
import sys
import os

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

from models.maize_cnn import get_maize_model, predict_maize_disease

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
connected_clients: List[WebSocketServerProtocol] = []
maize_model = None


async def handle_client(websocket: WebSocketServerProtocol, path: str):
    """Handle WebSocket client connections."""
    client_id = id(websocket)
    logger.info(f"🔌 Client connected: {client_id}")
    connected_clients.append(websocket)
    
    try:
        # Send ready notification
        await websocket.send(json.dumps({
            'type': 'cnn_ready',
            'data': {
                'model_type': 'Maize Disease Detection CNN',
                'timestamp': datetime.now().isoformat()
            }
        }))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                await handle_message(websocket, data)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from client {client_id}")
            except Exception as e:
                logger.error(f"Error handling message from client {client_id}: {e}")
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"🔌 Client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"Error with client {client_id}: {e}")
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


async def handle_message(websocket: WebSocketServerProtocol, data: Dict[str, Any]):
    """Handle incoming WebSocket messages."""
    message_type = data.get('type')
    
    if message_type == 'classify_image':
        await handle_image_classification(websocket, data)
    elif message_type == 'ping':
        await websocket.send(json.dumps({'type': 'pong', 'timestamp': datetime.now().isoformat()}))
    else:
        logger.warning(f"Unknown message type: {message_type}")


async def handle_image_classification(websocket: WebSocketServerProtocol, data: Dict[str, Any]):
    """Handle image classification requests."""
    try:
        request_data = data.get('data', {})
        image_base64 = request_data.get('image')
        position = request_data.get('position', [0, 0, 0])
        plants = request_data.get('plants', [])
        
        if not image_base64:
            logger.error("No image data provided")
            await send_error(websocket, "No image data provided")
            return
        
        # Get maize model
        global maize_model
        if maize_model is None:
            maize_model = await get_maize_model()
        
        # Perform prediction
        prediction = await predict_maize_disease(image_base64)
        
        # Update plant health based on prediction
        updated_plants = []
        for plant in plants:
            # Determine plant health based on CNN prediction
            if prediction['is_sick']:
                plant['health'] = 'sick'
                plant['confidence'] = prediction['confidence']
            else:
                plant['health'] = 'healthy'
                plant['confidence'] = prediction['confidence']
            
            updated_plants.append(plant)
        
        # Send classification result
        result = {
            'type': 'plant_classification',
            'data': {
                'plants': updated_plants,
                'prediction': prediction,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        await websocket.send(json.dumps(result))
        
        logger.info(f"🌽 Classification result: {prediction['prediction']} "
                   f"(confidence: {prediction['confidence']:.3f})")
        
    except Exception as e:
        logger.error(f"Error in image classification: {e}")
        await send_error(websocket, f"Classification failed: {str(e)}")


async def send_error(websocket: WebSocketServerProtocol, error_message: str):
    """Send error message to client."""
    error_response = {
        'type': 'error',
        'data': {
            'message': error_message,
            'timestamp': datetime.now().isoformat()
        }
    }
    await websocket.send(json.dumps(error_response))


async def broadcast_message(message: Dict[str, Any]):
    """Broadcast message to all connected clients."""
    message_json = json.dumps(message)
    disconnected_clients = []
    
    for client in connected_clients:
        try:
            await client.send(message_json)
        except websockets.exceptions.ConnectionClosed:
            disconnected_clients.append(client)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
            disconnected_clients.append(client)
    
    # Remove disconnected clients
    for client in disconnected_clients:
        if client in connected_clients:
            connected_clients.remove(client)


async def main():
    """Main server function."""
    global maize_model
    
    # Initialize maize model
    logger.info("🌽 Initializing maize disease detection model...")
    maize_model = await get_maize_model()
    
    # Get model info
    model_info = maize_model.get_model_info()
    logger.info(f"Model info: {model_info}")
    
    # Start WebSocket server
    port = int(os.getenv('CNN_SERVER_PORT', '8001'))
    host = os.getenv('CNN_SERVER_HOST', 'localhost')
    
    logger.info(f"🚀 Starting CNN server on {host}:{port}")
    
    async with websockets.serve(handle_client, host, port):
        logger.info(f"✅ CNN server running on ws://{host}:{port}")
        
        # Keep server running
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 CNN server stopped by user")
    except Exception as e:
        logger.error(f"❌ CNN server error: {e}") 