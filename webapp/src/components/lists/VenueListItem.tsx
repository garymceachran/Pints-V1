import { MapPin, Star, Beer, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenueStore } from "@/store/useVenueStore";
import { formatDistance, getGoogleMapsUrl } from "@/lib/overpass";
import type { Venue } from "@/types/venue";
import { cn } from "@/lib/utils";

interface VenueListItemProps {
  venue: Venue;
  showRating?: boolean;
}

export function VenueListItem({ venue, showRating = false }: VenueListItemProps) {
  const { storedData, setSelectedVenueId } = useVenueStore();
  const visitedData = storedData.visitedVenues[venue.id];

  const handleViewOnMap = () => {
    setSelectedVenueId(venue.id);
    // Navigate to map - this will be handled by parent
  };

  const handleOpenMaps = () => {
    window.open(getGoogleMapsUrl(venue.lat, venue.lng), "_blank");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg text-foreground truncate">
            {venue.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                venue.type === "pub"
                  ? "bg-gold/20 text-gold"
                  : "bg-oxblood/20 text-oxblood-light"
              )}
            >
              {venue.type === "pub" ? "Pub" : "Bar"}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {formatDistance(venue.distance)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenMaps}
          className="text-muted-foreground hover:text-gold"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {venue.address && (
        <p className="text-sm text-muted-foreground truncate">{venue.address}</p>
      )}

      {showRating && visitedData && (
        <div className="flex items-center gap-4 pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= visitedData.rating
                    ? "text-gold fill-gold"
                    : "text-muted"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 text-gold">
            <Beer className="w-4 h-4" />
            <span className="text-sm">{visitedData.pintCount} pints</span>
          </div>
        </div>
      )}
    </div>
  );
}
