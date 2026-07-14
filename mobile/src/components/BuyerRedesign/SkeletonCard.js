// SkeletonCard.js
// Visual skeleton container representing active loaders during dataset refreshes.

import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

export default function SkeletonCard() {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {/* Image Container Placeholder */}
      <View style={styles.imagePlaceholder} />

      <View style={styles.bodyContent}>
        {/* Title Lines */}
        <View style={styles.titleLine} />
        <View style={styles.subtitleLine} />

        {/* Price Line */}
        <View style={styles.priceLine} />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Grid Cells Placeholders */}
        <View style={styles.gridPlaceholder}>
          <View style={styles.cellPlaceholder} />
          <View style={styles.cellPlaceholder} />
          <View style={styles.cellPlaceholder} />
          <View style={styles.cellPlaceholder} />
        </View>

        {/* AI Estimation Card Placeholder */}
        <View style={styles.aiPlaceholder} />

        {/* View Details Button Placeholder */}
        <View style={styles.btnPlaceholderLarge} />

        {/* Call & WhatsApp Row Placeholders */}
        <View style={styles.rowPlaceholder}>
          <View style={styles.btnPlaceholder} />
          <View style={styles.btnPlaceholder} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 260,
    backgroundColor: '#F1F5F9',
  },
  bodyContent: {
    padding: 18,
    gap: 12,
  },
  titleLine: {
    width: '65%',
    height: 20,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  subtitleLine: {
    width: '40%',
    height: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    marginTop: 4,
  },
  priceLine: {
    width: '30%',
    height: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  gridPlaceholder: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  cellPlaceholder: {
    width: '48%',
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  aiPlaceholder: {
    height: 60,
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 4,
  },
  btnPlaceholderLarge: {
    height: 54,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    marginTop: 4,
  },
  rowPlaceholder: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPlaceholder: {
    flex: 1,
    height: 60,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
});
