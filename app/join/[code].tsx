// =============================================================================
// ROAM — Join by invite code (web route: /join/ABC12345)
// Redirects to join-group with code param for consistent handling
// =============================================================================
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../lib/constants';

export default function JoinByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (code) {
      router.replace({ pathname: '/join-group', params: { code } });
    }
  }, [code, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
      <ActivityIndicator size="large" color={COLORS.sage} />
    </View>
  );
}
