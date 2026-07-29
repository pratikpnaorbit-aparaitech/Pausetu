import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, Modal, Share, Alert, ActivityIndicator, TextInput, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { animalApi } from '../api/animalApi';
import { resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import CustomHeader from '../components/CustomHeader';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { REFRESH_EVENTS } from '../services/refreshManager';

const TABS = ['All', 'Active', 'Pending', 'Sold', 'Rejected'];

const DEFAULT_ANIMAL_FALLBACK = 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?q=80&w=400';

function ImageWithFallback({ uri, style }) {
  const [imgSrc, setImgSrc] = useState(uri ? { uri } : { uri: DEFAULT_ANIMAL_FALLBACK });

  useEffect(() => {
    setImgSrc(uri ? { uri } : { uri: DEFAULT_ANIMAL_FALLBACK });
  }, [uri]);

  return (
    <Image
      source={imgSrc}
      style={style}
      onError={() => setImgSrc({ uri: DEFAULT_ANIMAL_FALLBACK })}
    />
  );
}

export default function MyListingsScreen({ navigation }) {
  const { userProfile, userToken } = useContext(AppContext);
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeMenuListing, setActiveMenuListing] = useState(null);

  // API states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const tabsFlatListRef = useRef(null);
  const isFetchingRef = useRef(false);

  useAutoRefresh(
    () => fetchMyListings(),
    {
      events: [REFRESH_EVENTS.LISTING_CREATED, REFRESH_EVENTS.LISTING_UPDATED, REFRESH_EVENTS.LISTING_DELETED],
      screenKey: 'MyListingsScreen'
    }
  );

  const fetchMyListings = async () => {
    if (!userProfile || !userProfile.id || userToken === 'guest') {
      setListings([]);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    setError(null);
    try {
      const res = await animalApi.getMyListings(userProfile.id);
      if (res.status === 'success' && res.data.animals) {
        setListings(res.data.animals);
      }
    } catch (err) {
      setError(err.message || t('myListings.connectionFailed'));
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (userProfile && userProfile.id && userToken !== 'guest') {
        const res = await animalApi.getMyListings(userProfile.id);
        if (res.status === 'success' && res.data.animals) {
          setListings(res.data.animals);
        }
      }
    } catch (err) {
      console.warn('Pull to refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabPress = (tab, index) => {
    setSelectedTab(tab);
    if (tabsFlatListRef.current) {
      try {
        tabsFlatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (e) {
        // Ignored fallback
      }
    }
  };

  const handleShareListing = async (listing) => {
    try {
      await Share.share({
        message: `Check out my listing for ${listing.title} (${listing.breedId?.name || ''}) on PashuSetu: ₹${listing.price}!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleDeleteListing = (id) => {
    Alert.alert(
      t('myListings.deleteListing'),
      t('myListings.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await animalApi.deleteAnimal(id);
              Alert.alert(t('common.success'), t('myListings.deleteSuccess'));
              fetchMyListings();
            } catch (err) {
              Alert.alert(t('myListings.deleteFailed'), err.message || t('myListings.deleteFailed'));
            }
            setActiveMenuListing(null);
          },
        },
      ]
    );
  };

  const handleMarkAsSold = async (id) => {
    try {
      await animalApi.updateAnimal(id, { status: 'sold' });
      Alert.alert(t('common.success'), t('myListings.markSoldSuccess'));
      fetchMyListings();
    } catch (err) {
      Alert.alert(t('myListings.updateFailed'), err.message || t('myListings.updateFailed'));
    }
    setActiveMenuListing(null);
  };

  const handleNavigateToAddAnimal = () => {
    navigation.navigate('AddAnimal');
  };

  // Tab Count Computation
  const counts = useMemo(() => {
    const c = { All: listings.length, Active: 0, Pending: 0, Sold: 0, Rejected: 0 };
    listings.forEach((item) => {
      const status = item.status?.toLowerCase();
      if (status === 'approved' || status === 'available') c.Active++;
      else if (status === 'pending') c.Pending++;
      else if (status === 'sold') c.Sold++;
      else if (status === 'rejected') c.Rejected++;
    });
    return c;
  }, [listings]);

  // Filtering Logic
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const status = item.status?.toLowerCase();
      let matchesTab = false;
      if (selectedTab === 'All') {
        matchesTab = true;
      } else if ((selectedTab === 'Active' || selectedTab === 'Available') && (status === 'approved' || status === 'available')) {
        matchesTab = true;
      } else if (selectedTab === 'Pending' && status === 'pending') {
        matchesTab = true;
      } else if (selectedTab === 'Sold' && status === 'sold') {
        matchesTab = true;
      } else if (selectedTab === 'Rejected' && status === 'rejected') {
        matchesTab = true;
      }

      const breedName = item.breedId?.name || '';
      const catName = item.categoryId?.name || '';
      const matchesQuery =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        breedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesQuery;
    });
  }, [listings, selectedTab, searchQuery]);

  // Contextual Empty State Configuration
  const emptyStateConfig = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return {
        iconName: 'search-outline',
        title: t('myListings.noSearchResults'),
        subtitle: t('myListings.noSearchResultsSub'),
        showAddButton: false,
      };
    }

    if (listings.length === 0) {
      return {
        iconName: 'clipboard-outline',
        title: t('myListings.noListings'),
        subtitle: t('myListings.noListingsSub'),
        showAddButton: true,
      };
    }

    switch (selectedTab) {
      case 'Active':
      case 'Available':
        return {
          iconName: 'checkmark-circle-outline',
          title: t('myListings.noAvailableListings'),
          subtitle: t('myListings.noAvailableListingsSub'),
          showAddButton: false,
        };
      case 'Pending':
        return {
          iconName: 'time-outline',
          title: t('myListings.noPendingListings'),
          subtitle: t('myListings.noPendingListingsSub'),
          showAddButton: false,
        };
      case 'Sold':
        return {
          iconName: 'pricetag-outline',
          title: t('myListings.noSoldListings'),
          subtitle: t('myListings.noSoldListingsSub'),
          showAddButton: false,
        };
      case 'Rejected':
        return {
          iconName: 'close-circle-outline',
          title: t('myListings.noRejectedListings'),
          subtitle: t('myListings.noRejectedListingsSub'),
          showAddButton: false,
        };
      default:
        return {
          iconName: 'clipboard-outline',
          title: t('myListings.noListings'),
          subtitle: t('myListings.noListingsSub'),
          showAddButton: listings.length === 0,
        };
    }
  }, [searchQuery, listings.length, selectedTab, t]);

  const renderStatusBadge = (status) => {
    let bg, color, label;
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'available':
        bg = '#DCFCE7';
        color = '#16A34A';
        label = t('myListings.active');
        break;
      case 'pending':
        bg = '#FEF3C7';
        color = '#D97706';
        label = t('myListings.pending');
        break;
      case 'sold':
        bg = '#DBEAFE';
        color = '#2563EB';
        label = t('myListings.sold');
        break;
      case 'rejected':
        bg = '#FEE2E2';
        color = '#EF4444';
        label = t('myListings.rejected');
        break;
      default:
        bg = '#F1F5F9';
        color = '#64748B';
        label = status || t('myListings.draft');
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <AppText style={[styles.statusBadgeText, { color }]}>{label}</AppText>
      </View>
    );
  };

  const renderMyListingItem = useCallback(({ item }) => {
    const mainImage = resolveMediaUrl(item?.photos && item.photos.length > 0 ? item.photos[0] : null);

    return (
      <View style={styles.listingCard}>
        <View style={styles.cardHeader}>
          <ImageWithFallback uri={mainImage} style={styles.cardThumbnail} />
          <View style={styles.cardDetails}>
            <View style={styles.titleRow}>
              <AppText style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                {item.title}
              </AppText>
              <TouchableOpacity
                style={styles.threeDotBtn}
                onPress={() => setActiveMenuListing(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <AppText style={styles.cardSubtitle} numberOfLines={1} ellipsizeMode="tail">
              {item.breedId?.name || t('animalDetails.na')} • {item.categoryId?.name || t('buy.categories')}
            </AppText>

            <AppText style={styles.cardPrice} numberOfLines={1}>
              ₹{Number(item.price).toLocaleString()}
            </AppText>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#64748B" style={{ marginRight: 3 }} />
              <AppText style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {item.village}, {item.district}
              </AppText>
            </View>
          </View>
        </View>

        {item.status === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionCard}>
            <AppText style={styles.rejectionLabel}>{t('myListings.rejectionReason')}</AppText>
            <AppText style={styles.rejectionText}>{item.rejectionReason}</AppText>
          </View>
        )}

        <View style={styles.divider} />

        {/* Performance Stats Overlay */}
        <View style={styles.cardPerformanceRow}>
          <View style={styles.perfStat}>
            <Ionicons name="eye-outline" size={14} color="#64748B" />
            <AppText style={styles.perfStatText}>{item.views || 0} {t('sell.views')}</AppText>
          </View>
          {renderStatusBadge(item.status)}
        </View>

        {/* Action buttons inside the card */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleShareListing(item)}>
            <Ionicons name="share-social-outline" size={16} color="#64748B" />
            <AppText style={styles.cardActionBtnLabel}>{t('common.share')}</AppText>
          </TouchableOpacity>
          {item.status?.toLowerCase() !== 'sold' && (
            <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleMarkAsSold(item.id || item._id)}>
              <Ionicons name="checkmark-done-circle-outline" size={16} color="#2563EB" />
              <AppText style={[styles.cardActionBtnLabel, { color: '#2563EB' }]}>{t('myListings.markSold')}</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [t]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>{t('myListings.title')}</AppText>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16A34A" />
          <AppText style={{ marginTop: 12, color: '#64748B' }}>{t('myListings.loading')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>{t('myListings.title')}</AppText>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <AppText style={{ fontSize: 16, fontWeight: '700', marginTop: 16 }}>{t('myListings.connectionFailed')}</AppText>
          <AppText style={{ textAlign: 'center', color: '#64748B', marginTop: 8, marginBottom: 20 }}>{error}</AppText>
          <TouchableOpacity style={styles.addAnimalBtn} onPress={fetchMyListings}>
            <AppText style={styles.addAnimalBtnText}>{t('myListings.retryConnection')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <CustomHeader
        title={
          isSearchActive ? (
            <TextInput
              style={styles.searchInput}
              placeholder={t('myListings.searchPlaceholder')}
              placeholderTextColor="#94A3B8"
              autoFocus={true}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          ) : (
            t('myListings.title')
          )
        }
        onBackPress={() => navigation.goBack()}
        centered={false}
        rightComponent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => {
                setIsSearchActive(!isSearchActive);
                if (isSearchActive) setSearchQuery('');
              }}
            >
              <Ionicons name={isSearchActive ? "close" : "search-outline"} size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Tabs Row - Horizontally Scrollable & Auto-Centering */}
      <View style={styles.tabsContainer}>
        <FlatList
          ref={tabsFlatListRef}
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsScrollContent}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item: tab, index }) => {
            const count = counts[tab] ?? 0;
            const isSelected = selectedTab === tab;
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => handleTabPress(tab, index)}
              >
                <AppText
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.tabText, isSelected && styles.tabTextActive]}
                >
                  {t(`myListings.${tab.toLowerCase()}`)} ({count})
                </AppText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Listings List / Empty State */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id || item._id}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#16A34A']}
            tintColor="#16A34A"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name={emptyStateConfig.iconName} size={46} color="#94A3B8" />
            </View>
            <AppText style={styles.emptyTitle}>{emptyStateConfig.title}</AppText>
            <AppText style={styles.emptySubtitle}>{emptyStateConfig.subtitle}</AppText>
            {emptyStateConfig.showAddButton && (
              <TouchableOpacity style={styles.addAnimalBtn} onPress={handleNavigateToAddAnimal}>
                <AppText style={styles.addAnimalBtnText}>{t('sell.addAnimal')}</AppText>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={renderMyListingItem}
      />

      {/* Slide-Up Bottom Sheet Modal */}
      <Modal
        visible={activeMenuListing !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActiveMenuListing(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveMenuListing(null)}
        >
          <View style={styles.bottomSheetContainer}>
            <View style={styles.dragHandle} />
            <AppText style={styles.bottomSheetTitle}>{t('myListings.manageListing')}</AppText>
            {activeMenuListing && (
              <View style={styles.bottomSheetMetaRow}>
                <ImageWithFallback
                  uri={resolveMediaUrl(activeMenuListing.photos && activeMenuListing.photos.length > 0 ? activeMenuListing.photos[0] : null)}
                  style={styles.bottomSheetThumb}
                />
                <View style={{ flex: 1 }}>
                  <AppText style={styles.bottomSheetListingName} numberOfLines={1}>{activeMenuListing.title}</AppText>
                  <AppText style={styles.bottomSheetListingPrice}>₹{Number(activeMenuListing.price).toLocaleString()}</AppText>
                </View>
              </View>
            )}

            <View style={styles.bottomSheetActionsList}>
              {activeMenuListing && activeMenuListing.status?.toLowerCase() !== 'sold' && (
                <TouchableOpacity style={styles.bottomSheetAction} onPress={() => handleMarkAsSold(activeMenuListing.id || activeMenuListing._id)}>
                  <Ionicons name="checkmark-done" size={20} color="#2563EB" style={styles.actionIcon} />
                  <AppText style={[styles.actionText, { color: '#2563EB' }]}>{t('myListings.markSold')}</AppText>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.bottomSheetAction} onPress={() => activeMenuListing && handleShareListing(activeMenuListing)}>
                <Ionicons name="share-social-outline" size={20} color="#0F172A" style={styles.actionIcon} />
                <AppText style={styles.actionText}>{t('myListings.shareListing')}</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bottomSheetAction, styles.deleteAction]}
                onPress={() => activeMenuListing && handleDeleteListing(activeMenuListing.id || activeMenuListing._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.actionIcon} />
                <AppText style={[styles.actionText, { color: '#EF4444' }]}>{t('myListings.deleteListing')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
  },
  tabButton: {
    minWidth: 92,
    height: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
    paddingVertical: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 24,
    lineHeight: 20,
  },
  addAnimalBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  addAnimalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  cardThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 14,
  },
  cardDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 22,
  },
  threeDotBtn: {
    padding: 4,
    marginLeft: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  cardPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  rejectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  rejectionText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardPerformanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfStatText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 10,
  },
  cardActionBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  cardActionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  bottomSheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
  },
  bottomSheetThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
  },
  bottomSheetListingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomSheetListingPrice: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  bottomSheetActionsList: {
    gap: 10,
  },
  bottomSheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 6,
  },
});
