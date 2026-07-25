import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import NotificationCard from '../components/NotificationCard';
import CustomHeader from '../components/CustomHeader';
import { api } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { REFRESH_EVENTS } from '../services/refreshManager';

const parseLocalizedText = (text, lang = 'en') => {
  if (!text) return '';
  if (text.includes(' / ')) {
    const parts = text.split(' / ');
    if (lang.startsWith('mr') || lang.startsWith('hi')) {
      return parts[0].trim();
    } else {
      return parts[1] ? parts[1].trim() : parts[0].trim();
    }
  }
  return text;
};

const formatRelativeTime = (dateStr, lang = 'en') => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) {
    return lang.startsWith('mr') ? 'आत्ताच' : lang.startsWith('hi') ? 'अभी' : 'Just now';
  }
  if (diffMin < 60) {
    return lang.startsWith('mr') ? `${diffMin} मिनिटांपूर्वी` : lang.startsWith('hi') ? `${diffMin} मिनट पहले` : `${diffMin} min ago`;
  }
  if (diffHr < 24) {
    return lang.startsWith('mr') ? `${diffHr} तासांपूर्वी` : lang.startsWith('hi') ? `${diffHr} घंटे पहले` : `${diffHr} hrs ago`;
  }
  if (diffDays === 1) {
    return lang.startsWith('mr') ? 'काल' : lang.startsWith('hi') ? 'कल' : 'Yesterday';
  }
  return date.toLocaleDateString();
};

const mapBackendNotification = (n, lang = 'en') => {
  let category = 'System';
  let icon = 'cog-outline';
  let iconColor = '#64748B';
  let badgeText = 'Update';
  let badgeColor = '#F1F5F9';
  let badgeTextColor = '#64748B';
  let priority = 'Medium';

  if (n.type === 'success') {
    category = 'Listings';
    icon = 'check-decagram';
    iconColor = '#16A34A';
    badgeText = 'Approved';
    badgeColor = '#DCFCE7';
    badgeTextColor = '#16A34A';
    priority = 'Low';
  } else if (n.type === 'alert' || n.type === 'error') {
    category = 'Listings';
    icon = 'alert-circle-outline';
    iconColor = '#EF4444';
    badgeText = 'Alert';
    badgeColor = '#FEE2E2';
    badgeTextColor = '#EF4444';
    priority = 'High';
  } else if (n.type === 'chat') {
    category = 'Messages';
    icon = 'account-question-outline';
    iconColor = '#3B82F6';
    badgeText = 'Message';
    badgeColor = '#DBEAFE';
    badgeTextColor = '#2563EB';
    priority = 'High';
  } else if (n.type === 'warning') {
    category = 'System';
    icon = 'warning-outline';
    iconColor = '#D97706';
    badgeText = 'Warning';
    badgeColor = '#FEF3C7';
    badgeTextColor = '#D97706';
    priority = 'Medium';
  }

  return {
    id: n._id || n.id,
    category,
    title: parseLocalizedText(n.title, lang),
    description: parseLocalizedText(n.message, lang),
    time: formatRelativeTime(n.createdAt, lang),
    isRead: n.isRead,
    icon,
    iconColor,
    badgeText,
    badgeColor,
    badgeTextColor,
    priority,
    targetScreen: n.targetScreen,
    relatedId: n.relatedId
  };
};

const TABS = ['All', 'Listings', 'Messages', 'Orders', 'System'];

export default function NotificationsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { t, i18n } = useTranslation();

  const isFetchingRef = useRef(false);

  const fetchNotifications = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    setLoading(true);
    try {
      const res = await api.getMyNotifications();
      if (res.status === 'success') {
        const lang = i18n.language || 'en';
        setNotifications((res.data.notifications || []).map(n => mapBackendNotification(n, lang)));
      }
    } catch (err) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useAutoRefresh(
    () => fetchNotifications(),
    {
      events: [REFRESH_EVENTS.NOTIFICATION_UPDATED, REFRESH_EVENTS.VERIFICATION_UPDATED],
      screenKey: 'NotificationsScreen'
    }
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      return selectedTab === 'All' || item.category === selectedTab;
    });
  }, [notifications, selectedTab]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markAsRead(id);
      setNotifications(
        notifications.map((item) =>
          item.id === id ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      Alert.alert(t('common.error'), t('notifications.markReadFailed'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(
        notifications.map((item) => ({ ...item, isRead: true }))
      );
      Alert.alert(t('common.success'), t('notifications.markAllReadSuccess'));
    } catch (err) {
      Alert.alert(t('common.error'), t('notifications.markAllFailed'));
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications(notifications.filter((item) => item.id !== id));
    } catch (err) {
      Alert.alert(t('common.error'), t('notifications.deleteFailed'));
    }
  };

  const handleDeleteAll = () => {
    setIsMenuVisible(false);
    Alert.alert(
      t('notifications.clearTitle'),
      t('notifications.clearConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notifications.clearAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(notifications.map(n => api.deleteNotification(n.id)));
              setNotifications([]);
            } catch (err) {
              Alert.alert(t('common.error'), t('notifications.clearFailed'));
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const handlePressNotification = useCallback((item) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }

    if (item.targetScreen === 'AnimalDetails' && item.relatedId) {
      navigation.navigate('AnimalDetails', { id: item.relatedId });
    } else if (item.targetScreen === 'Verification') {
      navigation.navigate('Verification');
    } else if (item.targetScreen === 'Chat' && item.relatedId) {
      navigation.navigate('ChatScreen', { conversationId: item.relatedId });
    } else if (item.targetScreen === 'MyListings') {
      navigation.navigate('MyListings');
    } else if (item.targetScreen === 'Profile') {
      navigation.navigate('Profile');
    } else {
      const titleLower = (item.title || '').toLowerCase();
      if (titleLower.includes('पावती') || titleLower.includes('verification')) {
        navigation.navigate('Verification');
      } else if (titleLower.includes('जाहिरात') || titleLower.includes('listing')) {
        if (item.relatedId) {
          navigation.navigate('AnimalDetails', { id: item.relatedId });
        } else {
          navigation.navigate('MyListings');
        }
      }
    }
  }, [handleMarkAsRead, navigation]);

  const renderNotificationItem = useCallback(({ item }) => (
    <NotificationCard
      item={item}
      onMarkAsRead={handleMarkAsRead}
      onDelete={handleDeleteNotification}
      onPressCard={handlePressNotification}
    />
  ), [handleMarkAsRead, handleDeleteNotification, handlePressNotification]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <CustomHeader
        title={t('notifications.title')}
        onBackPress={() => navigation.goBack()}
        centered={false}
        rightComponent={
          <View style={styles.headerRight}>
            {notifications.length > 0 && (
              <TouchableOpacity style={styles.headerMarkReadBtn} onPress={handleMarkAllAsRead}>
                <AppText style={styles.headerMarkReadText}>{t('notifications.markAllRead')}</AppText>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setIsMenuVisible(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Categories Tabs Row */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tabsScrollContent}
          renderItem={({ item }) => {
            const isActive = selectedTab === item;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.tabButton,
                  isActive ? styles.tabButtonActive : styles.tabButtonInactive
                ]}
                onPress={() => setSelectedTab(item)}
              >
                <AppText style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : styles.tabTextInactive
                ]}>
                  {t(`notifications.${item.toLowerCase()}`)}
                </AppText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Feed List / Empty State */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color="#94A3B8" />
            </View>
            <AppText style={styles.emptyTitle}>{t('notifications.noNotifications')}</AppText>
            <AppText style={styles.emptySubtitle}>
              {t('notifications.noNotificationsSub')}
            </AppText>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              {isRefreshing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" style={styles.refreshIcon} />
                  <AppText style={styles.refreshButtonText}>{t('common.retry')}</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        }
        renderItem={renderNotificationItem}
      />

      {/* Options Menu Sheet Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuDropdownContainer}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleMarkAllAsRead}>
              <Ionicons name="checkmark-done-outline" size={18} color="#0F172A" style={styles.dropdownIcon} />
              <AppText style={styles.dropdownText}>{t('notifications.markAllRead')}</AppText>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            <TouchableOpacity style={[styles.dropdownItem, styles.deleteItem]} onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" style={styles.dropdownIcon} />
              <AppText style={[styles.dropdownText, { color: '#EF4444' }]}>{t('notifications.clearAll')}</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMarkReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  headerMarkReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  headerMenuBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginRight: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButtonActive: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    elevation: 3,
  },
  tabButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0F172A',
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabTextInactive: {
    color: '#475569',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  refreshIcon: {
    marginRight: 6,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  menuDropdownContainer: {
    position: 'absolute',
    top: 56,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    width: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
