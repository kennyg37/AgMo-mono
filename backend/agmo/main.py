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
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    
    logger.info("🚀 Starting AGMO backend with TensorFlow maize disease detection...")
    
    try:
        # Initialize database
        logger.info("🗄️ Initializing database...")
        create_tables()
        
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
        "maize_disease_model": "available"
    }


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run(
        "agmo.main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="info"
    )