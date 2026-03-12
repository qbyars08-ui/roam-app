import { useMemo } from 'react';
import { getDestinationTheme, type DestinationTheme } from './destination-themes';

export function useDestinationTheme(destination?: string | null): DestinationTheme {
  return useMemo(() => getDestinationTheme(destination || ''), [destination]);
}
