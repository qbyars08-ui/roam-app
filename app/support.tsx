// =============================================================================
// ROAM — Support
// In-app and web-hosted at https://roamtravel.app/support
// =============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../lib/constants';

const FAQ_ITEMS = [
  {
    q: 'How does ROAM generate itineraries?',
    a: 'ROAM uses advanced AI to build personalized day-by-day travel plans based on your destination, budget, travel dates, and style preferences. Every recommendation references real places with real pricing.',
  },
  {
    q: 'Is my first trip really free?',
    a: 'Yes. Every ROAM account gets one free AI-generated trip per month. No credit card required. Upgrade to Pro for unlimited trips.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Open ROAM, go to your Profile tab, and tap "Upgrade to Pro." Your subscription is managed through your Apple ID and can be canceled anytime in your device Settings under Subscriptions.',
  },
  {
    q: 'Can I use ROAM offline?',
    a: 'Yes. All saved itineraries are available offline. You need an internet connection to generate new trips or use AI chat.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Open your device Settings > tap your Apple ID > Subscriptions > ROAM. Tap Cancel Subscription. Your Pro access continues until the end of your current billing period.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Open ROAM > Profile > Settings > Delete Account. This permanently removes your account and all associated data. This action cannot be undone.',
  },
  {
    q: 'How does Emergency SOS work?',
    a: 'Long-press the SOS button to instantly access local emergency numbers for your destination. ROAM can also share your current GPS coordinates via text message to your emergency contact.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded(!expanded)}
      style={({ pressed }) => [viewStyles.faqItem, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={viewStyles.faqHeader}>
        <Text style={textStyles.faqQuestion}>{q}</Text>
        {expanded ? (
          <ChevronUp size={20} color={COLORS.creamMuted} />
        ) : (
          <ChevronDown size={20} color={COLORS.creamMuted} />
        )}
      </View>
      {expanded && <Text style={textStyles.faqAnswer}>{a}</Text>}
    </Pressable>
  );
}

export default function SupportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[viewStyles.container, { paddingTop: insets.top }]}>
      <View style={viewStyles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={viewStyles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={textStyles.headerTitle}>{t('support.title')}</Text>
      </View>
      <ScrollView
        style={viewStyles.scroll}
        contentContainerStyle={[viewStyles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={textStyles.hero}>{t('support.needHelp')}</Text>
        <Text style={textStyles.heroSub}>{t('support.weAreHere')}</Text>

        <Text style={textStyles.sectionLabel}>{t('support.frequentlyAsked')}</Text>
        {FAQ_ITEMS.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}

        <View style={viewStyles.contactCard}>
          <Mail size={24} color={COLORS.sage} style={{ marginBottom: SPACING.sm }} />
          <Text style={textStyles.contactTitle}>{t('support.contactUs')}</Text>
          <Text style={textStyles.contactSub}>{t('support.responseWithin48Hours')}</Text>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@roamtravel.app')}
            style={({ pressed }) => [viewStyles.emailBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Text style={textStyles.emailBtnText}>support@roamtravel.app</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const viewStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { marginRight: SPACING.sm },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  faqItem: { backgroundColor: COLORS.bgGlass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactCard: { marginTop: SPACING.xl, backgroundColor: COLORS.bgGlass, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, alignItems: 'center' },
  emailBtn: { marginTop: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
});

const textStyles = StyleSheet.create({
  headerTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream },
  hero: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, marginBottom: SPACING.xs },
  heroSub: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.creamMuted, marginBottom: SPACING.xl },
  sectionLabel: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 1.5, marginBottom: SPACING.md },
  faqQuestion: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream, flex: 1 },
  faqAnswer: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, lineHeight: 22, marginTop: SPACING.sm },
  contactTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream },
  contactSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginTop: 4 },
  emailBtnText: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.sage },
});

