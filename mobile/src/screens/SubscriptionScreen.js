import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import CustomHeader from '../components/CustomHeader';
import { getActivePlans, getSubscriptionStatus, createRazorpayOrder, verifyPayment } from '../api/subscriptionApi';

const { width } = Dimensions.get('window');

export default function SubscriptionScreen({ navigation }) {
  const { t } = useTranslation();

  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        getActivePlans(),
        getSubscriptionStatus().catch(() => null)
      ]);

      if (plansRes && plansRes.data && plansRes.data.plans) {
        setPlans(plansRes.data.plans);
        const rec = plansRes.data.plans.find(p => p.badge && p.badge.toLowerCase().includes('recommend')) || plansRes.data.plans[0];
        if (rec) setSelectedPlanId(rec._id);
      }

      if (statusRes && statusRes.data) {
        setSubscriptionStatus(statusRes.data);
      }
    } catch (err) {
      console.error('[SubscriptionScreen] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async (plan) => {
    setProcessing(true);
    try {
      // 1. Call Backend to Create Razorpay Order
      const orderRes = await createRazorpayOrder(plan._id);
      if (!orderRes || !orderRes.data) {
        throw new Error('Failed to create payment order from server.');
      }

      const orderData = orderRes.data;

      // 2. Prepare official Razorpay options
      const options = {
        description: `Subscription: ${orderData.plan.name}`,
        image: 'https://pashusetu.com/logo.png',
        currency: orderData.currency || 'INR',
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        name: 'PashuSetu Premium',
        order_id: orderData.orderId,
        prefill: {
          email: orderData.user?.email || '',
          contact: orderData.user?.mobile || '',
          name: orderData.user?.name || ''
        },
        theme: { color: '#7C3AED' }
      };

      // 3. Launch Official Razorpay Checkout widget
      if (Platform.OS === 'web') {
        const loadScript = () => {
          return new Promise((resolve) => {
            if (typeof window !== 'undefined' && window.Razorpay) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const loaded = await loadScript();
        if (!loaded) {
          throw new Error('Failed to load official Razorpay Checkout SDK script.');
        }

        const rzpOptions = {
          ...options,
          handler: function (response) {
            handlePaymentSuccess(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              orderData.plan.id
            );
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
              Alert.alert('Payment Cancelled', 'You cancelled the payment transaction.');
            }
          }
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.open();
      } else {
        // Native Platforms (Android / iOS): Use react-native-razorpay SDK
        let RazorpayCheckout;
        try {
          RazorpayCheckout = require('react-native-razorpay').default || require('react-native-razorpay');
        } catch (e) {
          RazorpayCheckout = require('react-native-razorpay');
        }

        RazorpayCheckout.open(options)
          .then((data) => {
            handlePaymentSuccess(
              data.razorpay_payment_id,
              data.razorpay_order_id,
              data.razorpay_signature,
              orderData.plan.id
            );
          })
          .catch((error) => {
            setProcessing(false);
            if (error && (error.code === 2 || error.code === '2' || error.description?.includes('cancelled'))) {
              Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
            } else {
              Alert.alert('Payment Error', error.description || error.message || 'Payment could not be completed.');
            }
          });
      }
    } catch (err) {
      setProcessing(false);
      Alert.alert(t('common.error') || 'Error', err.message || 'Failed to initialize payment order');
    }
  };

  const handlePaymentSuccess = async (paymentId, orderId, signature, planId) => {
    setProcessing(true);
    try {
      // Send payment credentials to backend for HMAC verification & subscription activation
      const result = await verifyPayment({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        planId: planId
      });

      if (result && result.status === 'success') {
        Alert.alert(
          '🎉 Premium Activated!',
          'Congratulations! Your PashuSetu Premium membership has been activated successfully.',
          [{ text: 'Awesome!', onPress: () => loadData() }]
        );
      }
    } catch (err) {
      Alert.alert('Verification Failed', err.message || 'Could not verify Razorpay signature');
    } finally {
      setProcessing(false);
    }
  };

  const selectedPlan = plans.find(p => p._id === selectedPlanId) || plans[0];

  const hasActiveSubscription = !!(
    subscriptionStatus &&
    subscriptionStatus.isPremium === true &&
    (subscriptionStatus.daysRemaining > 0 || (subscriptionStatus.premiumExpiresAt && new Date(subscriptionStatus.premiumExpiresAt) > new Date()))
  );

  const featureLabels = {
    unlimited_listings: 'Unlimited Animal Listings',
    ai_feed_planner: 'AI Feed Planner Access',
    cow_estimator: 'Cow Price Estimator',
    featured_listings: 'Featured Listing Badges',
    premium_badge: 'Verified Premium Farmer Badge',
    priority_support: '24/7 Priority Support',
    future_premium_features: 'Future Premium Features & Analytics'
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <AppText style={styles.loadingText}>Loading Subscription Details...</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title="Premium Membership"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {hasActiveSubscription ? (
          /* =========================================================
           * ACTIVE PREMIUM SUBSCRIPTION VIEW (HIDE PLAN LIST & PAY BUTTON)
           * ========================================================= */
          <View style={styles.activeSubscriptionContainer}>
            {/* Hero Card */}
            <View style={styles.activeHeroCard}>
              <View style={styles.activeCrownCircle}>
                <Ionicons name="ribbon-sharp" size={36} color="#F59E0B" />
              </View>
              <View style={styles.activeBadgePill}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <AppText style={styles.activeBadgeText}>ACTIVE MEMBERSHIP</AppText>
              </View>
              <AppText style={styles.activePlanName}>
                {subscriptionStatus?.subscription?.planId?.name || 'PashuSetu Premium'}
              </AppText>
              <AppText style={styles.activePlanSubtitle}>
                Your premium membership is active and all features are unlocked across the app.
              </AppText>
            </View>

            {/* Key Subscription Info Card */}
            <View style={styles.detailsCard}>
              <AppText style={styles.detailsCardTitle}>Subscription Overview</AppText>
              
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="calendar-outline" size={18} color="#64748B" />
                  <AppText style={styles.detailLabel}>Expiration Date</AppText>
                </View>
                <AppText style={styles.detailValue}>
                  {new Date(subscriptionStatus.premiumExpiresAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </AppText>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <AppText style={styles.detailLabel}>Time Remaining</AppText>
                </View>
                <View style={styles.daysRemainingPill}>
                  <AppText style={styles.daysRemainingText}>
                    {subscriptionStatus.daysRemaining} Days
                  </AppText>
                </View>
              </View>

              {subscriptionStatus?.subscription?.startDate && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Ionicons name="sparkles-outline" size={18} color="#64748B" />
                    <AppText style={styles.detailLabel}>Member Since</AppText>
                  </View>
                  <AppText style={styles.detailValue}>
                    {new Date(subscriptionStatus.subscription.startDate).toLocaleDateString()}
                  </AppText>
                </View>
              )}
            </View>

            {/* Unlocked Benefits */}
            <View style={styles.activeFeaturesCard}>
              <AppText style={styles.activeFeaturesTitle}>Included Premium Benefits</AppText>
              {(subscriptionStatus?.subscription?.planId?.features || [
                'unlimited_listings',
                'ai_feed_planner',
                'cow_estimator',
                'featured_listings',
                'premium_badge',
                'priority_support'
              ]).map((featKey, idx) => (
                <View key={idx} style={styles.activeFeatureRow}>
                  <View style={styles.activeCheckCircle}>
                    <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
                  </View>
                  <AppText style={styles.activeFeatureLabel}>
                    {featureLabels[featKey] || featKey.replace(/_/g, ' ')}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* =========================================================
           * NON-PREMIUM / EXPIRED PLAN SELECTION VIEW
           * ========================================================= */
          <>
            {/* Banner Header */}
            <View style={styles.heroCard}>
              <View style={styles.crownIconCircle}>
                <Ionicons name="ribbon-sharp" size={32} color="#F59E0B" />
              </View>
              <AppText style={styles.heroTitle}>Unlock PashuSetu Premium</AppText>
              <AppText style={styles.heroSubtitle}>
                Grow your livestock business with unlimited listings, AI feed advisor & price estimators.
              </AppText>
            </View>

            {/* Dynamic Plan Selector Cards */}
            <AppText style={styles.sectionTitle}>Choose Your Plan</AppText>
            <View style={styles.plansGrid}>
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan._id;
                const savingsPercent = plan.originalPrice
                  ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
                  : 0;

                return (
                  <TouchableOpacity
                    key={plan._id}
                    style={[styles.planCard, isSelected && styles.planCardActive]}
                    onPress={() => setSelectedPlanId(plan._id)}
                    activeOpacity={0.85}
                  >
                    {plan.badge ? (
                      <View style={[styles.badgeTag, isSelected && styles.badgeTagActive]}>
                        <AppText style={styles.badgeTagText}>{plan.badge.toUpperCase()}</AppText>
                      </View>
                    ) : null}

                    <AppText style={[styles.planName, isSelected && styles.planNameActive]}>
                      {plan.name}
                    </AppText>

                    <View style={styles.priceRow}>
                      <AppText style={styles.currencySymbol}>₹</AppText>
                      <AppText style={styles.priceAmount}>{plan.price}</AppText>
                      {plan.originalPrice ? (
                        <AppText style={styles.originalPrice}>₹{plan.originalPrice}</AppText>
                      ) : null}
                    </View>

                    {savingsPercent > 0 && (
                      <View style={styles.savingsPill}>
                        <AppText style={styles.savingsText}>SAVE {savingsPercent}%</AppText>
                      </View>
                    )}

                    <AppText style={styles.durationText}>
                      Valid for {plan.durationDays} Days
                    </AppText>

                    <View style={[styles.radioDot, isSelected && styles.radioDotActive]}>
                      {isSelected && <View style={styles.radioDotInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Feature List of Selected Plan */}
            {selectedPlan && (
              <View style={styles.featuresCard}>
                <AppText style={styles.featuresCardTitle}>Features included in {selectedPlan.name}:</AppText>
                
                {(selectedPlan.features || []).map((featKey, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                    <AppText style={styles.featureLabel}>
                      {featureLabels[featKey] || featKey.replace(/_/g, ' ')}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

      </ScrollView>

      {/* Footer Payment Action (Render ONLY for Non-Premium / Expired users) */}
      {!hasActiveSubscription && selectedPlan && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <AppText style={styles.footerPrice}>₹{selectedPlan.price}</AppText>
            <AppText style={styles.footerDuration}> / {selectedPlan.durationDays} Days</AppText>
          </View>

          <TouchableOpacity
            style={[styles.buyBtn, processing && styles.buyBtnDisabled]}
            onPress={() => handleBuyPlan(selectedPlan)}
            disabled={processing}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <AppText style={styles.buyBtnText}>Subscribe Now 🚀</AppText>
            )}
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600'
  },
  scrollContent: {
    padding: 16
  },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  crownIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 18
  },
  activeSubCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  activeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  activeSubTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 8
  },
  activeSubDesc: {
    fontSize: 13,
    color: '#047857'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  planCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    position: 'relative'
  },
  planCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF'
  },
  badgeTag: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#64748B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  badgeTagActive: {
    backgroundColor: '#7C3AED'
  },
  badgeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  planName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4
  },
  planNameActive: {
    color: '#6D28D9'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginRight: 6
  },
  originalPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through'
  },
  savingsPill: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6
  },
  savingsText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706'
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  radioDot: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioDotActive: {
    borderColor: '#7C3AED'
  },
  radioDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#7C3AED'
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20
  },
  featuresCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  featureLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0'
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  footerPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A'
  },
  footerDuration: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
  },
  buyBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12
  },
  buyBtnDisabled: {
    backgroundColor: '#A78BFA'
  },
  buyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  /* Active Subscription View Styles */
  activeSubscriptionContainer: {
    paddingBottom: 24
  },
  activeHeroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16
  },
  activeCrownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5
  },
  activePlanName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center'
  },
  activePlanSubtitle: {
    fontSize: 13,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16
  },
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 13.5,
    color: '#475569',
    fontWeight: '600',
    marginLeft: 8
  },
  detailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A'
  },
  daysRemainingPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8
  },
  daysRemainingText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047857'
  },
  activeFeaturesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16
  },
  activeFeaturesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14
  },
  activeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  activeCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  activeFeatureLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B'
  }
});
