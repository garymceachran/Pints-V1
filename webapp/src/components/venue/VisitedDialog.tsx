import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Beer, Minus, Plus } from "lucide-react";
import { useVenueStore } from "@/store/useVenueStore";
import type { Venue } from "@/types/venue";

interface VisitedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: Venue;
}

export function VisitedDialog({
  open,
  onOpenChange,
  venue,
}: VisitedDialogProps) {
  const { markVisited } = useVenueStore();
  const [rating, setRating] = useState(3);
  const [pintCount, setPintCount] = useState(2);

  const handleSubmit = () => {
    markVisited(venue.id, rating, pintCount);
    onOpenChange(false);
    setRating(3);
    setPintCount(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">
            You visited {venue.name}!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Rate your experience and log your pints
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              How was it?
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-gold fill-gold"
                        : "text-muted hover:text-gold/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Pint count */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              How many pints?
            </label>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPintCount(Math.max(1, pintCount - 1))}
                className="h-10 w-10 bg-secondary border-border"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[80px] justify-center">
                <Beer className="w-6 h-6 text-gold" />
                <span className="text-3xl font-display text-foreground">
                  {pintCount}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPintCount(pintCount + 1)}
                className="h-10 w-10 bg-secondary border-border"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold bg-gold text-charcoal hover:bg-gold-light"
        >
          Save Visit
        </Button>
      </DialogContent>
    </Dialog>
  );
}
