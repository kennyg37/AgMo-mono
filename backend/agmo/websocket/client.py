"""WebSocket client for simulation communication."""

import asyncio
import json
import logging
from typing import Dict, Any, Optional
import websockets
from websockets.exceptions import ConnectionClosed, InvalidURI

logger = logging.getLogger(__name__)


class SimulationWebSocketClient:
    """WebSocket client for communicating with the simulation."""
    
    def __init__(self, url: str, rl_trainer=None, plant_classifier=None):
        self.url = url
        self.rl_trainer = rl_trainer
        self.plant_classifier = plant_classifier
        
        self.websocket = None
        self.connected = False
        self.reconnect_interval = 5.0
        self.max_reconnect_attempts = 10
        self.reconnect_attempts = 0
        
        # Message handlers
        self.message_handlers = {
            "observation": self._handle_observation,
            "reward": self._handle_reward,
            "reset": self._handle_reset,
            "drone_update": self._handle_drone_update,
            "plants_update": self._handle_plants_update,
            "camera_feed": self._handle_camera_feed,
        }
    
    async def connect(self):
        """Connect to the simulation WebSocket."""
        while self.reconnect_attempts < self.max_reconnect_attempts:
            try:
                logger.info(f"🔌 Connecting to simulation: {self.url}")
                
                self.websocket = await websockets.connect(
                    self.url,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=10
                )
                
                self.connected = True
                self.reconnect_attempts = 0
                
                logger.info("✅ Connected to simulation")
                
                # Start message handling loop
                await self._handle_messages()
                
            except (ConnectionClosed, InvalidURI, OSError) as e:
                logger.error(f"❌ Connection failed: {e}")
                self.connected = False
                self.websocket = None
                
                self.reconnect_attempts += 1
                if self.reconnect_attempts < self.max_reconnect_attempts:
                    logger.info(f"🔄 Reconnecting in {self.reconnect_interval}s... (attempt {self.reconnect_attempts})")
                    await asyncio.sleep(self.reconnect_interval)
                else:
                    logger.error("❌ Max reconnection attempts reached")
                    break
            
            except Exception as e:
                logger.error(f"❌ Unexpected error: {e}")
                break
    
    async def disconnect(self):
        """Disconnect from the simulation."""
        if self.websocket:
            logger.info("🔌 Disconnecting from simulation")
            await self.websocket.close()
            self.websocket = None
            self.connected = False
    
    async def _handle_messages(self):
        """Handle incoming messages from simulation."""
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    if message_type in self.message_handlers:
                        await self.message_handlers[message_type](data.get("data", {}))
                    else:
                        logger.warning(f"Unknown message type: {message_type}")
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode message: {e}")
                except Exception as e:
                    logger.error(f"Error handling message: {e}")
                    
        except ConnectionClosed:
            logger.warning("🔌 Connection closed by simulation")
            self.connected = False
        except Exception as e:
            logger.error(f"❌ Message handling error: {e}")
            self.connected = False
    
    async def send_message(self, message_type: str, data: Dict[str, Any]):
        """Send message to simulation."""
        if not self.connected or not self.websocket:
            logger.warning("Cannot send message: not connected")
            return
        
        try:
            message = {
                "type": message_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await self.websocket.send(json.dumps(message))
            
        except Exception as e:
            logger.error(f"Failed to send message: {e}")
            self.connected = False
    
    async def send_action(self, action: list):
        """Send RL action to simulation."""
        await self.send_message("action", {"action": action})
    
    async def send_reset(self):
        """Send reset command to simulation."""
        await self.send_message("reset", {})
    
    async def send_plant_classification(self, plant_id: str, prediction: str, confidence: float):
        """Send plant classification result to simulation."""
        await self.send_message("plant_classification", {
            "plant_id": plant_id,
            "prediction": prediction,
            "confidence": confidence
        })
    
    # Message handlers
    
    async def _handle_observation(self, data: Dict[str, Any]):
        """Handle observation from simulation."""
        logger.debug("📡 Received observation")
        
        # Update RL trainer with new observation
        if self.rl_trainer:
            self.rl_trainer.update_observation(data)
        
        # Process camera image with CNN if available
        if self.plant_classifier and "image" in data:
            try:
                import base64
                from PIL import Image
                import io
                
                # Decode image
                image_data = base64.b64decode(data["image"])
                image = Image.open(io.BytesIO(image_data))
                
                # Classify plant health
                prediction, confidence = await self.plant_classifier.predict(image)
                
                # Send classification result back to simulation
                await self.send_plant_classification("current_view", prediction, confidence)
                
            except Exception as e:
                logger.error(f"CNN processing failed: {e}")
    
    async def _handle_reward(self, data: Dict[str, Any]):
        """Handle reward signal from simulation."""
        reward = data.get("reward", 0.0)
        done = data.get("done", False)
        
        logger.debug(f"🎯 Received reward: {reward}, done: {done}")
        
        # This would be used by the RL trainer to update the policy
        # For now, just log it
    
    async def _handle_reset(self, data: Dict[str, Any]):
        """Handle reset signal from simulation."""
        logger.info("🔄 Simulation reset")
        
        # Reset RL trainer state if needed
        if self.rl_trainer:
            # Reset any episode-specific state
            pass
    
    async def _handle_drone_update(self, data: Dict[str, Any]):
        """Handle drone telemetry update."""
        logger.debug("🚁 Received drone update")
        # Process drone telemetry if needed
    
    async def _handle_plants_update(self, data: Dict[str, Any]):
        """Handle plants status update."""
        logger.debug("🌱 Received plants update")
        # Process plant data if needed
    
    async def _handle_camera_feed(self, data: Dict[str, Any]):
        """Handle camera feed from drone."""
        logger.debug("📷 Received camera feed")
        
        # Process camera feed with CNN
        if self.plant_classifier and "image" in data:
            try:
                import base64
                from PIL import Image
                import io
                
                # Decode image
                image_data = base64.b64decode(data["image"])
                image = Image.open(io.BytesIO(image_data))
                
                # Classify plant health
                prediction, confidence = await self.plant_classifier.predict(image)
                
                logger.debug(f"🧠 CNN prediction: {prediction} ({confidence:.2f})")
                
            except Exception as e:
                logger.error(f"Camera feed processing failed: {e}")