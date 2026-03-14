// =============================================================================
// ROAM — Privacy Policy
// In-app and web-hosted at https://roamtravel.app/privacy
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../lib/constants';

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

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>ROAM Privacy Policy</Text>
        <Text style={styles.meta}>Effective Date: March 11, 2026 • Last Updated: March 11, 2026</Text>

        <Para>
          ROAM Travel Inc. ("ROAM," "we," "us," or "our") operates the ROAM mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our App.
        </Para>
        <Para>By using ROAM, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use the App.</Para>

        <Section title="1. INFORMATION WE COLLECT">
          <Text style={styles.subsection}>1.1 Information You Provide Directly</Text>
          <Bullet>Account Information: Email address, display name, and profile photo when you create an account.</Bullet>
          <Bullet>Trip Preferences: Destinations, budget ranges, travel dates, travel style preferences (vibes), and other inputs when generating itineraries.</Bullet>
          <Bullet>Chat Messages: Text you send through the AI chat feature for travel recommendations.</Bullet>
          <Bullet>Emergency Contact: Name and phone number of your designated emergency contact, stored locally.</Bullet>
          <Text style={styles.subsection}>1.2 Information Collected Automatically</Text>
          <Bullet>Usage Data: App feature usage, session duration, screens visited. Used in aggregate to improve the App.</Bullet>
          <Bullet>Device Information: Device type, OS version, unique identifiers, app version.</Bullet>
          <Bullet>Location Data: Approximate (city-level) for recommendations. Precise GPS only when you use Emergency SOS. Never passive or continuous.</Bullet>
          <Text style={styles.subsection}>1.3 Information from Third-Party Services</Text>
          <Bullet>Authentication: If you sign in with Apple or Google, we receive name and email as authorized.</Bullet>
          <Bullet>Subscription: Apple manages payments. We receive confirmation of subscription status, never payment details.</Bullet>
        </Section>

        <Section title="2. HOW WE USE YOUR INFORMATION">
          <Text style={styles.para}>We use collected information to:</Text>
          <Bullet>Generate personalized travel itineraries and recommendations</Bullet>
          <Bullet>Process AI chat queries and return travel information</Bullet>
          <Bullet>Manage your account and subscription status</Bullet>
          <Bullet>Provide weather, safety, and flight information</Bullet>
          <Bullet>Improve the App's features and user experience</Bullet>
          <Bullet>Respond to support requests and enforce our Terms</Bullet>
          <Text style={[styles.para, { marginTop: SPACING.md }]}>We do NOT sell your personal data, build advertising profiles, or make automated decisions with legal effects.</Text>
        </Section>

        <Section title="3. AI AND DATA PROCESSING">
          <Para>
            Anthropic (Claude): Your trip preferences and chat messages are sent to Anthropic's Claude API. Anthropic does not use your inputs to train models. Data is transmitted encrypted and not retained beyond the API request.
          </Para>
          <Para>
            We send only the information necessary to generate your itinerary (destination, dates, budget, vibes, chat context). We do not send email, name, or account info to AI providers.
          </Para>
        </Section>

        <Section title="4. THIRD-PARTY SERVICES">
          <Para>Supabase (auth, database), Anthropic (AI), Aviationstack (flights), OpenWeatherMap (weather), RevenueCat (subscriptions), Apple (payments). Each has its own privacy policy. We select services with strong data protection.</Para>
        </Section>

        <Section title="5. DATA STORAGE AND SECURITY">
          <Bullet>Data stored on Supabase (US). Encrypted in transit (TLS 1.2+) and at rest (AES-256).</Bullet>
          <Bullet>Row Level Security ensures you access only your own data.</Bullet>
          <Bullet>Saved itineraries cached locally with encrypted storage.</Bullet>
        </Section>

        <Section title="6. DATA RETENTION">
          <Bullet>Active accounts: Data retained while account is active.</Bullet>
          <Bullet>Deleted accounts: Personal data removed within 30 days.</Bullet>
          <Bullet>Chat messages: 90 days, then auto-deleted.</Bullet>
        </Section>

        <Section title="7. YOUR RIGHTS">
          <Bullet>Access, correction, deletion via Profile &gt; Settings or email privacy@roamtravel.app</Bullet>
          <Bullet>California (CCPA): Know, delete, opt-out of sale (we don't sell). Non-discrimination.</Bullet>
          <Bullet>EEA/UK (GDPR): Access, rectify, erase, restrict, object, portability, withdraw consent, lodge complaint.</Bullet>
        </Section>

        <Section title="8. CHILDREN'S PRIVACY">
          <Para>ROAM is not directed to children under 13 (or 16 in EEA). We do not knowingly collect data from children. Contact privacy@roamtravel.app if you believe a child has provided data.</Para>
        </Section>

        <Section title="9. CHANGES">
          <Para>We may update this policy. Material changes will be posted in the App. Continued use constitutes acceptance.</Para>
        </Section>

        <Section title="10. CONTACT US">
          <Para>ROAM Travel Inc.</Para>
          <Para>Email: privacy@roamtravel.app</Para>
          <Para>Support: support@roamtravel.app</Para>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { marginEnd: SPACING.sm },
  headerTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  title: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream, marginBottom: SPACING.xs },
  meta: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.sage, marginBottom: SPACING.sm },
  subsection: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  para: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginBottom: SPACING.sm },
  bullet: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginBottom: 4 },
});
