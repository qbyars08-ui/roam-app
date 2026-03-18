// =============================================================================
// PackingSection — packing list tab
// =============================================================================
import React, { useMemo } from 'react';
import { View } from 'react-native';
import type { Trip } from '../../lib/store';
import type { Itinerary } from '../../lib/types/itinerary';
import PackingList from '../features/PackingList';
import { sharedStyles } from './prep-shared';

type Props = {
  destination: string;
  trip: Trip | null;
  itinerary: Itinerary | null;
};

export default function PackingSection({ destination, trip, itinerary }: Props) {
  const essentials = useMemo(() => {
    if (itinerary?.packingEssentials?.length) {
      return itinerary.packingEssentials;
    }
    const items: string[] = [];
    if (itinerary?.days) {
      for (const day of itinerary.days) {
        for (const slot of ['morning', 'afternoon', 'evening'] as const) {
          const tip = day[slot]?.tip;
          if (tip && tip.toLowerCase().includes('bring')) {
            items.push(tip);
          }
        }
      }
    }
    return items.slice(0, 5);
  }, [itinerary]);

  return (
    <View style={sharedStyles.tabContent}>
      <PackingList
        essentials={essentials}
        destination={destination}
        tripId={trip?.id}
      />
    </View>
  );
}
