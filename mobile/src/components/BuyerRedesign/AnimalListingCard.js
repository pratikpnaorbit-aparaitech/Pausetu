// AnimalListingCard.js
// Redesigned premium animal listing card with clean layout inspired by Animal.in.

import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Share, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../../api/api';
import AppText from '../AppText';

// Smooth matching text highlighter for farmer-friendly search feedback
const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <AppText>{text}</AppText>;
  }
  const escaped = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <AppText style={styles.highlightTextBase}>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <AppText key={i} style={styles.matchHighlight}>{part}</AppText>
        ) : (
          <AppText key={i}>{part}</AppText>
        )
      )}
    </AppText>
  );
};

// Smooth Image Loader with Spinner
const ImageWithLoader = ({ uri, style }) => {
  const [loading, setLoading] = useState(false);
  return (
    <View style={style}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.imgLoaderContainer]}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      )}
    </View>
  );
};

export default function AnimalListingCard({ item, onDetailsPress, searchText = '' }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  // Card margins Horizontal = 10px (for nearly full screen width)
  const cardWidth = width - 20;

  const numericPrice = Number(item.price?.replace(/[^0-9]/g, '') || 65000);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Helper to detect if a file path or object is a video
  const detectIsVideo = useCallback((itemVal) => {
    if (!itemVal) return false;
    if (typeof itemVal === 'string') {
      const lower = itemVal.toLowerCase();
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
    if (typeof itemVal === 'object') {
      if (itemVal.type === 'video') return true;
      if (itemVal.mime?.startsWith('video/') || itemVal.mimeType?.startsWith('video/')) return true;
      if (itemVal.uri && detectIsVideo(itemVal.uri)) return true;
    }
    return false;
  }, []);

  const getUri = useCallback((itemVal) => {
    if (!itemVal) return '';
    if (typeof itemVal === 'string') return itemVal;
    return itemVal.uri || itemVal.url || '';
  }, []);

  // Multi-format media carousel builder supporting images & videos
  const mediaSlides = useMemo(() => {
    const slides = [];

    // 1. Process photos list in original order
    if (item?.photos && item.photos.length > 0) {
      item.photos.forEach((mediaItem) => {
        const uri = getUri(mediaItem);
        if (detectIsVideo(mediaItem)) {
          slides.push({
            type: 'video',
            uri: resolveMediaUrl(uri),
            thumbnail: item.photos.find(p => !detectIsVideo(p)) 
              ? resolveMediaUrl(getUri(item.photos.find(p => !detectIsVideo(p))))
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

    // 2. Process separate video field if it exists
    if (item?.video) {
      const videoUriVal = getUri(item.video);
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
  }, [item?.photos, item?.video, detectIsVideo, getUri]);

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / cardWidth);
    if (index >= 0 && index < mediaSlides.length) {
      setActiveImageIdx(index);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this animal on PashuSetu: ${item.name} (${item.breed}), Price: ${item.price}, Location: ${item.location}.`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCall = async () => {
    const phone = item.sellerId?.mobile || item.sellerId?.phoneNumber || '9876543210';
    const url = `tel:${phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), 'Calling is not supported on this device.');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleWhatsApp = async () => {
    const phone = item.sellerId?.mobile || item.sellerId?.phoneNumber || '9876543210';
    const cleaned = phone.replace(/[^0-9]/g, '');
    const withCountry = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
    const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(
      `Hi, I am interested in your animal listing: ${item.name} (${item.breed}) priced at ${item.price} on PashuSetu.`
    )}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error', { defaultValue: 'Error' }), 'WhatsApp is not installed on this device.');
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Build integrated title: Gir Cow | 2nd Calving | 12L Milk
  const calvingSuffix = item.lactation ? ` | ${item.lactation} ${t('buy.calvingLabel', { defaultValue: 'Calving' })}` : '';
  const milkSuffix = item.milkYield ? ` | ${item.milkYield}L ${t('buy.milkLabel', { defaultValue: 'Milk' })}` : '';
  const rawTitle = `${item.breed || item.name}${calvingSuffix}${milkSuffix}`;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      
      {/* 1. Header Info Row (Animal title, location metadata, wishlist outside image) */}
      <View style={styles.headerBlock}>
        <View style={styles.titleColumn}>
          <HighlightText text={rawTitle} highlight={searchText} />
          
          {/* Price display directly below title */}
          <View style={styles.priceRow}>
            <AppText style={styles.animalPrice}>₹{numericPrice.toLocaleString()}</AppText>
            {item.negotiable && (
              <View style={styles.badgeNegotiable}>
                <AppText style={styles.negotiableText}>
                  {t('buy.negotiable', { defaultValue: 'Negotiable' }).toUpperCase()}
                </AppText>
              </View>
            )}
          </View>

          {/* Location & posted time row */}
          <View style={styles.locationBar}>
            <View style={styles.locationMetaCol}>
              <Ionicons name="location-sharp" size={15} color="#16A34A" />
              <AppText style={styles.locationText} numberOfLines={1}>
                {item.location} • 3.2 km
              </AppText>
            </View>
            <View style={styles.locationMetaCol}>
              <Ionicons name="time-outline" size={15} color="#64748B" />
              <AppText style={styles.locationText}>{item.postedTime || 'Active'}</AppText>
            </View>
          </View>
        </View>

        {/* Floating Heart outside of the Media card overlay */}
        <TouchableOpacity 
          style={styles.headerActionCircle} 
          onPress={() => setIsWishlisted(!isWishlisted)}
          aria-label={t('buy.save')}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={22} 
            color={isWishlisted ? "#EF4444" : "#1E293B"} 
          />
        </TouchableOpacity>
      </View>

      {/* 2. Media Area (Carousel slider - 270px) */}
      <View style={styles.imageContainer}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageSlider}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {mediaSlides.map((slide, i) => {
            if (slide.type === 'video') {
              return (
                <View key={i} style={[styles.sliderImg, { width: cardWidth, position: 'relative' }]}>
                  <ImageWithLoader 
                    uri={slide.thumbnail || mediaSlides[0]?.uri || 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=400&q=80'} 
                    style={StyleSheet.absoluteFillObject} 
                  />
                  <View style={styles.videoOverlay}>
                    <TouchableOpacity 
                      style={styles.playButtonCircle} 
                      onPress={onDetailsPress} 
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            if (slide.type === 'placeholder') {
              return (
                <View key={i} style={[styles.sliderImg, styles.placeholderWrap, { width: cardWidth }]}>
                  <MaterialCommunityIcons name="image-outline" size={48} color="#94A3B8" />
                </View>
              );
            }
            return (
              <ImageWithLoader 
                key={i} 
                uri={slide.uri} 
                style={[styles.sliderImg, { width: cardWidth }]} 
              />
            );
          })}
        </ScrollView>

        {/* Top-Left badges */}
        <View style={styles.overlayTopLeft}>
          {item.isVerified && (
            <View style={[styles.floatingBadge, styles.badgeVerified]}>
              <MaterialCommunityIcons name="check-decagram" size={12} color="#FFFFFF" />
              <AppText style={styles.badgeTextSmallBold}>
                {t('common.verified', { defaultValue: 'VERIFIED' })}
              </AppText>
            </View>
          )}
          {item.views > 350 && (
            <View style={[styles.floatingBadge, styles.badgeUrgent]}>
              <MaterialCommunityIcons name="fire" size={12} color="#FFFFFF" />
              <AppText style={styles.badgeTextSmallBold}>
                {t('buy.urgentSale', { defaultValue: 'URGENT' })}
              </AppText>
            </View>
          )}
        </View>

        {/* Top-Right Share */}
        <View style={styles.overlayTopRight}>
          <TouchableOpacity 
            style={styles.floatingActionCircle} 
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Bottom Floating indicators */}
        <View style={styles.overlayBottomRight}>
          <View style={styles.imageCounter}>
            <AppText style={styles.imageCounterText}>{activeImageIdx + 1}/{mediaSlides.length}</AppText>
          </View>
        </View>
      </View>

      {/* 3. View Details Trigger Button (Placed directly below image) */}
      <TouchableOpacity 
        style={styles.viewDetailsBtn} 
        activeOpacity={0.8} 
        onPress={onDetailsPress}
      >
        <AppText style={styles.viewDetailsText}>{t('buy.viewCompleteDetails')}</AppText>
      </TouchableOpacity>

      {/* 4. Compact Seller Row (Seller name, star rating, verified badge, call/WhatsApp) */}
      <View style={styles.sellerRow}>
        <View style={styles.sellerLeftCol}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person-circle-sharp" size={36} color="#16A34A" />
          </View>
          <View style={styles.sellerMeta}>
            <View style={styles.sellerNameRow}>
              <AppText style={styles.sellerName} numberOfLines={1}>{item.sellerName || 'Dealer'}</AppText>
              {item.isVerified && (
                <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" style={{ marginLeft: 3 }} />
              )}
            </View>
            <AppText style={styles.sellerRating}>⭐ 4.8</AppText>
          </View>
        </View>

        {/* Bottom CTA Row: Call & WhatsApp Actions */}
        <View style={styles.ctaActionsWrap}>
          <TouchableOpacity 
            style={[styles.ctaBtn, styles.ctaCall]} 
            activeOpacity={0.7}
            onPress={handleCall}
          >
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.ctaBtn, styles.ctaWhatsapp]} 
            activeOpacity={0.7}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginHorizontal: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    padding: 14,
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  titleColumn: {
    flex: 1,
    marginRight: 8,
  },
  highlightTextBase: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
  },
  matchHighlight: {
    color: '#16A34A',
    fontWeight: '950',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  animalPrice: {
    fontSize: 22,
    fontWeight: '950',
    color: '#16A34A',
  },
  badgeNegotiable: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  negotiableText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '800',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  locationMetaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  headerActionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 270,
    position: 'relative',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageSlider: {
    width: '100%',
    height: '100%',
  },
  sliderImg: {
    height: '100%',
  },
  placeholderWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  imgLoaderContainer: {
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(22, 163, 74, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  floatingBadge: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeVerified: {
    backgroundColor: '#16A34A',
  },
  badgeUrgent: {
    backgroundColor: '#EF4444',
  },
  badgeTextSmallBold: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  overlayTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  floatingActionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  imageCounter: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  imageCounterText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewDetailsBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  avatarWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerMeta: {
    justifyContent: 'center',
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 13.5,
    fontWeight: '850',
    color: '#1E293B',
  },
  sellerRating: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 1,
  },
  ctaActionsWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  ctaBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaCall: {
    backgroundColor: '#0F172A',
  },
  ctaWhatsapp: {
    backgroundColor: '#16A34A',
  },
});
