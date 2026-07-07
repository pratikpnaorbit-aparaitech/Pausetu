import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SELLER_STATS = [
  { id: '1', label: 'Active Listings', value: '8', icon: 'list-box-outline', color: '#16A34A' },
  { id: '2', label: 'Sold Animals', value: '12', icon: 'checkbox-marked-circle-outline', color: '#3B82F6' },
  { id: '3', label: 'Total Views', value: '2.4K', icon: 'eye-outline', color: '#8B5CF6' },
];

const MENU_ITEMS = [
  { id: 'my_listings', title: 'My Listings', icon: 'clipboard-list-outline', type: 'material', screen: 'MyListings' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', type: 'ion', screen: 'Notifications' },
  { id: 'settings', title: 'Settings', icon: 'cog-outline', type: 'ion', screen: 'Settings' },
  { id: 'language', title: 'Language Preferences', icon: 'language-outline', type: 'ion' },
  { id: 'help', title: 'Help & Support', icon: 'help-circle-outline', type: 'ion' },
  { id: 'privacy', title: 'Privacy Policy', icon: 'shield-checkmark-outline', type: 'ion' },
  { id: 'terms', title: 'Terms & Conditions', icon: 'document-text-outline', type: 'ion' },
  { id: 'about', title: 'About PashuSetu', icon: 'information-circle-outline', type: 'ion' },
];

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout from PashuSetu?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // UI Only simulation: navigate back to Auth flow
            Alert.alert('Logged Out', 'You have been successfully logged out.');
          },
        },
      ]
    );
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(item.title, `This is a UI placeholder action for "${item.title}".`);
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit Profile details modal trigger.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card Header block */}
        <View style={styles.profileUserCard}>
          <View style={styles.userMainRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' }}
                style={styles.avatarImage}
              />
              <MaterialCommunityIcons name="check-decagram" size={18} color="#3B82F6" style={styles.verifyOverlayBadge} />
            </View>

            <View style={styles.userMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>Ramesh Patil</Text>
              </View>
              <Text style={styles.userRole}>Verified Livestock Seller</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={14} color="#16A34A" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Seller Statistics Grid */}
        <Text style={styles.sectionTitle}>Dashboard Stats</Text>
        <View style={styles.statsGrid}>
          {SELLER_STATS.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: stat.color + '12' }]}>
                {stat.type === 'material' ? (
                  <MaterialCommunityIcons name={stat.icon} size={18} color={stat.color} />
                ) : (
                  <Ionicons name={stat.icon === 'heart-outline' ? 'heart-outline' : 'eye-outline'} size={18} color={stat.color} />
                )}
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Profile Information */}
        <Text style={styles.sectionTitle}>Contact & Location Info</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>Ramesh Patil</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>+91 98765 43210</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>ramesh.patil@example.com</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location Address</Text>
            <Text style={styles.infoValue}>Saswad, Purandar, Pune, Maharashtra</Text>
          </View>
        </View>

        {/* Account Menu Items Section */}
        <Text style={styles.sectionTitle}>Account & Settings</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity style={styles.menuRow} onPress={() => handleMenuPress(item)}>
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconContainer}>
                    {item.type === 'material' ? (
                      <MaterialCommunityIcons name={item.icon} size={20} color="#475569" />
                    ) : (
                      <Ionicons name={item.icon} size={20} color="#475569" />
                    )}
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Account Actions Section */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholderBox: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  userMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
  },
  verifyOverlayBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  userMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginHorizontal: '2%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  infoRow: {
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 28,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
});
