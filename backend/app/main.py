import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import connect_to_mongo, close_mongo_connection
from app.api.routes import router
from app.services.gbfs_service import gbfs_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

background_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    global background_task
    
    logger.info("🚀 Starting BikeScope Analytics API...")
    
    try:
        await connect_to_mongo()
        
        logger.info("📡 Performing initial GBFS data fetch...")
        await gbfs_service.update_stations_data()
        
        background_task = asyncio.create_task(gbfs_service.start_background_updates())
        
        logger.info("✅ BikeScope API started successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    
    yield
    
    logger.info("🛑 Shutting down BikeScope API...")
    
    if background_task:
        gbfs_service.stop_background_updates()
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            logger.info("Background task cancelled")
    
    await close_mongo_connection()
    
    logger.info("👋 BikeScope API shutdown complete")

app = FastAPI(
    title="BikeScope Analytics API",
    description="Multi-tenant bike share analytics system",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {
        "message": "BikeScope Analytics API",
        "status": "running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )