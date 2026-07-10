import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { resolveMediaUrl } from '../api/api';

export default function ListingCard({ item, onViewDetailsPress, style }) {
  const imageUrl = resolveMediaUrl(item.photos && item.photos.length > 0 ? item.photos[0] : null);

  return (
    <View style={[styles.card, style]}>
      {/* Image Block */}
      <View style={styles.imagePlaceholder}>
        {item.photos && item.photos.length > 0 ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.cardImage} 
            onError={(e) => console.log('[Image Load Error] ListingCard:', e.nativeEvent.error, 'URL:', imageUrl)}
          />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={38} color="#94A3B8" />
        )}
        
        {/* Badges Overlay Container (Top Left) */}
        <View style={styles.badgeOverlayContainer}>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={11} color="#FFFFFF" style={styles.badgeIcon} />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      {/* Details Block */}
      <View style={styles.cardDetails}>
        <View style={styles.titleRow}>
          <Text style={styles.animalName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={15} color="#3B82F6" style={styles.verifiedIcon} />
          )}
        </View>

        <Text style={styles.breedText} numberOfLines={1}>
          {item.breed} • {item.age}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{item.price}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Seller Info & Posted Time */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerLeft}>
            <Ionicons name="person-circle-outline" size={16} color="#64748B" />
            <Text style={styles.sellerName} numberOfLines={1}>
              {item.sellerName}
            </Text>
          </View>
          <Text style={styles.postedTime}>{item.postedTime}</Text>
        </View>

        {/* Location Row */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color="#64748B" style={styles.locationPinIcon} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        {/* Action Button - Polished Solid Green Light Theme */}
        <TouchableOpacity style={styles.detailsButton} onPress={onViewDetailsPress}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Softer border
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 135, // Polished card image ratio (aspect-ratio fit)
    backgroundColor: '#F8FAFC',
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
    marginRight: 6,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardDetails: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalName: {
    fontSize: 15,
    fontWeight: '700', // Stronger Typography
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
  priceRow: {
    marginTop: 6,
  },
  priceText: {
    fontSize: 19, // Polished price size
    fontWeight: '800', // Bold/Black
    color: '#16A34A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerName: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 5,
  },
  postedTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  locationPinIcon: {
    marginRight: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  detailsButton: {
    backgroundColor: '#DCFCE7', // Softer solid green background
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  }
});
