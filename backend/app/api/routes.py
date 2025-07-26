from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta

from app.database.connection import get_database
from app.models.schemas import StationResponse, Alert, Analytics
from app.services.gbfs_service import gbfs_service
from app.services.analytics_service import analytics_service

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}

@router.get("/stations/{tenant_id}", response_model=List[StationResponse])
async def get_tenant_stations(tenant_id: str):
    """Get all stations for a tenant"""
    if tenant_id not in ["manhattan", "brooklyn"]:
        raise HTTPException(status_code=400, detail="Invalid tenant_id")
    
    try:
        db = get_database()
        stations_cursor = db.stations.find({"tenant_id": tenant_id})
        stations = await stations_cursor.to_list(None)
        
        response_stations = []
        for station in stations:
            status = station["current_status"]
            
            bikes_available = status["bikes_available"]
            docks_available = status["docks_available"]
            
            if bikes_available <= 3 or docks_available <= 3:
                status_color = "red" if bikes_available == 0 or docks_available == 0 else "yellow"
            else:
                status_color = "green"
            
            response_stations.append(StationResponse(
                station_id=station["station_id"],
                name=station["name"],
                lat=station["lat"],
                lon=station["lon"],
                capacity=station["capacity"],
                bikes_available=bikes_available,
                docks_available=docks_available,
                last_updated=status["last_updated"],
                status_color=status_color
            ))
        
        return response_stations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stations: {str(e)}")

@router.get("/alerts/{tenant_id}", response_model=List[Alert])
async def get_tenant_alerts(
    tenant_id: str, 
    limit: Optional[int] = Query(50, ge=1, le=100)
):
    """Get recent alerts for a tenant"""
    if tenant_id not in ["manhattan", "brooklyn"]:
        raise HTTPException(status_code=400, detail="Invalid tenant_id")
    
    try:
        db = get_database()
        
        alerts_cursor = db.alerts.find(
            {"tenant_id": tenant_id, "resolved": False}
        ).sort("timestamp", -1).limit(limit)
        
        alerts = await alerts_cursor.to_list(None)
        
        return [Alert(**alert) for alert in alerts]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

@router.get("/analytics/{tenant_id}", response_model=Analytics)
async def get_tenant_analytics(tenant_id: str):
    """Get analytics for a tenant"""
    if tenant_id not in ["manhattan", "brooklyn"]:
        raise HTTPException(status_code=400, detail="Invalid tenant_id")
    
    try:
        analytics = await analytics_service.get_tenant_analytics(tenant_id)
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")

@router.post("/stations/refresh")
async def refresh_stations():
    """Manually trigger station data refresh"""
    try:
        success = await gbfs_service.update_stations_data()
        if success:
            return {"message": "Stations updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update stations")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing stations: {str(e)}")