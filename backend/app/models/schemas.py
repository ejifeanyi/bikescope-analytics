from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from typing import List, Literal, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic v2"""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, 
        source_type: Any, 
        handler: GetJsonSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.no_info_plain_validator_function(cls.validate),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(
        cls, 
        core_schema: core_schema.CoreSchema, 
        handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class StationStatus(BaseModel):
    bikes_available: int = Field(ge=0)
    docks_available: int = Field(ge=0)
    last_updated: datetime
    is_installed: bool = True
    is_renting: bool = True

class Station(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    station_id: str
    tenant_id: Literal["manhattan", "brooklyn"]
    name: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    capacity: int = Field(gt=0)
    current_status: StationStatus

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class Alert(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    tenant_id: Literal["manhattan", "brooklyn"]
    station_id: str
    station_name: str
    type: Literal["low_bikes", "full_station", "offline"]
    severity: Literal["info", "warning", "critical"]
    timestamp: datetime
    resolved: bool = False

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

class TopStation(BaseModel):
    station_id: str
    name: str
    trip_count: int

class Analytics(BaseModel):
    top_stations: List[TopStation]
    avg_trip_duration: float  # in minutes
    peak_hour: int
    total_trips: int

class StationResponse(BaseModel):
    """Response model for station data"""
    station_id: str
    name: str
    lat: float
    lon: float
    capacity: int
    bikes_available: int
    docks_available: int
    last_updated: datetime
    status_color: Literal["green", "yellow", "red"]

class AlertResponse(BaseModel):
    """Response model for alerts"""
    station_id: str
    station_name: str
    type: str
    severity: str
    timestamp: datetime