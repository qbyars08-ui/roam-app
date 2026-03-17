// =============================================================================
// ROAM — "Coming Soon" Gate
// Wraps non-essential screens for v1.0 App Store submission.
// Shows a beautiful teaser instead of the full feature.
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

interface ComingSoonProps {
  /** Feature name shown in the header */
  title: string;
  /** Short description of what's coming */
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={[COLORS.bg, COLORS.gradientForestLight, COLORS.bg]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('common.comingSoon')}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : (
          <Text style={styles.description}>
            {t('comingSoon.description', { defaultValue: "We're putting the finishing touches on this feature.\nIt'll be worth the wait." })}
          </Text>
        )}

        <View style={styles.divider} />

        <Text style={styles.hint}>
          {t('comingSoon.hint', { defaultValue: 'Upgrade to Pro to get early access when it launches' })}
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>{t('common.back')}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
  },
  badge: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamFaint,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },
});
