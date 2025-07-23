import L from "leaflet";
import type { Station } from "../types";

export const getMapCenter = (tenant: string): [number, number] => {
  switch (tenant) {
    case "manhattan":
      return [40.758, -73.9855];
    case "brooklyn":
      return [40.6782, -73.9442];
    default:
      return [40.7128, -73.936];
  }
};

export const getMarkerColor = (station: Station): string => {
  return station.status_color;
};

export const createCustomIcon = (color: string) => {
  const iconColors = {
    green: "#10b981",
    yellow: "#f59e0b",
    red: "#ef4444",
  };

  const fillColor =
    iconColors[color as keyof typeof iconColors] || iconColors.green;

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: ${fillColor};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};
