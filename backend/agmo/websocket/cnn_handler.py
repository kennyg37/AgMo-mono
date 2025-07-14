"""
WebSocket handler for CNN plant recognition in the simulation.

This module handles WebSocket connections from the simulation and processes
images with the CNN model for plant health classification.
"""

import asyncio
import json
import logging
import base64
from typing import Dict, Any, Optional
from datetime import datetime

import websockets
from websockets.server import WebSocketServerProtocol

# Import the plant recognition model
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from models.plant_cnn import get_plant_model, predict_plant_health

logger = logging.getLogger(__name__)


class CNNWebSocketHandler:
    """
    WebSocket handler for CNN plant recognition.
    
    This class manages WebSocket connections from the simulation and
    processes images with the plant recognition CNN model.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path
        self.plant_model = None
        self.connected_clients: set[WebSocketServerProtocol] = set()
        self.processing_queue = asyncio.Queue()
        self.is_processing = False
        
        logger.info("🧠 CNN WebSocket handler initialized")
    
    async def initialize(self):
        """Initialize the plant recognition model."""
        try:
            self.plant_model = await get_plant_model(self.model_path)
            logger.info("✅ Plant recognition model loaded")
        except Exception as e:
            logger.error(f"❌ Failed to load plant recognition model: {e}")
            logger.info("⚠️ CNN processing will be disabled")
    
    async def handle_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket connection."""
        client_id = id(websocket)
        logger.info(f"🔌 New WebSocket connection: {client_id}")
        
        self.connected_clients.add(websocket)
        
        try:
            # Send ready message
            await self.send_message(websocket, {
                'type': 'cnn_ready',
                'data': {
                    'model_loaded': self.plant_model is not None,
                    'timestamp': datetime.now().isoformat()
                }
            })
            
            # Handle incoming messages
            async for message in websocket:
                await self.handle_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 WebSocket connection closed: {client_id}")
        except Exception as e:
            logger.error(f"❌ WebSocket error for client {client_id}: {e}")
        finally:
            self.connected_clients.discard(websocket)
            logger.info(f"🔌 Client disconnected: {client_id}")
    
    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming WebSocket message."""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'classify_image':
                await self.handle_image_classification(websocket, data)
            elif message_type == 'ping':
                await self.send_message(websocket, {'type': 'pong', 'data': {}})
            else:
                logger.warning(f"⚠️ Unknown message type: {message_type}")
                await self.send_error(websocket, f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("❌ Invalid JSON message received")
            await self.send_error(websocket, "Invalid JSON message")
        except Exception as e:
            logger.error(f"❌ Error handling message: {e}")
            await self.send_error(websocket, f"Internal error: {str(e)}")
    
    async def handle_image_classification(self, websocket: WebSocketServerProtocol, data: Dict[str, Any]):
        """Handle image classification request."""
        if not self.plant_model:
            await self.send_error(websocket, "CNN model not loaded")
            return
        
        try:
            # Extract image data
            image_data = data.get('data', {})
            image_base64 = image_data.get('image')
            position = image_data.get('position', [0, 0, 0])
            plants = image_data.get('plants', [])
            
            if not image_base64:
                await self.send_error(websocket, "No image data provided")
                return
            
            # Process image with CNN
            logger.info("🌱 Processing image with CNN...")
            prediction_result = await self.plant_model.predict_from_base64(image_base64)
            
            # Prepare response with plant-specific results
            response_data = {
                'plants': [],
                'overall_prediction': prediction_result,
                'timestamp': datetime.now().isoformat()
            }
            
            # If we have plant positions, create individual results
            if plants:
                for plant in plants:
                    plant_result = {
                        'plantId': plant.get('id', 'unknown'),
                        'position': plant.get('position', [0, 0, 0]),
                        'prediction': prediction_result['health']['prediction'],
                        'confidence': prediction_result['health']['confidence'],
                        'plant_type': prediction_result['type']['prediction'],
                        'type_confidence': prediction_result['type']['confidence'],
                        'overall_confidence': prediction_result['overall_confidence']
                    }
                    response_data['plants'].append(plant_result)
            else:
                # Single prediction for the entire image
                response_data['plants'].append({
                    'plantId': 'image_center',
                    'position': position,
                    'prediction': prediction_result['health']['prediction'],
                    'confidence': prediction_result['health']['confidence'],
                    'plant_type': prediction_result['type']['prediction'],
                    'type_confidence': prediction_result['type']['confidence'],
                    'overall_confidence': prediction_result['overall_confidence']
                })
            
            # Send classification results
            await self.send_message(websocket, {
                'type': 'plant_classification',
                'data': response_data
            })
            
            logger.info(f"✅ Image processed - Health: {prediction_result['health']['prediction']} "
                       f"({prediction_result['health']['confidence']:.2f}), "
                       f"Type: {prediction_result['type']['prediction']} "
                       f"({prediction_result['type']['confidence']:.2f})")
            
        except Exception as e:
            logger.error(f"❌ Image classification failed: {e}")
            await self.send_error(websocket, f"Classification failed: {str(e)}")
    
    async def send_message(self, websocket: WebSocketServerProtocol, message: Dict[str, Any]):
        """Send message to WebSocket client."""
        try:
            await websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"❌ Failed to send message: {e}")
    
    async def send_error(self, websocket: WebSocketServerProtocol, error_message: str):
        """Send error message to WebSocket client."""
        await self.send_message(websocket, {
            'type': 'error',
            'data': {
                'message': error_message,
                'timestamp': datetime.now().isoformat()
            }
        })
    
    async def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        if not self.connected_clients:
            return
        
        # Create a copy of the set to avoid modification during iteration
        clients = self.connected_clients.copy()
        
        for websocket in clients:
            try:
                await self.send_message(websocket, message)
            except Exception as e:
                logger.error(f"❌ Failed to broadcast to client: {e}")
                # Remove disconnected client
                self.connected_clients.discard(websocket)
    
    def get_connection_count(self) -> int:
        """Get number of connected clients."""
        return len(self.connected_clients)
    
    async def shutdown(self):
        """Shutdown the handler."""
        logger.info("🔄 Shutting down CNN WebSocket handler...")
        
        # Close all connections
        for websocket in self.connected_clients.copy():
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"❌ Error closing connection: {e}")
        
        self.connected_clients.clear()
        logger.info("✅ CNN WebSocket handler shutdown complete")


# Global handler instance
_cnn_handler: Optional[CNNWebSocketHandler] = None


async def get_cnn_handler(model_path: Optional[str] = None) -> CNNWebSocketHandler:
    """Get or create the global CNN WebSocket handler."""
    global _cnn_handler
    
    if _cnn_handler is None:
        _cnn_handler = CNNWebSocketHandler(model_path)
        await _cnn_handler.initialize()
    
    return _cnn_handler


async def start_cnn_websocket_server(host: str = 'localhost', port: int = 8000, 
                                   model_path: Optional[str] = None):
    """Start the CNN WebSocket server."""
    handler = await get_cnn_handler(model_path)
    
    async def websocket_handler(websocket, path):
        await handler.handle_connection(websocket, path)
    
    server = await websockets.serve(websocket_handler, host, port)
    
    logger.info(f"🌐 CNN WebSocket server started on ws://{host}:{port}")
    
    try:
        await server.wait_closed()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down CNN WebSocket server...")
        await handler.shutdown()


if __name__ == "__main__":
    # Example usage
    import argparse
    
    parser = argparse.ArgumentParser(description='Start CNN WebSocket server')
    parser.add_argument('--host', default='localhost', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    parser.add_argument('--model', help='Path to pre-trained model')
    
    args = parser.parse_args()
    
    asyncio.run(start_cnn_websocket_server(args.host, args.port, args.model)) 