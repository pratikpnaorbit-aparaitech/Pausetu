import React, { useContext, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, TextInput, FlatList, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { api, resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

// Import Reusable Components
import SectionHeader from '../components/SectionHeader';
import ListingCard from '../components/ListingCard';

const CATEGORIES = [
  { id: 'cow', nameKey: 'buy.cow', image: require('../../assets/icons/cow.png') },
  { id: 'buffalo', nameKey: 'buy.buffalo', image: require('../../assets/icons/buffalo.png') },
  { id: 'goat', nameKey: 'buy.goat', image: require('../../assets/icons/goat.png') },
  { id: 'sheep', nameKey: 'buy.sheep', image: require('../../assets/icons/sheep.png') },
  { id: 'horse', nameKey: 'buy.horse', image: require('../../assets/icons/horse.png') },
  { id: 'other', nameKey: 'buy.other', image: require('../../assets/icons/other.png') },
];

const FEATURED_ANIMALS = [
  {
    id: 'f1',
    name: 'HF Cross Cow',
    breed: 'Holstein Friesian',
    age: '3.5 Years',
    price: '₹55,000',
    location: 'Baramati, Pune',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: 'f2',
    name: 'Murrah Buffalo',
    breed: 'Pure Murrah',
    age: '4 Years',
    price: '₹85,000',
    location: 'Hassan, Karnataka',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: 'f3',
    name: 'Sirohi Goat',
    breed: 'Sirohi',
    age: '1.5 Years',
    price: '₹12,500',
    location: 'Sikar, Rajasthan',
    isVerified: false,
    isFeatured: true,
  },
];

const LATEST_LISTINGS = [
  {
    id: 'l1',
    name: 'Sahiwal Cow',
    breed: 'Sahiwal',
    age: '3 Years',
    price: '₹48,000',
    sellerName: 'Ramesh Patel',
    location: 'Surat, Gujarat',
    isVerified: true,
    isFeatured: false,
    postedTime: '2 hours ago',
  },
  {
    id: 'l2',
    name: 'Jafarabadi Buffalo',
    breed: 'Jafarabadi',
    age: '5 Years',
    price: '₹95,000',
    sellerName: 'Suresh Kumar',
    location: 'Junagadh, Gujarat',
    isVerified: true,
    isFeatured: true,
    postedTime: '5 hours ago',
  },
  {
    id: 'l3',
    name: 'Beetal Goat',
    breed: 'Beetal',
    age: '2 Years',
    price: '₹15,000',
    sellerName: 'Amit Singh',
    location: 'Gurdaspur, Punjab',
    isVerified: false,
    isFeatured: false,
    postedTime: '1 day ago',
  },
];

const RECOMMENDED_ANIMALS = [
  {
    id: 'r1',
    name: 'Gir Cow',
    breed: 'Gir',
    age: '2.8 Years',
    price: '₹62,000',
    sellerName: 'Devendra Vyas',
    location: 'Rajkot, Gujarat',
    isVerified: true,
    isFeatured: true,
    postedTime: '3 hours ago',
  },
  {
    id: 'r2',
    name: 'Bhadawari Buffalo',
    breed: 'Bhadawari',
    age: '3 Years',
    price: '₹75,000',
    sellerName: 'Rajesh Mishra',
    location: 'Etawah, Uttar Pradesh',
    isVerified: false,
    isFeatured: false,
    postedTime: '6 hours ago',
  },
  {
    id: 'r3',
    name: 'Jamnapari Goat',
    breed: 'Jamnapari',
    age: '1 Year',
    price: '₹14,000',
    sellerName: 'Vikas Dubey',
    location: 'Kanpur, Uttar Pradesh',
    isVerified: true,
    isFeatured: true,
    postedTime: '1 day ago',
  },
];

// Standalone React.memo components to prevent unmounting/remounting of list headers and footers
const ListHeader = React.memo(({ selectedCategory, setSelectedCategory, onViewDetails, featuredAnimals }) => {
  const { t } = useTranslation();

  return (
    <View>
      {/* Location Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={20} color="#16A34A" style={styles.locationPinIcon} />
          <View style={styles.locationTextContainer}>
            <AppText style={styles.locationCity}>Pune, Maharashtra</AppText>
            <AppText style={styles.locationSubtitle}>{t('buy.showingNearby')}</AppText>
          </View>
        </View>
        <TouchableOpacity style={styles.changeButton}>
          <AppText style={styles.changeButtonText}>{t('buy.change')}</AppText>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('buy.searchCattle')}
            placeholderTextColor="#94A3B8"
            editable={true}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialCommunityIcons name="tune-variant" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Browse Categories Section */}
      <View style={styles.categoriesSection}>
        <AppText style={styles.categoriesTitle}>{t('buy.browseCategories')}</AppText>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.categoryCardWrapper,
                  isSelected ? styles.selectedCardWrapper : styles.unselectedCardWrapper
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Image source={item.image} style={styles.categoryCardImage} resizeMode="contain" />
                <AppText style={[
                  styles.categoryCardName,
                  isSelected ? styles.selectedCardName : styles.unselectedCardName
                ]}>
                  {t(item.nameKey)}
                </AppText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Featured Animals Section */}
      <View style={styles.featuredSection}>
        <SectionHeader title={t('buy.featuredAnimals')} onActionPress={() => { }} />

        <View style={styles.featuredListVertical}>
          {(featuredAnimals && featuredAnimals.length > 0 ? featuredAnimals : FEATURED_ANIMALS).map((item) => (
            <ListingCard
              key={item.id}
              item={{ ...item, isFeatured: true }}
              onViewDetailsPress={() => onViewDetails(item)}
            />
          ))}
        </View>
      </View>
      {/* Latest Listings Header */}
      <SectionHeader title={t('buy.latestListings')} onActionPress={() => { }} />
    </View>
  );
});

const ListFooter = React.memo(({ onViewDetails, recommendedAnimals }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.footerSection}>
      {/* Recommended For You */}
      <SectionHeader title={t('buy.recommendedForYou')} onActionPress={() => { }} />
      <View style={styles.recommendedVerticalList}>
        {(recommendedAnimals && recommendedAnimals.length > 0 ? recommendedAnimals : RECOMMENDED_ANIMALS).map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            onViewDetailsPress={() => onViewDetails(item)}
          />
        ))}
      </View>
    </View>
  );
});

export default function BuyScreen({ navigation }) {
  const { userProfile, userToken } = useContext(AppContext);
  const isGuest = userToken === 'guest';
  const name = isGuest ? 'Guest' : userProfile?.name || 'User';
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState('cow');
  const [animalsList, setAnimalsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveListings = async () => {
    setLoading(true);
    try {
      const res = await api.getAnimals({ status: 'approved' });
      if (res.status === 'success') {
        const mappedList = res.data.animals.map((a) => ({
          ...a,
          id: a._id,
          name: a.title,
          breed: a.breedId?.name || 'Unknown Breed',
          age: a.age,
          price: `₹${a.price.toLocaleString()}`,
          sellerName: a.sellerId?.name || 'Seller',
          location: `${a.village}, ${a.district}`,
          isVerified: a.status === 'approved',
          isFeatured: a.views > 200,
          postedTime: 'Active',
          photos: a.photos
        }));
        setAnimalsList(mappedList);
      }
    } catch (e) {
      console.warn('[BuyScreen API Warning] Offline or failed backend:', e.message);
      setAnimalsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveListings();
  }, []);

  const handleNavigateToSell = useCallback(() => {
    navigation.navigate('Sell');
  }, [navigation]);

  const handleViewDetails = useCallback((item) => {
    navigation.navigate('AnimalDetails', { animal: item });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Main Body Wrap */}
        <View style={styles.contentWrapper}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoAndBrand}>
              {/* App Logo */}
              <View style={styles.logoCircle}>
                <AppText style={styles.logoText}>PS</AppText>
              </View>
              {/* Title and Tagline */}
              <View style={styles.brandTextContainer}>
                <AppText style={styles.headerTitle}>
                  {t('app.name')}
                </AppText>
                <AppText style={styles.headerTagline}>{t('buy.marketplaceCare')}</AppText>
              </View>
            </View>

            {/* Right Controls */}
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.sellButton} onPress={handleNavigateToSell}>
                <AppText style={styles.sellButtonText}>{t('buy.sellPlus')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationHeaderBtn} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={20} color="#0F172A" />
                <View style={styles.notificationHeaderBadge} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarCircle} onPress={() => navigation.navigate('Profile')}>
                <AppText style={styles.avatarText}>{name.charAt(0).toUpperCase()}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#16A34A" />
              <AppText style={{ marginTop: 12, color: '#64748B', fontWeight: '600' }}>{t('buy.loadingListings')}</AppText>
            </View>
          ) : (
            <FlatList
              data={animalsList}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <ListHeader
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onViewDetails={handleViewDetails}
                  featuredAnimals={animalsList.slice(0, 3)}
                />
              }
              ListFooterComponent={
                <ListFooter
                  onViewDetails={handleViewDetails}
                  recommendedAnimals={animalsList.slice(2, 5)}
                />
              }
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <ListingCard
                  item={item}
                  onViewDetailsPress={() => handleViewDetails(item)}
                />
              )}
            />
          )}

          {/* Floating Action Button (FAB) */}
          <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={handleNavigateToSell}>
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
            <AppText style={styles.fabLabel}>{t('buy.sellAnimal')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Softer header border
    backgroundColor: '#FFFFFF',
  },
  logoAndBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  headerTagline: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  sellButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  notificationHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  notificationHeaderBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingBottom: 120, // Increased bottom padding to prevent FAB overlay overlap
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Consistent border radius
    borderWidth: 1,
    borderColor: '#F1F5F9', // Softer borders
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationPinIcon: {
    marginRight: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  changeButton: {
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  categoriesSection: {
    marginTop: 24, // Consistent spacing 24px
    marginBottom: 8,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 8,
  },
  categoryCardWrapper: {
    width: 78, // Width 78
    height: 96, // Height 96
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 7, // 14px horizontal spacing between cards (7 on left, 7 on right)
    backgroundColor: '#FFFFFF',
  },
  unselectedCardWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light grey border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCardWrapper: {
    borderWidth: 2,
    borderColor: '#16A34A', // Subtle green border
    shadowColor: '#16A34A', // Soft green shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  categoryCardImage: {
    width: 48, // Size 48x48
    height: 48,
    marginBottom: 6,
  },
  categoryCardName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  unselectedCardName: {
    color: '#475569', // Dark grey text
  },
  selectedCardName: {
    color: '#16A34A', // Green text
  },
  featuredSection: {
    marginTop: 24, // Consistent spacing 24px
  },
  featuredList: {
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  animalCard: {
    width: 240, // Increased animal card width slightly
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Consistent border radius
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 8,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  imagePlaceholder: {
    width: '100%',
    height: 110,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  badgeOverlayContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 3,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardDetails: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  breedText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
    flex: 1,
  },
  detailsButton: {
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#DCFCE7',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  footerSection: {
    marginTop: 24, // Consistent spacing 24px
    marginBottom: 24,
  },
  featuredListVertical: {
    marginBottom: 8,
  },
  recommendedVerticalList: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    height: 48, // Reduced height for slightly smaller size FAB
    backgroundColor: '#16A34A',
    borderRadius: 24, // 48 / 2
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  fabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});
