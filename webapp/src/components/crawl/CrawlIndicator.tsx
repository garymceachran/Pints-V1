import { useState, useEffect } from "react";
import { Beer, Clock, Square } from "lucide-react";
import { useVenueStore } from "@/store/useVenueStore";
import { Button } from "@/components/ui/button";

interface CrawlIndicatorProps {
  onEndCrawl: () => void;
}

export function CrawlIndicator({ onEndCrawl }: CrawlIndicatorProps) {
  const { getActiveCrawlStats, isCrawlActive } = useVenueStore();
  const [stats, setStats] = useState<{ venues: number; pints: number; duration: number } | null>(null);

  useEffect(() => {
    if (!isCrawlActive()) return;

    const updateStats = () => {
      setStats(getActiveCrawlStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [getActiveCrawlStats, isCrawlActive]);

  if (!stats) return null;

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="bg-card/95 backdrop-blur border border-gold/30 rounded-xl px-3 py-2">
      <div className="flex items-center gap-3">
        {/* Crawl active indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
          </span>
          <span className="text-xs font-medium text-gold uppercase tracking-wider">
            Crawl
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Beer className="w-3 h-3 text-gold" />
            <span className="text-foreground font-medium">{stats.pints}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(stats.duration)}</span>
          </span>
          <span className="text-foreground font-medium">{stats.venues} venues</span>
        </div>

        {/* End button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEndCrawl}
          className="h-6 px-2 text-xs text-oxblood-light hover:text-oxblood hover:bg-oxblood/10"
        >
          <Square className="w-3 h-3 mr-1 fill-current" />
          End
        </Button>
      </div>
    </div>
  );
}
