// ConfidenceMeter.js
// Displays the calculation confidence level using a smooth colored meter.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';

export default function ConfidenceMeter({ score }) {
  const { t } = useTranslation();
  
  let color = '#EF4444';
  let labelKey = 'estimator.confidence.low';
  
  if (score >= 75) {
    color = '#16A34A';
    labelKey = 'estimator.confidence.high';
  } else if (score >= 50) {
    color = '#F59E0B';
    labelKey = 'estimator.confidence.medium';
  }

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        <AppText style={styles.title}>{t('estimator.result.confidenceScore')}</AppText>
        <AppText style={[styles.scoreText, { color }]}>{score}%</AppText>
      </View>
      
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      
      <View style={styles.indicatorRow}>
        <AppText style={[styles.indicatorText, { color }]}>{t(labelKey)}</AppText>
        <AppText style={styles.helperText}>{t('estimator.result.confidenceHelp')}</AppText>
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
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
  },
});
