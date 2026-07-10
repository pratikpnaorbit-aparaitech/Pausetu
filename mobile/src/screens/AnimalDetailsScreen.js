import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Modal, Share, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import SectionHeader from '../components/SectionHeader';
import ListingCard from '../components/ListingCard';
import { api, resolveMediaUrl } from '../api/api';

const { width } = Dimensions.get('window');
const GALLERY_HEIGHT = 280;

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=600&q=80', // Cow image 1
  'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80', // Cow image 2
  'https://images.unsplash.com/photo-1527153857715-3908f2bacb31?auto=format&fit=crop&w=600&q=80', // Cow image 3
];

const SIMILAR_ANIMALS = [
  {
    id: 's1',
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
    id: 's2',
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
    id: 's3',
    name: 'HF Cross Cow',
    breed: 'Holstein Friesian',
    age: '3.5 Years',
    price: '₹55,000',
    location: 'Baramati, Pune',
    isVerified: true,
    isFeatured: true,
    postedTime: '1 day ago',
  },
];

export default function AnimalDetailsScreen({ route, navigation }) {
  // Safe extraction of params (fallback to mock default)
  const animal = route.params?.animal || {
    id: 'f1',
    name: 'HF Cross Cow',
    breed: 'Holstein Friesian',
    age: '3.5 Years',
    price: '₹55,000',
    location: 'Baramati, Pune',
    isVerified: true,
    isFeatured: true,
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [similarAnimals, setSimilarAnimals] = useState([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        if (animal.categoryId) {
          const catId = animal.categoryId._id || animal.categoryId;
          const res = await api.getAnimals({ categoryId: catId, status: 'approved' });
          if (res.status === 'success') {
            const list = res.data.animals
              .filter(a => a._id !== animal._id)
              .slice(0, 5)
              .map(a => ({
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
            setSimilarAnimals(list);
          }
        }
      } catch (err) {
        console.warn('Failed to load similar animals:', err.message);
      }
    };
    fetchSimilar();
  }, [animal]);

  const scrollRef = useRef(null);

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${animal.name} (${animal.breed}) listed for ${animal.price} on PashuSetu!`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleOpenMaps = () => {
    // UI Only notification simulation or deep link if needed
    alert('Opening maps location for ' + animal.location);
  };

  return (
    <View style={styles.container}>
      {/* Absolute Transparent Header Overlay */}
      <View style={styles.absoluteHeader}>
        <TouchableOpacity style={styles.headerCircleButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerCircleButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image/Video Gallery Slider */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ref={scrollRef}
          >
            {/* Images */}
            {(animal.photos && animal.photos.length > 0 ? animal.photos : MOCK_IMAGES).map((imgUri, index) => (
              <Image key={index} source={{ uri: resolveMediaUrl(imgUri) }} style={styles.galleryImage} resizeMode="cover" />
            ))}

            {/* Video Thumbnail Slide */}
            <View style={styles.videoSlide}>
              <Image source={{ uri: animal.photos && animal.photos.length > 0 ? resolveMediaUrl(animal.photos[0]) : MOCK_IMAGES[0] }} style={styles.galleryImage} blurRadius={3} resizeMode="cover" />
              <View style={styles.videoOverlay}>
                <TouchableOpacity style={styles.playButtonCircle} onPress={() => setIsVideoPlaying(true)}>
                  <Ionicons name="play" size={28} color="#FFFFFF" style={styles.playIconOffset} />
                </TouchableOpacity>
                <Text style={styles.videoSlideLabel}>Tap to Watch Video</Text>
              </View>
            </View>
          </ScrollView>

          {/* Pagination Indicators */}
          <View style={styles.paginationContainer}>
            {[...Array((animal.photos && animal.photos.length > 0 ? animal.photos.length : MOCK_IMAGES.length) + 1)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeSlide === index ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.detailsBody}>
          {/* Title and Price Info */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <Text style={styles.animalName}>{animal.name}</Text>
              {animal.isVerified && (
                <View style={styles.verifiedTextBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={13} color="#FFFFFF" style={styles.verifiedIconMargin} />
                  <Text style={styles.verifiedTextBadgeLabel}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.animalBreed}>{animal.breed}</Text>
            <Text style={styles.animalPrice}>{animal.price}</Text>
            <View style={styles.postedBadge}>
              <Ionicons name="time-outline" size={12} color="#64748B" />
              <Text style={styles.postedText}>Listed 5 hours ago</Text>
            </View>
          </View>

          {/* Key Specifications Grid */}
          <Text style={styles.sectionTitle}>Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="calendar-range" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Age</Text>
              <Text style={styles.specValue}>{animal.age}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="gender-male-female" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Gender</Text>
              <Text style={styles.specValue}>{animal.gender || 'Female'}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="weight-kilogram" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Weight</Text>
              <Text style={styles.specValue}>{animal.weight ? `${animal.weight} kg` : 'N/A'}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="palette" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Color</Text>
              <Text style={styles.specValue}>{animal.color || 'N/A'}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Health</Text>
              <Text style={styles.specValue}>{animal.health?.healthy ? 'Healthy' : 'N/A'}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#16A34A" />
              <Text style={styles.specLabel}>Vaccinated</Text>
              <Text style={styles.specValue}>{animal.health?.vaccinated ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.infoCard}>
            <Text style={styles.cardSectionTitle}>Description</Text>
            <Text style={styles.descriptionText} numberOfLines={descriptionExpanded ? undefined : 3}>
              {animal.description || 'No description available for this livestock listing.'}
            </Text>
            <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)}>
              <Text style={styles.readMoreText}>
                {descriptionExpanded ? 'Read Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seller Information */}
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerMainInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
                  style={styles.sellerAvatar}
                />
                <MaterialCommunityIcons name="check-decagram" size={16} color="#3B82F6" style={styles.sellerVerifyBadge} />
              </View>

              <View style={styles.sellerMeta}>
                <Text style={styles.sellerName}>Ramesh Patil</Text>
                <Text style={styles.sellerSubtext}>Joined Dec 2024</Text>
                <View style={styles.ratingStarsRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingLabel}>4.8 (18 ratings)</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Contact Buttons */}
            <View style={styles.sellerActionsRow}>
              <TouchableOpacity style={[styles.sellerActionBtn, styles.callBtn]}>
                <Ionicons name="call" size={16} color="#FFFFFF" />
                <Text style={styles.sellerActionTextWhite}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sellerActionBtn, styles.whatsappBtn]}>
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                <Text style={styles.sellerActionTextWhite}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sellerActionBtn, styles.chatBtn]}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#16A34A" />
                <Text style={styles.sellerActionTextGreen}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location details */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoCard}>
            <View style={styles.locationHeaderRow}>
              <Ionicons name="location" size={20} color="#16A34A" />
              <View style={styles.locationMeta}>
                <Text style={styles.locationPrimary}>{animal.location}</Text>
                <Text style={styles.locationSecondary}>Taluka: Baramati, District: Pune, State: Maharashtra</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
              <Ionicons name="map-outline" size={16} color="#16A34A" />
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Similar Listing Section */}
          <View style={styles.similarSection}>
            <SectionHeader title="Similar Animals" onActionPress={() => {}} />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={similarAnimals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => (
                <ListingCard
                  item={item}
                  onViewDetailsPress={() => {
                    // Navigate to details screen recursively with new item
                    navigation.push('AnimalDetails', { animal: item });
                  }}
                  style={styles.similarCardOverride}
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity style={styles.stickyPrimaryBtn}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <Text style={styles.stickyPrimaryBtnText}>Contact Seller</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Video Player Modal Simulation */}
      <Modal visible={isVideoPlaying} transparent={true} animationType="slide">
        <View style={styles.videoPlayerContainer}>
          <SafeAreaView style={styles.videoSafeArea}>
            <TouchableOpacity style={styles.closeVideoBtn} onPress={() => setIsVideoPlaying(false)}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Simulated Fullscreen Video Content */}
          <View style={styles.simulatedVideoBox}>
            <MaterialCommunityIcons name="video-vintage" size={80} color="rgba(255,255,255,0.4)" />
            <Text style={styles.videoPlayerText}>Simulated Video Playback Stream</Text>
            <View style={styles.videoControlsRow}>
              <Ionicons name="play-back-sharp" size={24} color="#FFFFFF" />
              <Ionicons name="pause" size={32} color="#FFFFFF" style={styles.controlMargin} />
              <Ionicons name="play-forward-sharp" size={24} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  absoluteHeader: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCircleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favBtnMargin: {
    marginLeft: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  galleryContainer: {
    width: width,
    height: GALLERY_HEIGHT,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  galleryImage: {
    width: width,
    height: GALLERY_HEIGHT,
  },
  videoSlide: {
    width: width,
    height: GALLERY_HEIGHT,
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(22, 163, 74, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  playIconOffset: {
    marginLeft: 4,
  },
  videoSlideLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#16A34A',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  detailsBody: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  verifiedTextBadge: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  verifiedIconMargin: {
    marginRight: 3,
  },
  verifiedTextBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  animalBreed: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  animalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 8,
  },
  postedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  postedText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 6,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sellerMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
  },
  sellerVerifyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  sellerMeta: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sellerSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  sellerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  sellerActionBtn: {
    width: '30%',
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtn: {
    backgroundColor: '#16A34A',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  chatBtn: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  sellerActionTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 5,
  },
  sellerActionTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 5,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMeta: {
    flex: 1,
    marginLeft: 8,
  },
  locationPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationSecondary: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mapButton: {
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#FFFFFF',
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 6,
  },
  similarSection: {
    marginTop: 16,
  },
  similarList: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  similarCardOverride: {
    width: 230,
    marginHorizontal: 8,
    marginBottom: 0,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 28, // Padded for iOS home bar safety
  },
  stickyPrimaryBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnIcon: {
    marginRight: 6,
  },
  stickyPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  videoSafeArea: {
    position: 'absolute',
    top: 24,
    left: 16,
    zIndex: 10,
  },
  closeVideoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatedVideoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  videoPlayerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  videoControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  controlMargin: {
    marginHorizontal: 24,
  },
});
