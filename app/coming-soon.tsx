// =============================================================================
// ROAM — Coming Soon (param-based)
// Renders ComingSoon component with title from URL params
// =============================================================================
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ComingSoon from '../components/ComingSoon';

export default function ComingSoonScreen() {
  const { t } = useTranslation();
  const { title } = useLocalSearchParams<{ title?: string }>();
  return <ComingSoon title={title ?? t('common.comingSoon', { defaultValue: 'Coming Soon' })} />;
}
