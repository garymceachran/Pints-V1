import { useEffect, useState, useRef } from "react";
import { PintsMap } from "@/components/map/PintsMap";
import { MapErrorBoundary } from "@/components/map/MapErrorBoundary";
import { VenueBottomSheet } from "@/components/venue/VenueBottomSheet";
import { Header } from "@/components/layout/Header";
import { CrawlIndicator } from "@/components/crawl/CrawlIndicator";
import { CrawlSummary } from "@/components/crawl/CrawlSummary";
import { useVenueStore } from "@/store/useVenueStore";
import { fetchNearbyVenues } from "@/lib/overpass";
import { Button } from "@/components/ui/button";
import { Crosshair, RefreshCw, Beer, Loader2, Play } from "lucide-react";
import type { CrawlSession } from "@/types/venue";

// Manchester fallback coordinates
const MANCHESTER_LAT = 53.4808;
const MANCHESTER_LNG = -2.2426;
const GEOLOCATION_TIMEOUT = 2000;

// Set to true to show debug counters
const DEBUG_MODE = false;

export default function Index() {
  const {
    userLocation,
    setUserLocation,
    setVenues,
    settings,
    isLoadingVenues,
    setIsLoadingVenues,
    selectNextUnjudgedVenue,
    getTotalUnjudgedCount,
    isCrawlActive,
    startCrawl,
    endCrawl,
    venues,
    getDisplayVenues,
  } = useVenueStore();

  const [locationStatus, setLocationStatus] = useState<string>("Initializing...");
  const [usingFallback, setUsingFallback] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [completedCrawl, setCompletedCrawl] = useState<CrawlSession | null>(null);
  const [overpassCount, setOverpassCount] = useState(0);
  const locationAttempted = useRef(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const nearbyCount = getTotalUnjudgedCount();
  const crawlActive = isCrawlActive();
  const displayVenues = getDisplayVenues();

  // Wait for container to have dimensions
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current) {
      setMapReady(false);
      return;
    }
    const el = mapContainerRef.current;
    const checkReady = () => {
      const rect = el.getBoundingClientRect();
      if (rect.height > 50 && rect.width > 50) {
        setMapReady(true);
        return true;
      }
      return false;
    };
    if (checkReady()) return;
    const ro = new ResizeObserver(() => {
      if (checkReady()) ro.disconnect();
    });
    ro.observe(el);
    const fallback = setTimeout(() => setMapReady(true), 500);
    return () => {
      ro.disconnect();
      clearTimeout(fallback);
    };
  }, [userLocation?.lat, userLocation?.lng]);

  // Get user location on mount
  useEffect(() => {
    if (locationAttempted.current) return;
    locationAttempted.current = true;

    setLocationStatus("Requesting location...");

    const fallbackTimeout = setTimeout(() => {
      if (!userLocation) {
        setLocationStatus("Using default location (Manchester)");
        setUsingFallback(true);
        setUserLocation({ lat: MANCHESTER_LAT, lng: MANCHESTER_LNG });
        setIsLoadingLocation(false);
      }
    }, GEOLOCATION_TIMEOUT);

    if (!navigator.geolocation) {
      clearTimeout(fallbackTimeout);
      setLocationStatus("Using default location (Manchester)");
      setUsingFallback(true);
      setUserLocation({ lat: MANCHESTER_LAT, lng: MANCHESTER_LNG });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(fallbackTimeout);
        setLocationStatus("Location found");
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      () => {
        clearTimeout(fallbackTimeout);
        setLocationStatus("Using default location (Manchester)");
        setUsingFallback(true);
        setUserLocation({ lat: MANCHESTER_LAT, lng: MANCHESTER_LNG });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: false,
        timeout: GEOLOCATION_TIMEOUT,
        maximumAge: 60000,
      }
    );

    return () => clearTimeout(fallbackTimeout);
  }, []);

  // Fetch venues when location changes
  useEffect(() => {
    if (userLocation && !isLoadingVenues) {
      loadVenues();
    }
  }, [userLocation?.lat, userLocation?.lng, settings.radius, settings.showPubs, settings.showBars]);

  const loadVenues = async () => {
    if (!userLocation) return;

    setIsLoadingVenues(true);

    try {
      const nearbyVenues = await fetchNearbyVenues(
        userLocation,
        settings.radius,
        settings.showPubs,
        settings.showBars
      );
      setVenues(nearbyVenues);
      setOverpassCount(nearbyVenues.length);

      if (DEBUG_MODE) {
        console.log("[PINTS DEBUG] Overpass returned:", nearbyVenues.length);
      }

      setTimeout(() => {
        selectNextUnjudgedVenue();
      }, 100);
    } catch (error) {
      console.error("[PINTS] Failed to fetch venues:", error);
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 0.5,
      });
    }
  };

  const handleRefresh = () => {
    loadVenues();
  };

  const handleStartCrawl = () => {
    startCrawl();
  };

  const handleEndCrawl = () => {
    const session = endCrawl();
    if (session) {
      setCompletedCrawl(session);
    }
  };

  const handleCloseSummary = () => {
    setCompletedCrawl(null);
  };

  // Header height constant (reduced for more map space)
  const HEADER_HEIGHT = 36;

  return (
    <div className="h-full w-full relative bg-background">
      {/* Header */}
      <Header />

      {/* Crawl indicator or Start Crawl button */}
      {!isLoadingLocation && !isLoadingVenues && (
        <div className="fixed left-4 z-[500]" style={{ top: HEADER_HEIGHT + 12 }}>
          {crawlActive ? (
            <CrawlIndicator onEndCrawl={handleEndCrawl} />
          ) : (
            <div className="flex items-center gap-2">
              {/* Nearby count pill */}
              <div className="bg-card/95 backdrop-blur border border-border rounded-full px-3 py-1.5 flex items-center gap-2">
                <Beer className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-foreground">
                  {venues.length} venues
                </span>
              </div>
              {/* Start Crawl button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartCrawl}
                className="h-8 px-3 bg-card/95 backdrop-blur border-gold/50 text-gold hover:bg-gold/10 hover:text-gold"
              >
                <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                Start Crawl
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Debug counters - venuesReturnedCount and markersRenderedCount MUST match */}
      {DEBUG_MODE && !isLoadingLocation && !isLoadingVenues && (
        <div className="fixed left-4 z-[500] text-xs text-muted-foreground bg-card/80 rounded px-2 py-1" style={{ top: HEADER_HEIGHT + 52 }}>
          <div>venuesReturnedCount: {overpassCount}</div>
          <div>markersRenderedCount: {displayVenues.length}</div>
          <div className={overpassCount === displayVenues.length ? "text-green-500" : "text-red-500"}>
            {overpassCount === displayVenues.length ? "MATCH" : "MISMATCH"}
          </div>
          <div className="text-muted-foreground/50 mt-1">Unjudged: {nearbyCount}</div>
        </div>
      )}

      {/* Floating controls */}
      <div className="fixed right-4 z-[500] flex flex-col gap-2" style={{ top: HEADER_HEIGHT + 12 }}>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRecenter}
          className="w-10 h-10 rounded-full bg-card/95 backdrop-blur border-border hover:bg-card"
          title="Re-centre to my location"
        >
          <Crosshair className="w-5 h-5 text-foreground" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoadingVenues}
          className="w-10 h-10 rounded-full bg-card/95 backdrop-blur border-border hover:bg-card"
          title="Refresh venues"
        >
          <RefreshCw className={`w-5 h-5 text-foreground ${isLoadingVenues ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Map container - full screen behind header */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ backgroundColor: "hsl(30 10% 6%)" }}
      >
        {/* Loading location overlay */}
        {isLoadingLocation && (
          <div className="absolute inset-0 z-[400] bg-background/90 flex flex-col items-center justify-center">
            <Beer className="w-16 h-16 text-gold mb-4" />
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
            <p className="text-foreground font-medium">{locationStatus}</p>
          </div>
        )}

        {/* Map */}
        {userLocation && mapReady && (
          <MapErrorBoundary>
            <PintsMap mapRef={mapRef} />
          </MapErrorBoundary>
        )}
      </div>

      {/* Venue Bottom Sheet */}
      {!isLoadingLocation && userLocation && <VenueBottomSheet />}

      {/* Crawl Summary Modal */}
      {completedCrawl && (
        <CrawlSummary crawl={completedCrawl} onClose={handleCloseSummary} />
      )}
    </div>
  );
}
