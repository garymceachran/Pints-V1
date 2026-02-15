import { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Share2,
  Beer,
  Star,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenueStore } from "@/store/useVenueStore";
import {
  formatDistance,
  getGoogleMapsPreviewUrl,
  getGoogleMapsDirectionsUrl,
} from "@/lib/overpass";
import { cn } from "@/lib/utils";

export function VenueBottomSheet() {
  const {
    selectedVenueId,
    venues,
    userLocation,
    saveVenue,
    skipVenue,
    unsaveVenue,
    markVisited,
    getVenueState,
    storedData,
    getCurrentVenueIndex,
    getTotalUnjudgedCount,
    selectPreviousVenue,
    selectNextVenueInList,
  } = useVenueStore();

  const [isShaking, setIsShaking] = useState(false);
  const [showVisitedForm, setShowVisitedForm] = useState(false);
  const [rating, setRating] = useState(3);
  const [pintCount, setPintCount] = useState(2);

  const venue = venues.find((v) => v.id === selectedVenueId);
  const venueState = venue ? getVenueState(venue.id) : "default";
  const visitedData = venue ? storedData.visitedVenues[venue.id] : null;

  const currentIndex = getCurrentVenueIndex();
  const totalCount = getTotalUnjudgedCount();

  const handleSave = () => {
    if (venue) {
      saveVenue(venue.id);
    }
  };

  const handleUndo = () => {
    if (venue) {
      unsaveVenue(venue.id);
    }
  };

  const handleSkip = () => {
    if (venue) {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        skipVenue(venue.id);
      }, 400);
    }
  };

  const handlePreview = () => {
    if (venue) {
      window.open(getGoogleMapsPreviewUrl(venue), "_blank");
    }
  };

  const handleDirections = () => {
    if (venue) {
      window.open(getGoogleMapsDirectionsUrl(venue), "_blank");
    }
  };

  const handleShare = async () => {
    if (venue) {
      const shareData = {
        title: venue.name,
        text: `Check out ${venue.name}`,
        url: getGoogleMapsPreviewUrl(venue),
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // User cancelled
        }
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
    }
  };

  const handleMarkVisited = () => {
    setShowVisitedForm(true);
    setRating(3);
    setPintCount(2);
  };

  const handleSubmitVisited = () => {
    if (venue) {
      markVisited(venue.id, rating, pintCount);
      setShowVisitedForm(false);
    }
  };

  const handleCancelVisited = () => {
    setShowVisitedForm(false);
  };

  if (!venue) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-[900] bg-card border-t border-border p-5">
        <div className="flex flex-col items-center justify-center text-center">
          <Beer className="w-10 h-10 text-gold mb-2" />
          <p className="text-foreground font-medium">No more pubs nearby</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try expanding your search radius
          </p>
        </div>
      </div>
    );
  }

  // Inline visited form
  if (showVisitedForm) {
    return (
      <div className="fixed bottom-16 left-0 right-0 z-[900] bg-card border-t border-border">
        <div className="px-4 py-4">
          <h3 className="font-display text-xl text-foreground mb-4">
            How was {venue.name}?
          </h3>

          {/* Rating */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= rating
                        ? "text-gold fill-gold"
                        : "text-muted hover:text-gold/50"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Pint count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">How many pints?</p>
            <p className="text-xs text-muted-foreground/70 mb-2">Approximate is fine.</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPintCount(Math.max(1, pintCount - 1))}
                className="w-10 h-10 rounded-full"
              >
                -
              </Button>
              <div className="flex items-center gap-2 min-w-[80px] justify-center">
                <Beer className="w-5 h-5 text-gold" />
                <span className="font-display text-2xl text-foreground">
                  {pintCount}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPintCount(pintCount + 1)}
                className="w-10 h-10 rounded-full"
              >
                +
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancelVisited}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitVisited}
              className="flex-1 h-12 bg-visited hover:bg-visited/90 text-foreground font-bold"
            >
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-16 left-0 right-0 z-[900] bg-card border-t border-border",
        isShaking && "animate-shake"
      )}
    >
      {/* Pager row - only show for default state */}
      {venueState === "default" && totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={selectPreviousVenue}
            disabled={totalCount <= 1}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {currentIndex >= 0 ? currentIndex + 1 : 1} of {totalCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={selectNextVenueInList}
            disabled={totalCount <= 1}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="px-4 py-3">
        {/* Venue name and type */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl text-foreground truncate">
              {venue.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  venue.type === "pub"
                    ? "bg-gold/20 text-gold"
                    : "bg-oxblood/20 text-oxblood-light"
                )}
              >
                {venue.type === "pub" ? "PUB" : "BAR"}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(venue.distance)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="w-8 h-8 rounded-full text-muted-foreground hover:text-gold"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Address */}
        {venue.address && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {venue.address}
          </p>
        )}

        {/* Visited info */}
        {visitedData && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-3.5 h-3.5",
                    star <= visitedData.rating
                      ? "text-gold fill-gold"
                      : "text-muted"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 text-gold text-sm">
              <Beer className="w-3.5 h-3.5" />
              <span>{visitedData.pintCount} pints</span>
            </div>
          </div>
        )}

        {/* DEFAULT STATE - Decision buttons */}
        {venueState === "default" && (
          <>
            {/* Quick action row */}
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-muted"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDirections}
                disabled={!userLocation}
                className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-muted"
              >
                <Navigation className="w-3.5 h-3.5 mr-1" />
                Directions
              </Button>
            </div>

            {/* Primary decision buttons */}
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleSkip}
                className="flex-1 h-12 text-xs font-bold bg-oxblood hover:bg-oxblood-dark text-foreground border-0 uppercase tracking-wide"
              >
                That place looks shit
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 h-12 text-xs font-bold bg-gold hover:bg-gold-light text-charcoal border-0 uppercase tracking-wide"
              >
                Yes please
              </Button>
            </div>
          </>
        )}

        {/* SAVED STATE - Post-YES actions */}
        {venueState === "saved" && (
          <>
            {/* Primary action - Directions */}
            <Button
              onClick={handleDirections}
              disabled={!userLocation}
              className="w-full h-12 mt-3 text-sm font-bold bg-gold hover:bg-gold-light text-charcoal uppercase tracking-wide"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </Button>

            {/* Secondary actions */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkVisited}
                className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-visited/20 hover:border-visited/50"
              >
                <Star className="w-3.5 h-3.5 mr-1" />
                Mark Visited
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-muted"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="h-9 text-xs bg-secondary border-border hover:bg-muted px-3"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* VISITED STATE */}
        {venueState === "visited" && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDirections}
              disabled={!userLocation}
              className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-muted"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" />
              Directions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="flex-1 h-9 text-xs bg-secondary border-border hover:bg-muted"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-9 text-xs bg-secondary border-border hover:bg-muted px-3"
            >
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
