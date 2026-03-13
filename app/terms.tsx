// =============================================================================
// ROAM — Terms of Service
// In-app and web-hosted at https://roamtravel.app/terms
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../lib/constants';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border } as ViewStyle,
  backBtn: { marginRight: SPACING.sm } as ViewStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { padding: SPACING.lg } as ViewStyle,
  section: { marginBottom: SPACING.xl } as ViewStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, marginBottom: SPACING.xs } as TextStyle,
  meta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, marginBottom: SPACING.lg } as TextStyle,
  sectionTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.sage, marginBottom: SPACING.sm } as TextStyle,
  para: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginBottom: SPACING.sm } as TextStyle,
  bullet: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginBottom: 4 } as TextStyle,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={styles.para}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bullet}>
      {'\u2022'} {children}
    </Text>
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>ROAM Terms of Service</Text>
        <Text style={styles.meta}>Effective Date: March 11, 2026 • Last Updated: March 11, 2026</Text>

        <Para>
          Welcome to ROAM. ROAM Travel Inc. ("ROAM," "we," "us," or "our") provides the ROAM mobile application (the "App"). By downloading, installing, or using the App, you agree to these Terms of Service ("Terms"). If you do not agree, do not use the App.
        </Para>

        <Section title="1. ELIGIBILITY">
          <Para>You must be at least 13 years old (or 16 in the EEA) to use ROAM. By using the App, you represent that you meet these requirements and have the legal capacity to enter into these Terms.</Para>
        </Section>

        <Section title="2. ACCOUNT AND REGISTRATION">
          <Para>You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.</Para>
        </Section>

        <Section title="3. SERVICES">
          <Para>ROAM provides AI-powered travel planning, including personalized itineraries, recommendations, and chat assistance. Our services are for informational and planning purposes only. We do not guarantee accuracy of third-party information (e.g., prices, hours, availability). Always verify details before booking.</Para>
        </Section>

        <Section title="4. SUBSCRIPTIONS AND PAYMENTS">
          <Para>Some features require a paid subscription (ROAM Pro). Subscriptions are billed through your Apple ID. Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions auto-renew unless canceled at least 24 hours before the end of the current period. Manage subscriptions in your device Settings &gt; Apple ID &gt; Subscriptions.</Para>
          <Para>Refunds are handled by Apple. Contact Apple Support for subscription refund requests.</Para>
        </Section>

        <Section title="5. ACCEPTABLE USE">
          <Para>You agree not to:</Para>
          <Bullet>Use the App for any illegal purpose or in violation of applicable laws</Bullet>
          <Bullet>Attempt to reverse engineer, decompile, or extract source code from the App</Bullet>
          <Bullet>Transmit viruses, malware, or other harmful code</Bullet>
          <Bullet>Abuse or overload our systems or third-party APIs</Bullet>
          <Bullet>Impersonate another person or entity</Bullet>
          <Bullet>Use the App to harass, spam, or harm others</Bullet>
          <Para>We may suspend or terminate your account for violations of these Terms.</Para>
        </Section>

        <Section title="6. INTELLECTUAL PROPERTY">
          <Para>ROAM and its content, features, and functionality are owned by ROAM Travel Inc. and are protected by copyright, trademark, and other laws. You may not copy, modify, distribute, or create derivative works without our express permission.</Para>
        </Section>

        <Section title="7. DISCLAIMERS">
          <Para>THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE." WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. TRAVEL RECOMMENDATIONS ARE INFORMATIONAL ONLY. WE ARE NOT LIABLE FOR TRAVEL DECISIONS, BOOKINGS, OR EXPERIENCES.</Para>
        </Section>

        <Section title="8. LIMITATION OF LIABILITY">
          <Para>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROAM AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR DATA, ARISING FROM YOUR USE OF THE APP.</Para>
        </Section>

        <Section title="9. CHANGES">
          <Para>We may modify these Terms from time to time. We will notify you of material changes by posting updated Terms in the App. Continued use after changes constitutes acceptance. If you do not agree, discontinue use and delete your account.</Para>
        </Section>

        <Section title="10. GOVERNING LAW">
          <Para>These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.</Para>
        </Section>

        <Section title="11. CONTACT">
          <Para>Questions? Contact us at support@roamtravel.app</Para>
        </Section>
      </ScrollView>
    </View>
  );
}
