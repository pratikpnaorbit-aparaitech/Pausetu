// AIPriceCard.js
// Gradient overlay card displaying AI pricing features and verification statistics details.

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function AIPriceCard({ onPress }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AppText style={styles.title}>{t('buy.knowAiValue')}</AppText>
        <AppText style={styles.desc}>{t('buy.aiAnalyzes')}</AppText>
      </View>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
        <AppText style={styles.btnText}>{t('buy.checkAiPrice')}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  desc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 14,
  },
  button: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
