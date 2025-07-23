import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

# Global database instance
database = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(settings.mongodb_url)
        database.database = database.client[settings.database_name]
        
        # Test connection
        await database.client.admin.command('ping')
        logger.info("✅ Connected to MongoDB")
        
        # Create indexes for performance
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("🔌 Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Function to safely create index
        async def safe_create_index(collection, index_spec, **kwargs):
            try:
                await collection.create_index(index_spec, **kwargs)
            except Exception as e:
                if "IndexKeySpecsConflict" in str(e) or "already exists" in str(e):
                    logger.debug(f"Index already exists: {index_spec}")
                else:
                    logger.warning(f"Failed to create index {index_spec}: {e}")
        
        # Stations indexes
        await safe_create_index(
            database.database.stations, 
            [("station_id", 1)], 
            unique=True
        )
        await safe_create_index(
            database.database.stations, 
            [("tenant_id", 1)]
        )
        
        # Alerts indexes
        await safe_create_index(
            database.database.alerts, 
            [("tenant_id", 1), ("timestamp", -1)]
        )
        await safe_create_index(
            database.database.alerts, 
            [("station_id", 1), ("timestamp", -1)]
        )
        
        # Trips indexes
        await safe_create_index(
            database.database.trips, 
            [("tenant_id", 1)]
        )
        await safe_create_index(
            database.database.trips, 
            [("start_station_id", 1)]
        )
        await safe_create_index(
            database.database.trips, 
            [("started_at", -1)]
        )
        
        logger.info("✅ Database indexes verified/created")
        
    except Exception as e:
        logger.error(f"❌ Failed to create indexes: {e}")

def get_database():
    """Get database instance"""
    return database.database