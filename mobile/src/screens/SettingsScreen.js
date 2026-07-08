import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';

export default function SettingsScreen({ navigation }) {
  const { logout, exitGuestSession, isGuest, userToken } = useContext(AppContext);
  // Theme state (system/dark/light)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('Medium'); // Small/Medium/Large

  const handleLogout = () => {
    const isGuestUser = isGuest || userToken === 'guest';
    console.log('[SettingsScreen] handleLogout initiated, isGuestUser:', isGuestUser);

    if (Platform.OS === 'web') {
      const msg = isGuestUser ? 'Exit Guest Session?' : 'Are you sure you want to logout?';
      const confirmed = window.confirm(msg);
      console.log('[SettingsScreen] Web confirm result:', confirmed);
      if (confirmed) {
        if (isGuestUser) {
          console.log('[SettingsScreen] Executing web exitGuestSession');
          exitGuestSession();
        } else {
          console.log('[SettingsScreen] Executing web logout');
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
              console.log('[SettingsScreen] Executing native exitGuestSession');
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
              console.log('[SettingsScreen] Executing native logout');
              await logout();
            },
          },
        ]
      );
    }
  };

  const handleSettingAction = (title) => {
    Alert.alert(title, `This is a UI placeholder action for "${title}".`);
  };

  const cycleFontSize = () => {
    if (fontSize === 'Small') setFontSize('Medium');
    else if (fontSize === 'Medium') setFontSize('Large');
    else setFontSize('Small');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* General Section */}
        <Text style={styles.sectionTitle}>General Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Language')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="language-outline" size={18} color="#16A34A" />
              </View>
              <Text style={styles.menuTitle}>Language</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueText}>English</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="moon-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>App Dark Theme</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
              thumbColor={isDarkMode ? '#16A34A' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={cycleFontSize}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="format-size" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.menuTitle}>Font Size</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValueText}>{fontSize}</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account Customizations</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Edit Profile')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="person-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.menuTitle}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Change Password')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="key-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.menuTitle}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Privacy Settings')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.menuTitle}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support & Feedback</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Help & Support')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#16A34A" />
              </View>
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Contact Us')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="mail-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.menuTitle}>Contact Us</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('FAQ')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.menuTitle}>FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Rate App')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.menuTitle}>Rate App</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <Text style={styles.sectionTitle}>Legal & Information</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Privacy Policy')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="document-text-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.menuTitle}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('Terms & Conditions')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="shield-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.menuTitle}>Terms & Conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={() => handleSettingAction('About PashuSetu')}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="information-circle-outline" size={18} color="#16A34A" />
              </View>
              <Text style={styles.menuTitle}>About PashuSetu</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.menuRow}>
            <View style={styles.menuLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="git-branch-outline" size={18} color="#64748B" />
              </View>
              <Text style={styles.menuTitle}>App Version</Text>
            </View>
            <Text style={styles.versionText}>v2.4.0</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  settingsCard: {
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValueText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    marginRight: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
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
    marginBottom: 20,
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
