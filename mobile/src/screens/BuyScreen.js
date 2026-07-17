import React, { useContext, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, TextInput, FlatList, Image, ActivityIndicator, Alert, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { api, resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import AppText from '../components/AppText';

// Import Reusable Components
import SectionHeader from '../components/SectionHeader';
import ListingCard from '../components/ListingCard';
import LocationPicker from '../components/LocationPicker';
import FilterBottomSheet from '../components/FilterBottomSheet';

const CATEGORIES = [
  { id: 'all', nameKey: 'buy.all', image: require('../../assets/icons/all.png') },
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
    categorySlug: 'cow',
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
    categorySlug: 'buffalo',
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
    categorySlug: 'goat',
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
    categorySlug: 'cow',
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
    categorySlug: 'buffalo',
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
    categorySlug: 'goat',
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
    categorySlug: 'cow',
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
    categorySlug: 'buffalo',
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
    categorySlug: 'goat',
  },
];

// Standalone React.memo components to prevent unmounting/remounting of list headers and footers
const CategoryCardItem = React.memo(({ item, isSelected, onPress, t }) => {
  const scaleAnim = React.useRef(new Animated.Value(isSelected ? 1.04 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.04 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isSelected]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.categoryCardWrapper,
          isSelected ? styles.selectedCardWrapper : styles.unselectedCardWrapper,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {/* Selected Checkmark Indicator */}
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          </View>
        )}
        <Image source={item.image} style={styles.categoryCardImage} resizeMode="contain" />
        <AppText style={[
          styles.categoryCardName,
          isSelected ? styles.selectedCardName : styles.unselectedCardName
        ]}>
          {t(item.nameKey).replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|➕|🐾/g, '').trim()}
        </AppText>
      </Animated.View>
    </TouchableOpacity>
  );
});

const FilterCardEntry = React.memo(({ onFilterPress }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onFilterPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.farmerFilterCardContainer}
    >
      <Animated.View style={[styles.farmerFilterCard, { transform: [{ scale: scaleValue }] }]}>
        <LinearGradient
          colors={['#FFFFFF', '#F5FCF3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.farmerFilterGradient}
        >
          <View style={styles.farmerFilterContent}>
            <AppText style={styles.farmerFilterTitle}>तुम्हाला काय पाहिजे?</AppText>
            <AppText style={styles.farmerFilterSubtitle}>योग्य जनावरे शोधा</AppText>
          </View>

          {/* Circular Green Action Button */}
          <View style={styles.farmerFilterActionBtn}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

const ListHeader = React.memo(({ 
  selectedCategory, 
  setSelectedCategory, 
  onViewDetails, 
  featuredAnimals, 
  userProfile, 
  onChangeLocation,
  searchText,
  setSearchText,
  onFilterPress
}) => {
  const { t } = useTranslation();
  const flatListRef = React.useRef(null);

  const getDisplayLocation = () => {
    if (userProfile?.village) {
      return {
        title: userProfile.village,
        subtitle: [userProfile.taluka, userProfile.district, userProfile.state].filter(Boolean).join(', ')
      };
    }
    if (userProfile?.taluka) {
      return {
        title: userProfile.taluka,
        subtitle: [userProfile.district, userProfile.state].filter(Boolean).join(', ')
      };
    }
    if (userProfile?.district) {
      return {
        title: userProfile.district,
        subtitle: userProfile.state || 'Maharashtra'
      };
    }
    return {
      title: 'Pune',
      subtitle: 'Maharashtra'
    };
  };

  const locDisplay = getDisplayLocation();

  // Auto-center the selected category when it changes
  React.useEffect(() => {
    const index = CATEGORIES.findIndex(cat => cat.id === selectedCategory);
    if (index !== -1 && flatListRef.current) {
      const timer = setTimeout(() => {
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5
          });
        } catch (e) {
          console.warn('Category scroll centering failed:', e.message);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCategory]);

  const displayFeatured = (featuredAnimals && featuredAnimals.length > 0)
    ? featuredAnimals
    : FEATURED_ANIMALS.filter(animal => {
        if (selectedCategory && selectedCategory !== 'all') {
          if (selectedCategory === 'other') {
            const knownSlugs = ['cow', 'buffalo', 'goat', 'sheep', 'horse'];
            if (knownSlugs.includes(animal.categorySlug)) return false;
          } else {
            if (animal.categorySlug !== selectedCategory) return false;
          }
        }
        if (searchText && searchText.trim() !== '') {
          const query = searchText.toLowerCase().trim();
          const nameMatch = animal.name?.toLowerCase().includes(query);
          const breedMatch = animal.breed?.toLowerCase().includes(query);
          const locationMatch = animal.location?.toLowerCase().includes(query);
          return nameMatch || breedMatch || locationMatch;
        }
        return true;
      });

  return (
    <View>
      {/* Location Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <View style={styles.locationPinIconWrapper}>
            <Ionicons name="location" size={18} color="#16A34A" />
          </View>
          <View style={styles.locationTextContainer}>
            <AppText style={styles.locationCity} numberOfLines={1}>
              {locDisplay.title}
            </AppText>
            <AppText style={styles.locationSubtitle} numberOfLines={1}>
              {locDisplay.subtitle}
            </AppText>
          </View>
        </View>
        <TouchableOpacity style={styles.changeButton} activeOpacity={0.6} onPress={onChangeLocation}>
          <AppText style={styles.changeButtonText}>{t('buy.change')}</AppText>
        </TouchableOpacity>
      </View>

      {/* Search Bar (Full Width) */}
      <View style={styles.searchSection}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('buy.searchCattle')}
            placeholderTextColor="#94A3B8"
            editable={true}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Farmer-Friendly Filter Card */}
      <FilterCardEntry onFilterPress={onFilterPress} />

      {/* Browse Categories Section */}
      <View style={styles.categoriesSection}>
        <AppText style={styles.categoriesTitle}>{t('buy.browseCategories')}</AppText>
        <FlatList
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          getItemLayout={(data, index) => (
            { length: 98, offset: 98 * index, index }
          )}
          renderItem={({ item }) => (
            <CategoryCardItem
              item={item}
              isSelected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
              t={t}
            />
          )}
        />
      </View>

      {/* Featured Animals Section */}
      {displayFeatured.length > 0 && (
        <View style={styles.featuredSection}>
          <SectionHeader title={t('buy.featuredAnimals')} onActionPress={() => { }} />

          <View style={styles.featuredListVertical}>
            {displayFeatured.map((item) => (
              <ListingCard
                key={item.id}
                item={{ ...item, isFeatured: true }}
                onViewDetailsPress={() => onViewDetails(item)}
              />
            ))}
          </View>
        </View>
      )}
      {/* Latest Listings Header */}
      <SectionHeader title={t('buy.latestListings')} onActionPress={() => { }} />
    </View>
  );
});

const ListFooter = React.memo(({ onViewDetails, recommendedAnimals, selectedCategory, searchText }) => {
  const { t } = useTranslation();

  const displayRecommended = (recommendedAnimals && recommendedAnimals.length > 0)
    ? recommendedAnimals
    : RECOMMENDED_ANIMALS.filter(animal => {
        if (selectedCategory && selectedCategory !== 'all') {
          if (selectedCategory === 'other') {
            const knownSlugs = ['cow', 'buffalo', 'goat', 'sheep', 'horse'];
            if (knownSlugs.includes(animal.categorySlug)) return false;
          } else {
            if (animal.categorySlug !== selectedCategory) return false;
          }
        }
        if (searchText && searchText.trim() !== '') {
          const query = searchText.toLowerCase().trim();
          const nameMatch = animal.name?.toLowerCase().includes(query);
          const breedMatch = animal.breed?.toLowerCase().includes(query);
          const locationMatch = animal.location?.toLowerCase().includes(query);
          return nameMatch || breedMatch || locationMatch;
        }
        return true;
      });

  if (displayRecommended.length === 0) return <View style={{ height: 24 }} />;

  return (
    <View style={styles.footerSection}>
      {/* Recommended For You */}
      <SectionHeader title={t('buy.recommendedForYou')} onActionPress={() => { }} />
      <View style={styles.recommendedVerticalList}>
        {displayRecommended.map((item) => (
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
  const { userProfile, userToken, updateLocation } = useContext(AppContext);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const isGuest = userToken === 'guest';
  const name = isGuest ? 'Guest' : userProfile?.name || 'User';
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [animalsList, setAnimalsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const getFilteredAnimals = () => {
    let list = animalsList;

    // Filter by selected category
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'other') {
        const knownSlugs = ['cow', 'buffalo', 'goat', 'sheep', 'horse'];
        list = list.filter((animal) => {
          const slug = animal.categoryId?.slug?.toLowerCase();
          return !slug || !knownSlugs.includes(slug);
        });
      } else {
        list = list.filter((animal) => {
          const slug = animal.categoryId?.slug?.toLowerCase();
          return slug === selectedCategory.toLowerCase();
        });
      }
    }

    // Filter by search text
    if (searchText && searchText.trim() !== '') {
      const query = searchText.toLowerCase().trim();
      list = list.filter((animal) => {
        const nameMatch = animal.name?.toLowerCase().includes(query);
        const breedMatch = animal.breed?.toLowerCase().includes(query);
        const locationMatch = animal.location?.toLowerCase().includes(query);
        const descriptionMatch = animal.description?.toLowerCase().includes(query);
        return nameMatch || breedMatch || locationMatch || descriptionMatch;
      });
    }

    return list;
  };

  const filteredAnimals = getFilteredAnimals();

  const fetchLiveListings = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
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
          photos: a.photos,
          video: a.video
        }));
        setAnimalsList(mappedList);
      }
    } catch (e) {
      console.warn('[BuyScreen API Warning] Offline or failed backend:', e.message);
      setAnimalsList([]);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveListings();
  }, [userProfile?.district]);

  const handleNavigateToSell = useCallback(() => {
    navigation.navigate('Sell');
  }, [navigation]);

  const handleViewDetails = useCallback((item) => {
    navigation.navigate('AnimalDetails', { animal: item });
  }, [navigation]);

  const handleLocationChange = useCallback(() => {
    setIsLocationPickerVisible(true);
  }, []);

  const handleSelectLocation = useCallback(async (locationData) => {
    setIsLocationPickerVisible(false);
    if (updateLocation) {
      await updateLocation(locationData);
    }
  }, [updateLocation]);

  const handleViewAllAnimals = useCallback(() => {
    setSelectedCategory('all');
    setSearchText('');
    fetchLiveListings(false);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8FCF7', '#F4FAEE', '#EEF8EC']}
        style={StyleSheet.absoluteFillObject}
      />
      <Image
        source={require('../../assets/farmer-bg.webp')}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.025, resizeMode: 'cover' }]}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Main Body Wrap */}
        <View style={styles.contentWrapper}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoAndBrand}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/logo-icon.png')} style={styles.logoIconImage} resizeMode="contain" />
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
              data={filteredAnimals}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <ListHeader
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onViewDetails={handleViewDetails}
                  featuredAnimals={filteredAnimals.slice(0, 3)}
                  userProfile={userProfile}
                  onChangeLocation={handleLocationChange}
                  searchText={searchText}
                  setSearchText={setSearchText}
                  onFilterPress={() => setIsFilterVisible(true)}
                />
              }
              ListFooterComponent={
                <ListFooter
                  onViewDetails={handleViewDetails}
                  recommendedAnimals={filteredAnimals.slice(2, 5)}
                  selectedCategory={selectedCategory}
                  searchText={searchText}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyIconWrapper}>
                    <Ionicons name="paw" size={48} color="#16A34A" />
                  </View>
                  <AppText style={styles.emptyStateTitle}>{t('buy.noAnimalsCategoryTitle')}</AppText>
                  <AppText style={styles.emptyStateSubtitle}>{t('buy.noAnimalsCategorySubtitle')}</AppText>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    activeOpacity={0.8}
                    onPress={handleViewAllAnimals}
                  >
                    <AppText style={styles.emptyStateButtonText}>{t('buy.noAnimalsCategoryButton')}</AppText>
                  </TouchableOpacity>
                </View>
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
      <LocationPicker
        visible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        onSelectLocation={handleSelectLocation}
      />
      <FilterBottomSheet
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(filters) => {
          console.log('[BuyScreen] Filters applied (UI only):', filters);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locationPinIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  changeButton: {
    borderWidth: 1,
    borderColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F0FDF4',
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
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
  farmerFilterCardContainer: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  farmerFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  farmerFilterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  farmerFilterContent: {
    flex: 1,
  },
  farmerFilterTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  farmerFilterSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
  },
  farmerFilterMiniCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  farmerMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  farmerMiniCardEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  farmerMiniCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  farmerFilterActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  categoryCardWrapper: {
    width: 84, // Premium width
    height: 112, // Premium height
    borderRadius: 20, // Rounded corners 20px
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 7, // 14px equal spacing between card elements
    backgroundColor: '#FFFFFF',
    position: 'relative', // Necessary for absolute positioning of checkmark
  },
  unselectedCardWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCardWrapper: {
    borderWidth: 2,
    borderColor: '#16A34A', // Green border
    backgroundColor: '#F0FDF4', // Soft light green background
    shadowColor: '#16A34A', // Soft green shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardImage: {
    width: 52, // Centered animal image larger size (approx 60-65%)
    height: 52,
    marginBottom: 6,
  },
  categoryCardName: {
    fontSize: 13,
    textAlign: 'center',
  },
  unselectedCardName: {
    color: '#475569', // Dark grey text
    fontWeight: '500', // Regular unselected text
  },
  selectedCardName: {
    color: '#16A34A', // Green text
    fontWeight: 'bold', // Bold selected category name
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
  scrollContent: {
    paddingBottom: 160,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
