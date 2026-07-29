import React, { useContext, useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Share, Linking, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import AppText from './AppText';
import { isUserVerified } from '../utils/verificationUtils';

function ListingCard({ item, onViewDetailsPress, style }) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { favorites, toggleFavoriteContext, isGuest, userToken } = useContext(AppContext);

  // Mirrors the same restriction logic used in AnimalDetailsScreen.
  // True for: guest sessions, post-logout (userToken null), or userToken === 'guest'.
  const isRestrictedUser = isGuest || !userToken || userToken === 'guest';
  const normalizedItemId = String(item?._id ?? item?.id ?? '').trim();
  const isWishlisted = favorites ? favorites.includes(normalizedItemId) : false;
  
  const [imageError, setImageError] = useState(false);
  const fallbackUrl = 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=300&q=80';
  const resolvedUrl = resolveMediaUrl(item.photos && item.photos.length > 0 ? item.photos[0] : null);
  const imageUrl = imageError ? fallbackUrl : resolvedUrl;

  // Category-aware determination of milk applicability
  const isMilkApplicable = useMemo(() => {
    if (!item) return false;
    if (item.gender === 'Male') return false;

    const cat = (
      item.categorySlug ||
      item.categoryId?.slug ||
      item.categoryName ||
      item.categoryId?.name ||
      item.category ||
      ''
    ).toString().toLowerCase();

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
  }, [item?.gender, item?.categorySlug, item?.categoryId, item?.categoryName, item?.category]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${item.name} (${item.breed}) listed for ${item.price} on PashuSetu!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCall = async () => {
    const phone = item.sellerId?.mobile || item.sellerId?.phoneNumber || '9876543210';
    let cleaned = String(phone).replace(/[^0-9]/g, '');
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    const withCountry = cleaned.startsWith('91') && cleaned.length > 10 ? `+${cleaned}` : `+91${cleaned}`;
    const url = `tel:${withCountry}`;
    
    console.log(`[CONSOLE LOG] [ListingCard Call] Initiated. Raw: ${phone}, Formatted: ${withCountry}, URL: ${url}`);

    try {
      console.log('[CONSOLE LOG] [ListingCard Call] Checking canOpenURL...');
      const supported = await Linking.canOpenURL(url);
      console.log(`[CONSOLE LOG] [ListingCard Call] canOpenURL result: ${supported}`);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('[CONSOLE LOG] [ListingCard Call] canOpenURL returned false. Trying direct openURL fallback...');
        await Linking.openURL(url);
      }
    } catch (e) {
      console.warn('[CONSOLE LOG] [ListingCard Call] Calling failed with error:', e.message);
      Alert.alert(t('common.error', { defaultValue: 'Error' }), 'Calling is not supported on this device.');
    }
  };

  const handleWhatsApp = async () => {
    const phone = item.sellerId?.mobile || item.sellerId?.phoneNumber || '9876543210';
    let cleaned = String(phone).replace(/[^0-9]/g, '');
    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    const withCountry = cleaned.startsWith('91') && cleaned.length > 10 ? cleaned : `91${cleaned}`;
    
    const cleanPrice = item.price ? String(item.price).replace(/[^0-9,]/g, '') : '';
    let messageText = t('animalDetails.whatsappShareMessage', {
      animalName: item.name,
      breed: item.breed,
      price: cleanPrice
    });
    if (!messageText || messageText.includes('whatsappShareMessage')) {
      messageText = `Hi, I am interested in your animal listing: ${item.name} (${item.breed}) priced at ${item.price} on PashuSetu.`;
    }

    const whatsappAppUrl = `whatsapp://send?phone=${withCountry}&text=${encodeURIComponent(messageText)}`;
    const whatsappWebUrl = `https://wa.me/${withCountry}?text=${encodeURIComponent(messageText)}`;
    
    console.log(`[CONSOLE LOG] [ListingCard WhatsApp] Initiated. Raw: ${phone}, Formatted: ${withCountry}, Msg: ${messageText}`);
    console.log(`[CONSOLE LOG] [ListingCard WhatsApp] App URL: ${whatsappAppUrl}`);
    console.log(`[CONSOLE LOG] [ListingCard WhatsApp] Web URL: ${whatsappWebUrl}`);

    try {
      console.log('[CONSOLE LOG] [ListingCard WhatsApp] Checking canOpenURL for whatsapp://...');
      const isWhatsappInstalled = await Linking.canOpenURL('whatsapp://');
      console.log(`[CONSOLE LOG] [ListingCard WhatsApp] canOpenURL result: ${isWhatsappInstalled}`);
      if (isWhatsappInstalled) {
        await Linking.openURL(whatsappAppUrl);
      } else {
        console.log('[CONSOLE LOG] [ListingCard WhatsApp] canOpenURL false. Trying direct App URL open fallback...');
        try {
          await Linking.openURL(whatsappAppUrl);
        } catch (directErr) {
          console.warn('[CONSOLE LOG] [ListingCard WhatsApp] Direct App URL open failed:', directErr.message);
          console.log('[CONSOLE LOG] [ListingCard WhatsApp] Trying Web URL fallback...');
          await Linking.openURL(whatsappWebUrl);
        }
      }
    } catch (e) {
      console.warn('[CONSOLE LOG] [ListingCard WhatsApp] WhatsApp failed with error:', e.message);
      Alert.alert(t('common.error', { defaultValue: 'Error' }), 'WhatsApp is not installed on this device.');
    }
  };

  // Short localized translation for unavailable milk capacity
  const getUnavailableMilkText = () => {
    const lang = i18n.language;
    if (lang === 'mr') return 'माहिती नाही';
    if (lang === 'hi') return 'जानकारी नहीं';
    return 'N/A';
  };

  // Determine seller name & verification status
  const sellerName = item.sellerName || item.sellerId?.name || 'Seller';
  const isSellerVerified = isUserVerified(item.sellerId) || item.isVerified;
  const sellerInitial = (sellerName && typeof sellerName === 'string' && sellerName.trim()) ? sellerName.trim().charAt(0).toUpperCase() : '?';

  // Role localized label
  const getSellerLabel = () => {
    const lang = i18n.language;
    if (lang === 'mr' || lang === 'hi') return 'विक्रेता';
    return 'Seller';
  };

  return (
    <TouchableOpacity 
      style={[styles.card, style]} 
      onPress={onViewDetailsPress}
      activeOpacity={0.95}
      onLayout={(e) => console.log('[ListingCard Layout] Card ID:', normalizedItemId, e.nativeEvent.layout)}
    >
      {/* 1. Animal Image */}
      <View style={styles.imageContainer}>
        {item.photos && item.photos.length > 0 ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
            resizeMode="cover"
            onError={(e) => {
              console.log('[Image Load Error] ListingCard:', e.nativeEvent?.error || e, 'URL:', imageUrl);
              if (!imageError) setImageError(true);
            }}
          />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={38} color="#94A3B8" />
        )}

        {/* 2. Badges (Top Left Overlay) */}
        <View style={styles.badgeOverlayContainer}>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <AppText style={styles.featuredBadgeText}>{t('common.featured')}</AppText>
            </View>
          )}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={11} color="#FFFFFF" style={styles.badgeIcon} />
              <AppText style={styles.verifiedBadgeText}>{t('common.verified')}</AppText>
            </View>
          )}
        </View>

        {/* 3. Share & Favourite Icons (Top Right Overlay) */}
        <View style={styles.floatingOverlayContainer}>
          <TouchableOpacity 
            style={styles.floatingActionCircle} 
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social" size={18} color="#1E293B" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.floatingActionCircle} 
            onPress={async () => {
              const res = await toggleFavoriteContext(normalizedItemId);
              if (res && res.reason === 'auth') {
                Alert.alert(
                  t('common.loginRequired', { defaultValue: 'Login Required' }),
                  t('animalDetails.loginToFavorite', { defaultValue: 'Please login to add animals to your favorites.' }),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.login', { defaultValue: 'Login' }), onPress: () => navigation.navigate('Auth') }
                  ]
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isWishlisted ? "heart" : "heart-outline"} 
              size={18} 
              color={isWishlisted ? "#EF4444" : "#1E293B"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Container */}
      <View style={styles.cardDetails}>
        {/* Active row status indicator */}
        <View style={styles.activeRow}>
          <View style={styles.activeDot} />
          <AppText style={styles.activeText}>Active</AppText>
        </View>

        {/* Name / Breed and Price row */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <AppText style={styles.animalName} numberOfLines={1}>
              {item.name}
            </AppText>
            <AppText style={styles.breedText} numberOfLines={1}>
              {item.breed}
            </AppText>
          </View>
          <View style={styles.priceColumn}>
            <AppText style={styles.priceText}>{item.price}</AppText>
          </View>
        </View>

        {/* Location & Posted Time Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Ionicons name="location-sharp" size={14} color="#64748B" style={styles.metaIcon} />
            <AppText style={styles.locationText} numberOfLines={1}>
              {item.location}
            </AppText>
          </View>
          <View style={styles.metaRight}>
            <Ionicons name="time-outline" size={14} color="#64748B" style={styles.metaIcon} />
            <AppText style={styles.postedTimeText} numberOfLines={1}>
              {item.postedTime || 'Active'}
            </AppText>
          </View>
        </View>

        {/* 9. Animal Specification Cards (Age and Milk Capacity) */}
        <View style={styles.specsContainer}>
          {/* Left Card: Age */}
          <View style={[styles.specCard, !isMilkApplicable && { flex: 1, marginRight: 0 }]}>
            <Ionicons name="calendar-outline" size={20} color="#16A34A" style={styles.specIcon} />
            <View style={styles.specTextContainer}>
              <AppText style={styles.specLabel}>{t('buy.ageLabel', { defaultValue: 'Age' })}</AppText>
              <AppText style={styles.specValue} numberOfLines={1}>
                {item.age || 'N/A'}
              </AppText>
            </View>
          </View>

          {/* Right Card: Milk Capacity (Only rendered if applicable) */}
          {isMilkApplicable && (
            <View style={styles.specCard}>
              <MaterialCommunityIcons name="bottle-tonic-outline" size={20} color="#2563EB" style={styles.specIcon} />
              <View style={styles.specTextContainer}>
                <AppText style={styles.specLabel}>{t('buy.milkLabel', { defaultValue: 'Milk' })}</AppText>
                <AppText style={styles.specValue} numberOfLines={1}>
                  {(() => {
                    const raw = item.health?.milkCapacity || item.milkYield;
                    if (!raw) return getUnavailableMilkText();
                    const cleaned = String(raw).replace(/liters\/day|liters|liter|l\/day|l/gi, '').trim();
                    return cleaned ? `${cleaned} L` : getUnavailableMilkText();
                  })()}
                </AppText>
              </View>
            </View>
          )}
        </View>

        {/* 10. Seller Profile Section */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <AppText style={styles.sellerAvatarText}>{sellerInitial}</AppText>
          </View>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerNameRow}>
              <AppText style={styles.sellerName} numberOfLines={1}>
                {sellerName}
              </AppText>
              {isSellerVerified && (
                <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" style={styles.verifiedSellerBadge} />
              )}
            </View>
            <AppText style={styles.sellerRole}>{getSellerLabel()}</AppText>
          </View>
        </View>

        {/* 11. Contact Buttons (Call + WhatsApp) */}
        <View style={styles.contactButtonsRow}>
          <TouchableOpacity
            style={[styles.contactButton, styles.callButton, isRestrictedUser && styles.guestDisabledBtn]}
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
              <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.85)" style={{ marginRight: 3 }} />
            )}
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <AppText style={styles.contactButtonText}>{t('buy.callSeller', { defaultValue: 'Call' })}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactButton, styles.whatsappButton, isRestrictedUser && styles.guestDisabledBtn]}
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
              <Ionicons name="lock-closed" size={13} color="rgba(255,255,255,0.85)" style={{ marginRight: 3 }} />
            )}
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <AppText style={styles.contactButtonText}>{t('buy.whatsapp', { defaultValue: 'WhatsApp' })}</AppText>
          </TouchableOpacity>
        </View>

        {/* 12. Show More Button (Keep It) */}
        <TouchableOpacity style={styles.detailsButton} onPress={onViewDetailsPress} activeOpacity={0.8}>
          <View style={styles.detailsButtonContent}>
            <AppText style={styles.detailsButtonText}>{t('common.viewDetails')}</AppText>
            <Ionicons name="chevron-forward" size={16} color="#16A34A" style={styles.detailsChevron} />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 8px 16px rgba(15, 23, 42, 0.05)',
      }
    }),
  },
  imageContainer: {
    width: '100%',
    height: 180, // Premium image size
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlayContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredBadge: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    paddingVertical: 4,
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingOverlayContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  floatingActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  cardDetails: {
    padding: 16,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flex: 1,
    marginRight: 8,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  breedText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16A34A',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  postedTimeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  specCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  specIcon: {
    marginRight: 10,
  },
  specTextContainer: {
    flex: 1,
  },
  specLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sellerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sellerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedSellerBadge: {
    marginLeft: 4,
  },
  sellerRole: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 1,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  contactButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callButton: {
    backgroundColor: '#2563EB',
  },
  whatsappButton: {
    backgroundColor: '#16A34A',
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Applied when isRestrictedUser is true (guest / logged-out).
  // Visually mutes the button and suppresses press animation.
  guestDisabledBtn: {
    opacity: 0.38,
  },
  detailsButton: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 4,
  },
  detailsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  detailsChevron: {
    position: 'absolute',
    right: 16,
  },
});

export default React.memo(ListingCard);
