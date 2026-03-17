// =============================================================================
// ROAM — Index redirect → Plan tab
// The index route (/) must redirect to /plan so the tab navigator
// renders the correct screen. Without this, the hidden index tab
// renders first and offsets every visible tab by one position.
// =============================================================================
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/plan" />;
}
