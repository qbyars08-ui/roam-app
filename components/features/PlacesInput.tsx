// =============================================================================
// ROAM — Google Places Autocomplete Input
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  type ListRenderItemInfo,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { searchPlaces, type PlacePrediction } from '../../lib/places';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlacesInputProps {
  /** Current text value */
  value: string;
  /** Called when a place prediction is selected */
  onSelect: (place: PlacePrediction) => void;
  /** Input placeholder */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlacesInput({
  value,
  onSelect,
  placeholder = 'Search destinations...',
}: PlacesInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Keep internal query in sync with external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const debouncedQuery = useDebouncedValue(query, 300);

  // Fetch predictions on debounced query change
  useEffect(() => {
    let cancelled = false;

    async function fetchPlaces() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);

      try {
        const predictions = await searchPlaces(debouncedQuery);
        if (!cancelled) {
          setResults(predictions);
          setShowDropdown(predictions.length > 0);
        }
      } catch (error) {
        console.error('[PlacesInput] Search error:', error);
        if (!cancelled) {
          setResults([]);
          setShowDropdown(false);
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (place: PlacePrediction) => {
      setQuery(place.mainText);
      setShowDropdown(false);
      setResults([]);
      Keyboard.dismiss();
      onSelect(place);
    },
    [onSelect]
  );

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setShowDropdown(false);
      setResults([]);
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  }, [results]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PlacePrediction>) => (
      <Pressable
        onPress={() => handleSelect(item)}
        style={({ pressed }) => [
          styles.resultItem,
          { backgroundColor: pressed ? COLORS.bgGlass : 'transparent' },
        ]}
      >
        <Text style={styles.resultIcon}>{'\uD83D\uDCCD'}</Text>
        <View style={styles.resultTextContainer}>
          <Text style={styles.resultMain} numberOfLines={1}>
            {item.mainText}
          </Text>
          {item.secondaryText ? (
            <Text style={styles.resultSecondary} numberOfLines={1}>
              {item.secondaryText}
            </Text>
          ) : null}
        </View>
      </Pressable>
    ),
    [handleSelect]
  );

  return (
    <View style={styles.container}>
      {/* Input field */}
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor="rgba(245,237,216,0.3)"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={COLORS.sage}
        />
        {isSearching && (
          <Text style={styles.searchingIndicator}>{'...'}</Text>
        )}
        {query.length > 0 && !isSearching && (
          <Pressable
            onPress={() => {
              setQuery('');
              setResults([]);
              setShowDropdown(false);
              inputRef.current?.focus();
            }}
            style={styles.clearButton}
            hitSlop={8}
          >
            <Text style={styles.clearText}>{'\u2715'}</Text>
          </Pressable>
        )}
      </View>

      {/* Dropdown results */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <FlatList<PlacePrediction>
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.resultsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 52,
    gap: SPACING.sm,
  } as ViewStyle,
  searchIcon: {
    fontSize: 16,
    opacity: 0.5,
  } as TextStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    paddingVertical: 0,
  } as TextStyle,
  searchingIndicator: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  clearText: {
    fontSize: 12,
    color: 'rgba(245,237,216,0.5)',
  } as TextStyle,
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 240,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  } as ViewStyle,
  resultsList: {
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm + 2,
  } as ViewStyle,
  resultIcon: {
    fontSize: 16,
    opacity: 0.6,
  } as TextStyle,
  resultTextContainer: {
    flex: 1,
  } as ViewStyle,
  resultMain: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  resultSecondary: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(245,237,216,0.4)',
    marginTop: 2,
  } as TextStyle,
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  } as ViewStyle,
});
