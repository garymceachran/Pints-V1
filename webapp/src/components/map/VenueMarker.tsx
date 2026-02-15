import { Marker } from "react-leaflet";
import L from "leaflet";
import { useVenueStore } from "@/store/useVenueStore";
import type { Venue, VenueState } from "@/types/venue";

interface VenueMarkerProps {
  venue: Venue;
}

function createMarkerIcon(venue: Venue, state: VenueState, isSelected: boolean): L.DivIcon {
  const stateClass = state;
  const selectedClass = isSelected ? "selected" : "";
  const letter = venue.type === "pub" ? "P" : "B";

  // Text color - always bone/off-white since all markers now have charcoal fill
  const textColor = "hsl(40, 20%, 92%)";

  return L.divIcon({
    className: `venue-marker ${stateClass} ${selectedClass}`,
    html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;">
      <span style="font-family:'Bebas Neue',sans-serif;font-size:14px;font-weight:bold;color:${textColor};line-height:32px;text-align:center;width:100%;height:100%;">${letter}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function VenueMarker({ venue }: VenueMarkerProps) {
  const { selectedVenueId, setSelectedVenueId, getVenueState } = useVenueStore();

  const state = getVenueState(venue.id);
  const isSelected = selectedVenueId === venue.id;
  const icon = createMarkerIcon(venue, state, isSelected);

  const handleClick = () => {
    setSelectedVenueId(venue.id);
  };

  return (
    <Marker
      position={[venue.lat, venue.lng]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
      }}
    />
  );
}
