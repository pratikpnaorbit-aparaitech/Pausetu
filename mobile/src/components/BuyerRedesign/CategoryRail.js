// CategoryRail.js
// Sidebar vertical rail for animal category navigation in the Buyer page.

import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

const PREMIUM_CATEGORIES = [
  { id: 'cow', nameKey: 'buy.cow', image: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=150&q=80', count: 42 },
  { id: 'buffalo', nameKey: 'buy.buffalo', image: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=150&q=80', count: 28 },
  { id: 'goat', nameKey: 'buy.goat', image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=150&q=80', count: 19 },
  { id: 'sheep', nameKey: 'buy.sheep', image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=150&q=80', count: 12 },
  { id: 'horse', nameKey: 'buy.horse', image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=150&q=80', count: 8 },
  { id: 'camel', nameKey: 'buy.camel', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=150&q=80', count: 3 },
  { id: 'pig', nameKey: 'buy.pig', image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=150&q=80', count: 5 },
  { id: 'chicken', nameKey: 'buy.chicken', image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=150&q=80', count: 64 },
];

export default function CategoryRail({ selected, onSelect }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {PREMIUM_CATEGORIES.map((cat) => {
          const isSelected = selected.toLowerCase() === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.railCard, isSelected && styles.railCardActive]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.85}
            >
              <View style={styles.imgWrapper}>
                <Image source={{ uri: cat.image }} style={styles.railImg} />
                <View style={styles.indicatorGreen} />
              </View>
              <AppText style={[styles.railLabel, isSelected && styles.railLabelActive]} numberOfLines={1}>
                {t(cat.nameKey).split(' ')[0]}
              </AppText>
              <AppText style={styles.railCount}>{cat.count}</AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 76,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    zIndex: 5,
  },
  scrollContent: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 14,
  },
  railCard: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  railCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
  },
  imgWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  railImg: {
    width: '100%',
    height: '100%',
  },
  indicatorGreen: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  railLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  railLabelActive: {
    color: '#16A34A',
    fontWeight: '800',
  },
  railCount: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
});
