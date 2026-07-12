import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, Share, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { api, resolveMediaUrl } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

const { width } = Dimensions.get('window');

export default function SellScreen({ navigation }) {
  const { userProfile, userToken, exitGuestSession } = useContext(AppContext);
  const isGuest = userToken === 'guest';
  const name = isGuest ? 'Guest' : userProfile?.name || 'User';
  const { t } = useTranslation();

  const [listings, setListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (isGuest || !userProfile?.id) {
        setLoading(false);
        return;
      }
      try {
        const [animRes, notifRes] = await Promise.all([
          api.getAnimals({ sellerId: userProfile.id }),
          api.getMyNotifications()
        ]);
        if (animRes.status === 'success') {
          setListings(animRes.data.animals);
        }
        if (notifRes.status === 'success') {
          setNotifications(notifRes.data.notifications || []);
        }
      } catch (err) {
        console.warn('Failed to load seller portal data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userProfile, isGuest]);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#94A3B8" />
          <AppText style={styles.guestTitle}>{t('sell.portalLocked')}</AppText>
          <AppText style={styles.guestSubtitle}>{t('sell.loginToSell')}</AppText>
          <TouchableOpacity style={styles.guestLoginButton} onPress={exitGuestSession}>
            <AppText style={styles.guestLoginButtonText}>{t('sell.loginSignup')}</AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const verification = userProfile?.verification || { status: 'unverified' };
  const verificationStatus = verification.status || 'unverified';

  if (!isGuest && verificationStatus !== 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <MaterialCommunityIcons
            name={
              verificationStatus === 'pending'
                ? 'clock-outline'
                : verificationStatus === 'rejected'
                  ? 'alert-decagram-outline'
                  : 'shield-alert-outline'
            }
            size={64}
            color={
              verificationStatus === 'pending'
                ? '#D97706'
                : verificationStatus === 'rejected'
                  ? '#DC2626'
                  : '#94A3B8'
            }
          />
          <AppText style={styles.guestTitle}>
            {verificationStatus === 'pending'
              ? t('verification.pending')
              : verificationStatus === 'rejected'
                ? t('verification.rejected')
                : t('verification.title')}
          </AppText>
          <AppText style={styles.guestSubtitle}>
            {verificationStatus === 'pending'
              ? t('verification.pendingDesc')
              : verificationStatus === 'rejected'
                ? t('verification.rejectedDesc', { reason: verification.rejectedReason || 'No reason specified' })
                : t('verification.unverifiedDesc')}
          </AppText>
          {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
            <TouchableOpacity
              style={styles.guestLoginButton}
              onPress={() => navigation.navigate('Verification')}
            >
              <AppText style={styles.guestLoginButtonText}>
                {t('verification.uploadNewBtn')}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate dynamic stats
  const activeCount = listings.filter(a => a.status === 'approved' && !a.isDeleted).length;
  const pendingCount = listings.filter(a => a.status === 'pending' && !a.isDeleted).length;
  const soldCount = listings.filter(a => a.status === 'sold' && !a.isDeleted).length;
  const totalViews = listings.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalSales = listings.filter(a => a.status === 'sold' && !a.isDeleted).reduce((acc, a) => acc + a.price, 0);

  const statsData = [
    { id: '1', count: String(activeCount), label: t('sell.activeListing'), icon: 'checkbox-marked-circle-outline', color: '#16A34A', trend: t('sell.live') },
    { id: '2', count: String(pendingCount), label: t('sell.pendingApproval'), icon: 'clock-outline', color: '#F59E0B', trend: t('sell.inReview') },
    { id: '3', count: String(soldCount), label: t('sell.soldListing'), icon: 'check-decagram-outline', color: '#3B82F6', trend: `₹${(totalSales/1000).toFixed(1)}k Sales` },
    { id: '4', count: totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}K` : String(totalViews), label: t('sell.totalViews'), icon: 'eye-outline', color: '#8B5CF6', trend: t('sell.views') },
  ];

  const recentListings = listings
    .filter(a => a.status === 'approved' && !a.isDeleted)
    .slice(0, 5)
    .map(a => ({
      id: a._id,
      name: a.title,
      breed: a.breedId?.name || 'Breed',
      price: `₹${a.price.toLocaleString()}`,
      status: t('sell.live'),
      views: a.views || 0,
      postedDate: t('sell.postedAgo', { time: new Date(a.createdAt).toLocaleDateString() }),
      image: a.photos && a.photos.length > 0 ? resolveMediaUrl(a.photos[0]) : 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80'
    }));

  const pendingListings = listings
    .filter(a => a.status === 'pending' && !a.isDeleted)
    .slice(0, 5)
    .map(a => ({
      id: a._id,
      name: a.title,
      breed: a.breedId?.name || 'Breed',
      price: `₹${a.price.toLocaleString()}`,
      status: t('sell.pending')
    }));

  const recentEnquiries = notifications
    .filter(n => n.type === 'chat' || n.title.includes('Enquiry') || n.message.includes('inquiring'))
    .slice(0, 3)
    .map((n, index) => {
      const nameMatch = n.message.match(/^([A-Za-z\s]+) (sent you|inquiring)/);
      const animalMatch = n.message.match(/about the ([A-Za-z\s]+)\.?$/);
      const buyerName = nameMatch ? nameMatch[1].trim() : 'Buyer';
      const animalName = animalMatch ? animalMatch[1].replace(/\.$/, '').trim() : 'Livestock';
      return {
        id: n._id || String(index),
        buyerName,
        animal: animalName,
        time: t('sell.live')
      };
    });

  const handleShare = async (item) => {
    try {
      await Share.share({
        message: `Check out my listing for ${item.name} (${item.breed}) listed for ${item.price} on PashuSetu!`,
      });
    } catch (error) {
      console.log('Error sharing listing:', error);
    }
  };

  const handleContactBuyer = (buyerName, action) => {
    Alert.alert(
      t('sell.contactBuyerTitle', { action }),
      t('sell.contactBuyerMsg', { action, buyerName })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header block */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText style={styles.greetingText}>{t('sell.goodMorning')}</AppText>
          <AppText style={styles.sellerName}>{name}</AppText>
          <AppText style={styles.headerSubtitle}>{t('sell.summarySubtitle')}</AppText>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#0F172A" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{ uri: userProfile?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Statistics Grid */}
        <View style={styles.statsGrid}>
          {statsData.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <AppText style={styles.statCount}>{item.count}</AppText>
                <View style={[styles.statIconCircle, { backgroundColor: item.color + '12' }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                </View>
              </View>
              <AppText style={styles.statLabel}>{item.label}</AppText>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up-outline" size={12} color={item.color} />
                <AppText style={[styles.trendText, { color: item.color }]}>{item.trend}</AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Row */}
        <AppText style={styles.sectionTitle}>{t('home.quickActions')}</AppText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AddAnimal')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="add-circle" size={26} color="#16A34A" />
            </View>
            <AppText style={styles.actionLabel}>{t('sell.addAnimal')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('MyListings')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="list" size={26} color="#3B82F6" />
            </View>
            <AppText style={styles.actionLabel}>{t('sell.myListings')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="chatbubbles" size={26} color="#EF4444" />
              <View style={styles.actionCounterDot} />
            </View>
            <AppText style={styles.actionLabel}>{t('sell.messages')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bar-chart" size={26} color="#8B5CF6" />
            </View>
            <AppText style={styles.actionLabel}>{t('sell.analytics')}</AppText>
          </TouchableOpacity>
        </View>

        {/* Monthly Analytics Overview Card */}
        <AppText style={styles.sectionTitle}>{t('sell.monthlyOverview')}</AppText>
        <View style={styles.overviewCard}>
          <AppText style={styles.overviewCardTitle}>{t('sell.juneSummary')}</AppText>
          <View style={styles.overviewMetricsRow}>
            <View style={styles.overviewMetric}>
              <AppText style={styles.metricLabel}>{t('sell.revenue')}</AppText>
              <AppText style={styles.metricValue}>₹1.85L</AppText>
              <AppText style={styles.metricTrend}>+12.4%</AppText>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <AppText style={styles.metricLabel}>{t('sell.views')}</AppText>
              <AppText style={styles.metricValue}>2.4K</AppText>
              <AppText style={styles.metricTrend}>+18.1%</AppText>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <AppText style={styles.metricLabel}>{t('sell.enquiries')}</AppText>
              <AppText style={styles.metricValue}>18</AppText>
              <AppText style={styles.metricTrend}>+5 new</AppText>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <AppText style={styles.metricLabel}>{t('sell.soldListing')}</AppText>
              <AppText style={styles.metricValue}>4</AppText>
              <AppText style={styles.metricTrend}>100% fill</AppText>
            </View>
          </View>
        </View>

        {/* Recent Listings Section */}
        <View style={styles.sectionHeaderRow}>
          <AppText style={styles.sectionTitle}>{t('sell.recentListings')}</AppText>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('MyListings')}>
            <AppText style={styles.viewAllText}>{t('sell.viewAll')}</AppText>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={recentListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listingsList}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.listingImageContainer}>
                <Image source={{ uri: item.image }} style={styles.listingImage} resizeMode="cover" />
                <View style={styles.activeBadge}>
                  <AppText style={styles.activeBadgeText}>{item.status}</AppText>
                </View>
              </View>

              <View style={styles.listingMeta}>
                <AppText style={styles.listingName} numberOfLines={1}>{item.name}</AppText>
                <AppText style={styles.listingBreed} numberOfLines={1}>{item.breed} • {item.postedDate}</AppText>
                <AppText style={styles.listingPrice}>{item.price}</AppText>

                <View style={styles.viewsRow}>
                  <Ionicons name="eye-outline" size={14} color="#64748B" />
                  <AppText style={styles.viewsText}>{t('buy.animalsAvailable', { count: item.views })}</AppText>
                </View>

                {/* Edit & Share buttons */}
                <View style={styles.listingButtonsRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('MyListings')}
                  >
                    <Ionicons name="create-outline" size={13} color="#16A34A" />
                    <AppText style={styles.editButtonText}>{t('sell.edit')}</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButton}
                    activeOpacity={0.75}
                    onPress={() => handleShare(item)}
                  >
                    <Ionicons name="share-social-outline" size={13} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />

        {/* Pending Approval Section */}
        <AppText style={styles.sectionTitle}>{t('sell.pendingApproval')}</AppText>
        <View style={styles.pendingContainer}>
          {pendingListings.map((item) => (
            <View key={item.id} style={styles.pendingCard}>
              <View style={styles.pendingLeft}>
                <View style={styles.pendingImagePlaceholder}>
                  <MaterialCommunityIcons name="image-outline" size={20} color="#94A3B8" />
                </View>
                <View style={styles.pendingDetails}>
                  <AppText style={styles.pendingName}>{item.name}</AppText>
                  <AppText style={styles.pendingBreed}>{item.breed} • {item.price}</AppText>
                </View>
              </View>

              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={11} color="#D97706" style={styles.pendingBadgeIcon} />
                <AppText style={styles.pendingBadgeText}>{item.status}</AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Enquiries Section */}
        <AppText style={styles.sectionTitle}>{t('sell.recentEnquiries')}</AppText>
        <View style={styles.enquiriesContainer}>
          {recentEnquiries.map((item) => (
            <View key={item.id} style={styles.enquiryCard}>
              <View style={styles.enquiryLeft}>
                <View style={styles.enquiryAvatarCircle}>
                  <AppText style={styles.enquiryAvatarText}>{item.buyerName.charAt(0)}</AppText>
                </View>
                <View style={styles.enquiryMeta}>
                  <AppText style={styles.enquiryBuyer}>{item.buyerName}</AppText>
                  <AppText style={styles.enquiryTarget}>{t('sell.interestedIn', { animal: item.animal })}</AppText>
                  <AppText style={styles.enquiryTime}>{item.time}</AppText>
                </View>
              </View>

              <View style={styles.enquiryActionsRow}>
                <TouchableOpacity
                  style={[styles.enquiryActionBtn, styles.enquiryCallBtn]}
                  activeOpacity={0.7}
                  onPress={() => handleContactBuyer(item.buyerName, 'Call')}
                >
                  <Ionicons name="call" size={14} color="#16A34A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.enquiryActionBtn, styles.enquiryWhatsappBtn]}
                  activeOpacity={0.7}
                  onPress={() => handleContactBuyer(item.buyerName, 'WhatsApp')}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>


      </ScrollView>

      {/* Floating Action Button (FAB) on bottom-right */}
      <TouchableOpacity
        style={styles.floatingFab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddAnimal')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  headerLeft: {
    justifyContent: 'center',
    flex: 1,
  },
  greetingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    marginHorizontal: '2%',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    width: '22%',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  actionCounterDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  overviewCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 14,
  },
  overviewMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricTrend: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  overviewVerticalDivider: {
    height: 32,
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  listingsList: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  listingCard: {
    width: 156,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 8,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  listingImageContainer: {
    width: '100%',
    height: 90,
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  listingMeta: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  listingName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  listingBreed: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viewsText: {
    fontSize: 9,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '500',
  },
  listingButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    backgroundColor: '#F0FDF4',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 4,
  },
  shareButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingImagePlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pendingDetails: {
    justifyContent: 'center',
  },
  pendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pendingBreed: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadgeIcon: {
    marginRight: 3,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  enquiriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  enquiryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  enquiryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  enquiryAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  enquiryAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16A34A',
  },
  enquiryMeta: {
    flex: 1,
  },
  enquiryBuyer: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  enquiryTarget: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  enquiryTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  enquiryActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enquiryActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enquiryCallBtn: {
    backgroundColor: '#DCFCE7',
    marginRight: 8,
  },
  enquiryWhatsappBtn: {
    backgroundColor: '#25D366',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 2,
  },
  chartBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  chartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  chartCanvas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  chartColumn: {
    alignItems: 'center',
    width: '11%',
  },
  barTrack: {
    height: 110,
    width: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  chartDayLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  floatingFab: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC'
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  guestLoginButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41
  },
  guestLoginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15
  }
});
