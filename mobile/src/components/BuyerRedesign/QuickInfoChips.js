// QuickInfoChips.js
// Custom status chips representing cattle health and verification details.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function QuickInfoChips({ item }) {
  const { t } = useTranslation();
  const isPregnant = item.isPregnant || item.pregnant || false;

  const chips = [
    { label: 'Healthy', active: true },
    { label: 'Vaccinated', active: item.vaccination === 'yes' || item.isVaccinated },
    { label: t('buy.pregnantText'), active: isPregnant },
    { label: 'AI Verified', active: item.isVerified },
    { label: 'Premium Seller', active: item.views > 100 },
  ].filter(c => c.active);

  return (
    <View style={styles.container}>
      {chips.map((chip, i) => (
        <View key={i} style={[styles.chip, i === 0 && styles.chipPrimary]}>
          <AppText style={[styles.chipText, i === 0 && styles.chipTextPrimary]}>
            {chip.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  chipPrimary: {
    backgroundColor: '#ECFDF5',
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextPrimary: {
    color: '#16A34A',
  },
});
