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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global instances
plant_classifier: PlantClassifier = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global plant_classifier
    
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
        
        logger.info("✅ AGMO backend initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize backend: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🛑 Shutting down AGMO backend...")
        logger.info("✅ AGMO backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="AGMO Farm API",
    description="AI-powered agricultural monitoring and management system",
    version="1.0.0"
)

# Add CORS middleware - Comprehensive configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Alternative CORS handler (uncomment if middleware doesn't work)
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Include API routes
app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    create_tables()
    print("✅ Database tables created successfully")

@app.get("/")
async def root():
    return {"message": "AGMO Farm API is running!"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "plant_classifier": plant_classifier is not None
    }


@app.get("/cnn/status")
async def cnn_status():
    """CNN model status endpoint."""
    if not plant_classifier:
        return {"status": "not_initialized"}
    
    return {
        "status": "ready",
        "model_info": plant_classifier.get_model_info()
    }


if __name__ == "__main__":
    uvicorn.run(
        "agmo.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )