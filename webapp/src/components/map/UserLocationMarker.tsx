import { Marker, Circle } from "react-leaflet";
import L from "leaflet";
import type { UserLocation } from "@/types/venue";

interface UserLocationMarkerProps {
  location: UserLocation;
  radius: number;
}

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: hsl(43 70% 50%);
    border: 3px solid hsl(40 20% 92%);
    border-radius: 50%;
    box-shadow: 0 0 10px hsl(43 70% 50% / 0.6), 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function UserLocationMarker({
  location,
  radius,
}: UserLocationMarkerProps) {
  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={radius}
        pathOptions={{
          color: "hsl(43 70% 50%)",
          fillColor: "hsl(43 70% 50%)",
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.4,
        }}
      />
      <Marker position={[location.lat, location.lng]} icon={userIcon} />
    </>
  );
}
