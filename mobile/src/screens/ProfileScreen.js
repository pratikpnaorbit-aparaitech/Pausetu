import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../context/AppContext';
import { profileApi } from '../api/profileApi';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

const SELLER_STATS = [
  { id: '1', label: 'Active Listings', value: '3', icon: 'list-box-outline', color: '#16A34A' },
  { id: '2', label: 'Sold Animals', value: '4', icon: 'checkbox-marked-circle-outline', color: '#3B82F6' },
  { id: '3', label: 'Total Views', value: '240', icon: 'eye-outline', color: '#8B5CF6' },
];

const MENU_ITEMS = [
  { id: 'my_listings', title: 'My Listings', icon: 'clipboard-list-outline', type: 'material', screen: 'MyListings' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications-outline', type: 'ion', screen: 'Notifications' },
  { id: 'settings', title: 'Settings', icon: 'cog-outline', type: 'ion', screen: 'Settings' },
];

export default function ProfileScreen({ navigation }) {
  const { userProfile, isProfileLoading, completeProfile, logout, exitGuestSession, isGuest, userToken, refreshProfileData } = useContext(AppContext);
  const { t } = useTranslation();

  // Edit profile states
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', village: '', taluka: '', district: '', state: '', language: 'en' });

  // Image uploading states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const handleLogout = () => {
    const isGuestUser = isGuest || userToken === 'guest';
    console.log('[ProfileScreen] handleLogout initiated, isGuestUser:', isGuestUser);

    if (Platform.OS === 'web') {
      const msg = isGuestUser ? 'Exit Guest Session?' : 'Are you sure you want to logout?';
      const confirmed = window.confirm(msg);
      console.log('[ProfileScreen] Web confirm result:', confirmed);
      if (confirmed) {
        if (isGuestUser) {
          console.log('[ProfileScreen] Executing web exitGuestSession');
          exitGuestSession();
        } else {
          console.log('[ProfileScreen] Executing web logout');
          logout();
        }
      }
      return;
    }

    if (isGuestUser) {
      Alert.alert(
        'Logout',
        'Exit Guest Session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: async () => {
              console.log('[ProfileScreen] Executing native exitGuestSession');
              await exitGuestSession();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              console.log('[ProfileScreen] Executing native logout');
              await logout();
            },
          },
        ]
      );
    }
  };

  const handleMenuPress = (item) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert(item.title, `Placeholder action for "${item.title}".`);
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      name: userProfile?.name || '',
      mobile: userProfile?.mobile || '',
      village: userProfile?.village || '',
      taluka: userProfile?.taluka || '',
      district: userProfile?.district || '',
      state: userProfile?.state || '',
      language: userProfile?.language || 'en'
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (editForm.name.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a valid full name (min 3 chars).');
      return;
    }
    if (editForm.mobile.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setSyncing(true);
    try {
      await completeProfile({
        name: editForm.name.trim(),
        role: userProfile?.role || '',
        mobile: editForm.mobile.trim(),
        village: editForm.village.trim(),
        taluka: editForm.taluka.trim(),
        district: editForm.district.trim(),
        state: editForm.state.trim(),
        language: editForm.language
      });
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Update Failed', err.message || 'Could not update profile details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant library permissions to change profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      await handleUploadPhoto(selectedImage.uri);
    }
  };

  const handleUploadPhoto = async (uri) => {
    setUploading(true);
    setUploadProgress(0);
    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const resBlob = await fetch(uri);
        const blob = await resBlob.blob();
        formData.append('photo', blob, filename);
      } else {
        formData.append('photo', {
          uri,
          name: filename,
          type
        });
      }

      const res = await profileApi.uploadPhoto(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (res.status === 'success') {
        Alert.alert('Success', 'Profile photo updated successfully!');
        await refreshProfileData();
      }
    } catch (err) {
      Alert.alert('Upload Failed', err.message || 'Could not upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await refreshProfileData();
      Alert.alert('Refreshed', 'Latest profile fetched successfully.');
    } catch (err) {
      Alert.alert('Sync Error', 'Could not fetch live updates. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const profileImageUrl = userProfile?.photo
    ? (userProfile.photo.startsWith('http') ? userProfile.photo : `http://10.0.2.2:5000${userProfile.photo}`)
    : null;
  const displayName = userProfile?.name?.trim() ? userProfile.name : 'Not provided';
  const displayRole = userProfile?.role?.trim() ? userProfile.role : 'Not provided';
  const displayMobile = userProfile?.mobile?.trim() ? userProfile.mobile : 'Not provided';
  const displayEmail = userProfile?.email?.trim() ? userProfile.email : 'Not provided';
  const displayLocation = userProfile?.village
    ? `${userProfile.village}, ${userProfile.taluka || ''}, ${userProfile.district || ''}, ${userProfile.state || ''}`.replace(/, ,/g, ',').replace(/(^,)|(,$)/g, '')
    : 'Not configured';

  if (isProfileLoading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#16A34A" />
          <AppText style={styles.loadingTitle}>Loading your profile</AppText>
          <AppText style={styles.loadingText}>We’re fetching your account details from the server.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{t('profile.title')}</AppText>
        <TouchableOpacity style={styles.backButton} onPress={triggerSync} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator size="small" color="#16A34A" />
          ) : (
            <Ionicons name="refresh-outline" size={22} color="#16A34A" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile photo progress indicator */}
        {uploading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#16A34A" />
            <AppText style={styles.progressText}>Uploading Profile Photo... {uploadProgress}%</AppText>
          </View>
        )}

        {!userProfile ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="person-circle-outline" size={40} color="#16A34A" />
            </View>
            <AppText style={styles.emptyStateTitle}>Complete your profile</AppText>
            <AppText style={styles.emptyStateText}>
              Your account is ready, but no profile details are available yet. Add your information to continue using PashuSetu with your real profile.
            </AppText>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleEditProfile}>
              <AppText style={styles.emptyStateButtonText}>Add Profile Details</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileUserCard}>
              <View style={styles.userMainRow}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectPhoto}>
                  <Image
                    source={{ uri: profileImageUrl }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.camOverlayBadge}>
                    <Ionicons name="camera" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>

                <View style={styles.userMeta}>
                  <View style={styles.nameRow}>
                    <AppText style={styles.userName}>{displayName}</AppText>
                  </View>
                  <AppText style={styles.userRole}>{displayRole}</AppText>
                </View>
              </View>

              <TouchableOpacity style={styles.editProfileBtn} onPress={handleEditProfile}>
                <Ionicons name="create-outline" size={14} color="#16A34A" />
                <AppText style={styles.editProfileText}>{t('profile.editProfile')}</AppText>
              </TouchableOpacity>
            </View>

            {/* Statistics Grid */}
            <Text style={styles.sectionTitle}>Dashboard Stats</Text>
            <View style={styles.statsGrid}>
              {SELLER_STATS.map((stat) => (
                <View key={stat.id} style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: stat.color + '12' }]}>
                    <MaterialCommunityIcons name={stat.icon} size={18} color={stat.color} />
                  </View>
                  <View style={styles.statInfo}>
                    <AppText style={styles.statValue}>{stat.value}</AppText>
                    <AppText style={styles.statLabel}>{stat.label}</AppText>
                  </View>
                </View>
              ))}
            </View>

            {/* Profile Information */}
            <Text style={styles.sectionTitle}>Contact & Location Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{displayName}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>+91 {displayMobile}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{displayEmail}</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location Address</Text>
                <Text style={styles.infoValue}>{displayLocation}</Text>
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
                      <AppText style={styles.menuTitle}>{item.title}</AppText>
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
              <AppText style={styles.logoutButtonText}>{t('profile.logout')}</AppText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Details Modal Form */}
        <Modal animationType="slide" transparent={true} visible={isEditModalVisible} onRequestClose={() => setIsEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Profile Details</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalFormScroll}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.input} value={editForm.name} onChangeText={(text) => setEditForm({ ...editForm, name: text })} placeholder="Enter Name" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput style={styles.input} keyboardType="phone-pad" value={editForm.mobile} onChangeText={(text) => setEditForm({ ...editForm, mobile: text })} placeholder="Enter Phone" maxLength={10} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Village</Text>
                  <TextInput style={styles.input} value={editForm.village} onChangeText={(text) => setEditForm({ ...editForm, village: text })} placeholder="Enter Village" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Taluka</Text>
                  <TextInput style={styles.input} value={editForm.taluka} onChangeText={(text) => setEditForm({ ...editForm, taluka: text })} placeholder="Enter Taluka" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>District</Text>
                  <TextInput style={styles.input} value={editForm.district} onChangeText={(text) => setEditForm({ ...editForm, district: text })} placeholder="Enter District" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>State</Text>
                  <TextInput style={styles.input} value={editForm.state} onChangeText={(text) => setEditForm({ ...editForm, state: text })} placeholder="Enter State" />
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={syncing}>
                {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Details</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  scrollContent: {
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
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
  camOverlayBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16A34A',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalFormScroll: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#16A34A',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
