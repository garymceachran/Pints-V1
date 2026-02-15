import { Beer, Clock, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrawlSession } from "@/types/venue";

interface CrawlSummaryProps {
  crawl: CrawlSession;
  onClose: () => void;
}

export function CrawlSummary({ crawl, onClose }: CrawlSummaryProps) {
  const startTime = new Date(crawl.startedAt).getTime();
  const endTime = crawl.endedAt ? new Date(crawl.endedAt).getTime() : Date.now();
  const durationMs = endTime - startTime;

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  };

  const getCheekyComment = () => {
    const pints = crawl.totalPints;
    const venues = crawl.venuesVisited.length;

    if (pints === 0) {
      return "Did you even go out?";
    }
    if (pints <= 2) {
      return "Responsible. Boring, but responsible.";
    }
    if (pints <= 4) {
      return "Solid effort. Liver intact.";
    }
    if (pints <= 6) {
      return "Now we're talking.";
    }
    if (pints <= 10) {
      return "Outstanding commitment.";
    }
    if (venues >= 4) {
      return "A true crawl. Memory reliability questionable.";
    }
    return "Legend status achieved. Tomorrow will hurt.";
  };

  const getPintsPerVenue = () => {
    if (crawl.venuesVisited.length === 0) return 0;
    return (crawl.totalPints / crawl.venuesVisited.length).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gold/10 border-b border-gold/20 px-6 py-4 text-center">
          <Trophy className="w-10 h-10 text-gold mx-auto mb-2" />
          <h2 className="font-display text-2xl text-gold">Crawl Complete</h2>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          {/* Main stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Beer className="w-6 h-6 text-gold mx-auto mb-1" />
              <p className="font-display text-3xl text-gold">{crawl.totalPints}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pints</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <MapPin className="w-6 h-6 text-gold mx-auto mb-1" />
              <p className="font-display text-3xl text-foreground">{crawl.venuesVisited.length}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Venues</p>
            </div>
          </div>

          {/* Duration */}
          <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <span className="font-display text-lg text-foreground">
              {formatDuration(durationMs)}
            </span>
          </div>

          {/* Pints per venue */}
          {crawl.venuesVisited.length > 0 && (
            <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. pints/venue</span>
              <span className="font-display text-lg text-foreground">
                {getPintsPerVenue()}
              </span>
            </div>
          )}

          {/* Cheeky comment */}
          <p className="text-center text-muted-foreground italic pt-2">
            {getCheekyComment()}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-gold hover:bg-gold-light text-charcoal font-bold uppercase tracking-wide"
          >
            Nice one
          </Button>
        </div>
      </div>
    </div>
  );
}
