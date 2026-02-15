import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Beer, MapPin, Clock, Calendar, Route } from "lucide-react";
import { useVenueStore } from "@/store/useVenueStore";
import { Button } from "@/components/ui/button";
import type { CrawlSession, Venue, StoredVenueData } from "@/types/venue";

export default function CrawlHistory() {
  const navigate = useNavigate();
  const { crawlData, venues, storedData } = useVenueStore();
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // Reverse geocode locations for crawls
  useEffect(() => {
    const fetchLocationNames = async () => {
      const names: Record<string, string> = {};

      for (const crawl of crawlData.completedCrawls) {
        if (crawl.locationName) {
          names[crawl.id] = crawl.locationName;
          continue;
        }

        if (crawl.startLat && crawl.startLng) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${crawl.startLat}&lon=${crawl.startLng}&format=json&zoom=10`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Unknown";
            names[crawl.id] = city;
          } catch {
            names[crawl.id] = "Unknown";
          }
        } else {
          names[crawl.id] = "Unknown";
        }
      }

      setLocationNames(names);
    };

    fetchLocationNames();
  }, [crawlData.completedCrawls]);

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const durationMs = end - start;

    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const sortedCrawls = [...crawlData.completedCrawls].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/stats")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-display text-xl text-foreground">Crawl History</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedCrawls.length > 0 ? (
          sortedCrawls.map((crawl) => (
            <CrawlCard
              key={crawl.id}
              crawl={crawl}
              locationName={locationNames[crawl.id] || "Loading..."}
              venues={venues}
              storedData={storedData}
              formatDate={formatDate}
              formatDuration={formatDuration}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Route className="w-16 h-16 text-muted mb-4" />
            <h2 className="text-xl font-display text-foreground mb-2">
              No crawls yet
            </h2>
            <p className="text-muted-foreground max-w-xs">
              Start a crawl on the Find screen and your adventures will be recorded here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CrawlCardProps {
  crawl: CrawlSession;
  locationName: string;
  venues: Venue[];
  storedData: StoredVenueData;
  formatDate: (date: string) => string;
  formatDuration: (start: string, end?: string) => string;
}

function CrawlCard({
  crawl,
  locationName,
  venues,
  storedData,
  formatDate,
  formatDuration,
}: CrawlCardProps) {
  const [expanded, setExpanded] = useState(false);

  const crawlVenues = crawl.venuesVisited
    .map((id) => {
      const venue = venues.find((v) => v.id === id);
      const visitedData = storedData.visitedVenues[id];
      return venue ? { ...venue, visitedData } : null;
    })
    .filter(Boolean);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Card Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Date and Location */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {formatDate(crawl.startedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-gold" />
              <span className="text-sm text-gold font-medium">{locationName}</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-foreground">
                <Beer className="w-4 h-4 text-gold" />
                <span className="font-display text-lg">{crawl.totalPints}</span>
                <span className="text-muted-foreground text-xs">pints</span>
              </span>
              <span className="flex items-center gap-1.5 text-foreground">
                <Route className="w-4 h-4 text-oxblood-light" />
                <span className="font-display text-lg">{crawl.venuesVisited.length}</span>
                <span className="text-muted-foreground text-xs">venues</span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm">{formatDuration(crawl.startedAt, crawl.endedAt)}</span>
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <div className="text-muted-foreground">
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${expanded ? "-rotate-90" : "rotate-180"}`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && crawlVenues.length > 0 && (
        <div className="border-t border-border px-4 pb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider py-3">
            Venues Visited
          </p>
          <div className="space-y-2">
            {crawlVenues.map((venue) => (
              <div
                key={venue!.id}
                className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{venue!.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {venue!.type === "pub" ? "Pub" : "Bar"}
                  </p>
                </div>
                {venue!.visitedData && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-gold">
                      <Beer className="w-3.5 h-3.5" />
                      {venue!.visitedData.pintCount}
                    </span>
                    <span className="text-muted-foreground">
                      {venue!.visitedData.rating}/5
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
