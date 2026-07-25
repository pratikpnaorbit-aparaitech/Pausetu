// FeedPlannerUnlockScreen.js
// Lifetime unlock screen for the AI Feed Planner Advisor, utilizing ₹1 Demo payment gateway simulation.

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';

export default function FeedPlannerUnlockScreen({ onUnlock, onClose }) {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: 'scale-balance',
      title: t('feedPlanner.chat.benefitTitle1'),
      desc: t('feedPlanner.chat.benefitDesc1')
    },
    {
      icon: 'cow',
      title: t('feedPlanner.chat.benefitTitle2'),
      desc: t('feedPlanner.chat.benefitDesc2')
    },
    {
      icon: 'cash-multiple',
      title: t('feedPlanner.chat.benefitTitle3'),
      desc: t('feedPlanner.chat.benefitDesc3')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} aria-label="Close unlock card">
          <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{t('feedPlanner.chat.unlockTitle')}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.badgeContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#B45309" />
            <AppText style={styles.badgeText}>PREMIUM ADVISORY</AppText>
          </View>

          <AppText style={styles.title}>{t('feedPlanner.chat.unlockTitle')}</AppText>
          <AppText style={styles.subtitle}>{t('feedPlanner.chat.unlockSubtitle')}</AppText>

          <View style={styles.divider} />

          {benefits.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={benefit.icon} size={22} color="#16A34A" />
              </View>
              <View style={styles.benefitTextContainer}>
                <AppText style={styles.benefitTitle}>{benefit.title}</AppText>
                <AppText style={styles.benefitDesc}>{benefit.desc}</AppText>
              </View>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.priceContainer}>
            <AppText style={styles.originalPrice}>₹299</AppText>
            <AppText style={styles.promoPrice}>₹1</AppText>
            <AppText style={styles.pricePeriod}>/ LIFETIME</AppText>
          </View>

          <TouchableOpacity style={styles.payBtn} onPress={onUnlock} activeOpacity={0.85}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <AppText style={styles.payBtnText}>₹1 - UPI Demo Payment</AppText>
          </TouchableOpacity>

          <AppText style={styles.secureText}>
            🔒 256-bit encrypted secure checkout simulation
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  scrollContent: { padding: 16, justifyContent: 'center', flexGrow: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 4
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#B45309' },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitTextContainer: { flex: 1 },
  benefitTitle: { fontSize: 14.5, fontWeight: '700', color: '#0F172A' },
  benefitDesc: { fontSize: 12.5, color: '#64748B', marginTop: 2, lineHeight: 18 },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 18,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  promoPrice: { fontSize: 32, fontWeight: '900', color: '#16A34A' },
  pricePeriod: { fontSize: 12, fontWeight: '700', color: '#64748B', marginLeft: 4 },
  payBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secureText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 12 },
});
