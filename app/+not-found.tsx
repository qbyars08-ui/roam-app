// =============================================================================
// ROAM — 404 Not Found Screen
// Shown when navigating to an invalid route
// =============================================================================
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MapPin size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{t('notFound.title')}</Text>
      <Text style={styles.subtitle}>
        {t('notFound.subtitle')}
      </Text>
      <Pressable
        onPress={() => router.replace('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel={t('notFound.goHome')}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.buttonText}>{t('notFound.goHome')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  } as ViewStyle,
  iconWrap: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  } as TextStyle,
  button: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  buttonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
