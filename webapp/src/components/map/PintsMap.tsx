import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, MutableRefObject } from "react";
import L from "leaflet";
import { useVenueStore } from "@/store/useVenueStore";
import { VenueMarker } from "./VenueMarker";
import { UserLocationMarker } from "./UserLocationMarker";

interface MapUpdaterProps {
  mapRef?: MutableRefObject<L.Map | null>;
}

// Component to handle map center updates and fix init timing
function MapUpdater({ mapRef }: MapUpdaterProps) {
  const map = useMap();
  const { userLocation, selectedVenueId, venues } = useVenueStore();

  // Expose map reference to parent
  useEffect(() => {
    if (mapRef) {
      mapRef.current = map;
    }
    return () => {
      if (mapRef) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef]);

  // Fix blank map: force Leaflet to recalculate size after container is laid out
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    if (selectedVenueId) {
      const venue = venues.find((v) => v.id === selectedVenueId);
      if (venue) {
        map.setView([venue.lat, venue.lng], map.getZoom(), {
          animate: true,
          duration: 0.5,
        });
      }
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }
  }, [selectedVenueId, userLocation, venues, map]);

  return null;
}

interface PintsMapProps {
  mapRef?: MutableRefObject<L.Map | null>;
}

export function PintsMap({ mapRef }: PintsMapProps) {
  const { userLocation, settings, getDisplayVenues } = useVenueStore();

  const displayVenues = getDisplayVenues();

  // Manchester as default fallback
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [53.4808, -2.2426];

  return (
    <MapContainer
      center={center}
      zoom={15}
      zoomControl={false}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <UserLocationMarker location={userLocation} radius={settings.radius} />
      )}

      {displayVenues.map((venue) => (
        <VenueMarker key={venue.id} venue={venue} />
      ))}

      <MapUpdater mapRef={mapRef} />
    </MapContainer>
  );
}
