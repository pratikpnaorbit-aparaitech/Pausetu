import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';
import CustomHeader from '../../components/CustomHeader';
import { PLANS, PAYMENT_PROVIDERS } from '../../constants/premiumConstants';
import { usePremium } from '../../hooks/usePremium';

export default function PremiumAdvisorPaymentScreen({ onPaymentSuccess, onBack }) {
  const { t } = useTranslation();
  const { subscribe } = usePremium();

  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [selectedProvider, setSelectedProvider] = useState('upi');
  const [processing, setProcessing] = useState(false);

  const activePlan = PLANS.find(p => p.id === selectedPlan) || PLANS[1];

  const handlePay = async () => {
    setProcessing(true);
    try {
      // ₹1 payment process
      const response = await subscribe(selectedPlan, 1, selectedProvider);
      
      if (response.success) {
        Alert.alert(
          t('premiumAdvisor.paymentScreen.successTitle'),
          `${t('premiumAdvisor.paymentScreen.successDesc')}\n\nTxn ID: ${response.transactionId}`,
          [{ text: t('common.continue'), onPress: onPaymentSuccess }]
        );
      } else {
        Alert.alert(
          t('premiumAdvisor.paymentScreen.errorTitle'),
          response.error || t('premiumAdvisor.paymentScreen.errorDesc')
        );
      }
    } catch (err) {
      Alert.alert(t('premiumAdvisor.paymentScreen.errorTitle'), err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
            <CustomHeader
        title={t('premiumAdvisor.paymentScreen.title')}
        onBackPress={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText style={styles.subtitle}>
          {t('premiumAdvisor.paymentScreen.subtitle')}
        </AppText>

        {/* Pricing Cards */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.8}
              >
                <View style={styles.planHeader}>
                  <Ionicons
                    name={plan.icon}
                    size={22}
                    color={isSelected ? '#8B5CF6' : '#64748B'}
                  />
                  <AppText style={[styles.planTitle, isSelected && styles.planTitleActive]}>
                    {t(plan.titleKey)}
                  </AppText>
                </View>
                
                <AppText style={styles.planPrice}>
                  {t(plan.priceKey)}
                </AppText>
                
                <AppText style={styles.planDesc}>
                  {t(plan.descKey)}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gateway Provider Selection */}
        <AppText style={styles.sectionTitle}>
          {t('premiumAdvisor.paymentScreen.selectPaymentMethod')}
        </AppText>
        
        <View style={styles.providersContainer}>
          {PAYMENT_PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <TouchableOpacity
                key={provider.id}
                style={[styles.providerRow, isSelected && styles.providerRowActive]}
                onPress={() => setSelectedProvider(provider.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={provider.logo}
                  size={20}
                  color={isSelected ? '#8B5CF6' : '#64748B'}
                  style={styles.providerIcon}
                />
                <AppText style={[styles.providerName, isSelected && styles.providerNameActive]}>
                  {provider.name}
                </AppText>
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Test mode notice */}
        <View style={styles.configCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
          <AppText style={styles.configText}>
            {t('premiumAdvisor.paymentScreen.testModeNote')}
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText style={styles.secureNote}>
          🔒 {t('premiumAdvisor.paymentScreen.secureNote')}
        </AppText>
        
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <AppText style={styles.payButtonText}>
              {t('premiumAdvisor.paymentScreen.payBtn')} (₹1)
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14.5,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  planCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    elevation: 1,
  },
  planCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
  },
  planTitleActive: {
    color: '#7C3AED',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  planDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    marginTop: 8,
  },
  providersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  providerRowActive: {
    backgroundColor: '#FAF5FF',
  },
  providerIcon: {
    marginRight: 12,
  },
  providerName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  providerNameActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: '#8B5CF6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },
  configCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  configText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  secureNote: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  payButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#C084FC',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  }
});
