// SellerInfoCard.js
// Presentation card for the livestock seller profile summary and statistics.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function SellerInfoCard({ item }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={20} color="#16A34A" />
        </View>
        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <AppText style={styles.sellerName}>{item.sellerName || 'Cattle Farmer'}</AppText>
            <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" style={{ marginLeft: 4 }} />
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <AppText style={styles.ratingText}>4.8 • {t('buy.verifiedSeller')}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <AppText style={styles.statVal}>95%</AppText>
          <AppText style={styles.statLabel}>{t('buy.responseRate')}</AppText>
        </View>
        <View style={styles.statBox}>
          <AppText style={styles.statVal}>{item.views ? Math.round(item.views / 20) + 1 : 3}</AppText>
          <AppText style={styles.statLabel}>{t('buy.animalsSold')}</AppText>
        </View>
        <View style={styles.statBox}>
          <AppText style={styles.statVal}>2024</AppText>
          <AppText style={styles.statLabel}>{t('buy.memberSince')}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  meta: {
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 2,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
