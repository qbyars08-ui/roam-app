// =============================================================================
// ROAM — CRAFT conversation message bubble
// Dark, intimate; assistant = left-aligned sage tint, user = right-aligned
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

interface CraftMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function CraftMessage({ role, content }: CraftMessageProps) {
  const isUser = role === 'user';
  return (
    <View style={[styles.wrap, isUser ? styles.wrapUser : styles.wrapAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]} selectable>
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: SPACING.xs,
    flexDirection: 'row',
  } as ViewStyle,
  wrapUser: {
    justifyContent: 'flex-end',
  } as ViewStyle,
  wrapAssistant: {
    justifyContent: 'flex-start',
  } as ViewStyle,
  bubble: {
    maxWidth: '88%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  bubbleUser: {
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  bubbleAssistant: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  textUser: {
    color: COLORS.cream,
  } as TextStyle,
  textAssistant: {
    color: COLORS.creamMuted,
  } as TextStyle,
});
