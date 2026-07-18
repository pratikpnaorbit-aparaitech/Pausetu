// BuyerHeader.js
// Header component for the premium livestock marketplace with location tracking and premium indicators.

import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../../context/AppContext';
import { resolveMediaUrl } from '../../../api/api';
import AppText from '../AppText';
import LanguageSelector from '../LanguageSelector';

export default function BuyerHeader({ name, onNavigateToSell, onNavigateToNotifications, onNavigateToProfile }) {
  const { t } = useTranslation();
  const { userProfile } = React.useContext(AppContext);
  const [nearbyActive, setNearbyActive] = useState(true);

  const getInitial = (nameStr) => {
    if (!nameStr || typeof nameStr !== 'string' || !nameStr.trim()) return '?';
    return nameStr.trim().charAt(0).toUpperCase();
  };
  const profileImageUrl = (userProfile?.profilePhoto || userProfile?.photo) ? resolveMediaUrl(userProfile.profilePhoto || userProfile.photo) : null;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Brand/Logo Group */}
        <View style={styles.brandGroup}>
          <View style={styles.logoCircle}>
            <Image source={require('../../../assets/logo-icon.png')} style={styles.logoIconImage} resizeMode="contain" />
          </View>
          <View style={styles.brandTextContainer}>
            <AppText style={styles.brandTitle}>{t('app.name')}</AppText>
            <AppText style={styles.brandSubtitle}>{t('buy.marketplaceCare')}</AppText>
          </View>
        </View>

        {/* Action Group */}
        <View style={styles.actionGroup}>
          <LanguageSelector style={{ marginRight: 8 }} />

          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={onNavigateToNotifications} 
            aria-label="Notifications"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={22} color="#475569" />
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={profileImageUrl ? styles.avatarImageWrap : styles.avatar} 
            onPress={onNavigateToProfile} 
            aria-label="Profile"
            activeOpacity={0.7}
          >
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <AppText style={styles.avatarText}>{getInitial(name)}</AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bar & Nearby Switcher */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.locationWrap} activeOpacity={0.7}>
          <View style={styles.locationIconCircle}>
            <Ionicons name="location" size={16} color="#16A34A" />
          </View>
          <View style={styles.locationInfo}>
            <AppText style={styles.locationText}>Pune, Maharashtra</AppText>
          </View>
          <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, nearbyActive ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => setNearbyActive(!nearbyActive)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={nearbyActive ? 'radar' : 'map-marker-off'} 
            size={15} 
            color={nearbyActive ? '#FFFFFF' : '#64748B'} 
          />
          <AppText style={[styles.toggleText, nearbyActive ? styles.toggleTextActive : styles.toggleTextInactiveText]}>
            {nearbyActive ? t('buy.nearbyOn', { defaultValue: 'Nearby ON' }) : t('buy.showAll', { defaultValue: 'Show All' })}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 10,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'visible',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIconImage: {
    width: 58,
    height: 58,
    overflow: 'visible',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumSellBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sellIcon: {
    marginRight: 4,
  },
  premiumSellText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImageWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconCircle: {
    marginRight: 4,
  },
  locationInfo: {
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
    borderWidth: 1,
  },
  toggleBtnInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextInactiveText: {
    color: '#64748B',
  },
});
