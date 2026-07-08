import React, { useState, useEffect, useContext, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, Modal, Share, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { animalApi } from '../api/animalApi';

const TABS = ['All', 'Active', 'Pending', 'Sold', 'Rejected'];

export default function MyListingsScreen({ navigation }) {
  const { userProfile, userToken } = useContext(AppContext);
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeMenuListing, setActiveMenuListing] = useState(null);

  // API states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyListings();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchMyListings();
    });

    return unsubscribe;
  }, [navigation, userProfile]);

  const fetchMyListings = async () => {
    if (!userProfile || !userProfile.id || userToken === 'guest') {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Query animal listings by sellerId
      const res = await animalApi.getMyListings(userProfile.id);
      if (res.status === 'success' && res.data.animals) {
        setListings(res.data.animals);
      }
    } catch (err) {
      setError(err.message || 'Failed to load seller listings.');
    } finally {
      setLoading(false);
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
      'Delete Listing',
      'Are you sure you want to permanently delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await animalApi.deleteAnimal(id);
              Alert.alert('Success', 'Listing deleted successfully.');
              fetchMyListings();
            } catch (err) {
              Alert.alert('Delete Failed', err.message || 'Could not delete listing.');
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
      Alert.alert('Listing Updated', 'Your listing is now marked as Sold.');
      fetchMyListings();
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update listing.');
    }
    setActiveMenuListing(null);
  };

  const handleNavigateToAddAnimal = () => {
    navigation.navigate('AddAnimal');
  };

  // Filtering Logic
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // 1. Tab Status Mapping
      const status = item.status?.toLowerCase();
      let matchesTab = false;
      if (selectedTab === 'All') {
        matchesTab = true;
      } else if (selectedTab === 'Active' && status === 'approved') {
        matchesTab = true;
      } else if (selectedTab === 'Pending' && status === 'pending') {
        matchesTab = true;
      } else if (selectedTab === 'Sold' && status === 'sold') {
        matchesTab = true;
      } else if (selectedTab === 'Rejected' && status === 'rejected') {
        matchesTab = true;
      }

      // 2. Search Query Mapping
      const breedName = item.breedId?.name || '';
      const catName = item.categoryId?.name || '';
      const matchesQuery =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        breedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesQuery;
    });
  }, [listings, selectedTab, searchQuery]);

  const renderStatusBadge = (status) => {
    let bg, color, label;
    switch (status?.toLowerCase()) {
      case 'approved':
        bg = '#DCFCE7';
        color = '#16A34A';
        label = 'Active';
        break;
      case 'pending':
        bg = '#FEF3C7';
        color = '#D97706';
        label = 'Pending';
        break;
      case 'sold':
        bg = '#DBEAFE';
        color = '#2563EB';
        label = 'Sold';
        break;
      case 'rejected':
        bg = '#FEE2E2';
        color = '#EF4444';
        label = 'Rejected';
        break;
      default:
        bg = '#F1F5F9';
        color = '#64748B';
        label = status || 'Draft';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Listings</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading your listings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Listings</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={48} color="var(--color-danger)" />
          <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 16 }}>Connection Failed</Text>
          <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, marginBottom: 20 }}>{error}</Text>
          <TouchableOpacity style={styles.addAnimalBtn} onPress={fetchMyListings}>
            <Text style={styles.addAnimalBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        {isSearchActive ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor="#94A3B8"
            autoFocus={true}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        ) : (
          <Text style={styles.headerTitle}>My Listings</Text>
        )}

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
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Listings List / Empty State */}
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id || item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-search-outline" size={50} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>You haven't listed any animals yet.</Text>
            <Text style={styles.emptySubtitle}>Start selling your animal on PashuSetu today!</Text>
            <TouchableOpacity style={styles.addAnimalBtn} onPress={handleNavigateToAddAnimal}>
              <Text style={styles.addAnimalBtnText}>Add Animal</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const mainImage = item.photos && item.photos.length > 0
            ? (item.photos[0].startsWith('http') ? item.photos[0] : `http://10.0.2.2:5000${item.photos[0]}`)
            : 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80';

          return (
            <View style={styles.listingCard}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: mainImage }} style={styles.cardThumbnail} />
                <View style={styles.cardDetails}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <TouchableOpacity
                      style={styles.threeDotBtn}
                      onPress={() => setActiveMenuListing(item)}
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardSubtitle}>{item.breedId?.name || 'Other Breed'} • {item.categoryId?.name || 'Cattle'}</Text>
                  <Text style={styles.cardPrice}>₹{Number(item.price).toLocaleString()}</Text>
                  
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color="#64748B" />
                    <Text style={styles.locationText} numberOfLines={1}>{item.village}, {item.district}</Text>
                  </View>
                </View>
              </View>

              {item.status === 'rejected' && item.rejectionReason && (
                <View style={styles.rejectionCard}>
                  <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                  <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Performance Stats Overlay */}
              <View style={styles.cardPerformanceRow}>
                <View style={styles.perfStat}>
                  <Ionicons name="eye-outline" size={14} color="#64748B" />
                  <Text style={styles.perfStatText}>{item.views || 0} Views</Text>
                </View>
                {renderStatusBadge(item.status)}
              </View>

              {/* Action buttons inside the card */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleShareListing(item)}>
                  <Ionicons name="share-social-outline" size={16} color="#64748B" />
                  <Text style={styles.cardActionBtnLabel}>Share</Text>
                </TouchableOpacity>
                {item.status?.toLowerCase() !== 'sold' && (
                  <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleMarkAsSold(item.id || item._id)}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color="#2563EB" />
                    <Text style={[styles.cardActionBtnLabel, { color: '#2563EB' }]}>Mark Sold</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
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
            <Text style={styles.bottomSheetTitle}>Manage Listing</Text>
            {activeMenuListing && (
              <View style={styles.bottomSheetMetaRow}>
                <Image
                  source={{ uri: activeMenuListing.photos && activeMenuListing.photos.length > 0 ? activeMenuListing.photos[0] : 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80' }}
                  style={styles.bottomSheetThumb}
                />
                <View>
                  <Text style={styles.bottomSheetListingName}>{activeMenuListing.title}</Text>
                  <Text style={styles.bottomSheetListingPrice}>₹{Number(activeMenuListing.price).toLocaleString()}</Text>
                </View>
              </View>
            )}

            <View style={styles.bottomSheetActionsList}>
              {activeMenuListing && activeMenuListing.status?.toLowerCase() !== 'sold' && (
                <TouchableOpacity style={styles.bottomSheetAction} onPress={() => handleMarkAsSold(activeMenuListing.id || activeMenuListing._id)}>
                  <Ionicons name="checkmark-done" size={20} color="#2563EB" style={styles.actionIcon} />
                  <Text style={[styles.actionText, { color: '#2563EB' }]}>Mark as Sold</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.bottomSheetAction} onPress={() => activeMenuListing && handleShareListing(activeMenuListing)}>
                <Ionicons name="share-social-outline" size={20} color="#0F172A" style={styles.actionIcon} />
                <Text style={styles.actionText}>Share Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bottomSheetAction, styles.deleteAction]}
                onPress={() => activeMenuListing && handleDeleteListing(activeMenuListing.id || activeMenuListing._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" style={styles.actionIcon} />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete Listing</Text>
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
  headerBackBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
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
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#16A34A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    padding: 14,
    marginBottom: 16,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  threeDotBtn: {
    padding: 4,
    marginLeft: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    gap: 12,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  cardActionBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
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
