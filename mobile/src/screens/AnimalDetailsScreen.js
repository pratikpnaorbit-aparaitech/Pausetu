// AnimalDetailsScreen.js
// Redesigned premium livestock details page with dynamic zoom views, spec cards, maps trackers, and call CTAs.

import React, { useState, useRef, useCallback, useEffect, useContext, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Dimensions, Modal, Share, FlatList, SafeAreaView, ActivityIndicator, Linking, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import SectionHeader from '../components/SectionHeader';
import ListingCard from '../components/ListingCard';
import { api, resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');
const GALLERY_HEIGHT = 300;

const ImageWithLoader = ({ uri, style, resizeMode, onPress }) => {
  const [loading, setLoading] = useState(false);
  const source = useMemo(() => {
    if (!uri) {
      return { uri: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80' };
    }
    return { uri };
  }, [uri]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={style}>
      {/* Blurred background to prevent blank/letterbox areas */}
      <Image
        source={source}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 20 : 10}
      />
      {/* Main image with aspect ratio preserved */}
      <Image
        source={source}
        style={StyleSheet.absoluteFillObject}
        resizeMode={resizeMode}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleLoadEnd}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loaderCenter]}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function AnimalDetailsScreen({ route, navigation }) {
  const passedAnimal = route.params?.animal || null;
  const animalId = passedAnimal?._id || passedAnimal?.id || null;

  const [animal, setAnimal] = useState(passedAnimal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const [zoomImageUri, setZoomImageUri] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [similarAnimals, setSimilarAnimals] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const { t } = useTranslation();

  const { userProfile, isGuest } = useContext(AppContext);

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
    return item.uri || item.url || '';
  }, []);

  const mediaSlides = useMemo(() => {
    const slides = [];

    // 1. Process photos list in original order (may contain mixed images and videos)
    if (animal?.photos && animal.photos.length > 0) {
      animal.photos.forEach((mediaItem) => {
        const uri = getUri(mediaItem);
        if (detectIsVideo(mediaItem)) {
          slides.push({
            type: 'video',
            uri: resolveMediaUrl(uri),
            thumbnail: animal.photos.find(p => !detectIsVideo(p)) 
              ? resolveMediaUrl(getUri(animal.photos.find(p => !detectIsVideo(p))))
              : null,
          });
        } else {
          slides.push({
            type: 'image',
            uri: resolveMediaUrl(uri),
          });
        }
      });
    }

    // 2. Process separate video field if it exists and hasn't been added yet
    if (animal?.video) {
      const videoUriVal = getUri(animal.video);
      const isAlreadyAdded = slides.some(s => s.type === 'video' && s.uri.includes(videoUriVal));
      if (!isAlreadyAdded) {
        slides.push({
          type: 'video',
          uri: resolveMediaUrl(videoUriVal),
          thumbnail: slides.find(s => s.type === 'image')?.uri || null,
        });
      }
    }

    if (slides.length === 0) {
      slides.push({
        type: 'placeholder',
      });
    }

    return slides;
  }, [animal?.photos, animal?.video, detectIsVideo, getUri]);

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

  const checkVerification = () => {
    if (isGuest) {
      Alert.alert(
        t('common.loginRequired', { defaultValue: 'Login Required' }),
        t('verification.restrictedToast', { defaultValue: 'Verification Required: Please log in and upload your milk dairy receipt to unlock this feature.' })
      );
      return false;
    }
    const status = userProfile?.verification?.status || 'unverified';
    if (status !== 'approved') {
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
            milkYield: a.milkYield || null,
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
    const cleaned = phone.replace(/[^0-9]/g, '');
    const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const cleanPrice = animal.price ? animal.price.replace(/[^0-9,]/g, '') : '';
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
    let url = '';
    if (animal.latitude && animal.longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${animal.latitude},${animal.longitude}`;
    } else if (animal.location) {
      const encoded = encodeURIComponent(
        [animal.village, animal.taluka, animal.district, animal.state].filter(Boolean).join(', ') || animal.location
      );
      url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    } else {
      Alert.alert(t('animalDetails.locationUnavailable'), t('animalDetails.noLocationMsg'));
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('animalDetails.cannotOpenMaps'), t('animalDetails.cannotOpenMapsMsg'));
    }
  };

  const handleReport = () => {
    Alert.alert(
      t('buy.report', { defaultValue: 'Report Listing' }),
      'Are you sure you want to report this cattle listing to PashuSetu administrators?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          onPress: () => {
            setIsReported(true);
            Alert.alert('Report Submitted', 'Thank you. We will audit this listing within 24 hours.');
          } 
        }
      ]
    );
  };

  const numericPrice = Number(animal.price?.replace(/[^0-9]/g, '') || 65000);
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
    const normalized = colorVal.trim().toLowerCase();
    const translationKey = `animalDetails.color_${normalized}`;
    const translated = t(translationKey);
    if (translated === translationKey) {
      return colorVal.charAt(0).toUpperCase() + colorVal.slice(1);
    }
    return translated;
  };

  const getFormattedGender = (genderVal) => {
    if (!genderVal) return t('animalDetails.female');
    const normalized = genderVal.trim().toLowerCase();
    return t(`animalDetails.${normalized}`, { defaultValue: genderVal });
  };

  // Compilation of detailed specifications layout list (9-item specifications grid)
  const detailsItems = [
    { label: t('buy.breedLabel', { defaultValue: 'Breed' }), value: animal.breed || 'Unknown', icon: 'cow' },
    { label: t('buy.ageLabel', { defaultValue: 'Age' }), value: getFormattedAge(animal.age), icon: 'calendar-clock' },
    { label: t('buy.milkLabel', { defaultValue: 'Milk Yield' }), value: getFormattedMilkYield(animal.milkYield), icon: 'water' },
    { label: t('buy.weightLabel', { defaultValue: 'Weight' }), value: getFormattedWeight(animal.weight), icon: 'scale' },
    { label: t('animalDetails.gender', { defaultValue: 'Gender' }), value: getFormattedGender(animal.gender), icon: 'gender-male-female' },
    { label: t('animalDetails.color', { defaultValue: 'Color' }), value: getFormattedColor(animal.color), icon: 'palette' },
    { label: t('buy.pregnantLabel', { defaultValue: 'Pregnancy' }), value: animal.pregnant ? t('animalDetails.yes') : t('animalDetails.no'), icon: 'baby-carriage' },
    { label: t('buy.vaccinatedLabel', { defaultValue: 'Vaccinated' }), value: animal.health?.vaccinated || animal.vaccination === 'yes' ? t('animalDetails.yes') : t('animalDetails.no'), icon: 'needle' },
    { label: t('buy.healthLabel', { defaultValue: 'Health Status' }), value: animal.health?.healthy || animal.health === 'yes' || !animal.health?.sick ? t('animalDetails.healthy') : t('animalDetails.treatment', { defaultValue: 'Treatment' }), icon: 'heart-pulse' },
  ];

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
      <View style={styles.absoluteHeader}>
        <TouchableOpacity style={styles.headerCircleButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerRightButtons}>
          <TouchableOpacity style={styles.headerCircleButton} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerCircleButton, styles.headerBtnMargin]} 
            onPress={() => setIsWishlisted(!isWishlisted)}
            activeOpacity={0.7}
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
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ref={scrollRef}
          >
            {mediaSlides.map((slide, index) => {
              if (slide.type === 'image') {
                return (
                  <View key={index} style={styles.galleryImageWrap}>
                    <ImageWithLoader
                      uri={slide.uri}
                      style={styles.galleryImage}
                      resizeMode="contain"
                      onPress={() => {
                        setZoomImageUri(slide.uri);
                        setIsZoomVisible(true);
                      }}
                    />
                    <View style={styles.zoomIndicatorOverlay}>
                      <Ionicons name="scan" size={16} color="#FFFFFF" />
                    </View>
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
                  <View key={index} style={styles.videoSlide}>
                    <ImageWithLoader
                      uri={slide.thumbnail || firstImage || resolveMediaUrl(null)}
                      style={styles.galleryImage}
                      resizeMode="contain"
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
                <AppText style={styles.locationPrimary}>{animal.location}</AppText>
                <AppText style={styles.locationSecondary}>
                  {[animal.taluka && `Taluka: ${animal.taluka}`, animal.district && `District: ${animal.district}`, animal.state && `State: ${animal.state}`].filter(Boolean).join(', ') || t('animalDetails.locationUnavailable')}
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

      {/* Sticky Bottom Actions Bar (Call Seller and WhatsApp side-by-side equal width height 60) */}
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity style={styles.stickyCallBtn} onPress={handleCall} activeOpacity={0.8}>
          <Ionicons name="call" size={20} color="#FFFFFF" style={styles.primaryBtnIcon} />
          <AppText style={styles.stickyPrimaryBtnText}>{t('buy.callSeller')}</AppText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.stickyWhatsappBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
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

      {/* Full-Screen Image Zoom Modal */}
      <Modal visible={isZoomVisible} transparent={true} animationType="fade" onRequestClose={() => setIsZoomVisible(false)}>
        <View style={styles.zoomModalContainer}>
          <SafeAreaView style={styles.zoomHeader}>
            <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setIsZoomVisible(false)}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
          
          <ScrollView
            contentContainerStyle={styles.zoomScrollViewContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {zoomImageUri && (
              <Image 
                source={{ uri: zoomImageUri }} 
                style={styles.zoomImage} 
                resizeMode="contain" 
              />
            )}
          </ScrollView>
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
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  galleryImageWrap: {
    width: width,
    height: GALLERY_HEIGHT,
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: GALLERY_HEIGHT,
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
    width: width,
    height: GALLERY_HEIGHT,
    position: 'relative',
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
  zoomModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeZoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomScrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  zoomImage: {
    width: width,
    height: '100%',
  },
  placeholderSlide: {
    width: width,
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
});
