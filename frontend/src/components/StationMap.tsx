import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  getMapCenter,
  getMarkerColor,
  createCustomIcon,
} from "../utils/mapUtils";
import type { StationMapProps } from "../types";
import "leaflet/dist/leaflet.css";

const StationPopup: React.FC<{ station: StationMapProps["stations"][0] }> = ({
  station,
}) => {
  const lastUpdated = new Date(station.last_updated);

  return (
    <div className="p-2 min-w-[200px]">
      <h3 className="font-semibold text-sm mb-2 text-gray-900">
        {station.name}
      </h3>

      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Available bikes:</span>
          <span className="font-medium">{station.bikes_available}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Available docks:</span>
          <span className="font-medium">{station.docks_available}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total capacity:</span>
          <span className="font-medium">{station.capacity}</span>
        </div>

        <div className="pt-1 border-t border-gray-200 mt-2">
          <span className="text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedTenant,
}) => {
  const center = getMapCenter(selectedTenant);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {stations.map((station) => (
          <Marker
            key={station.station_id}
            position={[station.lat, station.lon]}
            icon={createCustomIcon(getMarkerColor(station))}
          >
            <Popup maxWidth={250} closeButton={true}>
              <StationPopup station={station} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
