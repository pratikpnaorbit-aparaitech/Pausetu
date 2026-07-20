import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/AppText';

export default function SummaryCard({ answers, onRestart }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={20} color="#0F172A" />
        <AppText style={styles.title}>
          {t('premiumAdvisor.guidedChat.summaryTitle', { defaultValue: 'Cattle Details Summary' })}
        </AppText>
      </View>

      <View style={styles.grid}>
        {Object.entries(answers).map(([key, val]) => (
          <View key={key} style={styles.item}>
            <AppText style={styles.label}>
              {t(`premiumAdvisor.guidedChat.summary.${key}`, { defaultValue: key })}
            </AppText>
            <AppText style={styles.value}>
              {/* Translate standard options if keys exist */}
              {t(`premiumAdvisor.guidedChat.options.${val.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, { defaultValue: val })}
            </AppText>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.8}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
        <AppText style={styles.restartText}>
          {t('premiumAdvisor.guidedChat.restartBtn', { defaultValue: 'Restart Advisor' })}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  grid: {
    gap: 8,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 14,
    color: '#64748B',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  restartBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  restartText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  }
});
