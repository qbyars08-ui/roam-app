# Phase 7 — Performance Notes

## Current Optimizations

- **Images**: Unsplash URLs use `w=800` or `w=1920` + `q=85/90` to limit size
- **FlatList**: Used for message list (chat), destination grids — native virtualization
- **Claude fallback**: 8s timeout on edge function before fallback; avoids indefinite hangs

## Recommended Improvements (future)

- Lazy-load images below the fold (IntersectionObserver on web)
- Memoize expensive filters (filteredDestinations, etc.) — already using useMemo in plan.tsx
- Debounce destination search input in Plan
- Consider React.memo for heavy list items (FlightCard, DestinationCard)
