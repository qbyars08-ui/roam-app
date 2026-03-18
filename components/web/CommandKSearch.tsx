// =============================================================================
// ROAM — CommandKSearch
// Cmd+K / Ctrl+K live travel search overlay (web only)
// =============================================================================

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { useSonarQuery } from '../../lib/sonar';
import LiveBadge from '../ui/LiveBadge';
import SourceCitation from '../ui/SourceCitation';

// ---------------------------------------------------------------------------
// Guard — renders nothing on non-web platforms
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  // eslint-disable-next-line import/no-anonymous-default-export
  const NullComponent = (): null => null;
  // We export early below when Platform.OS !== 'web', but TypeScript requires
  // the default export at module scope. We handle this via a runtime guard in
  // the component body instead.
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------
function useDebounce(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

// ---------------------------------------------------------------------------
// Derive a destination slug from the raw query (first 1–2 capitalized words)
// ---------------------------------------------------------------------------
function deriveDestination(query: string): string | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  // Grab the first two words as a loose destination hint
  const words = trimmed.split(/\s+/).slice(0, 2);
  return words.join(' ');
}

// ---------------------------------------------------------------------------
// ResultCard — answer text + LiveBadge + SourceCitation
// ---------------------------------------------------------------------------
interface ResultCardProps {
  answer: string;
  isLive: boolean;
  citations: import('../../lib/types/sonar').SonarCitation[];
}

function ResultCard({ answer, isLive, citations }: ResultCardProps): React.JSX.Element {
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        {isLive && <LiveBadge size="sm" />}
      </View>
      <ScrollView
        style={styles.resultScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.answerText}>{answer}</Text>
        {citations.length > 0 && (
          <View style={styles.citationsWrapper}>
            <SourceCitation citations={citations} max={4} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inner overlay — contains input + result state
// ---------------------------------------------------------------------------
interface OverlayContentProps {
  onClose: () => void;
}

function OverlayContent({ onClose }: OverlayContentProps): React.JSX.Element {
  const [rawQuery, setRawQuery] = useState('');
  const inputRef = useRef<TextInput>(null);
  const debouncedQuery = useDebounce(rawQuery, 500);
  const destination = deriveDestination(debouncedQuery);

  const { data, isLoading, citations, isLive } = useSonarQuery(destination, 'pulse');

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setRawQuery(text);
  }, []);

  const showLoading = isLoading && debouncedQuery.trim().length > 0;
  const showResult = !isLoading && data !== null && debouncedQuery.trim().length > 0;

  return (
    <View style={styles.modal}>
      {/* Search input */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={rawQuery}
          onChangeText={handleChangeText}
          placeholder="Search anywhere — Tokyo nightlife, Bali safety..."
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <Pressable onPress={onClose} style={styles.escBadge} hitSlop={8}>
          <Text style={styles.escText}>ESC</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Loading state */}
      {showLoading && (
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Result */}
      {showResult && data && (
        <ResultCard
          answer={data.answer}
          isLive={isLive}
          citations={citations}
        />
      )}

      {/* Empty / prompt state */}
      {!showLoading && !showResult && (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>
            Type a destination or travel question
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CommandKSearch — main exported component
// ---------------------------------------------------------------------------
export default function CommandKSearch(): React.JSX.Element | null {
  // Hard guard — this component is web-only
  if (Platform.OS !== 'web') return null;

  return <CommandKSearchWeb />;
}

function CommandKSearchWeb(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openOverlay = useCallback(() => {
    setIsOpen(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const closeOverlay = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  }, [fadeAnim]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          closeOverlay();
        } else {
          openOverlay();
        }
        return;
      }
      // Esc closes
      if (e.key === 'Escape' && isOpen) {
        closeOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openOverlay, closeOverlay]);

  if (!isOpen) return <></>;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={closeOverlay} />
      {/* Modal sheet */}
      <View style={styles.modalWrapper}>
        <OverlayContent onClose={closeOverlay} />
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Dark overlay: #0A0A0A at 95% opacity
    backgroundColor: COLORS.overlayDarkest,
    zIndex: 9999,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 720,
    marginTop: 80,
    paddingHorizontal: SPACING.md,
    zIndex: 10000,
  },
  modal: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 24,
  },
  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.accent,
    backgroundColor: COLORS.transparent,
    paddingVertical: SPACING.sm,
  },
  escBadge: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  escText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 0,
  },
  // Loading
  loadingRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
    letterSpacing: 0.3,
  },
  // Empty prompt
  emptyRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
    letterSpacing: 0.2,
  },
  // Result card
  resultCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  resultScroll: {
    maxHeight: 320,
  },
  answerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.accent,
    lineHeight: 22,
  },
  citationsWrapper: {
    marginTop: SPACING.sm,
  },
});
