import logging
from datetime import datetime, timedelta
from typing import Dict, List
from collections import Counter

from app.database.connection import get_database
from app.models.schemas import Analytics, TopStation

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.db = get_database()

    async def get_tenant_analytics(self, tenant_id: str) -> Analytics:
        """Get analytics data for a specific tenant"""
        try:
            logger.info(f"📊 Generating analytics for tenant: {tenant_id}")
            
            # Get all trips for this tenant
            trips_cursor = self.db.trips.find({"tenant_id": tenant_id})
            trips = await trips_cursor.to_list(None)
            
            if not trips:
                logger.warning(f"No trip data found for tenant: {tenant_id}")
                return Analytics(
                    top_stations=[],
                    avg_trip_duration=0.0,
                    peak_hour=0,
                    total_trips=0
                )
            
            # Calculate top stations by trip count
            top_stations = await self._calculate_top_stations(trips, tenant_id)
            
            # Calculate average trip duration (in minutes)
            avg_duration = self._calculate_avg_duration(trips)
            
            # Calculate peak hour
            peak_hour = self._calculate_peak_hour(trips)
            
            return Analytics(
                top_stations=top_stations,
                avg_trip_duration=avg_duration,
                peak_hour=peak_hour,
                total_trips=len(trips)
            )
            
        except Exception as e:
            logger.error(f"Error generating analytics for {tenant_id}: {e}")
            return Analytics(
                top_stations=[],
                avg_trip_duration=0.0,
                peak_hour=0,
                total_trips=0
            )

    async def _calculate_top_stations(self, trips: List[Dict], tenant_id: str) -> List[TopStation]:
        """Calculate top 5 stations by trip starts"""
        try:
            # Count trips by start station
            station_counts = Counter()
            for trip in trips:
                if "start_station_id" in trip and trip["start_station_id"]:
                    station_counts[trip["start_station_id"]] += 1
            
            # Get top 5 stations
            top_station_ids = station_counts.most_common(5)
            top_stations = []
            
            for station_id, count in top_station_ids:
                # Get station name from stations collection
                station_doc = await self.db.stations.find_one({
                    "station_id": station_id,
                    "tenant_id": tenant_id
                })
                
                station_name = station_doc["name"] if station_doc else f"Station {station_id}"
                
                top_stations.append(TopStation(
                    station_id=station_id,
                    name=station_name,
                    trip_count=count
                ))
            
            return top_stations
            
        except Exception as e:
            logger.error(f"Error calculating top stations: {e}")
            return []

    def _calculate_avg_duration(self, trips: List[Dict]) -> float:
        """Calculate average trip duration in minutes"""
        try:
            durations = []
            for trip in trips:
                if "duration_seconds" in trip and trip["duration_seconds"]:
                    # Convert to minutes and filter out unrealistic values
                    duration_minutes = trip["duration_seconds"] / 60
                    if 1 <= duration_minutes <= 1440:  # 1 minute to 24 hours
                        durations.append(duration_minutes)
            
            if durations:
                return round(sum(durations) / len(durations), 2)
            return 0.0
            
        except Exception as e:
            logger.error(f"Error calculating average duration: {e}")
            return 0.0

    def _calculate_peak_hour(self, trips: List[Dict]) -> int:
        """Calculate peak usage hour (0-23)"""
        try:
            hours = []
            for trip in trips:
                if "started_at" in trip and trip["started_at"]:
                    if isinstance(trip["started_at"], datetime):
                        hours.append(trip["started_at"].hour)
            
            if hours:
                hour_counts = Counter(hours)
                return hour_counts.most_common(1)[0][0]
            return 0
            
        except Exception as e:
            logger.error(f"Error calculating peak hour: {e}")
            return 0

# Service instance
analytics_service = AnalyticsService()