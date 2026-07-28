// AnimalDetailsScreen.js
// Redesigned premium livestock details page with dynamic zoom views, spec cards, maps trackers, and call CTAs.

import React, { useState, useRef, useCallback, useEffect, useContext, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Dimensions, useWindowDimensions, Modal, Share, FlatList, ActivityIndicator, Linking, Alert, Platform, TextInput, Animated, PanResponder } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import SectionHeader from '../components/SectionHeader';
import ListingCard from '../components/ListingCard';
import { api, resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import { AppContext } from '../context/AppContext';
import { reverseGeocodeWithCache, formatLocationDisplay } from '../utils/geocoder';
import { isUserVerified } from '../utils/verificationUtils';

const { width: INITIAL_WIDTH } = Dimensions.get('window');
// Dynamic gallery height fallback
const GALLERY_HEIGHT = Math.min(Math.round(INITIAL_WIDTH * (4 / 3)), 420);

const ImageWithLoader = ({ uri, style, resizeMode = 'cover', onPress }) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fallbackUri = 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=800&q=80';

  useEffect(() => {
    setHasError(false);
    setLoading(true);
    fadeAnim.setValue(0);
  }, [uri, fadeAnim]);

  const isValidUri = useMemo(() => {
    if (!uri || typeof uri !== 'string') return false;
    const trimmed = uri.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
    if (trimmed.endsWith('/null') || trimmed.endsWith('/undefined')) return false;
    return true;
  }, [uri]);

  const source = useMemo(() => {
    if (hasError || !isValidUri) {
      return { uri: fallbackUri };
    }
    return { uri };
  }, [uri, hasError, isValidUri]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleError = useCallback((e) => {
    const errObj = e?.nativeEvent?.error || e;
    console.warn(`[ImageWithLoader] Failed to load image URI "${uri}":`, errObj);
    setHasError(true);
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [uri, fadeAnim]);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      style={[style, { overflow: 'hidden', backgroundColor: '#0F172A' }]}
    >
      {/* Ambient Blurred Backdrop Layer: fills letterbox space smoothly with color-matched tones */}
      {resizeMode === 'contain' && (
        <Animated.Image
          source={source}
          style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim, transform: [{ scale: 1.15 }] }]}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 25 : 15}
        />
      )}
      {/* Dark tint overlay for pristine contrast behind foreground subject */}
      {resizeMode === 'contain' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]} />
      )}
      {/* Skeleton shimmer while image loads */}
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.skeletonContainer]}>
          <View style={styles.skeletonIconWrap}>
            <MaterialCommunityIcons name="image-outline" size={48} color="rgba(255,255,255,0.18)" />
          </View>
        </View>
      )}
      {/* Foreground Crisp Main Image — contain ensures 100% of animal is visible without cropping */}
      <Animated.Image
        source={source}
        style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoad={handleLoadEnd}
        onError={handleError}
      />
    </TouchableOpacity>
  );
};

// Interactive full-screen zoom component with double-tap toggle & gesture pan tracking
const ZoomableImage = ({ uri, isActive }) => {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [currentScale, setCurrentScale] = useState(1);
  const lastTap = useRef(0);

  // Reset zoom & panning when active slide changes
  useEffect(() => {
    if (!isActive) {
      pan.flattenOffset();
      pan.setValue({ x: 0, y: 0 });
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.timing(pan, { toValue: { x: 0, y: 0 }, duration: 200, useNativeDriver: false }),
      ]).start(() => {
        setCurrentScale(1);
      });
    }
  }, [isActive, scale, pan]);

  const handleDoubleTap = () => {
    const nextScale = currentScale > 1 ? 1 : 2.5;
    pan.flattenOffset();
    Animated.parallel([
      Animated.spring(scale, { toValue: nextScale, useNativeDriver: false, friction: 6 }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 6 }),
    ]).start(() => {
      setCurrentScale(nextScale);
    });
  };

  const handleTouchEnd = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTap.current = now;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => currentScale > 1,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return currentScale > 1 && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2);
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <View
      style={{ width: screenW, height: screenH, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}
      onTouchEnd={handleTouchEnd}
      {...panResponder.panHandlers}
    >
      <Animated.Image
        source={{ uri }}
        style={{
          width: screenW,
          height: screenH,
          transform: [
            { scale: scale },
            { translateX: pan.x },
            { translateY: pan.y }
          ]
        }}
        resizeMode="contain"
      />
    </View>
  );
};

export default function AnimalDetailsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const galleryHeight = Math.min(Math.round(width * (4 / 3)), 420);

  const passedAnimal = route.params?.animal || null;
  const animalId = passedAnimal?._id || passedAnimal?.id || null;

  const [animal, setAnimal] = useState(passedAnimal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [zoomImageUri, setZoomImageUri] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [similarAnimals, setSimilarAnimals] = useState([]);
  const [isReported, setIsReported] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Complaint state
  const [isComplaintModalVisible, setIsComplaintModalVisible] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  const scrollRef = useRef(null);
  const zoomFlatListRef = useRef(null);

  const { t } = useTranslation();
  const { userProfile, isGuest, userToken, favorites, toggleFavoriteContext, refreshProfileData } = useContext(AppContext);
  const normalizedAnimalId = String(animalId || '').trim();
  const isWishlisted = favorites ? favorites.includes(normalizedAnimalId) : false;

  // Helper to detect if a file path or object is a video
  const detectIsVideo = useCallback((item) => {
    if (!item) return false;
    if (typeof item === 'string') {
      const lower = item.toLowerCase();
      return (
        lower.endsWith('.mp4') ||
        lower.endsWith('.mov') ||
        lower.endsWith('.m4v') ||
        lower.endsWith('.3gp') ||
        lower.endsWith('.avi') ||
        lower.endsWith('.webm') ||
        lower.includes('/videos/') ||
        lower.includes('/video/')
      );
    }
    if (typeof item === 'object') {
      if (item.type === 'video') return true;
      if (item.mime?.startsWith('video/') || item.mimeType?.startsWith('video/')) return true;
      if (item.uri && detectIsVideo(item.uri)) return true;
    }
    return false;
  }, []);

  const getUri = useCallback((item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      return item.uri || item.url || item.fileUrl || item.path || '';
    }
    return '';
  }, []);

  const mediaSlides = useMemo(() => {
    const slides = [];

    // 1. Process photos list in original order (filter out null, undefined, empty strings, invalid objects)
    if (animal?.photos && Array.isArray(animal.photos) && animal.photos.length > 0) {
      animal.photos.forEach((mediaItem, idx) => {
        const rawUri = getUri(mediaItem);
        // Ignore null, undefined, empty strings, whitespace-only strings, or literal 'null'/'undefined' strings
        if (!rawUri || typeof rawUri !== 'string' || rawUri.trim() === '' || rawUri === 'undefined' || rawUri === 'null') {
          console.warn(`[AnimalDetails] Skipping invalid/empty photo entry at index ${idx}:`, mediaItem);
          return;
        }

        const resolved = resolveMediaUrl(rawUri);

        if (detectIsVideo(mediaItem)) {
          slides.push({
            type: 'video',
            uri: resolved,
            thumbnail: animal.photos.find(p => getUri(p) && !detectIsVideo(p)) 
              ? resolveMediaUrl(getUri(animal.photos.find(p => getUri(p) && !detectIsVideo(p))))
              : null,
          });
        } else {
          slides.push({
            type: 'image',
            uri: resolved,
          });
        }
      });
    }

    // 2. Process separate video field if it exists and hasn't been added yet
    if (animal?.video) {
      const videoUriVal = getUri(animal.video);
      if (videoUriVal && typeof videoUriVal === 'string' && videoUriVal.trim() !== '' && videoUriVal !== 'null' && videoUriVal !== 'undefined') {
        const resolvedVideo = resolveMediaUrl(videoUriVal);
        const isAlreadyAdded = slides.some(s => s.type === 'video' && s.uri && s.uri.includes(videoUriVal));
        if (!isAlreadyAdded) {
          slides.push({
            type: 'video',
            uri: resolvedVideo,
            thumbnail: slides.find(s => s.type === 'image')?.uri || null,
          });
        }
      }
    }

    if (slides.length === 0) {
      slides.push({
        type: 'placeholder',
      });
    }

    return slides;
  }, [animal?.photos, animal?.video, detectIsVideo, getUri]);

  const handleOpenZoom = useCallback((index, uri) => {
    const targetUri = uri || (mediaSlides[index]?.type === 'image' ? mediaSlides[index]?.uri : null);
    setZoomImageIndex(index);
    setZoomImageUri(targetUri);
    setIsZoomVisible(true);
  }, [mediaSlides]);

  const handleCloseZoom = useCallback(() => {
    setIsZoomVisible(false);
    setZoomImageUri(null);
  }, []);

  useEffect(() => {
    if (isZoomVisible && zoomFlatListRef.current && zoomImageIndex >= 0 && zoomImageIndex < mediaSlides.length) {
      const timer = setTimeout(() => {
        try {
          zoomFlatListRef.current?.scrollToIndex({ index: zoomImageIndex, animated: false });
        } catch (e) {
          // Safe fallback
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isZoomVisible, zoomImageIndex, mediaSlides.length]);

  const firstVideoInSlides = useMemo(() => {
    return mediaSlides.find(s => s.type === 'video')?.uri || null;
  }, [mediaSlides]);

  const videoUri = animal?.video ? resolveMediaUrl(animal.video) : firstVideoInSlides;
  const player = useVideoPlayer(videoUri, (playerInstance) => {
    playerInstance.loop = false;
  });

  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('error', (error) => {
      console.warn('[VideoPlayer] Playback error:', error);
      Alert.alert(
        t('common.error'),
        t('animalDetails.videoError'),
        [{ text: t('common.close'), onPress: () => setIsVideoPlaying(false) }]
      );
    });
    return () => {
      subscription.remove();
    };
  }, [player, t]);

  useEffect(() => {
    if (player && videoUri) {
      player.replace(videoUri);
    }
  }, [videoUri, player]);

  useEffect(() => {
    if (player) {
      if (isVideoPlaying) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isVideoPlaying, player]);

  useEffect(() => {
    if (!player) return;

    // Set initial playing status
    setIsPlayerPlaying(player.playing);

    const subscription = player.addListener('playingChange', (event) => {
      if (typeof event === 'object' && event !== null) {
        if ('isPlaying' in event) {
          setIsPlayerPlaying(event.isPlaying);
        } else if ('playing' in event) {
          setIsPlayerPlaying(event.playing);
        }
      } else if (typeof event === 'boolean') {
        setIsPlayerPlaying(event);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  // Auto-refresh user profile on mount to ensure fresh verification status
  useEffect(() => {
    if (userToken && !isGuest && refreshProfileData) {
      refreshProfileData();
    }
  }, [userToken, isGuest]);

  // True for guest sessions AND for fully logged-out sessions (userToken null/absent).
  // Both states must show the Marathi login dialog and disable Call/WhatsApp.
  const isRestrictedUser = isGuest || !userToken || userToken === 'guest';

  const checkVerification = () => {
    console.log('[VERIFICATION DEBUG] User verification object:', userProfile?.verification);
    console.log('[VERIFICATION DEBUG] User verification status:', userProfile?.verification?.status || userProfile?.verificationStatus);
    console.log('[VERIFICATION DEBUG] isGuest:', isGuest, '| userToken:', userToken, '| isRestrictedUser:', isRestrictedUser);

    if (isRestrictedUser) {
      console.log('[VERIFICATION DEBUG] final boolean used to enable Call/WhatsApp:', false, '(Guest / Logged-out User)');
      Alert.alert(
        'लॉगिन आवश्यक',
        'विक्रेत्याशी संपर्क करण्यासाठी कृपया प्रथम लॉगिन करा.',
        [
          { text: 'रद्द करा', style: 'cancel' },
          { text: 'लॉगिन करा', onPress: () => navigation.navigate('Auth') }
        ]
      );
      return false;
    }

    const verified = isUserVerified(userProfile);
    console.log('[VERIFICATION DEBUG] final boolean used to enable Call/WhatsApp:', verified);

    if (!verified) {
      const status = userProfile?.verification?.status || userProfile?.verificationStatus || 'unverified';
      Alert.alert(
        status === 'pending'
          ? t('verification.pending', { defaultValue: 'Verification Pending' })
          : t('verification.title', { defaultValue: 'Verification Required' }),
        status === 'pending'
          ? t('verification.pendingDesc', { defaultValue: 'Your account is under review. Marketplace features will be unlocked after approval.' })
          : t('verification.restrictedToast', { defaultValue: 'Verification Required: Please upload your milk dairy receipt to unlock this feature.' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: status === 'pending' ? t('common.close') : t('verification.uploadNewBtn', { defaultValue: 'Upload Receipt' }),
            onPress: () => {
              if (status !== 'pending') {
                navigation.navigate('Verification');
              }
            }
          }
        ]
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    // Reset animal & gallery scroll state immediately when target listing changes
    setAnimal(passedAnimal);
    setActiveSlide(0);
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTo({ x: 0, animated: false });
      } catch (e) {
        // Safe check if unmounted
      }
    }

    const fetchAnimalDetails = async () => {
      if (!animalId) {
        setLoading(false);
        setError(t('animalDetails.notFound'));
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await api.getAnimalById(animalId);

        if (cancelled) return;

        if (res.status === 'success' && res.data?.animal) {
          const a = res.data.animal;
          
          let displayLocation = [a.village, a.district].filter(Boolean).join(', ') || passedAnimal?.location || '';
          let talukaVal = a.taluka || null;
          let districtVal = a.district || null;
          let stateVal = a.state || null;
          let villageVal = a.village || null;
          let pincodeVal = a.pincode || null;
          let formattedAddr = a.formattedAddress || null;

          // Legacy migration: If listing contains latitude/longitude but missing formattedAddress/village
          // Display geocoded address locally. Do NOT persist to DB from this read-only screen.
          if (a.latitude && a.longitude && (!a.formattedAddress || !a.village)) {
            const geocoded = await reverseGeocodeWithCache(a.latitude, a.longitude);
            if (geocoded) {
              villageVal = geocoded.village || villageVal;
              talukaVal = geocoded.taluka || talukaVal;
              districtVal = geocoded.district || districtVal;
              stateVal = geocoded.state || stateVal;
              pincodeVal = geocoded.pincode || pincodeVal;
              formattedAddr = geocoded.formattedAddress;
              displayLocation = formattedAddr;
              // NOTE: No api.updateAnimal() call here. AnimalDetailsScreen is READ-ONLY.
              // Geocoded location is displayed locally without writing to the database.
            }
          } else if (a.formattedAddress) {
            displayLocation = a.formattedAddress;
          }

          setAnimal({
            ...a,
            _id: a._id,
            id: a._id,
            name: a.title || passedAnimal?.name || 'Unknown',
            breed: a.breedId?.name || passedAnimal?.breed || 'Unknown Breed',
            age: a.age || passedAnimal?.age || 'N/A',
            price: `₹${(a.price || 0).toLocaleString()}`,
            sellerName: a.sellerId?.name || passedAnimal?.sellerName || 'Seller',
            location: displayLocation,
            isVerified: a.status === 'approved',
            isFeatured: (a.views || 0) > 200,
            photos: a.photos || [],
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
            state: stateVal,
            district: districtVal,
            taluka: talukaVal,
            village: villageVal,
            pincode: pincodeVal,
            formattedAddress: formattedAddr,
            milkYield: a.health?.milkCapacity || a.milkYield || null,
            pregnant: a.pregnant || false,
            lactation: a.lactation || null,
          });
        } else {
          setError(t('animalDetails.notFound'));
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[AnimalDetails] Failed to load animal:', err.message);
          if (passedAnimal) {
            setAnimal(passedAnimal);
          } else {
            setError(err.message || t('animalDetails.notFound'));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnimalDetails();
    return () => { cancelled = true; };
  }, [animalId, passedAnimal, t]);

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
  }, [animal?.categoryId, animal?._id, animal?.id]);


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

  const handleCall = async () => {
    if (!checkVerification()) return;
    const phone = animal.sellerId?.mobile || animal.sellerId?.phoneNumber;
    if (!phone) {
      Alert.alert(t('animalDetails.phoneNotAvailable'), t('animalDetails.phoneNotAvailableMsg'));
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('animalDetails.cannotOpenDialer'), t('animalDetails.cannotOpenDialerMsg'));
    }
  };

  const handleWhatsApp = async () => {
    if (!checkVerification()) return;
    const phone = animal.sellerId?.mobile || animal.sellerId?.phoneNumber;
    if (!phone) {
      Alert.alert(t('animalDetails.phoneNotAvailable'), t('animalDetails.phoneNotAvailableMsg'));
      return;
    }
    const cleaned = String(phone).replace(/[^0-9]/g, '');
    const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const cleanPrice = animal.price ? String(animal.price).replace(/[^0-9,]/g, '') : '';
    const messageText = t('animalDetails.whatsappShareMessage', {
      animalName: animal.name,
      breed: animal.breed,
      price: cleanPrice
    });
    const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(messageText)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('animalDetails.whatsappNotFound'), t('animalDetails.whatsappNotFoundMsg'));
    }
  };

  const handleChat = () => {
    if (!checkVerification()) return;
    const sellerId = animal.sellerId?._id || animal.sellerId;
    if (!sellerId) {
      Alert.alert(t('common.error'), t('animalDetails.notFound'));
      return;
    }
    const state = navigation.getState();
    const routeNames = state?.routeNames || [];
    if (routeNames.includes('Chat')) {
      navigation.navigate('Chat', {
        sellerId,
        animalId: animal._id || animal.id,
        animalTitle: animal.name,
      });
    } else {
      Alert.alert(
        t('animalDetails.chatComingSoon'),
        t('animalDetails.chatComingSoonMsg'),
        [
          { text: t('animalDetails.call'), onPress: handleCall },
          { text: t('animalDetails.whatsapp'), onPress: handleWhatsApp },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    }
  };

  const handleOpenMaps = async () => {
    const lat = animal?.latitude || animal?.mediaMetadata?.latitude || passedAnimal?.latitude;
    const lng = animal?.longitude || animal?.mediaMetadata?.longitude || passedAnimal?.longitude;

    const validLat = (lat !== undefined && lat !== null && !isNaN(Number(lat))) ? Number(lat) : null;
    const validLng = (lng !== undefined && lng !== null && !isNaN(Number(lng))) ? Number(lng) : null;

    const locationStr = formatLocationDisplay({
      village: animal?.village,
      taluka: animal?.taluka,
      district: animal?.district,
      state: animal?.state
    }).formatted || animal?.location || animal?.formattedAddress || passedAnimal?.location;

    if (validLat !== null && validLng !== null) {
      const nativeNavUrl = `google.navigation:q=${validLat},${validLng}&mode=d`;
      const webDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${validLat},${validLng}&travelmode=driving`;

      if (Platform.OS === 'android') {
        try {
          // Directly launch Android native Google Maps driving navigation intent (bypasses canOpenURL API 30+ restrictions)
          await Linking.openURL(nativeNavUrl);
          return;
        } catch (androidErr) {
          console.warn('[Maps] Native intent launch failed, using web fallback:', androidErr.message);
        }
      }

      // Web/iOS or Android fallback
      try {
        await Linking.openURL(webDirUrl);
      } catch (webErr) {
        Alert.alert(t('animalDetails.cannotOpenMaps'), t('animalDetails.cannotOpenMapsMsg'));
      }
      return;
    }

    if (locationStr) {
      const encoded = encodeURIComponent(locationStr);
      const webDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
      try {
        await Linking.openURL(webDirUrl);
      } catch (err) {
        Alert.alert(t('animalDetails.cannotOpenMaps'), t('animalDetails.cannotOpenMapsMsg'));
      }
      return;
    }

    Alert.alert(t('animalDetails.locationUnavailable'), t('animalDetails.noLocationMsg'));
  };

  const handleReport = () => {
    if (isGuest || !userToken || userToken === 'guest') {
      Alert.alert(
        t('common.loginRequired', { defaultValue: 'Login Required' }),
        t('animalDetails.loginToReport', { defaultValue: 'Please login to report this listing.' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.login', { defaultValue: 'Login' }), onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }
    setComplaintText('');
    setTimeout(() => {
      setIsComplaintModalVisible(true);
    }, 50);
  };

  const submitComplaint = async () => {
    if (complaintText.trim().length < 10) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), 'Complaint must be at least 10 characters long.');
      return;
    }
    if (complaintText.length > 500) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), 'Complaint cannot exceed 500 characters.');
      return;
    }

    setIsSubmittingComplaint(true);
    try {
      const res = await api.submitComplaint({
        animalId: animal._id || animal.id,
        message: complaintText.trim()
      });
      if (res?.status === 'success') {
        setIsComplaintModalVisible(false);
        setIsReported(true);
        Alert.alert(
          'यशस्वीरित्या नोंदवली गेली',
          'तुमची तक्रार यशस्वीरित्या नोंदवली गेली.',
          [{ text: t('common.ok', { defaultValue: 'OK' }) }]
        );
      }
    } catch (e) {
      console.warn('Complaint submission error:', e);
      const msg = e.response?.data?.message || 'Something went wrong. Please try again.';
      Alert.alert(t('common.error', { defaultValue: 'Error' }), msg);
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Favorites are now fetched globally via AppContext
  // No local fetch needed

  const handleLikeToggle = async () => {
    if (isGuest || !userToken || userToken === 'guest') {
       Alert.alert(
        t('common.loginRequired', { defaultValue: 'Login Required' }),
        t('animalDetails.loginToFavorite', { defaultValue: 'Please login to add animals to your favorites.' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.login', { defaultValue: 'Login' }), onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }

    if (isLiking || !animalId) return;
    setIsLiking(true);

    try {
      const res = await toggleFavoriteContext(animalId);
      if (res && res.reason === 'auth') {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), t('common.loginRequired', { defaultValue: 'Login Required' }));
      } else if (!res || !res.success) {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' }));
      }
    } catch (e) {
      console.warn('Like API error:', e);
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('common.somethingWentWrong', { defaultValue: 'Something went wrong. Please try again.' }));
    } finally {
      setIsLiking(false);
    }
  };

  console.log('[AnimalDetailsScreen] typeof animal?.price:', typeof animal?.price, 'Value:', animal?.price);

  const numericPrice = typeof animal?.price === 'number'
    ? (isNaN(animal.price) ? 65000 : animal.price)
    : Number(String(animal?.price || '').replace(/[^0-9]/g, '') || 65000);
  const aiEstPrice = Math.round(numericPrice * 1.07);
  const priceDiff = aiEstPrice - numericPrice;
  const isGoodDeal = priceDiff > 0;

  const getFormattedAge = (ageVal) => {
    if (!ageVal) return '--';
    const cleaned = String(ageVal).replace(/years|year|वर्षे|वर्ष/gi, '').trim();
    if (!cleaned) return '--';
    return t('animalDetails.ageValue', { count: cleaned, defaultValue: `${cleaned} Years` });
  };

  const getFormattedWeight = (weightVal) => {
    if (!weightVal) return '--';
    const cleaned = String(weightVal).replace(/kg|kilograms|kilogram|किलोग्राम|किलो/gi, '').trim();
    if (!cleaned) return '--';
    return t('animalDetails.weightValue', { count: cleaned, defaultValue: `${cleaned} kg` });
  };

  const getFormattedMilkYield = (milkVal) => {
    if (!milkVal) return '--';
    const cleaned = String(milkVal).replace(/l\/day|liters\/day|liters|liter|l|लिटर|लीटर/gi, '').trim();
    if (!cleaned) return '--';
    return t('animalDetails.milkValue', { count: cleaned, defaultValue: `${cleaned} L` });
  };

  const getFormattedColor = (colorVal) => {
    if (!colorVal) return '--';
    const normalized = String(colorVal).trim().toLowerCase();
    const translationKey = `animalDetails.color_${normalized}`;
    const translated = t(translationKey);
    if (translated === translationKey) {
      return String(colorVal).charAt(0).toUpperCase() + String(colorVal).slice(1);
    }
    return translated;
  };

  const getFormattedGender = (genderVal) => {
    if (!genderVal) return t('animalDetails.female');
    const normalized = String(genderVal).trim().toLowerCase();
    return t(`animalDetails.${normalized}`, { defaultValue: genderVal });
  };

  const isDairyCategory = useMemo(() => {
    if (animal.gender === 'Male') return false;
    const cat = (
      animal.categorySlug ||
      animal.categoryId?.slug ||
      animal.categoryName ||
      animal.categoryId?.name ||
      animal.category ||
      ''
    ).toLowerCase();

    if (!cat) return true;
    if (cat.includes('horse') || cat.includes('घोडा')) return false;
    if (cat.includes('sheep') || cat.includes('मेंढी')) return false;
    if (cat.includes('other') || cat.includes('इतर')) return false;
    if (cat.includes('bull') || cat.includes('ox')) return false;
    if (cat.includes('donkey') || cat.includes('mule')) return false;

    return (
      cat.includes('cow') || cat.includes('गाय') ||
      cat.includes('buffalo') || cat.includes('म्हैस') ||
      cat.includes('goat') || cat.includes('शेळी')
    );
  }, [animal.gender, animal.categorySlug, animal.categoryId, animal.categoryName, animal.category]);

  // Compilation of detailed specifications layout list (category-aware specifications grid)
  const detailsItems = [
    { label: t('buy.breedLabel', { defaultValue: 'Breed' }), value: animal.breed || 'Unknown', icon: 'cow' },
    { label: t('buy.ageLabel', { defaultValue: 'Age' }), value: getFormattedAge(animal.age), icon: 'calendar-clock' },
    isDairyCategory ? { label: t('buy.milkLabel', { defaultValue: 'Milk Yield' }), value: getFormattedMilkYield(animal.milkYield), icon: 'water' } : null,
    { label: t('buy.weightLabel', { defaultValue: 'Weight' }), value: getFormattedWeight(animal.weight), icon: 'scale' },
    { label: t('animalDetails.gender', { defaultValue: 'Gender' }), value: getFormattedGender(animal.gender), icon: 'gender-male-female' },
    { label: t('animalDetails.color', { defaultValue: 'Color' }), value: getFormattedColor(animal.color), icon: 'palette' },
    (isDairyCategory && animal.gender !== 'Male') ? { label: t('buy.pregnantLabel', { defaultValue: 'Pregnancy' }), value: animal.pregnant ? t('animalDetails.yes') : t('animalDetails.no'), icon: 'baby-carriage' } : null,
    { label: t('buy.vaccinatedLabel', { defaultValue: 'Vaccinated' }), value: animal.health?.vaccinated || animal.vaccination === 'yes' ? t('animalDetails.yes') : t('animalDetails.no'), icon: 'needle' },
    { label: t('buy.healthLabel', { defaultValue: 'Health Status' }), value: animal.health?.healthy || animal.health === 'yes' || !animal.health?.sick ? t('animalDetails.healthy') : t('animalDetails.treatment', { defaultValue: 'Treatment' }), icon: 'heart-pulse' },
  ].filter(Boolean);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <AppText style={styles.loadingText}>
          {t('animalDetails.loading')}
        </AppText>
      </View>
    );
  }

  if (error || !animal) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#94A3B8" />
        <AppText style={styles.errorTitleText}>
          {error || t('animalDetails.notFound')}
        </AppText>
        <AppText style={styles.errorSubText}>
          {t('animalDetails.unavailable')}
        </AppText>
        <TouchableOpacity
          style={styles.errorBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <AppText style={styles.errorBtnText}>{t('animalDetails.goBack')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Absolute Transparent Header Overlay */}
      <View style={[styles.absoluteHeader, { top: (insets?.top || 0) + 8 }]}>
        <TouchableOpacity style={styles.headerCircleButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerCircleButton} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerCircleButton, styles.headerBtnMargin]} 
            onPress={handleLikeToggle}
            activeOpacity={0.7}
            disabled={isLiking}
          >
            <Ionicons 
              name={isWishlisted ? "heart" : "heart-outline"} 
              size={22} 
              color={isWishlisted ? "#EF4444" : "#0F172A"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerCircleButton, styles.headerBtnMargin]} 
            onPress={handleReport}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isReported ? "flag" : "flag-outline"} 
              size={20} 
              color={isReported ? "#EF4444" : "#0F172A"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Image/Video Gallery Slider */}
        <View style={[styles.galleryContainer, { height: galleryHeight }]}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ref={scrollRef}
            style={{ width: '100%' }}
          >
            {mediaSlides.map((slide, index) => {
              if (slide.type === 'image') {
                return (
                  <View key={`hero-slide-${index}-${slide.uri}`} style={[styles.galleryImageWrap, { width, height: galleryHeight }]}>
                    <ImageWithLoader
                      uri={slide.uri}
                      style={[styles.galleryImage, { width, height: galleryHeight }]}
                      resizeMode="cover"
                      onPress={() => handleOpenZoom(index, slide.uri)}
                    />
                    <TouchableOpacity
                      style={styles.zoomIndicatorOverlay}
                      activeOpacity={0.8}
                      onPress={() => handleOpenZoom(index, slide.uri)}
                    >
                      <Ionicons name="scan" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              }

              if (slide.type === 'video') {
                const firstImage = mediaSlides.find(s => s.type === 'image')?.uri;
                
                const handlePlay = () => {
                  if (player) {
                    player.replace(slide.uri);
                  }
                  setIsVideoPlaying(true);
                };
                
                return (
                  <View key={index} style={[styles.videoSlide, { width, height: galleryHeight }]}>
                    <ImageWithLoader
                      uri={slide.thumbnail || firstImage || resolveMediaUrl(null)}
                      style={[styles.galleryImage, { width, height: galleryHeight }]}
                      resizeMode="cover"
                      onPress={(e) => {
                        console.log('[VideoPlayer] Play button/thumbnail tapped');
                        handlePlay();
                      }}
                    />
                    <View style={[styles.playButtonAbsoluteContainer, { pointerEvents: 'none' }]}>
                      <View style={styles.playButtonCircle}>
                        <Ionicons name="play" size={36} color="#FFFFFF" style={styles.playIconOffset} />
                      </View>
                      <AppText style={[styles.videoSlideLabel, { marginTop: 12 }]}>
                        {t('animalDetails.watchVideo')}
                      </AppText>
                    </View>
                  </View>
                );
              }

              // Placeholder
              return (
                <View key={index} style={styles.placeholderSlide}>
                  <MaterialCommunityIcons name="image-outline" size={64} color="#94A3B8" />
                  <AppText style={styles.placeholderText}>
                    {t('animalDetails.noPhotos', { defaultValue: 'No media available' })}
                  </AppText>
                </View>
              );
            })}
          </ScrollView>

          {mediaSlides.length > 1 && (
            <View style={styles.paginationContainer}>
              {mediaSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    activeSlide === index ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}

        </View>

        {/* Content Body */}
        <View style={styles.detailsBody}>
          
          {/* 1. Header Information card */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <AppText style={styles.animalName} numberOfLines={2}>{animal.name}</AppText>
              {animal.isVerified && (
                <View style={styles.verifiedTextBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={13} color="#FFFFFF" style={styles.verifiedIconMargin} />
                  <AppText style={styles.verifiedTextBadgeLabel}>
                    {t('common.verified', { defaultValue: 'Verified' })}
                  </AppText>
                </View>
              )}
            </View>
            
            <AppText style={styles.animalBreed}>{animal.breed} • {getFormattedAge(animal.age)}</AppText>
            
            {/* Price dominating display */}
            <AppText style={styles.animalPrice}>{animal.price}</AppText>

            {/* AI Estimation Prominent Card inside Details */}
            <View style={styles.aiEstimationDetailsBox}>
              <View style={styles.aiDetailsHeader}>
                <View style={styles.aiTitleWrap}>
                  <MaterialCommunityIcons name="robot" size={16} color="#15803D" />
                  <AppText style={styles.aiTitleText}>
                    {t('buy.aiEstimatedValue', { defaultValue: 'AI Estimated Market Value' })}
                  </AppText>
                </View>
                <AppText style={styles.aiDetailsValue}>₹{aiEstPrice.toLocaleString()}</AppText>
              </View>
              {isGoodDeal && (
                <View style={styles.aiDetailsDealFooter}>
                  <View style={styles.dealBadge}>
                    <AppText style={styles.dealBadgeLabel}>{t('buy.goodDeal', { defaultValue: 'GOOD DEAL' })}</AppText>
                  </View>
                  <AppText style={styles.aiDetailsSavingsText}>
                    {t('buy.aiSavingsText', { price: priceDiff.toLocaleString(), defaultValue: `Price is ₹${priceDiff.toLocaleString()} lower than estimated market value` })}
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.postedBadge}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <AppText style={styles.postedText}>{t('animalDetails.listedAgo', { defaultValue: 'Listed recently' })}</AppText>
            </View>
          </View>

          {/* 2. Key Specifications Grid (9 specifications) */}
          <AppText style={styles.sectionTitle}>{t('animalDetails.specifications')}</AppText>
          <View style={styles.specsGrid}>
            {detailsItems.map((spec, idx) => (
              <View key={idx} style={styles.specItem}>
                <View style={styles.specIconCircle}>
                  <MaterialCommunityIcons name={spec.icon} size={20} color="#16A34A" />
                </View>
                <View style={styles.specContentWrap}>
                  <AppText style={styles.specLabel}>{spec.label}</AppText>
                  <AppText style={styles.specValue}>{spec.value}</AppText>
                </View>
              </View>
            ))}
          </View>

          {/* 3. Description Section */}
          <View style={styles.infoCard}>
            <AppText style={styles.cardSectionTitle}>{t('animalDetails.description')}</AppText>
            <AppText style={styles.descriptionText} numberOfLines={descriptionExpanded ? undefined : 3}>
              {animal.description || t('animalDetails.noDescription')}
            </AppText>
            <TouchableOpacity onPress={() => setDescriptionExpanded(!descriptionExpanded)} activeOpacity={0.7}>
              <AppText style={styles.readMoreText}>
                {descriptionExpanded ? t('animalDetails.readLess') : t('animalDetails.readMore')}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* 4. Seller Information */}
          <AppText style={styles.sectionTitle}>{t('animalDetails.sellerInfo')}</AppText>
          <View style={styles.sellerCard}>
            <View style={styles.sellerMainInfo}>
              <View style={styles.avatarContainer}>
                {animal.sellerId?.profilePhoto ? (
                  <Image
                    source={{ uri: resolveMediaUrl(animal.sellerId.profilePhoto) }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={[styles.sellerAvatar, styles.sellerPlaceholderAvatar]}>
                    <Ionicons name="person" size={26} color="#94A3B8" />
                  </View>
                )}
                {animal.isVerified && (
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#3B82F6" style={styles.sellerVerifyBadge} />
                )}
              </View>

              <View style={styles.sellerMeta}>
                <AppText style={styles.sellerName}>{animal.sellerId?.name || animal.sellerName || 'Seller'}</AppText>
                <AppText style={styles.sellerRepliesText}>
                  {t('buy.repliesWithin', { defaultValue: 'Usually replies within 15 minutes' })}
                </AppText>
                <View style={styles.ratingStarsRow}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <AppText style={styles.ratingLabel}>4.8 • {t('animalDetails.verifiedSeller')}</AppText>
                </View>
              </View>
            </View>

            {/* Seller Statistics Grid */}
            <View style={styles.sellerStatsRow}>
              <View style={styles.statBox}>
                <AppText style={styles.statVal}>96%</AppText>
                <AppText style={styles.statLabel}>{t('buy.responseRate')}</AppText>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.statBox}>
                <AppText style={styles.statVal}>{animal.sellerId?.views ? Math.round(animal.sellerId.views / 20) + 1 : 8}</AppText>
                <AppText style={styles.statLabel}>{t('buy.animalsSold')}</AppText>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.statBox}>
                <AppText style={styles.statVal}>2024</AppText>
                <AppText style={styles.statLabel}>{t('buy.memberSince')}</AppText>
              </View>
            </View>
          </View>

          {/* 5. Location Details & Map Selector */}
          <AppText style={styles.sectionTitle}>{t('animalDetails.location')}</AppText>
          <View style={styles.infoCard}>
            <View style={styles.locationHeaderRow}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location" size={20} color="#16A34A" />
              </View>
              <View style={styles.locationMeta}>
                <AppText style={styles.locationPrimary}>
                  📍 {animal.formattedAddress || animal.location || t('animalDetails.locationUnavailable')}
                </AppText>
                <AppText style={styles.locationSecondary}>
                  {[
                    animal.village && `${t('profile.village')}: ${animal.village}`,
                    animal.taluka && `${t('profile.taluka')}: ${animal.taluka}`,
                    animal.district && `${t('profile.district')}: ${animal.district}`,
                    animal.state && `${t('profile.state')}: ${animal.state}`
                  ].filter(Boolean).join(' | ') || t('animalDetails.locationUnavailable')}
                </AppText>
              </View>
            </View>

            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps} activeOpacity={0.8}>
              <Ionicons name="map-outline" size={18} color="#16A34A" />
              <AppText style={styles.mapButtonText}>{t('animalDetails.openMaps')}</AppText>
            </TouchableOpacity>
          </View>

          {/* 6. Similar Listings Carousel Section */}
          {similarAnimals.length > 0 && (
            <View style={styles.similarSection}>
              <SectionHeader title={t('animalDetails.similarAnimals')} onActionPress={() => {}} />
              <View style={styles.similarVerticalList}>
                {similarAnimals.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={item}
                    onViewDetailsPress={() => {
                      navigation.push('AnimalDetails', { animal: item });
                    }}
                    style={styles.similarCardVerticalOverride}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      {/* Guest / logged-out: buttons are visually muted and show a login dialog on tap */}
      {/* Authenticated: existing handleCall / handleWhatsApp logic is unchanged */}
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity
          style={[styles.stickyCallBtn, isRestrictedUser && styles.guestDisabledBtn]}
          activeOpacity={isRestrictedUser ? 1 : 0.8}
          onPress={() => {
            if (isRestrictedUser) {
              Alert.alert(
                'लॉगिन आवश्यक',
                'विक्रेत्याशी संपर्क करण्यासाठी कृपया प्रथम लॉगिन करा.',
                [
                  { text: 'रद्द करा', style: 'cancel' },
                  { text: 'लॉगिन करा', onPress: () => navigation.navigate('Auth') }
                ]
              );
              return;
            }
            handleCall();
          }}
        >
          {isRestrictedUser && (
            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.85)" style={{ marginRight: 5 }} />
          )}
          <Ionicons name="call" size={20} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <AppText style={styles.stickyPrimaryBtnText}>{t('buy.callSeller')}</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stickyWhatsappBtn, isRestrictedUser && styles.guestDisabledBtn]}
          activeOpacity={isRestrictedUser ? 1 : 0.8}
          onPress={() => {
            if (isRestrictedUser) {
              Alert.alert(
                'लॉगिन आवश्यक',
                'विक्रेत्याशी संपर्क करण्यासाठी कृपया प्रथम लॉगिन करा.',
                [
                  { text: 'रद्द करा', style: 'cancel' },
                  { text: 'लॉगिन करा', onPress: () => navigation.navigate('Auth') }
                ]
              );
              return;
            }
            handleWhatsApp();
          }}
        >
          {isRestrictedUser && (
            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.85)" style={{ marginRight: 5 }} />
          )}
          <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <AppText style={styles.stickyPrimaryBtnText}>{t('buy.whatsapp')}</AppText>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Video Player Modal */}
      <Modal visible={isVideoPlaying} transparent={false} animationType="slide" statusBarTranslucent>
        <View style={styles.videoPlayerContainer}>
          <SafeAreaView style={styles.videoSafeArea}>
            <TouchableOpacity style={styles.closeVideoBtn} onPress={() => setIsVideoPlaying(false)}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          {videoUri ? (
            <View style={styles.fullscreenVideoContainer}>
              <VideoView
                player={player}
                style={styles.fullscreenVideo}
                resizeMode="contain"
                controls={isPlayerPlaying}
              />
              {!isPlayerPlaying && (
                <TouchableOpacity 
                  style={styles.videoOverlayPlayContainer}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (player) {
                      player.play();
                    }
                  }}
                >
                  <View style={styles.centerPlayButtonCircle}>
                    <Ionicons name="play" size={40} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noVideoBox}>
              <MaterialCommunityIcons name="video-off-outline" size={64} color="rgba(255,255,255,0.5)" />
              <AppText style={styles.noVideoText}>{t('animalDetails.noVideo')}</AppText>
            </View>
          )}
        </View>
      </Modal>

      {/* Full-Screen Interactive Image & Gallery Viewer Modal */}
      <Modal
        visible={isZoomVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={handleCloseZoom}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.fullScreenGalleryContainer}>
          {/* Header Bar */}
          <View style={styles.fullScreenGalleryHeader}>
            <TouchableOpacity
              style={styles.fullScreenCloseBtn}
              onPress={handleCloseZoom}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.fullScreenTitleWrap}>
              <AppText style={styles.fullScreenTitle} numberOfLines={1}>
                {animal?.name || animal?.breed || 'Animal Gallery'}
              </AppText>
              <AppText style={styles.fullScreenSubtitle}>
                {t('animalDetails.doubleTapZoom', { defaultValue: 'Double-tap or pinch to zoom' })}
              </AppText>
            </View>

            {/* Slide Count Counter Badge */}
            {mediaSlides.length > 0 && (
              <View style={styles.fullScreenPageBadge}>
                <AppText style={styles.fullScreenPageText}>
                  {zoomImageIndex + 1} / {mediaSlides.length}
                </AppText>
              </View>
            )}
          </View>

          {/* Swipeable Horizontal Gallery List */}
          <FlatList
            ref={zoomFlatListRef}
            data={mediaSlides}
            horizontal
            pagingEnabled
            initialScrollIndex={zoomImageIndex >= 0 && zoomImageIndex < mediaSlides.length ? zoomImageIndex : 0}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(_, index) => `fullscreen-slide-${index}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
              if (newIdx !== zoomImageIndex && newIdx >= 0 && newIdx < mediaSlides.length) {
                setZoomImageIndex(newIdx);
                setActiveSlide(newIdx);
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ x: newIdx * width, animated: true });
                }
              }
            }}
            renderItem={({ item, index }) => {
              if (item.type === 'image') {
                return (
                  <ZoomableImage
                    uri={item.uri}
                    isActive={zoomImageIndex === index}
                  />
                );
              }

              if (item.type === 'video') {
                return (
                  <View style={styles.fullScreenVideoSlide}>
                    <Image
                      source={{ uri: item.thumbnail || resolveMediaUrl(null) }}
                      style={styles.fullScreenImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity
                      style={styles.fullScreenPlayOverlay}
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsZoomVisible(false);
                        if (player) {
                          player.replace(item.uri);
                        }
                        setIsVideoPlaying(true);
                      }}
                    >
                      <View style={styles.playButtonCircle}>
                        <Ionicons name="play" size={40} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      </View>
                      <AppText style={[styles.videoSlideLabel, { marginTop: 12 }]}>
                        {t('animalDetails.watchVideo')}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <View style={styles.fullScreenPlaceholderSlide}>
                  <MaterialCommunityIcons name="image-outline" size={72} color="#64748B" />
                  <AppText style={styles.placeholderText}>
                    {t('animalDetails.noPhotos', { defaultValue: 'No media available' })}
                  </AppText>
                </View>
              );
            }}
          />

          {/* Pagination dots overlay in full screen modal */}
          {mediaSlides.length > 1 && (
            <View style={styles.fullScreenPagination}>
              {mediaSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.fullScreenDot,
                    zoomImageIndex === index ? styles.fullScreenActiveDot : styles.fullScreenInactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Complaint Modal */}
      <Modal
        visible={isComplaintModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isSubmittingComplaint) setIsComplaintModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>Report Listing</AppText>
              <TouchableOpacity 
                onPress={() => {
                  setIsComplaintModalVisible(false);
                }}
                disabled={isSubmittingComplaint}
                style={styles.closeModalButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <AppText style={styles.modalSubtitle}>
              Please describe the issue with this listing.
            </AppText>
            
            <TextInput
              style={styles.complaintInput}
              multiline
              numberOfLines={6}
              placeholder="तुमची तक्रार लिहा... / Describe your complaint..."
              placeholderTextColor="#94A3B8"
              value={complaintText}
              onChangeText={setComplaintText}
              maxLength={500}
              editable={!isSubmittingComplaint}
              textAlignVertical="top"
            />
            <AppText style={styles.charCount}>
              {complaintText.length}/500
            </AppText>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => {
                  setIsComplaintModalVisible(false);
                }}
                disabled={isSubmittingComplaint}
              >
                <AppText style={styles.cancelBtnText}>Cancel</AppText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitBtn,
                  (complaintText.trim().length < 10 || isSubmittingComplaint) && styles.submitBtnDisabled
                ]} 
                onPress={submitComplaint}
                disabled={complaintText.trim().length < 10 || isSubmittingComplaint}
              >
                {isSubmittingComplaint ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={styles.submitBtnText}>Submit Complaint</AppText>
                )}
              </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  centerAlign: {
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12, 
    color: '#64748B', 
    fontSize: 15, 
    fontWeight: '700',
  },
  errorContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32,
  },
  errorTitleText: {
    marginTop: 16, 
    color: '#0F172A', 
    fontSize: 18, 
    fontWeight: '800', 
    textAlign: 'center',
  },
  errorSubText: {
    marginTop: 8, 
    color: '#64748B', 
    fontSize: 14, 
    textAlign: 'center',
  },
  errorBtn: {
    marginTop: 24, 
    paddingHorizontal: 28, 
    paddingVertical: 12, 
    backgroundColor: '#16A34A', 
    borderRadius: 16,
  },
  errorBtnText: {
    color: '#FFFFFF', 
    fontWeight: '900', 
    fontSize: 15,
  },
  absoluteHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtnMargin: {
    marginLeft: 10,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  galleryContainer: {
    width: '100%',
    height: GALLERY_HEIGHT,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  galleryImageWrap: {
    width: '100%',
    height: GALLERY_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  galleryImage: {
    width: '100%',
    height: GALLERY_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  skeletonContainer: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.4)',
  },
  placeholderSlide: {
    width: '100%',
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  placeholderText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  zoomIndicatorOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSlide: {
    width: '100%',
    height: GALLERY_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  playButtonAbsoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  playButtonCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(22, 163, 74, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  playIconOffset: {
    marginLeft: 4,
  },
  videoSlideLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
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
    width: 18,
    backgroundColor: '#16A34A',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  detailsBody: {
    padding: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  verifiedTextBadge: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  verifiedIconMargin: {
    marginRight: 4,
  },
  verifiedTextBadgeLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  animalBreed: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  animalPrice: {
    fontSize: 26,
    fontWeight: '950',
    color: '#16A34A',
    marginTop: 8,
  },
  aiEstimationDetailsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  aiDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiDetailsValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  aiDetailsDealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: 8,
    marginTop: 8,
  },
  dealBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  dealBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aiDetailsSavingsText: {
    fontSize: 11.5,
    fontWeight: '750',
    color: '#15803D',
    flex: 1,
  },
  postedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  postedText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginLeft: 4,
    marginBottom: 10,
    marginTop: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  specIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specContentWrap: {
    flex: 1,
  },
  specLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '850',
    color: '#1E293B',
    marginTop: 1,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '855',
    color: '#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13.5,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '600',
  },
  readMoreText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 6,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
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
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
  },
  sellerPlaceholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '850',
    color: '#0F172A',
  },
  sellerRepliesText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '800',
    marginTop: 2,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F59E0B',
    marginLeft: 4,
  },
  sellerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  dividerVertical: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationMeta: {
    flex: 1,
  },
  locationPrimary: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationSecondary: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  mapButton: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#F8FAFC',
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
    marginLeft: 6,
  },
  similarSection: {
    marginTop: 16,
  },
  similarVerticalList: {
    paddingTop: 8,
  },
  similarCardVerticalOverride: {
    marginHorizontal: 0,
    marginBottom: 16,
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
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  stickyCallBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  stickyWhatsappBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#16A34A',
    borderRadius: 16,
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
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  fullscreenVideoContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  videoOverlayPlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  centerPlayButtonCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(22, 163, 74, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
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
  // Applied to Call & WhatsApp buttons for guest/logged-out users: clearly muted, no press animation,
  // but tap still fires — showing the Marathi login dialog rather than doing nothing.
  guestDisabledBtn: {
    opacity: 0.38,
  },
  fullScreenGalleryContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenGalleryHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
  },
  fullScreenCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'center',
  },
  fullScreenTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  fullScreenSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  fullScreenPageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullScreenPageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fullScreenImageSlide: {
    width: INITIAL_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  fullScreenScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: INITIAL_WIDTH,
  },
  fullScreenImage: {
    width: INITIAL_WIDTH,
    height: '100%',
  },
  fullScreenVideoSlide: {
    width: INITIAL_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    position: 'relative',
  },
  fullScreenPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPlaceholderSlide: {
    width: INITIAL_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  fullScreenPagination: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenDot: {
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 4,
  },
  fullScreenActiveDot: {
    width: 20,
    backgroundColor: '#16A34A',
  },
  fullScreenInactiveDot: {
    width: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  placeholderSlide: {
    width: INITIAL_WIDTH,
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  loaderCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeModalButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  complaintInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#FCA5A5',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
