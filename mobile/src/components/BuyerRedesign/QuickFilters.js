// QuickFilters.js
// Horizontal quick filter tags containing icons and active state controls.

import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function QuickFilters({ 
  verifiedOnly, setVerifiedOnly, 
  premiumOnly, setPremiumOnly, 
  pregnantOnly, setPregnantOnly, 
  vaccinatedOnly, setVaccinatedOnly,
  onOpenFilters
}) {
  const { t } = useTranslation();

  const FILTER_ITEMS = [
    { id: 'pregnant', label: t('buy.pregnantText', { defaultValue: 'Pregnant' }), icon: 'baby-carriage', active: pregnantOnly },
    { id: 'verified', label: t('buy.verifiedSellers', { defaultValue: 'Verified' }), icon: 'check-decagram', active: verifiedOnly },
    { id: 'vaccinated', label: t('buy.vaccinated', { defaultValue: 'Vaccinated' }), icon: 'needle', active: vaccinatedOnly },
    { id: 'premium', label: t('buy.premiumListings', { defaultValue: 'Premium' }), icon: 'shield-star', active: premiumOnly },
    { id: 'milk', label: t('buy.highestMilk', { defaultValue: 'Milk' }).split(' ')[0], icon: 'cow', active: false },
    { id: 'price', label: t('buy.lowestPrice', { defaultValue: 'Price' }).split(' ')[0], icon: 'cash-multiple', active: false },
    { id: 'distance', label: t('buy.nearest', { defaultValue: 'Distance' }).split(' ')[0], icon: 'map-marker-distance', active: false },
    { id: 'ai', label: t('buy.aiRecommended', { defaultValue: 'AI' }), icon: 'robot', active: false },
  ];

  const handleToggle = (id) => {
    if (id === 'verified') {
      setVerifiedOnly(!verifiedOnly);
    } else if (id === 'premium') {
      setPremiumOnly(!premiumOnly);
    } else if (id === 'pregnant') {
      setPregnantOnly(!pregnantOnly);
    } else if (id === 'vaccinated') {
      setVaccinatedOnly(!vaccinatedOnly);
    } else {
      onOpenFilters();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_ITEMS.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, item.active && styles.chipActive]}
              onPress={() => handleToggle(item.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={15}
                color={item.active ? '#FFFFFF' : '#64748B'}
              />
              <AppText style={[styles.label, item.active && styles.labelActive]}>
                {item.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#475569',
  },
  labelActive: {
    color: '#FFFFFF',
  },
});
