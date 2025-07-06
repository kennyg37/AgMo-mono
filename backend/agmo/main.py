"""FastAPI application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agmo.api.routes import router
from agmo.core.config import settings
from agmo.rl.trainer import RLTrainer
from agmo.vision.cnn_model import PlantClassifier
from agmo.websocket.client import SimulationWebSocketClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
rl_trainer: RLTrainer = None
plant_classifier: PlantClassifier = None
ws_client: SimulationWebSocketClient = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global rl_trainer, plant_classifier, ws_client
    
    logger.info("🚀 Starting AGMO backend...")
    
    try:
        # Initialize CNN model
        logger.info("🧠 Initializing plant classifier...")
        plant_classifier = PlantClassifier(
            num_classes=settings.CNN_NUM_CLASSES,
            input_size=settings.CNN_INPUT_SIZE
        )
        await plant_classifier.load_model(settings.CNN_MODEL_PATH)
        
        # Initialize RL trainer
        logger.info("🎯 Initializing RL trainer...")
        rl_trainer = RLTrainer(
            model_name=settings.MODEL_NAME,
            learning_rate=settings.LEARNING_RATE,
            total_timesteps=settings.TOTAL_TIMESTEPS
        )
        
        # Initialize WebSocket client
        logger.info("🔌 Connecting to simulation...")
        ws_client = SimulationWebSocketClient(
            url=settings.SIMULATION_WS_URL,
            rl_trainer=rl_trainer,
            plant_classifier=plant_classifier
        )
        
        # Start WebSocket connection in background
        asyncio.create_task(ws_client.connect())
        
        logger.info("✅ AGMO backend initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize backend: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🛑 Shutting down AGMO backend...")
        
        if ws_client:
            await ws_client.disconnect()
        
        if rl_trainer:
            rl_trainer.save_model()
        
        logger.info("✅ AGMO backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="AGMO Backend",
    description="Reinforcement Learning backend for drone plant monitoring",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AGMO Backend API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "rl_trainer": rl_trainer is not None,
        "plant_classifier": plant_classifier is not None,
        "websocket_connected": ws_client.connected if ws_client else False
    }


if __name__ == "__main__":
    uvicorn.run(
        "agmo.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )