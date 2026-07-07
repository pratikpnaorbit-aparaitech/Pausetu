import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, Modal, TextInput, Share, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const MOCK_MY_LISTINGS = [
  {
    id: '1',
    name: 'HF Cross Cow',
    category: 'Cow',
    breed: 'Holstein Friesian',
    price: '₹55,000',
    postedDate: 'Posted on 20 June 2026',
    views: 312,
    favorites: 18,
    status: 'Active',
    location: 'Baramati, Pune',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '2',
    name: 'Murrah Buffalo',
    category: 'Buffalo',
    breed: 'Pure Murrah',
    price: '₹85,000',
    postedDate: 'Posted on 18 June 2026',
    views: 450,
    favorites: 24,
    status: 'Active',
    location: 'Hassan, Karnataka',
    image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '3',
    name: 'Tharparkar Cow',
    category: 'Cow',
    breed: 'Tharparkar',
    price: '₹52,000',
    postedDate: 'Posted on 25 June 2026',
    views: 12,
    favorites: 2,
    status: 'Pending',
    location: 'Saswad, Pune',
    image: 'https://images.unsplash.com/photo-1527153857715-3908f2bacb31?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '4',
    name: 'Jamnapari Goat',
    category: 'Goat',
    breed: 'Jamnapari',
    price: '₹14,000',
    postedDate: 'Posted on 10 June 2026',
    views: 620,
    favorites: 42,
    status: 'Sold',
    location: 'Hadapsar, Pune',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: '5',
    name: 'Sahiwal Bull',
    category: 'Cow',
    breed: 'Sahiwal',
    price: '₹75,000',
    postedDate: 'Posted on 02 June 2026',
    views: 95,
    favorites: 5,
    status: 'Rejected',
    location: 'Sikar, Rajasthan',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80',
  },
];

const TABS = ['All', 'Active', 'Pending', 'Sold'];

export default function MyListingsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeMenuListing, setActiveMenuListing] = useState(null); // Listing selected for bottom sheet
  const [inventoryList, setInventoryList] = useState(MOCK_MY_LISTINGS);

  const filteredListings = useMemo(() => {
    return inventoryList.filter((item) => {
      // 1. Filter by Tab
      const matchesTab =
        selectedTab === 'All' ||
        (selectedTab === 'Active' && item.status === 'Active') ||
        (selectedTab === 'Pending' && item.status === 'Pending') ||
        (selectedTab === 'Sold' && item.status === 'Sold');

      // 2. Filter by Search Query
      const matchesQuery =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesQuery;
    });
  }, [inventoryList, selectedTab, searchQuery]);

  const handleShareListing = async (listing) => {
    try {
      await Share.share({
        message: `Check out my listing for ${listing.name} (${listing.breed}) on PashuSetu: ${listing.price}!`,
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
          onPress: () => {
            setInventoryList(inventoryList.filter((item) => item.id !== id));
            setActiveMenuListing(null);
          },
        },
      ]
    );
  };

  const handleMarkAsSold = (id) => {
    setInventoryList(
      inventoryList.map((item) =>
        item.id === id ? { ...item, status: 'Sold' } : item
      )
    );
    setActiveMenuListing(null);
    Alert.alert('Listing Updated', 'Your listing is now marked as Sold.');
  };

  const handleDuplicateListing = (listing) => {
    const duplicated = {
      ...listing,
      id: Date.now().toString(),
      name: `${listing.name} (Copy)`,
      views: 0,
      favorites: 0,
      postedDate: `Posted on today`,
    };
    setInventoryList([duplicated, ...inventoryList]);
    setActiveMenuListing(null);
    Alert.alert('Listing Duplicated', 'A copy of this listing has been created.');
  };

  const handleNavigateToAddAnimal = () => {
    navigation.navigate('AddAnimal');
  };

  const renderStatusBadge = (status) => {
    let bg, color, label;
    switch (status) {
      case 'Active':
        bg = '#DCFCE7';
        color = '#16A34A';
        label = 'Active';
        break;
      case 'Pending':
        bg = '#FEF3C7';
        color = '#D97706';
        label = 'Pending Approval';
        break;
      case 'Sold':
        bg = '#DBEAFE';
        color = '#2563EB';
        label = 'Sold';
        break;
      case 'Rejected':
        bg = '#FEE2E2';
        color = '#EF4444';
        label = 'Rejected';
        break;
      default:
        bg = '#F1F5F9';
        color = '#64748B';
        label = status;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

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
          <TouchableOpacity style={styles.headerActionBtn}>
            <MaterialCommunityIcons name="tune-variant" size={22} color="#0F172A" />
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-search-outline" size={50} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Listings Found</Text>
            <Text style={styles.emptySubtitle}>You don't have any listings in this section. Start selling your animal today!</Text>
            <TouchableOpacity style={styles.addAnimalBtn} onPress={handleNavigateToAddAnimal}>
              <Text style={styles.addAnimalBtnText}>Add Animal</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.listingCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: item.image }} style={styles.cardThumbnail} />
              <View style={styles.cardDetails}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.threeDotBtn}
                    onPress={() => setActiveMenuListing(item)}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cardSubtitle}>{item.breed} • {item.category}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
                
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color="#64748B" />
                  <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Performance Stats Overlay */}
            <View style={styles.cardPerformanceRow}>
              <View style={styles.perfStat}>
                <Ionicons name="eye-outline" size={14} color="#64748B" />
                <Text style={styles.perfStatText}>{item.views} Views</Text>
              </View>
              {renderStatusBadge(item.status)}
            </View>

            {/* Action buttons inside the card */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleShareListing(item)}>
                <Ionicons name="share-social-outline" size={16} color="#64748B" />
                <Text style={styles.cardActionBtnLabel}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleDuplicateListing(item)}>
                <Ionicons name="copy-outline" size={16} color="#64748B" />
                <Text style={styles.cardActionBtnLabel}>Duplicate</Text>
              </TouchableOpacity>
              {item.status !== 'Sold' && (
                <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleMarkAsSold(item.id)}>
                  <Ionicons name="checkmark-done-circle-outline" size={16} color="#2563EB" />
                  <Text style={[styles.cardActionBtnLabel, { color: '#2563EB' }]}>Mark Sold</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
                <Image source={{ uri: activeMenuListing.image }} style={styles.bottomSheetThumb} />
                <View>
                  <Text style={styles.bottomSheetListingName}>{activeMenuListing.name}</Text>
                  <Text style={styles.bottomSheetListingPrice}>{activeMenuListing.price}</Text>
                </View>
              </View>
            )}

            <View style={styles.bottomSheetActionsList}>
              <TouchableOpacity style={styles.bottomSheetAction} onPress={() => setActiveMenuListing(null)}>
                <Ionicons name="create-outline" size={20} color="#0F172A" style={styles.actionIcon} />
                <Text style={styles.actionText}>Edit Listing</Text>
              </TouchableOpacity>

              {activeMenuListing && activeMenuListing.status !== 'Sold' && (
                <TouchableOpacity style={styles.bottomSheetAction} onPress={() => handleMarkAsSold(activeMenuListing.id)}>
                  <Ionicons name="checkmark-done" size={20} color="#2563EB" style={styles.actionIcon} />
                  <Text style={[styles.actionText, { color: '#2563EB' }]}>Mark as Sold</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.bottomSheetAction} onPress={() => activeMenuListing && handleShareListing(activeMenuListing)}>
                <Ionicons name="share-social-outline" size={20} color="#0F172A" style={styles.actionIcon} />
                <Text style={styles.actionText}>Share Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bottomSheetAction} onPress={() => activeMenuListing && handleDuplicateListing(activeMenuListing)}>
                <Ionicons name="copy-outline" size={20} color="#0F172A" style={styles.actionIcon} />
                <Text style={styles.actionText}>Duplicate Listing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bottomSheetAction, styles.deleteAction]}
                onPress={() => activeMenuListing && handleDeleteListing(activeMenuListing.id)}
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
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
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
    backgroundColor: '#F8FAFC',
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  threeDotBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
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
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardPerformanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  perfStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  perfStatText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  cardActionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  addAnimalBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  addAnimalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 34,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bottomSheetThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  bottomSheetListingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomSheetListingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  bottomSheetActionsList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
  },
  bottomSheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 6,
    paddingTop: 16,
  },
});
