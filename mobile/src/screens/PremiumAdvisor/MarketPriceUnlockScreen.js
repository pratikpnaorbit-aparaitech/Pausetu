// MarketPriceUnlockScreen.js
// Beautiful premium unlock screen for the ₹1 Market Price AI Valuation.

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';

export default function MarketPriceUnlockScreen({ onUnlock, onClose }) {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: 'calculator-variant',
      titleKey: 'estimator.premium.benefitValuationTitle',
      descKey: 'estimator.premium.benefitValuationDesc',
      color: '#16A34A',
      defaultTitle: 'Accurate Valuation',
      defaultDesc: 'Uses 10+ advanced animal physiological and environmental factors.'
    },
    {
      icon: 'brain',
      titleKey: 'estimator.premium.benefitInsightsTitle',
      descKey: 'estimator.premium.benefitInsightsDesc',
      color: '#22C55E',
      defaultTitle: 'AI Insights',
      defaultDesc: 'Dynamic rules generate targeted actions to maximize selling price.'
    },
    {
      icon: 'trending-up',
      titleKey: 'estimator.premium.benefitDemandTitle',
      descKey: 'estimator.premium.benefitDemandDesc',
      color: '#0ea5e9',
      defaultTitle: 'Market Demand',
      defaultDesc: 'Analyzes district-specific trends and seasonality index.'
    },
    {
      icon: 'bullseye-arrow',
      titleKey: 'estimator.premium.benefitRecommendationTitle',
      descKey: 'estimator.premium.benefitRecommendationDesc',
      color: '#eab308',
      defaultTitle: 'Selling Recommendation',
      defaultDesc: 'Actionable tips regarding health, verification, and timing.'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} aria-label="Close premium unlock prompt">
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#16A34A', '#22C55E']}
            style={styles.lockBadge}
          >
            <Ionicons name="flash" size={38} color="#FFFFFF" />
          </LinearGradient>
          
          <AppText style={styles.title}>
            {t('estimator.premium.title', { defaultValue: 'AI Market Price Assistant' })}
          </AppText>
          <AppText style={styles.subtitle}>
            {t('estimator.premium.subtitle', { defaultValue: 'Unlock lifetime access to our advanced livestock valuation engine' })}
          </AppText>
        </View>

        <View style={styles.featuresContainer}>
          {benefits.map((b, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.iconContainer, { backgroundColor: b.color + '15' }]}>
                <MaterialCommunityIcons name={b.icon} size={24} color={b.color} />
              </View>
              <View style={styles.featureText}>
                <AppText style={styles.featureTitle}>
                  {t(b.titleKey, { defaultValue: b.defaultTitle })}
                </AppText>
                <AppText style={styles.featureDesc}>
                  {t(b.descKey, { defaultValue: b.defaultDesc })}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onUnlock} activeOpacity={0.85}>
          <AppText style={styles.primaryBtnText}>
            {t('estimator.premium.unlockBtn', { defaultValue: 'Unlock for ₹1' })}
          </AppText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <AppText style={styles.secondaryBtnText}>
            {t('common.cancel')}
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  lockBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  featureDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  footer: {
    padding: 24,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#94A3B8',
  }
});
