import { useState } from "react";
import {
  Beer,
  Star,
  MapPin,
  Navigation,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Undo2,
  Check,
  Edit2,
  ArrowRight,
} from "lucide-react";
import { useVenueStore } from "@/store/useVenueStore";
import {
  formatDistance,
  getGoogleMapsPreviewUrl,
  getGoogleMapsDirectionsUrl,
} from "@/lib/overpass";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import type { Venue, VenueState } from "@/types/venue";

type ListTab = "saved" | "skipped" | "visited";

interface DeletedRecord {
  venueId: string;
  state: VenueState;
  visitedData?: { rating: number; pintCount: number; visitedAt: string };
}

export default function Lists() {
  const [activeTab, setActiveTab] = useState<ListTab>("saved");
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(3);
  const [editPintCount, setEditPintCount] = useState(2);
  const { toast } = useToast();

  const {
    venues,
    storedData,
    setSelectedVenueId,
    saveVenue,
    skipVenue,
    unskipVenue,
    markVisited,
    updateVisited,
    unvisit,
    deleteVenueRecord,
    restoreVenueRecord,
  } = useVenueStore();
  const navigate = useNavigate();

  const savedVenues = venues.filter((v) =>
    storedData.savedVenues.includes(v.id)
  );
  const skippedVenues = venues.filter((v) =>
    storedData.skippedVenues.includes(v.id)
  );
  const visitedVenues = venues.filter((v) =>
    Object.keys(storedData.visitedVenues).includes(v.id)
  );

  const tabs: { key: ListTab; label: string; count: number }[] = [
    { key: "saved", label: "Saved", count: savedVenues.length },
    { key: "skipped", label: "Skipped", count: skippedVenues.length },
    { key: "visited", label: "Visited", count: visitedVenues.length },
  ];

  const currentVenues =
    activeTab === "saved"
      ? savedVenues
      : activeTab === "skipped"
      ? skippedVenues
      : visitedVenues;

  const handleOpenOnMap = (venueId: string) => {
    setSelectedVenueId(venueId);
    navigate("/");
  };

  const handleDelete = (venue: Venue, currentState: VenueState) => {
    const visitedData = storedData.visitedVenues[venue.id];
    const deletedRecord: DeletedRecord = {
      venueId: venue.id,
      state: currentState,
      visitedData: visitedData ? { ...visitedData } : undefined,
    };

    deleteVenueRecord(venue.id);

    toast({
      title: "Deleted",
      description: `${venue.name} removed`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            restoreVenueRecord(
              deletedRecord.venueId,
              deletedRecord.state,
              deletedRecord.visitedData
            );
          }}
        >
          <Undo2 className="w-3 h-3 mr-1" />
          Undo
        </Button>
      ),
      duration: 5000,
    });
  };

  const handleStartEdit = (venue: Venue) => {
    const visitedData = storedData.visitedVenues[venue.id];
    if (visitedData) {
      setEditRating(visitedData.rating);
      setEditPintCount(visitedData.pintCount);
    }
    setEditingVenueId(venue.id);
  };

  const handleSaveEdit = () => {
    if (editingVenueId) {
      updateVisited(editingVenueId, editRating, editPintCount);
      setEditingVenueId(null);
    }
  };

  const handleMoveToSkipped = (venue: Venue) => {
    skipVenue(venue.id);
  };

  const handleRestoreToSaved = (venue: Venue) => {
    unskipVenue(venue.id);
    saveVenue(venue.id);
  };

  const handleUnvisit = (venue: Venue) => {
    unvisit(venue.id);
  };

  const handleMarkVisited = (venue: Venue) => {
    setEditRating(3);
    setEditPintCount(2);
    setEditingVenueId(venue.id);
  };

  const handleSaveNewVisit = (venueId: string) => {
    markVisited(venueId, editRating, editPintCount);
    setEditingVenueId(null);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Segmented Control */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex bg-card rounded-lg p-1 border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-gold text-charcoal"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "ml-1.5 text-xs",
                    activeTab === tab.key ? "text-charcoal/70" : "text-muted-foreground"
                  )}
                >
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {currentVenues.length > 0 ? (
          currentVenues.map((venue) => {
            const visitedData = storedData.visitedVenues[venue.id];
            const isEditing = editingVenueId === venue.id;
            const isNewVisit = activeTab === "saved" && isEditing;

            return (
              <div
                key={venue.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-foreground truncate">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded",
                          venue.type === "pub"
                            ? "bg-gold/20 text-gold"
                            : "bg-oxblood/20 text-oxblood-light"
                        )}
                      >
                        {venue.type === "pub" ? "PUB" : "BAR"}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {formatDistance(venue.distance)}
                      </span>
                    </div>
                    {venue.address && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {venue.address}
                      </p>
                    )}

                    {/* Visited stats (non-editing) */}
                    {activeTab === "visited" && visitedData && !isEditing && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
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
                          <span className="text-sm font-medium">
                            {visitedData.pintCount} pints
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Edit form (for visited or new visit) */}
                    {isEditing && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        {/* Rating */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Rating</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditRating(star)}
                                className="p-0.5"
                              >
                                <Star
                                  className={cn(
                                    "w-6 h-6 transition-colors",
                                    star <= editRating
                                      ? "text-gold fill-gold"
                                      : "text-muted hover:text-gold/50"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Pint count */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pints</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditPintCount(Math.max(1, editPintCount - 1))}
                              className="w-8 h-8 rounded-full"
                            >
                              -
                            </Button>
                            <div className="flex items-center gap-1 min-w-[60px] justify-center">
                              <Beer className="w-4 h-4 text-gold" />
                              <span className="font-display text-xl text-foreground">
                                {editPintCount}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setEditPintCount(editPintCount + 1)}
                              className="w-8 h-8 rounded-full"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* Edit actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVenueId(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => isNewVisit ? handleSaveNewVisit(venue.id) : handleSaveEdit()}
                            className="flex-1 bg-gold hover:bg-gold-light text-charcoal"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {isNewVisit ? "Mark Visited" : "Save"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleOpenOnMap(venue.id)}>
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Map
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(getGoogleMapsDirectionsUrl(venue), "_blank")}
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Directions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(getGoogleMapsPreviewUrl(venue), "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Saved actions */}
                        {activeTab === "saved" && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkVisited(venue)}>
                              <Star className="w-4 h-4 mr-2" />
                              Mark Visited
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMoveToSkipped(venue)}>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Move to Skipped
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Skipped actions */}
                        {activeTab === "skipped" && (
                          <DropdownMenuItem onClick={() => handleRestoreToSaved(venue)}>
                            <Undo2 className="w-4 h-4 mr-2" />
                            Restore to Saved
                          </DropdownMenuItem>
                        )}

                        {/* Visited actions */}
                        {activeTab === "visited" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStartEdit(venue)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Visit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUnvisit(venue)}>
                              <Undo2 className="w-4 h-4 mr-2" />
                              Unvisit (Move to Saved)
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => handleDelete(venue, activeTab)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Beer className="w-16 h-16 text-muted mb-4" />
            <h2 className="text-xl font-display text-foreground mb-2">
              {activeTab === "saved" && "No saved pubs yet"}
              {activeTab === "skipped" && "No skipped pubs"}
              {activeTab === "visited" && "No visits logged yet"}
            </h2>
            <p className="text-muted-foreground max-w-xs">
              {activeTab === "saved" &&
                "Tap 'Yes please' on pubs you fancy and they'll appear here"}
              {activeTab === "skipped" &&
                "Pubs you pass on will show up here"}
              {activeTab === "visited" &&
                "Save a pub, visit it, then mark it as visited to track your adventures"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
