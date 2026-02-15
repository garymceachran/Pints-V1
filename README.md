# PINTS - Get Me A Pint

A map-first pub discovery and judgement app with chaotic pub energy.

## Features

- **Full-screen interactive map** using OpenStreetMap with Leaflet
- **Pub/Bar discovery** via Overpass API (1200m default radius)
- **ALL venues rendered** - marker count always matches venue count
- **Swipe-style judgement** - "Yes please" or "Nah, shit"
- **Auto-selection** of nearest unjudged venue
- **Visit tracking** with ratings (1-5 stars) and pint counts
- **Guinness-inspired dark theme** - charcoal, gold, oxblood
- **Sleek compact header** - maximises map visibility

## Marker Visibility Rules

- All venues from Overpass are rendered on the map
- Judged state (saved/visited) affects marker **styling only**, never visibility
- Only exception: skipped venues hidden when "Re-show Skipped" is OFF in settings
- No viewport filtering - Overpass radius is the only visibility rule

## Screens

1. **Map Screen** (Main) - Browse pubs on the map with venue cards
2. **Saved List** - Pubs you've bookmarked
3. **Visited List** - Pubs you've been to with ratings
4. **Skipped List** - Pubs you passed on
5. **Settings** - Radius, venue types, re-show skipped toggle

## Tech Stack

- React 18 + TypeScript + Vite
- React-Leaflet for OpenStreetMap
- Zustand for state management
- TailwindCSS + shadcn/ui
- Local storage persistence

## Design

- **Background**: Near-black charcoal (#0f0e0d)
- **Cards**: Warm dark grey
- **Text**: Bone/off-white
- **Accent**: Aged gold
- **Secondary**: Oxblood

## API

- Uses Overpass API for venue discovery
- Fetches `amenity=pub` and `amenity=bar`
- No API key required
