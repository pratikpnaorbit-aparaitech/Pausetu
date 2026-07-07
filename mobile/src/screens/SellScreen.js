import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Dimensions, FlatList, Share, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const STATS_DATA = [
  { id: '1', count: '8', label: 'Active Listings', icon: 'checkbox-marked-circle-outline', color: '#16A34A', trend: '+2 this week' },
  { id: '2', count: '2', label: 'Pending Approval', icon: 'clock-outline', color: '#F59E0B', trend: 'In review' },
  { id: '3', count: '12', label: 'Sold Animals', icon: 'check-decagram-outline', color: '#3B82F6', trend: '₹1.85L Sales' },
  { id: '4', count: '2.4K', label: 'Total Views', icon: 'eye-outline', color: '#8B5CF6', trend: '+12.4% views' },
];

const RECENT_LISTINGS = [
  {
    id: 'l1',
    name: 'Sahiwal Cow',
    breed: 'Sahiwal',
    price: '₹48,000',
    status: 'Active',
    views: 312,
    postedDate: 'Posted 2 days ago',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'l2',
    name: 'Jafarabadi Buffalo',
    breed: 'Jafarabadi',
    price: '₹95,000',
    status: 'Active',
    views: 450,
    postedDate: 'Posted 5 days ago',
    image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'l3',
    name: 'Gir Cow',
    breed: 'Gir',
    price: '₹62,000',
    status: 'Active',
    views: 289,
    postedDate: 'Posted 1 week ago',
    image: 'https://images.unsplash.com/photo-1527153857715-3908f2bacb31?auto=format&fit=crop&w=300&q=80',
  },
];

const PENDING_LISTINGS = [
  {
    id: 'p1',
    name: 'Tharparkar Cow',
    breed: 'Tharparkar',
    price: '₹55,000',
    status: 'Pending Approval',
  },
  {
    id: 'p2',
    name: 'Beetal Goat',
    breed: 'Beetal',
    price: '₹14,500',
    status: 'Pending Approval',
  },
];

const RECENT_ENQUIRIES = [
  {
    id: 'e1',
    buyerName: 'Amit Sharma',
    animal: 'Sahiwal Cow',
    time: '10 mins ago',
  },
  {
    id: 'e2',
    buyerName: 'Vijay Kadam',
    animal: 'Jafarabadi Buffalo',
    time: '1 hour ago',
  },
  {
    id: 'e3',
    buyerName: 'Sanjay Deshmukh',
    animal: 'Gir Cow',
    time: '3 hours ago',
  },
];

const PERFORMANCE_CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PERFORMANCE_DATA_VIEWS = [65, 80, 110, 95, 140, 120, 165]; // Mock points

export default function SellScreen({ navigation }) {
  const maxView = Math.max(...PERFORMANCE_DATA_VIEWS);

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
    Alert.alert(`${action} Buyer`, `UI placeholder: Opening ${action} interface for ${buyerName}.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header block */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>Good Morning,</Text>
          <Text style={styles.sellerName}>Ramesh Patil</Text>
          <Text style={styles.headerSubtitle}>Here is your livestock summary today</Text>
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
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
              style={styles.avatarImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Statistics Grid */}
        <View style={styles.statsGrid}>
          {STATS_DATA.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCount}>{item.count}</Text>
                <View style={[styles.statIconCircle, { backgroundColor: item.color + '12' }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                </View>
              </View>
              <Text style={styles.statLabel}>{item.label}</Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up-outline" size={12} color={item.color} />
                <Text style={[styles.trendText, { color: item.color }]}>{item.trend}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions Row */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AddAnimal')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="add-circle" size={26} color="#16A34A" />
            </View>
            <Text style={styles.actionLabel}>Add Animal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('MyListings')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="list" size={26} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>My Listings</Text>
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
            <Text style={styles.actionLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bar-chart" size={26} color="#8B5CF6" />
            </View>
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Analytics Overview Card */}
        <Text style={styles.sectionTitle}>Monthly Overview</Text>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewCardTitle}>June Summary</Text>
          <View style={styles.overviewMetricsRow}>
            <View style={styles.overviewMetric}>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricValue}>₹1.85L</Text>
              <Text style={styles.metricTrend}>+12.4%</Text>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <Text style={styles.metricLabel}>Views</Text>
              <Text style={styles.metricValue}>2.4K</Text>
              <Text style={styles.metricTrend}>+18.1%</Text>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <Text style={styles.metricLabel}>Enquiries</Text>
              <Text style={styles.metricValue}>18</Text>
              <Text style={styles.metricTrend}>+5 new</Text>
            </View>
            <View style={styles.overviewVerticalDivider} />
            <View style={styles.overviewMetric}>
              <Text style={styles.metricLabel}>Sold</Text>
              <Text style={styles.metricValue}>4</Text>
              <Text style={styles.metricTrend}>100% fill</Text>
            </View>
          </View>
        </View>

        {/* Recent Listings Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('MyListings')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RECENT_LISTINGS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listingsList}
          renderItem={({ item }) => (
            <View style={styles.listingCard}>
              <View style={styles.listingImageContainer}>
                <Image source={{ uri: item.image }} style={styles.listingImage} />
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.listingMeta}>
                <Text style={styles.listingName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.listingBreed} numberOfLines={1}>{item.breed} • {item.postedDate}</Text>
                <Text style={styles.listingPrice}>{item.price}</Text>

                <View style={styles.viewsRow}>
                  <Ionicons name="eye-outline" size={14} color="#64748B" />
                  <Text style={styles.viewsText}>{item.views} views</Text>
                </View>

                {/* Edit & Share buttons */}
                <View style={styles.listingButtonsRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('MyListings')}
                  >
                    <Ionicons name="create-outline" size={13} color="#16A34A" />
                    <Text style={styles.editButtonText}>Edit</Text>
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
        <Text style={styles.sectionTitle}>Pending Approval</Text>
        <View style={styles.pendingContainer}>
          {PENDING_LISTINGS.map((item) => (
            <View key={item.id} style={styles.pendingCard}>
              <View style={styles.pendingLeft}>
                <View style={styles.pendingImagePlaceholder}>
                  <MaterialCommunityIcons name="image-outline" size={20} color="#94A3B8" />
                </View>
                <View style={styles.pendingDetails}>
                  <Text style={styles.pendingName}>{item.name}</Text>
                  <Text style={styles.pendingBreed}>{item.breed} • {item.price}</Text>
                </View>
              </View>

              <View style={styles.pendingBadge}>
                <Ionicons name="time-outline" size={11} color="#D97706" style={styles.pendingBadgeIcon} />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Enquiries Section */}
        <Text style={styles.sectionTitle}>Recent Enquiries</Text>
        <View style={styles.enquiriesContainer}>
          {RECENT_ENQUIRIES.map((item) => (
            <View key={item.id} style={styles.enquiryCard}>
              <View style={styles.enquiryLeft}>
                <View style={styles.enquiryAvatarCircle}>
                  <Text style={styles.enquiryAvatarText}>{item.buyerName.charAt(0)}</Text>
                </View>
                <View style={styles.enquiryMeta}>
                  <Text style={styles.enquiryBuyer}>{item.buyerName}</Text>
                  <Text style={styles.enquiryTarget}>Interested in {item.animal}</Text>
                  <Text style={styles.enquiryTime}>{item.time}</Text>
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

        {/* Performance Graph Card */}
        <Text style={styles.sectionTitle}>Weekly Views Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.chartTitleRow}>
            <View>
              <Text style={styles.chartTitle}>Total Animal Views</Text>
              <Text style={styles.chartSubtitle}>+18.4% weekly growth</Text>
            </View>
            <View style={styles.chartBadge}>
              <Text style={styles.chartBadgeText}>Peak: Sun (165)</Text>
            </View>
          </View>

          {/* Custom Styled Graphic Bar Chart */}
          <View style={styles.chartCanvas}>
            {PERFORMANCE_DATA_VIEWS.map((val, index) => {
              // Calculate relative height percentage
              const barHeight = Math.round((val / maxView) * 110);
              return (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: barHeight }]} />
                  </View>
                  <Text style={styles.chartDayLabel}>{PERFORMANCE_CHART_DAYS[index]}</Text>
                </View>
              );
            })}
          </View>
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
    marginTop: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    paddingBottom: 140, // Increased spacing to clear Bottom Nav bar & floating FAB
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 16,
    justifyContent: 'space-between',
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 16,
    marginTop: 14,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  actionCounterDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  overviewCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  overviewMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewMetric: {
    width: '21%',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  metricTrend: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  overviewVerticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 8,
  },
  listingsList: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  listingCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  listingImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    position: 'relative',
  },
  listingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listingMeta: {
    padding: 12,
  },
  listingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  listingBreed: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 6,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  viewsText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  listingButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingVertical: 6,
    flex: 1,
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
});
