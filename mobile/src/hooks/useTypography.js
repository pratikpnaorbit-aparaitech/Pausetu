/**
 * useTypography.js — Font Scale Hook
 *
 * Reads the global fontSize preference from AppContext and
 * returns a numeric multiplier. All text components use this
 * to scale their base fontSize values.
 *
 * Scale map:
 *   'Small'  → 0.85
 *   'Medium' → 1.00  (default)
 *   'Large'  → 1.18
 *
 * Usage:
 *   const fontScale = useFontScale();
 *   // Apply: style={{ fontSize: 14 * fontScale }}
 *
 *   OR use the helper:
 *   const scale = useScaledFontSize(14); // returns 14 * multiplier
 */
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const SCALE_MAP = {
  Small: 0.85,
  Medium: 1.0,
  Large: 1.18,
};

/**
 * Returns the numeric multiplier for the current font size preference.
 */
export function useFontScale() {
  const { fontSize } = useContext(AppContext);
  return SCALE_MAP[fontSize] ?? 1.0;
}

/**
 * Returns a single scaled font size value.
 * @param {number} base — The base font size in pixels
 */
export function useScaledFontSize(base) {
  const scale = useFontScale();
  return Math.round(base * scale);
}
