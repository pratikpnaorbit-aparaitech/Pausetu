// SearchSection.js
// Upgraded search panel with local history lists, clean-up features, and automated AI suggestions.

import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

const SMART_SUGGESTIONS = [
  { text: 'Gir Cow', icon: 'cow', category: 'cow' },
  { text: 'Murrah Buffalo', icon: 'cow', category: 'buffalo' },
  { text: 'Osmanabadi Goat', icon: 'sheep', category: 'goat' },
  { text: 'Pune Location', icon: 'map-marker', category: 'location' },
  { text: 'Satara District', icon: 'map-marker', category: 'location' },
  { text: 'Kolhapur Markets', icon: 'map-marker', category: 'location' },
  { text: 'Premium Sellers Only', icon: 'shield-star', category: 'seller' },
  { text: 'Verified Animals only', icon: 'check-decagram', category: 'verified' },
];

export default function SearchSection({ 
  searchText, 
  onChangeSearch, 
  onFilterPress, 
  recentSearches = [], 
  onClearHistory,
  activeFiltersCount = 0 
}) {
  const { t } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Filter AI suggestions matching input characters
  const activeSuggestions = SMART_SUGGESTIONS.filter(item => 
    searchText && item.text.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectSuggestion = (text) => {
    onChangeSearch(text);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('buy.searchCattle', { defaultValue: 'Search cattle, breed, location...' })}
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={(t) => {
              onChangeSearch(t);
              setDropdownVisible(true);
            }}
            onFocus={() => setDropdownVisible(true)}
            onBlur={() => setTimeout(() => setDropdownVisible(false), 250)}
          />
          {searchText ? (
            <TouchableOpacity 
              style={styles.clearSearchBtn} 
              onPress={() => { onChangeSearch(''); setDropdownVisible(false); }} 
              aria-label="Clear Search"
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.voiceSearchBtn} aria-label={t('buy.voiceSearch')}>
              <Ionicons name="mic" size={20} color="#16A34A" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={onFilterPress} 
          aria-label="Filters"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="tune-variant" size={22} color="#FFFFFF" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <AppText style={styles.badgeText}>{activeFiltersCount}</AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Suggestion Dropdown */}
      {dropdownVisible && activeSuggestions.length > 0 && (
        <View style={styles.dropdown}>
          {activeSuggestions.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.dropdownRow} 
              onPress={() => handleSelectSuggestion(item.text)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={item.icon} size={16} color="#16A34A" />
              <AppText style={styles.dropdownText}>{item.text}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent History log */}
      {recentSearches.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <AppText style={styles.historyLabel}>{t('buy.recentSearches')}</AppText>
            <TouchableOpacity onPress={onClearHistory} activeOpacity={0.7}>
              <AppText style={styles.clearBtnText}>{t('buy.reset', { defaultValue: 'Clear History' })}</AppText>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.historyScroll}
          >
            {recentSearches.map((search, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.chip} 
                onPress={() => onChangeSearch(search)}
                activeOpacity={0.8}
              >
                <AppText style={styles.chipText}>{search}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
    zIndex: 20,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  clearSearchBtn: {
    padding: 4,
  },
  voiceSearchBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 8,
    marginTop: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
  },
  historySection: {
    gap: 8,
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  clearBtnText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '800',
  },
  historyScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '700',
  },
});
