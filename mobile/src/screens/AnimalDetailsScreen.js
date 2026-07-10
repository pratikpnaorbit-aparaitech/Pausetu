import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Modal, Share, FlatList, SafeAreaView, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
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
  // Extract the pre-mapped item from route params (used as immediate preview)
  const passedAnimal = route.params?.animal || null;

  // Derive the animal's MongoDB _id from whichever field the caller provided.
  // BuyScreen maps _id → id, but similar-animal cards pass the raw object.
  const animalId = passedAnimal?._id || passedAnimal?.id || null;

  const [animal, setAnimal] = useState(passedAnimal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [similarAnimals, setSimilarAnimals] = useState([]);

  // Fetch the complete animal document from the API on mount.
  // The pre-mapped object from BuyScreen is missing critical fields
  // (_id, categoryId, description, gender, weight, color, health, sellerId object, etc.).
  useEffect(() => {
    let cancelled = false;

    const fetchAnimalDetails = async () => {
      if (!animalId) {
        setLoading(false);
        setError('No animal ID provided.');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await api.getAnimalById(animalId);

        if (cancelled) return;

        if (res.status === 'success' && res.data?.animal) {
          const a = res.data.animal;
          setAnimal({
            ...a,
            _id: a._id,
            id: a._id,
            name: a.title || passedAnimal?.name || 'Unknown',
            breed: a.breedId?.name || passedAnimal?.breed || 'Unknown Breed',
            age: a.age || passedAnimal?.age || 'N/A',
            price: `₹${(a.price || 0).toLocaleString()}`,
            sellerName: a.sellerId?.name || passedAnimal?.sellerName || 'Seller',
            location: [a.village, a.district].filter(Boolean).join(', ') || passedAnimal?.location || '',
            isVerified: a.status === 'approved',
            isFeatured: (a.views || 0) > 200,
            photos: a.photos || [],
            // Backend field is 'video' (singular string), not 'videos'
            video: a.video || null,
            description: a.description || '',
            gender: a.gender || null,
            weight: a.weight || null,
            color: a.color || null,
            health: a.health || {},
            categoryId: a.categoryId || null,
            breedId: a.breedId || null,
            sellerId: a.sellerId || null,
            latitude: a.latitude || null,
            longitude: a.longitude || null,
            state: a.state || null,
            district: a.district || null,
            taluka: a.taluka || null,
            village: a.village || null,
          });
        } else {
          setError('Animal listing not found.');
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[AnimalDetails] Failed to load animal:', err.message);
          // If the API failed but we have the pre-mapped preview, show it
          if (passedAnimal) {
            setAnimal(passedAnimal);
          } else {
            setError(err.message || 'Failed to load animal details.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnimalDetails();
    return () => { cancelled = true; };
  }, [animalId]);

  // Fetch similar animals once we have the full animal data with categoryId
  useEffect(() => {
    if (!animal?.categoryId) return;

    const fetchSimilar = async () => {
      try {
        const catId = animal.categoryId._id || animal.categoryId;
        const res = await api.getAnimals({ categoryId: catId, status: 'approved' });
        if (res.status === 'success') {
          const list = res.data.animals
            .filter(a => a._id !== (animal._id || animal.id))
            .slice(0, 5)
            .map(a => ({
              ...a,
              id: a._id,
              name: a.title,
              breed: a.breedId?.name || 'Unknown Breed',
              age: a.age,
              price: `₹${(a.price || 0).toLocaleString()}`,
              sellerName: a.sellerId?.name || 'Seller',
              location: `${a.village || ''}, ${a.district || ''}`,
              isVerified: a.status === 'approved',
              isFeatured: (a.views || 0) > 200,
              postedTime: 'Active',
              photos: a.photos || [],
            }));
          setSimilarAnimals(list);
        }
      } catch (err) {
        console.warn('Failed to load similar animals:', err.message);
      }
    };
    fetchSimilar();
  }, [animal?.categoryId]);

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

  // ── Action Handlers ──────────────────────────────────────────────────────

  const handleCall = async () => {
    const phone = animal.sellerId?.mobile || animal.sellerId?.phoneNumber;
    if (!phone) {
      Alert.alert('Phone Not Available', 'The seller has not provided a phone number for this listing.');
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open Dialer', 'Unable to open phone dialer on this device.');
    }
  };

  const handleWhatsApp = async () => {
    const phone = animal.sellerId?.mobile || animal.sellerId?.phoneNumber;
    if (!phone) {
      Alert.alert('Phone Not Available', 'The seller has not provided a phone number for this listing.');
      return;
    }
    // Normalize phone: strip leading zeros, spaces, dashes; prepend country code 91 for India
    const cleaned = phone.replace(/[^0-9]/g, '');
    const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(`Hi, I am interested in your animal listing: ${animal.name} (${animal.breed}) priced at ${animal.price} on PashuSetu.`)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp Not Found', 'WhatsApp is not installed on this device.');
    }
  };

  const handleChat = () => {
    const sellerId = animal.sellerId?._id || animal.sellerId;
    if (!sellerId) {
      Alert.alert('Seller Unavailable', 'Cannot start chat — seller information is missing.');
      return;
    }
    // Navigate to Chat screen if available, otherwise show graceful fallback
    const state = navigation.getState();
    const routeNames = state?.routeNames || [];
    if (routeNames.includes('Chat')) {
      navigation.navigate('Chat', {
        sellerId,
        animalId: animal._id || animal.id,
        animalTitle: animal.name,
      });
    } else {
      // Chat screen not yet wired — offer Call or WhatsApp instead
      Alert.alert(
        'Chat Coming Soon',
        'In-app chat is being set up. Would you like to contact the seller via call or WhatsApp?',
        [
          { text: 'Call', onPress: handleCall },
          { text: 'WhatsApp', onPress: handleWhatsApp },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleOpenMaps = async () => {
    let url = '';
    if (animal.latitude && animal.longitude) {
      // Prefer precise coordinates
      url = `https://www.google.com/maps/search/?api=1&query=${animal.latitude},${animal.longitude}`;
    } else if (animal.location) {
      // Fall back to address string
      const encoded = encodeURIComponent(
        [animal.village, animal.taluka, animal.district, animal.state].filter(Boolean).join(', ') || animal.location
      );
      url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    } else {
      Alert.alert('Location Unavailable', 'No location data is available for this listing.');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Cannot Open Maps', 'Unable to open Google Maps on this device.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' }}>
          Loading animal details...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !animal) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#94A3B8" />
        <Text style={{ marginTop: 16, color: '#0F172A', fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          {error || 'Animal not found'}
        </Text>
        <Text style={{ marginTop: 8, color: '#64748B', fontSize: 13, textAlign: 'center' }}>
          The listing may have been removed or is temporarily unavailable.
        </Text>
        <TouchableOpacity
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#16A34A', borderRadius: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

            {/* Video Thumbnail Slide — only render when the animal has an actual video */}
            {!!animal.video && (
              <View style={styles.videoSlide}>
                <Image
                  source={{ uri: animal.photos && animal.photos.length > 0 ? resolveMediaUrl(animal.photos[0]) : MOCK_IMAGES[0] }}
                  style={styles.galleryImage}
                  blurRadius={3}
                  resizeMode="cover"
                />
                <View style={styles.videoOverlay}>
                  <TouchableOpacity style={styles.playButtonCircle} onPress={() => setIsVideoPlaying(true)}>
                    <Ionicons name="play" size={28} color="#FFFFFF" style={styles.playIconOffset} />
                  </TouchableOpacity>
                  <Text style={styles.videoSlideLabel}>Tap to Watch Video</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Pagination Indicators — +1 for video slide only when video exists */}
          <View style={styles.paginationContainer}>
            {[...Array(
              (animal.photos && animal.photos.length > 0 ? animal.photos.length : MOCK_IMAGES.length) +
              (animal.video ? 1 : 0)
            )].map((_, index) => (
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
                {animal.sellerId?.profilePhoto ? (
                  <Image
                    source={{ uri: resolveMediaUrl(animal.sellerId.profilePhoto) }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={[styles.sellerAvatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={24} color="#94A3B8" />
                  </View>
                )}
                {animal.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#3B82F6" style={styles.sellerVerifyBadge} />
                )}
              </View>

              <View style={styles.sellerMeta}>
                <Text style={styles.sellerName}>{animal.sellerId?.name || animal.sellerName || 'Seller'}</Text>
                <Text style={styles.sellerSubtext}>{animal.sellerId?.email || ''}</Text>
                <View style={styles.ratingStarsRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.ratingLabel}>Verified Seller</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Contact Buttons */}
            {(() => {
              const hasPhone = !!(animal.sellerId?.mobile || animal.sellerId?.phoneNumber);
              return (
                <View style={styles.sellerActionsRow}>
                  <TouchableOpacity
                    style={[styles.sellerActionBtn, styles.callBtn, !hasPhone && styles.disabledBtn]}
                    onPress={handleCall}
                    activeOpacity={hasPhone ? 0.7 : 1}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.sellerActionTextWhite}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sellerActionBtn, styles.whatsappBtn, !hasPhone && styles.disabledBtn]}
                    onPress={handleWhatsApp}
                    activeOpacity={hasPhone ? 0.7 : 1}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.sellerActionTextWhite}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sellerActionBtn, styles.chatBtn]}
                    onPress={handleChat}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chatbubble-ellipses" size={16} color="#16A34A" />
                    <Text style={styles.sellerActionTextGreen}>Chat</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>

          {/* Location details */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoCard}>
            <View style={styles.locationHeaderRow}>
              <Ionicons name="location" size={20} color="#16A34A" />
              <View style={styles.locationMeta}>
                <Text style={styles.locationPrimary}>{animal.location}</Text>
                <Text style={styles.locationSecondary}>
                  {[animal.taluka && `Taluka: ${animal.taluka}`, animal.district && `District: ${animal.district}`, animal.state && `State: ${animal.state}`].filter(Boolean).join(', ') || 'Location details unavailable'}
                </Text>
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
        <TouchableOpacity style={styles.stickyCallBtn} onPress={handleCall} activeOpacity={0.8}>
          <Ionicons name="call" size={18} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <Text style={styles.stickyPrimaryBtnText}>Call Seller</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stickyPrimaryBtn} onPress={handleChat} activeOpacity={0.8}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <Text style={styles.stickyPrimaryBtnText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Video Player Modal — uses expo-av for real uploaded video playback */}
      <Modal visible={isVideoPlaying} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={styles.videoPlayerContainer}>
          <SafeAreaView style={styles.videoSafeArea}>
            <TouchableOpacity style={styles.closeVideoBtn} onPress={() => setIsVideoPlaying(false)}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {animal.video ? (
            <Video
              source={{ uri: resolveMediaUrl(animal.video) }}
              style={styles.fullscreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
              isLooping={false}
              onError={(err) => {
                console.warn('[VideoPlayer] Playback error:', err);
                Alert.alert(
                  'Playback Error',
                  'Unable to play the video. The file may still be processing or the URL is unavailable.',
                  [{ text: 'Close', onPress: () => setIsVideoPlaying(false) }]
                );
              }}
            />
          ) : (
            <View style={styles.noVideoBox}>
              <MaterialCommunityIcons name="video-off-outline" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.noVideoText}>No video available for this listing.</Text>
            </View>
          )}
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
    gap: 10,
    paddingBottom: 28, // Padded for iOS home bar safety
  },
  stickyCallBtn: {
    flex: 1,
    height: 46,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
  fullscreenVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  noVideoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noVideoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  disabledBtn: {
    opacity: 0.45,
  },
});

