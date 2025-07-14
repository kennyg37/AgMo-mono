"""FastAPI application entry point."""

import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agmo.api.routes import router
from agmo.core.config import settings
from agmo.core.database import create_tables
from agmo.vision.cnn_model import PlantClassifier
from agmo.websocket.cnn_handler import get_cnn_handler, start_cnn_websocket_server

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
plant_classifier: PlantClassifier = None
cnn_handler = None
cnn_server_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global plant_classifier, cnn_handler, cnn_server_task
    
    logger.info("🚀 Starting AGMO backend with CNN plant recognition...")
    
    try:
        # Initialize database
        logger.info("🗄️ Initializing database...")
        create_tables()
        
        # Initialize CNN model
        logger.info("🧠 Initializing plant classifier...")
        plant_classifier = PlantClassifier(
            num_classes=settings.CNN_NUM_CLASSES,
            input_size=settings.CNN_INPUT_SIZE
        )
        await plant_classifier.load_model(settings.CNN_MODEL_PATH)
        
        # Set global reference for routes
        from agmo.api.routes import plant_classifier as routes_plant_classifier
        import agmo.api.routes
        agmo.api.routes.plant_classifier = plant_classifier
        
        # Initialize CNN WebSocket handler
        logger.info("🔌 Initializing CNN WebSocket handler...")
        cnn_handler = await get_cnn_handler(settings.CNN_MODEL_PATH)
        
        # Start CNN WebSocket server in background
        logger.info("🌐 Starting CNN WebSocket server...")
        cnn_server_task = asyncio.create_task(
            start_cnn_websocket_server(
                host=settings.CNN_WS_HOST,
                port=settings.CNN_WS_PORT,
                model_path=settings.CNN_MODEL_PATH
            )
        )
        
        logger.info("✅ AGMO backend initialized successfully")
        logger.info(f"🌐 CNN WebSocket server running on ws://{settings.CNN_WS_HOST}:{settings.CNN_WS_PORT}")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize backend: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🛑 Shutting down AGMO backend...")
        
        if cnn_server_task and not cnn_server_task.done():
            cnn_server_task.cancel()
            try:
                await cnn_server_task
            except asyncio.CancelledError:
                pass
        
        if cnn_handler:
            await cnn_handler.shutdown()
        
        logger.info("✅ AGMO backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="AGMO Farming Backend",
    description="Comprehensive farming management system with AI-powered crop monitoring and CNN plant recognition",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
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
        "message": "AGMO Farming Backend API",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "User Authentication",
            "Farm Management",
            "Crop Monitoring",
            "AI Chatbot",
            "CNN Plant Health Analysis",
            "Weather Monitoring",
            "Sensor Data Collection",
            "Decision Support",
            "Manual Drone Control"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "plant_classifier": plant_classifier is not None,
        "cnn_handler": cnn_handler is not None,
        "cnn_websocket_connections": cnn_handler.get_connection_count() if cnn_handler else 0
    }


@app.get("/cnn/status")
async def cnn_status():
    """CNN model status endpoint."""
    if not plant_classifier:
        return {"status": "not_initialized"}
    
    return {
        "status": "ready",
        "model_info": plant_classifier.get_model_info(),
        "connections": cnn_handler.get_connection_count() if cnn_handler else 0
    }


if __name__ == "__main__":
    uvicorn.run(
        "agmo.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )