// =============================================================================
// ROAM — Coming Soon (param-based)
// Renders ComingSoon component with title from URL params
// =============================================================================
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ComingSoon from '../components/ComingSoon';

export default function ComingSoonScreen() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  return <ComingSoon title={title ?? 'Coming Soon'} />;
}
