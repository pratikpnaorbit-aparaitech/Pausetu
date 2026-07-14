// HorizontalCategories.js
// Horizontal category list selector optimized for Maharashtra livestock: Cow, Buffalo, Goat, Sheep, Bull, Calf, Bullock, Other.

import React from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

const PREMIUM_CATEGORIES = [
  { id: 'cow', nameKey: 'buy.cow', image: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=150&q=80', count: 482 },
  { id: 'buffalo', nameKey: 'buy.buffalo', image: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=150&q=80', count: 367 },
  { id: 'goat', nameKey: 'buy.goat', image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=150&q=80', count: 519 },
  { id: 'sheep', nameKey: 'buy.sheep', image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=150&q=80', count: 203 },
  { id: 'bull', nameKey: 'buy.bull', image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=150&q=80', count: 128 },
  { id: 'calf', nameKey: 'buy.calf', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=150&q=80', count: 89 },
  { id: 'bullock', nameKey: 'buy.bullock', image: 'https://images.unsplash.com/photo-1605117882932-f9e32b1bfea4?auto=format&fit=crop&w=150&q=80', count: 95 },
  { id: 'other', nameKey: 'buy.other', image: 'https://images.unsplash.com/photo-1534067783941-51c9c23eccfd?auto=format&fit=crop&w=150&q=80', count: 112 },
];

export default function HorizontalCategories({ selected, onSelect }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.sectionTitle}>{t('buy.browseCategories', { defaultValue: 'Animal Types' })}</AppText>
        <TouchableOpacity activeOpacity={0.7}>
          <AppText style={styles.viewAllText}>{t('common.viewAll', { defaultValue: 'View All' })}</AppText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PREMIUM_CATEGORIES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = selected.toLowerCase() === item.id;
          return (
            <TouchableOpacity
              style={[styles.card, isSelected && styles.cardActive]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.imgWrap}>
                <Image source={{ uri: item.image }} style={styles.img} />
                {isSelected && <View style={styles.indicator} />}
              </View>
              <View style={styles.meta}>
                <AppText style={[styles.name, isSelected && styles.nameActive]}>
                  {t(item.nameKey).replace(/🐄|🐂|🍼|🐾/g, '').trim()}
                </AppText>
                <AppText style={[styles.count, isSelected && styles.countActive]}>
                  {item.count}+ {t('buy.activeListings', { defaultValue: 'listings' }).includes('Listings') ? 'listings' : 'सूची'}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 145,
    gap: 10,
  },
  cardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  imgWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  meta: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#334155',
  },
  nameActive: {
    color: '#15803D',
  },
  count: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 1,
  },
  countActive: {
    color: '#16A34A',
  },
});
