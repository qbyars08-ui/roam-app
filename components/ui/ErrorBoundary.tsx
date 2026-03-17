// =============================================================================
// ROAM — Error Boundary
// Catches uncaught JS errors and renders a graceful fallback
// =============================================================================
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import i18n from '../../lib/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Props {
  children: ReactNode;
  /** Optional fallback to render instead of the default */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={48} color={COLORS.coral} strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>{i18n.t('errorBoundary.title')}</Text>
          <Text style={styles.subtitle}>
            {i18n.t('errorBoundary.subtitle')}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('errorBoundary.tryAgain')}
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.buttonText}>{i18n.t('errorBoundary.tryAgain')}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
    fontSize: 24,
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
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  buttonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.white,
  } as TextStyle,
});
