// =============================================================================
// ROAM — Push Notifications (web stub — expo-notifications crashes on web)
// =============================================================================

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleTripCountdown(
  _tripId: string,
  _destination: string,
  _departureDate: string
): Promise<string | null> {
  return null;
}

export async function scheduleDailyDiscovery(): Promise<string> {
  return '';
}

export async function cancelDailyDiscovery(): Promise<void> {}

export async function sendAlert(
  _title: string,
  _body: string,
  _data?: Record<string, unknown>
): Promise<string> {
  return '';
}

export async function cancelNotification(_id: string): Promise<void> {}

export async function cancelAllNotifications(): Promise<void> {}

export async function schedulePetCheckIn(
  _petName: string,
  _tripEndDate: string
): Promise<void> {}

export async function cancelPetCheckIns(): Promise<void> {}

export async function getExpoPushToken(_projectId: string): Promise<string | null> {
  return null;
}
