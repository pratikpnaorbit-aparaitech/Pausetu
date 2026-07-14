import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function PremiumBadge({ style, size = 'small' }) {
  const { t } = useTranslation();
  
  const isLarge = size === 'large';
  
  return (
    <View style={[
      styles.badge, 
      isLarge ? styles.largeBadge : styles.smallBadge,
      style
    ]}>
      <Ionicons 
        name="star" 
        size={isLarge ? 14 : 11} 
        color="#D97706" 
        style={styles.icon} 
      />
      <AppText style={[
        styles.text, 
        isLarge ? styles.largeText : styles.smallText
      ]}>
        {t('premiumAdvisor.membership.activeStatus')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
  },
  smallBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  largeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '800',
    color: '#D97706',
  },
  smallText: {
    fontSize: 10,
  },
  largeText: {
    fontSize: 12.5,
  }
});
