import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';

export default function PremiumAdvisorLockScreen({ onUnlock, onClose }) {
  const { t } = useTranslation();

  const features = [
    {
      icon: 'cow',
      titleKey: 'premiumAdvisor.lockScreen.featureMilkTitle',
      descKey: 'premiumAdvisor.lockScreen.featureMilkDesc',
      color: '#10B981'
    },
    {
      icon: 'stethoscope',
      titleKey: 'premiumAdvisor.lockScreen.featureHealthTitle',
      descKey: 'premiumAdvisor.lockScreen.featureHealthDesc',
      color: '#3B82F6'
    },
    {
      icon: 'chat-processing-outline',
      titleKey: 'premiumAdvisor.lockScreen.featureLimitlessTitle',
      descKey: 'premiumAdvisor.lockScreen.featureLimitlessDesc',
      color: '#8B5CF6'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#7C3AED', '#C084FC']}
            style={styles.lockBadge}
          >
            <Ionicons name="lock-closed" size={36} color="#FFFFFF" />
          </LinearGradient>
          
          <AppText style={styles.title}>
            {t('premiumAdvisor.lockScreen.title')}
          </AppText>
          <AppText style={styles.subtitle}>
            {t('premiumAdvisor.lockScreen.subtitle')}
          </AppText>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.iconContainer, { backgroundColor: f.color + '15' }]}>
                <MaterialCommunityIcons name={f.icon} size={24} color={f.color} />
              </View>
              <View style={styles.featureText}>
                <AppText style={styles.featureTitle}>{t(f.titleKey)}</AppText>
                <AppText style={styles.featureDesc}>{t(f.descKey)}</AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onUnlock} activeOpacity={0.85}>
          <AppText style={styles.primaryBtnText}>
            {t('premiumAdvisor.lockScreen.unlockBtn')}
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
    marginVertical: 20,
  },
  lockBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15.5,
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
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
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
