// PriceCard.js
// Displays the estimated prices beautifully with premium gradient aesthetics.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';
import formatPrice from '../utils/priceFormatter';

export default function PriceCard({ minPrice, expectedPrice, premiumPrice }) {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={['#16A34A', '#15803D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <AppText style={styles.label}>{t('estimator.result.expectedPrice')}</AppText>
      </View>
      
      <AppText style={styles.price}>{formatPrice(expectedPrice)}</AppText>
      
      <View style={styles.divider} />
      
      <View style={styles.rangeContainer}>
        <View style={styles.rangeItem}>
          <AppText style={styles.rangeLabel}>{t('estimator.result.minPrice')}</AppText>
          <AppText style={styles.rangeValue}>{formatPrice(minPrice)}</AppText>
        </View>
        
        <View style={styles.rangeDivider} />
        
        <View style={styles.rangeItem}>
          <AppText style={styles.rangeLabel}>{t('estimator.result.premiumPrice')}</AppText>
          <AppText style={styles.rangeValue}>{formatPrice(premiumPrice)}</AppText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    marginVertical: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: '100%',
    marginBottom: 16,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rangeValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rangeDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
