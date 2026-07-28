import React, { useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../context/AppContext';
import { profileApi } from '../api/profileApi';
import { animalApi } from '../api/animalApi';
import { useTranslation } from 'react-i18next';
import { resolveMediaUrl } from '../api/api';
import AppText from '../components/AppText';
import VerificationCard from '../components/VerificationCard';
import CustomHeader from '../components/CustomHeader';
import { formatLocationDisplay } from '../utils/geocoder';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { REFRESH_EVENTS } from '../services/refreshManager';

const SELLER_STATS_CONFIG = [
  { id: 'active', labelKey: 'profile.activeListings', icon: 'list-box-outline', color: '#16A34A' },
  { id: 'sold', labelKey: 'profile.soldAnimals', icon: 'checkbox-marked-circle-outline', color: '#3B82F6' },
  { id: 'views', labelKey: 'profile.totalViews', icon: 'eye-outline', color: '#8B5CF6' },
];

const MENU_ITEMS = [
  { id: 'my_listings', titleKey: 'profile.myListings', icon: 'clipboard-list-outline', type: 'material', screen: 'MyListings' },
  { id: 'notifications', titleKey: 'profile.notifications', icon: 'notifications-outline', type: 'ion', screen: 'Notifications' },
  { id: 'settings', titleKey: 'profile.settings', icon: 'cog-outline', type: 'ion', screen: 'Settings' },
];

export default function ProfileScreen({ navigation }) {
  const { userProfile, isProfileLoading, completeProfile, logout, exitGuestSession, isGuest, userToken, refreshProfileData } = useContext(AppContext);
  const { t } = useTranslation();

  // Dynamic Stats States
  const [myListings, setMyListings] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  const fetchUserStatsData = useCallback(async () => {
    if (!userProfile || !userProfile.id || isGuest || userToken === 'guest') {
      setMyListings([]);
      setIsStatsLoading(false);
      return;
    }

    try {
      const res = await animalApi.getMyListings(userProfile.id);
      if (res && res.status === 'success' && res.data && res.data.animals) {
        setMyListings(res.data.animals);
      } else if (res && res.data && Array.isArray(res.data)) {
        setMyListings(res.data);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Failed to fetch stats listings:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [userProfile?.id, isGuest, userToken]);

  useEffect(() => {
    fetchUserStatsData();
  }, [fetchUserStatsData]);

  useAutoRefresh(
    () => {
      if (!isGuest && userToken !== 'guest') {
        fetchUserStatsData();
        if (refreshProfileData) {
          return refreshProfileData();
        }
      }
    },
    {
      events: [
        REFRESH_EVENTS.VERIFICATION_UPDATED,
        REFRESH_EVENTS.PROFILE_UPDATED,
        REFRESH_EVENTS.LISTING_CREATED,
        REFRESH_EVENTS.LISTING_UPDATED,
        REFRESH_EVENTS.LISTING_DELETED
      ],
      screenKey: 'ProfileScreen',
      enabled: !isGuest
    }
  );

  const statsData = useMemo(() => {
    const activeCount = myListings.filter(item => {
      const s = item.status?.toLowerCase();
      return s === 'available' || s === 'approved';
    }).length;

    const soldCount = myListings.filter(item => {
      const s = item.status?.toLowerCase();
      return s === 'sold';
    }).length;

    let totalViews = 0;
    if (userProfile && typeof userProfile.totalViews === 'number') {
      totalViews = userProfile.totalViews;
    } else {
      totalViews = myListings.reduce((sum, item) => sum + Number(item.views || 0), 0);
    }

    return {
      activeListings: activeCount,
      soldAnimals: soldCount,
      totalViews: totalViews
    };
  }, [myListings, userProfile]);

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
      const msg = isGuestUser ? t('profile.exitGuestMsg') : t('profile.logoutMsg');
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
        t('profile.logoutTitle'),
        t('profile.exitGuestMsg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('profile.exitBtn'),
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
        t('profile.logoutTitle'),
        t('profile.logoutMsg'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('profile.logoutBtn'),
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
      Alert.alert(t(item.titleKey), `${t('common.loading')} "${t(item.titleKey)}".`);
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
      Alert.alert(t('profile.validationError'), t('profile.validNameError'));
      return;
    }
    if (editForm.mobile.trim().length < 10) {
      Alert.alert(t('profile.validationError'), t('profile.validMobileError'));
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
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (err) {
      Alert.alert(t('profile.validationError'), err.message || t('profile.updateFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionDenied'), t('profile.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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
      let filename = uri.split('/').pop() || 'photo.jpg';
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const resBlob = await fetch(uri);
        const blob = await resBlob.blob();
        if (blob.type) {
          type = blob.type;
          const ext = blob.type.split('/').pop();
          if (ext && !filename.endsWith(`.${ext}`)) {
            filename = `${filename}.${ext}`;
          }
        } else if (!match) {
          filename = `${filename}.jpg`;
        }
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
      console.log('[ProfileScreen] Upload Response:', res);

      if (res.status === 'success') {
        Alert.alert(t('common.success'), t('profile.uploadSuccess'));
        await refreshProfileData();
      }
    } catch (err) {
      Alert.alert(t('profile.validationError'), err.message || t('profile.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        refreshProfileData ? refreshProfileData() : Promise.resolve(),
        fetchUserStatsData()
      ]);
      Alert.alert(t('common.success'), t('profile.refreshed'));
    } catch (err) {
      Alert.alert(t('profile.validationError'), t('profile.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const profileImageUrl = useMemo(() => {
    return (userProfile?.profilePhoto || userProfile?.photo) ? resolveMediaUrl(userProfile.profilePhoto || userProfile.photo) : null;
  }, [userProfile?.profilePhoto, userProfile?.photo]);

  const userInitial = useMemo(() => {
    const nameStr = userProfile?.name;
    if (!nameStr || typeof nameStr !== 'string' || !nameStr.trim()) return '?';
    return nameStr.trim().charAt(0).toUpperCase();
  }, [userProfile?.name]);

  const displayName = useMemo(() => userProfile?.name?.trim() ? userProfile.name : t('profile.notProvided'), [userProfile?.name, t]);
  const displayRole = useMemo(() => userProfile?.role?.trim() ? userProfile.role : t('profile.notProvided'), [userProfile?.role, t]);
  const displayMobile = useMemo(() => userProfile?.mobile?.trim() ? userProfile.mobile : t('profile.notProvided'), [userProfile?.mobile, t]);
  const displayEmail = useMemo(() => userProfile?.email?.trim() ? userProfile.email : t('profile.notProvided'), [userProfile?.email, t]);
  const displayLocation = useMemo(() => formatLocationDisplay(userProfile).formatted || t('profile.notConfigured'), [userProfile, t]);

  if (isProfileLoading && !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#16A34A" />
          <AppText style={styles.loadingTitle}>{t('profile.loadingProfile')}</AppText>
          <AppText style={styles.loadingText}>{t('profile.loadingProfileSub')}</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <CustomHeader
        title={t('profile.title')}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.backButton} onPress={triggerSync} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color="#16A34A" />
            ) : (
              <Ionicons name="refresh-outline" size={22} color="#16A34A" />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile photo progress indicator */}
        {uploading && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#16A34A" />
            <AppText style={styles.progressText}>{t('profile.uploadingPhoto')} {uploadProgress}%</AppText>
          </View>
        )}

        {!userProfile ? (
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="person-circle-outline" size={40} color="#16A34A" />
            </View>
            <AppText style={styles.emptyStateTitle}>{t('profile.completeProfile')}</AppText>
            <AppText style={styles.emptyStateText}>
              {t('profile.completeProfileSub')}
            </AppText>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleEditProfile}>
              <AppText style={styles.emptyStateButtonText}>{t('profile.addProfileDetails')}</AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileUserCard}>
              <View style={styles.userMainRow}>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectPhoto}>
                  {profileImageUrl ? (
                    <Image
                      source={{ uri: profileImageUrl }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                      <AppText style={styles.avatarInitial}>{userInitial}</AppText>
                    </View>
                  )}
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

            <VerificationCard navigation={navigation} />

            {/* Statistics Grid */}
            <AppText style={styles.sectionTitle}>{t('profile.dashboardStats')}</AppText>
            <View style={styles.statsGrid}>
              {SELLER_STATS_CONFIG.map((stat) => {
                let displayVal = 0;
                if (stat.id === 'active') displayVal = statsData.activeListings;
                else if (stat.id === 'sold') displayVal = statsData.soldAnimals;
                else if (stat.id === 'views') displayVal = statsData.totalViews;

                return (
                  <View key={stat.id} style={styles.statCard}>
                    <View style={[styles.statIconCircle, { backgroundColor: stat.color + '12' }]}>
                      <MaterialCommunityIcons name={stat.icon} size={18} color={stat.color} />
                    </View>
                    <View style={styles.statInfo}>
                      {isStatsLoading ? (
                        <View style={styles.statSkeleton} />
                      ) : (
                        <AppText style={styles.statValue}>{displayVal.toLocaleString()}</AppText>
                      )}
                      <AppText style={styles.statLabel}>{t(stat.labelKey)}</AppText>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Profile Information */}
            <AppText style={styles.sectionTitle}>{t('profile.contactInfo')}</AppText>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>{t('profile.fullName')}</AppText>
                <AppText style={styles.infoValue}>{displayName}</AppText>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>{t('profile.mobileNumber')}</AppText>
                <AppText style={styles.infoValue}>+91 {displayMobile}</AppText>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>{t('profile.emailAddress')}</AppText>
                <AppText style={styles.infoValue}>{displayEmail}</AppText>
              </View>
              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <AppText style={styles.infoLabel}>{t('profile.locationAddress')}</AppText>
                <AppText style={styles.infoValue}>{displayLocation}</AppText>
              </View>
            </View>

            {/* Account Menu Items Section */}
            <AppText style={styles.sectionTitle}>{t('profile.accountSettings')}</AppText>
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
                      <AppText style={styles.menuTitle}>{t(item.titleKey)}</AppText>
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
              <AppText style={styles.modalTitle}>{t('profile.updateProfile')}</AppText>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalFormScroll}>
              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.fullName')}</AppText>
                <TextInput style={styles.input} value={editForm.name} onChangeText={(text) => setEditForm({ ...editForm, name: text })} placeholder={t('profile.enterName')} />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.mobileNumber')}</AppText>
                <TextInput style={styles.input} keyboardType="phone-pad" value={editForm.mobile} onChangeText={(text) => setEditForm({ ...editForm, mobile: text })} placeholder={t('profile.enterPhone')} maxLength={10} />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.village')}</AppText>
                <TextInput style={styles.input} value={editForm.village} onChangeText={(text) => setEditForm({ ...editForm, village: text })} placeholder={t('profile.enterVillage')} />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.taluka')}</AppText>
                <TextInput style={styles.input} value={editForm.taluka} onChangeText={(text) => setEditForm({ ...editForm, taluka: text })} placeholder={t('profile.enterTaluka')} />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.district')}</AppText>
                <TextInput style={styles.input} value={editForm.district} onChangeText={(text) => setEditForm({ ...editForm, district: text })} placeholder={t('profile.enterDistrict')} />
              </View>

              <View style={styles.inputGroup}>
                <AppText style={styles.label}>{t('profile.state')}</AppText>
                <TextInput style={styles.input} value={editForm.state} onChangeText={(text) => setEditForm({ ...editForm, state: text })} placeholder={t('profile.enterState')} />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={syncing}>
              {syncing ? <ActivityIndicator color="#fff" /> : <AppText style={styles.saveButtonText}>{t('profile.saveDetails')}</AppText>}
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
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
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
  statSkeleton: {
    width: 32,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  emptyStateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
