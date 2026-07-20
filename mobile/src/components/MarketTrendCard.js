// MarketTrendCard.js
// Displays localized market insights and actionable buying/selling suggestions.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from './AppText';

export default function MarketTrendCard({ demand, suggestions }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Market Demand Status */}
      <View style={styles.demandRow}>
        <View style={styles.demandTitleContainer}>
          <MaterialCommunityIcons name="trending-up" size={22} color="#1E293B" />
          <AppText style={styles.demandTitle}>{t('estimator.result.marketDemand')}</AppText>
        </View>
        <View style={[styles.demandBadge, { backgroundColor: demand.color + '15' }]}>
          <AppText style={[styles.demandLabel, { color: demand.color }]}>
            {t(demand.labelKey)}
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Selling Suggestions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="tag-outline" size={18} color="#16A34A" />
          <AppText style={styles.sectionTitle}>{t('estimator.result.sellingSuggestions')}</AppText>
        </View>
        {suggestions.selling.map((key, index) => (
          <View key={index} style={styles.suggestionItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#16A34A" style={styles.bullet} />
            <AppText style={styles.suggestionText}>{t(key)}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Buying Suggestions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="cart-outline" size={18} color="#2563EB" />
          <AppText style={styles.sectionTitle}>{t('estimator.result.buyingSuggestions')}</AppText>
        </View>
        {suggestions.buying.map((key, index) => (
          <View key={index} style={styles.suggestionItem}>
            <MaterialCommunityIcons name="help-circle-outline" size={16} color="#2563EB" style={styles.bullet} />
            <AppText style={styles.suggestionText}>{t(key)}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 8,
  },
  demandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  demandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demandTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
  },
  demandBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demandLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  section: {
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
    paddingRight: 16,
  },
  bullet: {
    marginTop: 2,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});
