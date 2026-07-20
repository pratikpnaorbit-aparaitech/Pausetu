import React, { useContext, useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../api/api';
import AppText from '../components/AppText';
import { usePremium } from '../hooks/usePremium';
import DashboardPremiumCard from '../components/PremiumAdvisor/DashboardPremiumCard';
import PremiumBadge from '../components/PremiumAdvisor/PremiumBadge';
import PremiumAdvisorContainer from './PremiumAdvisor/PremiumAdvisorContainer';

export default function HomeScreen() {
  const { userProfile, userToken } = useContext(AppContext);
  const { t } = useTranslation();
  const isGuest = userToken === 'guest';
  const name = isGuest ? t('profile.guestUser') : userProfile?.name || 'User';
  const role = isGuest ? t('profile.guestMode') : userProfile?.role || t('profile.farmer');

  const getInitial = (nameStr) => {
    if (!nameStr || typeof nameStr !== 'string' || !nameStr.trim()) return '?';
    return nameStr.trim().charAt(0).toUpperCase();
  };
  const userInitial = getInitial(name);
  const profileImageUrl = (userProfile?.profilePhoto || userProfile?.photo) ? resolveMediaUrl(userProfile.profilePhoto || userProfile.photo) : null;

  const { isPremium } = usePremium();
  const [showPremiumAdvisor, setShowPremiumAdvisor] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Header Card */}
        <LinearGradient colors={isPremium ? ['#7F00FF', '#E100FF'] : ['#11998e', '#38ef7d']} style={styles.headerCard}>
          <View style={styles.profileRow}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <AppText style={styles.avatarText}>{userInitial}</AppText>
              </View>
            )}
            <View style={styles.profileDetails}>
              <AppText style={styles.welcomeText}>{t('home.welcomeBack')}</AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText style={styles.nameText}>{name}</AppText>
                {isPremium && <PremiumBadge style={{ marginLeft: 6 }} />}
              </View>
              <AppText style={styles.roleBadge}>{role}</AppText>
            </View>
          </View>
        </LinearGradient>

        <DashboardPremiumCard
          isPremium={isPremium}
          onPress={() => setShowPremiumAdvisor(true)}
        />

        {/* Dashboard Title */}
        <AppText style={styles.sectionTitle}>{t('home.quickActions')}</AppText>

        {/* Action Grid */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="cow" size={32} color="#00E676" style={styles.gridIcon} />
            <AppText style={styles.gridLabel}>{t('home.cattleMarket')}</AppText>
            <AppText style={styles.gridDesc}>{t('home.cattleMarketDesc')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="stethoscope" size={32} color="#00E676" style={styles.gridIcon} />
            <AppText style={styles.gridLabel}>{t('home.consultVet')}</AppText>
            <AppText style={styles.gridDesc}>{t('home.consultVetDesc')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="sprout" size={32} color="#00E676" style={styles.gridIcon} />
            <AppText style={styles.gridLabel}>{t('home.animalFeed')}</AppText>
            <AppText style={styles.gridDesc}>{t('home.animalFeedDesc')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard}>
            <MaterialCommunityIcons name="weather-partly-cloudy" size={32} color="#00E676" style={styles.gridIcon} />
            <AppText style={styles.gridLabel}>{t('home.agriWeather')}</AppText>
            <AppText style={styles.gridDesc}>{t('home.agriWeatherDesc')}</AppText>
          </TouchableOpacity>
        </View>

        {/* Recent Updates - shows real notifications when available */}
        <AppText style={styles.sectionTitle}>{t('home.recentUpdates')}</AppText>
        <View style={styles.emptyUpdatesCard}>
          <MaterialCommunityIcons name="bell-outline" size={28} color="rgba(255,255,255,0.3)" />
          <AppText style={styles.emptyUpdatesText}>{t('home.noRecentUpdates')}</AppText>
          <AppText style={styles.emptyUpdatesDesc}>{t('home.noRecentUpdatesDesc')}</AppText>
        </View>
      </ScrollView>

      <PremiumAdvisorContainer
        visible={showPremiumAdvisor}
        onClose={() => setShowPremiumAdvisor(false)}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F2027',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#38ef7d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileDetails: {
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  gridIcon: {
    marginBottom: 12,
  },
  gridLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gridDesc: {
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 4,
  },
  emptyUpdatesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyUpdatesText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyUpdatesDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
