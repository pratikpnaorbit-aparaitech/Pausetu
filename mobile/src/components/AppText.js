/**
 * AppText.js — Global Scaled Text Component
 *
 * Drop-in replacement for React Native <Text> that automatically
 * applies the user's font size preference from AppContext.
 *
 * HOW IT WORKS:
 *   1. Reads fontSize ('Small' | 'Medium' | 'Large') from AppContext
 *   2. Maps it to a multiplier (0.85 | 1.0 | 1.18)
 *   3. Intercepts any `fontSize` value in the style prop(s) and multiplies it
 *   4. All other props and styles pass through unchanged
 *
 * USAGE:
 *   import AppText from '../components/AppText';
 *
 *   // Instead of: <Text style={{ fontSize: 16, color: '#000' }}>Hello</Text>
 *   // Use:        <AppText style={{ fontSize: 16, color: '#000' }}>Hello</AppText>
 *
 *   Supports:
 *     - style as a plain object:  style={{ fontSize: 14 }}
 *     - style as an array:        style={[styles.base, { fontSize: 14 }]}
 *     - StyleSheet references:    style={styles.myText}  (if styles.myText has fontSize)
 *     - No style prop at all:     <AppText>Text</AppText>  (uses default 14px scaled)
 *
 * NOTE: Do NOT use this for icon labels or non-content decorators.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useFontScale } from '../hooks/useTypography';

const DEFAULT_FONT_SIZE = 14;

/**
 * Recursively resolves and scales the fontSize within a style or array of styles.
 */
function scaleStyle(style, fontScale) {
  if (!style) return style;

  // Handle arrays
  if (Array.isArray(style)) {
    return style.map((s) => scaleStyle(s, fontScale));
  }

  // Handle StyleSheet ID (number) — flatten first
  if (typeof style === 'number') {
    const flat = StyleSheet.flatten(style);
    if (!flat) return style;
    if (flat.fontSize != null) {
      return { ...flat, fontSize: Math.round(flat.fontSize * fontScale) };
    }
    return flat;
  }

  // Handle plain object
  if (typeof style === 'object' && style.fontSize != null) {
    return { ...style, fontSize: Math.round(style.fontSize * fontScale) };
  }

  return style;
}

export default function AppText({ style, children, ...props }) {
  const fontScale = useFontScale();

  // Flatten the provided style(s) to get base fontSize
  const flatStyle = StyleSheet.flatten(style) || {};
  const baseFontSize = flatStyle.fontSize ?? DEFAULT_FONT_SIZE;
  const scaledFontSize = Math.round(baseFontSize * fontScale);

  // Build final style: scaled style overrides the original fontSize
  const finalStyle = [style, { fontSize: scaledFontSize }];

  return (
    <Text style={finalStyle} {...props}>
      {children}
    </Text>
  );
}
