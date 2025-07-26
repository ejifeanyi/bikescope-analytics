import asyncio
import logging
from datetime import datetime
from typing import Dict, List
import httpx

from app.database.connection import get_database

logger = logging.getLogger(__name__)

class GBFSService:
    def __init__(self):
        self.info_url = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json"
        self.status_url = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json"
        self._running = False

    @property
    def db(self):
        """Get database instance (lazy loading)"""
        return get_database()

    def assign_tenant_id(self, lat: float, lon: float) -> str:
        """
        Assign tenant based on coordinates
        Manhattan: Everything north of ~40.769 latitude
        Brooklyn: Everything south and east (simplified)
        """
        if lat >= 40.769:
            return "manhattan"
        else:
            return "brooklyn"

    async def fetch_gbfs_data(self, url: str) -> Dict:
        """Fetch data from GBFS endpoint with error handling"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            logger.error(f"Timeout fetching {url}")
            return {}
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code} for {url}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {e}")
            return {}

    async def update_stations_data(self) -> bool:
        """Fetch and update station data from GBFS"""
        logger.info("Updating station data from GBFS...")
        
        try:
            if self.db is None:
                logger.error("Database not available")
                return False
            
            info_data, status_data = await asyncio.gather(
                self.fetch_gbfs_data(self.info_url),
                self.fetch_gbfs_data(self.status_url)
            )
            
            if not info_data or not status_data:
                logger.error("Failed to fetch GBFS data")
                return False
            
            stations_info = info_data.get("data", {}).get("stations", [])
            stations_status = status_data.get("data", {}).get("stations", [])
            
            status_lookup = {
                station["station_id"]: station 
                for station in stations_status
            }
            
            updated_count = 0
            new_alerts = []
            
            for station_info in stations_info:
                station_id = station_info["station_id"]
                
                if station_id not in status_lookup:
                    continue
                
                status_info = status_lookup[station_id]
                
                station_doc = {
                    "station_id": station_id,
                    "tenant_id": self.assign_tenant_id(
                        station_info["lat"], 
                        station_info["lon"]
                    ),
                    "name": station_info["name"],
                    "lat": station_info["lat"],
                    "lon": station_info["lon"],
                    "capacity": station_info["capacity"],
                    "current_status": {
                        "bikes_available": status_info["num_bikes_available"],
                        "docks_available": status_info["num_docks_available"],
                        "last_updated": datetime.fromtimestamp(status_info["last_reported"]),
                        "is_installed": status_info.get("is_installed", True),
                        "is_renting": status_info.get("is_renting", True)
                    }
                }
                
                await self.db.stations.update_one(
                    {"station_id": station_id},
                    {"$set": station_doc},
                    upsert=True
                )
                updated_count += 1
                
                alerts = await self.check_station_alerts(station_doc)
                new_alerts.extend(alerts)
            
            logger.info(f"Updated {updated_count} stations")
            
            if new_alerts:
                await self.db.alerts.insert_many(new_alerts)
                logger.info(f"🚨 Created {len(new_alerts)} new alerts")
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating stations: {e}")
            return False

    async def check_station_alerts(self, station_doc: Dict) -> List[Dict]:
        """Check station for alert conditions"""
        alerts = []
        status = station_doc["current_status"]
        base_alert = {
            "tenant_id": station_doc["tenant_id"],
            "station_id": station_doc["station_id"],
            "station_name": station_doc["name"],
            "timestamp": datetime.utcnow(),
            "resolved": False
        }
        
        if status["bikes_available"] <= 3:
            alerts.append({
                **base_alert,
                "type": "low_bikes",
                "severity": "warning" if status["bikes_available"] > 0 else "critical"
            })
        
        if status["docks_available"] <= 3:
            alerts.append({
                **base_alert,
                "type": "full_station",
                "severity": "warning" if status["docks_available"] > 0 else "critical"
            })
        
        if not status["is_installed"] or not status["is_renting"]:
            alerts.append({
                **base_alert,
                "type": "offline",
                "severity": "critical"
            })
        
        return alerts

    async def start_background_updates(self):
        """Start background task for regular updates"""
        self._running = True
        logger.info("Starting background GBFS updates (every 60 seconds)")
        
        while self._running:
            try:
                await self.update_stations_data()
                await asyncio.sleep(60)  # Wait 60 seconds
            except asyncio.CancelledError:
                logger.info("Background updates cancelled")
                break
            except Exception as e:
                logger.error(f"Background update error: {e}")
                await asyncio.sleep(60)

    def stop_background_updates(self):
        """Stop background updates"""
        self._running = False
        logger.info("Stopping background updates")

gbfs_service = GBFSService()