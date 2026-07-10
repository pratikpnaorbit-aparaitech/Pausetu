import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
  StyleSheet, View, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, Platform, Modal,
  Linking, ActivityIndicator, Text,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AppContext } from '../context/AppContext';
import { api } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

// ── App store deep links ───────────────────────────────────────────────────
const ANDROID_PACKAGE = 'com.pashusetu.mobile';
const IOS_APP_ID = ''; // Set when published to App Store
const PLAY_STORE_URL = `market://details?id=${ANDROID_PACKAGE}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = IOS_APP_ID
  ? `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}`
  : null;

// ── Support contact info ───────────────────────────────────────────────────
const SUPPORT_EMAIL = 'support@pashusetu.com';
const SUPPORT_PHONE = '+918800000000';
const SUPPORT_WEBSITE = 'https://www.pashusetu.com';

// ── Language options ───────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

// ── Font size options ──────────────────────────────────────────────────────
const FONT_SIZES = ['Small', 'Medium', 'Large'];

// ── FAQ data ──────────────────────────────────────────────────────────────
const FAQ_DATA = [
  {
    q: 'How do I list my animal for sale?',
    a: 'Go to the Post tab, fill in all required details including at least 5 photos and one video, and submit. Your listing will go live after admin approval.',
  },
  {
    q: 'How long does approval take?',
    a: 'Listings are typically approved within 24 hours by our moderation team. You will receive a notification once approved.',
  },
  {
    q: 'Is my phone number visible to buyers?',
    a: 'Your phone number is only shared when a buyer taps Call or WhatsApp on your listing. It is not displayed publicly.',
  },
  {
    q: 'How do I contact a seller?',
    a: 'Open any animal listing and tap Call, WhatsApp, or Chat in the seller section.',
  },
  {
    q: 'Can I edit my listing after posting?',
    a: 'Yes. Go to My Listings, select the listing, and tap Edit. Note: editing resets approval status.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Contact us at support@pashusetu.com with your registered email and we will process the deletion within 7 business days.',
  },
];

// ── Privacy Policy sections ───────────────────────────────────────────────
const POLICY_SECTIONS = [
  ['1. Information We Collect', 'We collect your name, phone number, email address, and location (village, taluka, district, state) to provide our livestock marketplace services. Photos and videos you upload are stored on our secure servers.'],
  ['2. How We Use Your Information', 'Your information is used to show your listings to potential buyers, verify your identity, send OTP-based login codes, and improve our services. We do not sell your personal data to third parties.'],
  ['3. Data Storage & Security', 'All data is stored on encrypted servers hosted in India. JWT tokens are stored securely using device Keychain (iOS) or KeyStore (Android). We follow industry-standard security practices.'],
  ['4. Location Data', 'Location information (village, district, state) is used to display your listing to nearby buyers. We do not collect GPS coordinates without your explicit permission.'],
  ['5. Media Uploads', 'Photos and videos of animals you upload become part of your public listing. Ensure you have the right to share any media you upload. Uploads are stored securely and deleted when you remove a listing.'],
  ['6. Your Rights', 'You may request deletion of your account and all associated data by emailing support@pashusetu.com. Data deletion is processed within 7 business days.'],
  ['7. Contact', 'For privacy concerns: support@pashusetu.com'],
];

// ── Terms sections ────────────────────────────────────────────────────────
const TERMS_SECTIONS = [
  ['1. Acceptance', 'By using PashuSetu, you agree to these Terms. If you do not agree, please do not use the application.'],
  ['2. Eligibility', 'You must be at least 18 years old to use PashuSetu. By registering, you confirm you are legally eligible to enter into contracts under Indian law.'],
  ['3. Listing Rules', "Listings must be genuine and accurate. Posting animals you do not own, using stock photos, or misrepresenting an animal's health or age is strictly prohibited and will result in immediate account suspension."],
  ['4. Mandatory Media', 'Each listing requires a minimum of 5 photographs and one live video of the actual animal being sold. This is enforced to build buyer trust.'],
  ['5. Prohibited Content', 'Illegal animals, protected species, or any listing that violates Indian wildlife protection laws are strictly prohibited.'],
  ['6. Transactions', 'PashuSetu is a marketplace platform. We facilitate connections between buyers and sellers but are not a party to any transaction. All deals are between buyers and sellers directly.'],
  ['7. Liability', 'PashuSetu is not liable for the quality, health, or accuracy of any animal listed. We recommend buyers verify animals in person before completing any transaction.'],
  ['8. Termination', 'We reserve the right to suspend or terminate accounts that violate these terms without prior notice.'],
  ['9. Governing Law', 'These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Pune, Maharashtra.'],
  ['10. Contact', 'For legal queries: support@pashusetu.com'],
];

// ── Dynamic version from app.json via expo-constants ─────────────────────
const APP_VERSION =
  Constants.expoConfig?.version ||
  Constants.manifest?.version ||
  '1.0.0';

// ── Theme tokens ──────────────────────────────────────────────────────────
const LIGHT = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  sectionLabel: '#475569',
  border: '#F1F5F9',
};
const DARK = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  sectionLabel: '#94A3B8',
  border: '#334155',
};

// ═══════════════════════════════════════════════════════════════════════════
// ROOT CAUSE FIX NOTE:
// All modal components MUST NOT be defined as component functions inside
// the parent component body (const LanguageModal = () => ...).
// Doing so causes React to treat them as new component types on every render,
// which unmounts and remounts them mid-animation → UI freeze / dim overlay.
//
// FIX: All modals are rendered as inline JSX directly in the return tree,
// controlled by boolean `visible` props. React preserves them across renders
// and only runs the slide animation when `visible` changes.
// ═══════════════════════════════════════════════════════════════════════════
export default function SettingsScreen({ navigation }) {
  const {
    logout, exitGuestSession, isGuest, userToken,
    language, completeOnboarding,
    isDarkMode, toggleDarkMode,
    fontSize, setAppFontSize,
    userProfile,
  } = useContext(AppContext);
  const { t } = useTranslation();

  // ── Modal visibility state ─────────────────────────────────────────────
  const [showLangModal, setShowLangModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [showPrivacySettingsModal, setShowPrivacySettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // ── Privacy toggles ────────────────────────────────────────────────────
  const [privacyToggles, setPrivacyToggles] = useState({
    locationData: true,
    marketingNotifications: false,
    analytics: true,
  });

  // ── Change password / OTP reset state ─────────────────────────────────
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // ── FAQ accordion ─────────────────────────────────────────────────────
  const [expandedFaq, setExpandedFaq] = useState(null);

  // ── Theme tokens ──────────────────────────────────────────────────────
  const T = isDarkMode ? DARK : LIGHT;

  // ─────────────────────────────────────────────────────────────────────
  // HANDLERS — all stable via useCallback to avoid unnecessary re-renders
  // ─────────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    const isGuestUser = isGuest || userToken === 'guest';
    if (Platform.OS === 'web') {
      const msg = isGuestUser ? 'Exit Guest Session?' : 'Are you sure you want to logout?';
      if (window.confirm(msg)) {
        isGuestUser ? exitGuestSession() : logout();
      }
      return;
    }
    Alert.alert(
      isGuestUser ? 'Exit Session' : 'Logout',
      isGuestUser
        ? 'Exit your guest session? You will need to log in to continue.'
        : 'Are you sure you want to log out? This will clear your session and cached data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isGuestUser ? 'Exit' : 'Logout',
          style: 'destructive',
          onPress: async () => { isGuestUser ? await exitGuestSession() : await logout(); },
        },
      ]
    );
  }, [isGuest, userToken, exitGuestSession, logout]);

  const handleSelectLanguage = useCallback(async (code) => {
    try {
      await completeOnboarding(code);
    } catch (e) {
      Alert.alert('Error', 'Could not save language preference.');
    } finally {
      setShowLangModal(false);
    }
  }, [completeOnboarding]);

  const currentLang = useMemo(
    () => LANGUAGES.find(l => l.code === language) || LANGUAGES[0],
    [language]
  );

  const handleThemeToggle = useCallback(async () => {
    try {
      await toggleDarkMode();
    } catch (e) {
      Alert.alert('Error', 'Could not save theme preference.');
    }
  }, [toggleDarkMode]);

  const handleSelectFont = useCallback(async (size) => {
    try {
      await setAppFontSize(size);
    } catch (e) {
      Alert.alert('Error', 'Could not save font size preference.');
    } finally {
      setShowFontModal(false);
    }
  }, [setAppFontSize]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleSendOtpReset = useCallback(async () => {
    if (!userProfile?.email && !userProfile?.mobile) {
      Alert.alert('No Contact Found', 'No email or phone associated with your account.');
      return;
    }
    setOtpSending(true);
    try {
      const identifier = userProfile.email || String(userProfile.mobile);
      await api.sendOtp(identifier);
      setOtpSent(true);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  }, [userProfile]);

  const handleContactEmail = useCallback(async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=PashuSetu Support Request`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) { await Linking.openURL(url); }
      else { Alert.alert('No Email App', `Please email us at ${SUPPORT_EMAIL}`); }
    } catch (e) {
      Alert.alert('No Email App', `Please email us at ${SUPPORT_EMAIL}`);
    }
  }, []);

  const handleContactPhone = useCallback(async () => {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) { await Linking.openURL(url); }
      else { Alert.alert('Cannot Call', `Please call us at ${SUPPORT_PHONE}`); }
    } catch (e) {
      Alert.alert('Cannot Call', `Please call us at ${SUPPORT_PHONE}`);
    }
  }, []);

  const handleContactWeb = useCallback(async () => {
    try {
      const ok = await Linking.canOpenURL(SUPPORT_WEBSITE);
      if (ok) { await Linking.openURL(SUPPORT_WEBSITE); }
      else { Alert.alert('Cannot Open', `Visit ${SUPPORT_WEBSITE}`); }
    } catch (e) {
      Alert.alert('Cannot Open', `Visit ${SUPPORT_WEBSITE}`);
    }
  }, []);

  const handleContactUs = useCallback(() => {
    if (Platform.OS === 'web') {
      Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => { });
      return;
    }
    Alert.alert(
      'Contact PashuSetu',
      "Choose how you'd like to reach us:",
      [
        { text: '✉️  Email Support', onPress: handleContactEmail },
        { text: '📞  Call Support', onPress: handleContactPhone },
        { text: '🌐  Visit Website', onPress: handleContactWeb },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [handleContactEmail, handleContactPhone, handleContactWeb]);

  const handleRateApp = useCallback(async () => {
    if (Platform.OS === 'web') {
      try { await Linking.openURL(PLAY_STORE_WEB_URL); } catch (e) { }
      return;
    }

    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

    if (!url) {
      Alert.alert(
        'Rate PashuSetu',
        `We are not yet published on the App Store. Your feedback means a lot!\n\nPlease email us at ${SUPPORT_EMAIL}`,
        [
          { text: 'Email Feedback', onPress: handleContactEmail },
          { text: 'Close', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) {
        await Linking.openURL(url);
      } else if (Platform.OS === 'android') {
        await Linking.openURL(PLAY_STORE_WEB_URL);
      } else {
        Alert.alert('Store Unavailable', 'Could not open the app store on this device.');
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        try { await Linking.openURL(PLAY_STORE_WEB_URL); } catch (e) {
          Alert.alert('Store Unavailable', 'Could not open the app store on this device.');
        }
      } else {
        Alert.alert('Store Unavailable', 'Could not open the app store on this device.');
      }
    }
  }, [handleContactEmail]);

  const closeLangModal = useCallback(() => setShowLangModal(false), []);
  const closeFontModal = useCallback(() => setShowFontModal(false), []);
  const closeChangePassModal = useCallback(() => { setShowChangePassModal(false); setOtpSent(false); }, []);
  const closePrivacyModal = useCallback(() => setShowPrivacySettingsModal(false), []);
  const closeHelpModal = useCallback(() => setShowHelpModal(false), []);
  const closeFaqModal = useCallback(() => setShowFaqModal(false), []);
  const closePolicyModal = useCallback(() => setShowPolicyModal(false), []);
  const closeTermsModal = useCallback(() => setShowTermsModal(false), []);
  const closeAboutModal = useCallback(() => setShowAboutModal(false), []);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────

  const renderMenuRow = ({ iconName, iconBg, iconColor, title, value, rightElement, onPress, iconLib = 'ion' }) => (
    <TouchableOpacity
      style={[styles.menuRow, { backgroundColor: T.card }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      accessible
      accessibilityLabel={title}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          {iconLib === 'mc'
            ? <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
            : <Ionicons name={iconName} size={18} color={iconColor} />}
        </View>
        <AppText style={[styles.menuTitle, { color: T.text }]}>{title}</AppText>
      </View>
      {rightElement || (
        <View style={styles.menuRight}>
          {value ? <AppText style={styles.menuValueText}>{value}</AppText> : null}
          {onPress && <Ionicons name="chevron-forward" size={16} color="#94A3B8" />}
        </View>
      )}
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // All modals rendered as inline JSX — NOT as component functions —
  // so React keeps them mounted and only slides them in/out via `visible`.
  // ─────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: T.card, borderBottomColor: T.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={T.text} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: T.text }]}>{t('settings.title')}</AppText>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── GENERAL ─────────────────────────────────────────────── */}
        <AppText style={[styles.sectionTitle, { color: T.sectionLabel }]}>{t('settings.general')}</AppText>
        <View style={[styles.settingsCard, { backgroundColor: T.card, borderColor: T.border }]}>

          {renderMenuRow({
            iconName: 'language-outline', iconBg: '#DCFCE7', iconColor: '#16A34A',
            title: t('settings.language'),
            value: currentLang.native,
            onPress: () => setShowLangModal(true),
          })}

          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'moon-outline', iconBg: '#DBEAFE', iconColor: '#2563EB',
            title: t('settings.darkTheme'),
            rightElement: (
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                thumbColor={isDarkMode ? '#16A34A' : '#94A3B8'}
                accessibilityLabel="Toggle dark mode"
              />
            ),
          })}

          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'format-size', iconBg: '#F3E8FF', iconColor: '#8B5CF6', iconLib: 'mc',
            title: t('settings.fontSize'),
            value: fontSize,
            onPress: () => setShowFontModal(true),
          })}
        </View>

        {/* ── ACCOUNT ─────────────────────────────────────────────── */}
        <AppText style={[styles.sectionTitle, { color: T.sectionLabel }]}>{t('settings.account')}</AppText>
        <View style={[styles.settingsCard, { backgroundColor: T.card, borderColor: T.border }]}>

          {renderMenuRow({
            iconName: 'person-outline', iconBg: '#FEE2E2', iconColor: '#EF4444',
            title: t('settings.editProfile'),
            onPress: handleEditProfile,
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'key-outline', iconBg: '#FEF3C7', iconColor: '#D97706',
            title: t('settings.changePassword'),
            onPress: () => { setOtpSent(false); setShowChangePassModal(true); },
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'lock-closed-outline', iconBg: '#E2E8F0', iconColor: '#475569',
            title: t('settings.privacySettings'),
            onPress: () => setShowPrivacySettingsModal(true),
          })}
        </View>

        {/* ── SUPPORT ─────────────────────────────────────────────── */}
        <AppText style={[styles.sectionTitle, { color: T.sectionLabel }]}>{t('settings.support')}</AppText>
        <View style={[styles.settingsCard, { backgroundColor: T.card, borderColor: T.border }]}>

          {renderMenuRow({
            iconName: 'help-circle-outline', iconBg: '#DCFCE7', iconColor: '#16A34A',
            title: t('settings.helpSupport'),
            onPress: () => setShowHelpModal(true),
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'mail-outline', iconBg: '#DBEAFE', iconColor: '#2563EB',
            title: t('settings.contactUs'),
            onPress: handleContactUs,
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'chatbox-ellipses-outline', iconBg: '#F3E8FF', iconColor: '#8B5CF6',
            title: t('settings.faq'),
            onPress: () => setShowFaqModal(true),
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'star-outline', iconBg: '#FEF3C7', iconColor: '#D97706',
            title: t('settings.rateApp'),
            onPress: handleRateApp,
          })}
        </View>

        {/* ── LEGAL ───────────────────────────────────────────────── */}
        <AppText style={[styles.sectionTitle, { color: T.sectionLabel }]}>{t('settings.legal')}</AppText>
        <View style={[styles.settingsCard, { backgroundColor: T.card, borderColor: T.border }]}>

          {renderMenuRow({
            iconName: 'document-text-outline', iconBg: '#E2E8F0', iconColor: '#475569',
            title: t('settings.privacyPolicy'),
            onPress: () => setShowPolicyModal(true),
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'shield-outline', iconBg: '#E2E8F0', iconColor: '#475569',
            title: t('settings.termsConditions'),
            onPress: () => setShowTermsModal(true),
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'information-circle-outline', iconBg: '#DCFCE7', iconColor: '#16A34A',
            title: t('settings.aboutPashuSetu'),
            onPress: () => setShowAboutModal(true),
          })}
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'git-branch-outline', iconBg: '#F1F5F9', iconColor: '#64748B',
            title: t('settings.appVersion'),
            rightElement: <AppText style={styles.versionText}>v{APP_VERSION}</AppText>,
          })}
        </View>



        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.75}
          accessibilityLabel="Log out of account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.logoutIcon} />
          <AppText style={styles.logoutButtonText}>{t('settings.logoutAccount')}</AppText>
        </TouchableOpacity>

      </ScrollView>

      {/* ═══════════════════════════════════════════════════════════════
          MODALS — rendered as plain inline JSX.
          They are ALWAYS mounted; `visible` prop slides them in/out.
          This is the correct React pattern that prevents UI freezes.
      ════════════════════════════════════════════════════════════════ */}

      {/* ── Language picker ─────────────────────────────────────────── */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={closeLangModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.selectLanguage')}</AppText>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langRow, language === lang.code && styles.langRowSelected]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <View>
                  <AppText style={[styles.langNative, language === lang.code && { color: '#16A34A' }]}>
                    {lang.native}
                  </AppText>
                  <AppText style={styles.langSub}>{lang.label}</AppText>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeLangModal}>
              <AppText style={styles.modalCancelText}>{t('common.cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Font Size picker ─────────────────────────────────────────── */}
      <Modal
        visible={showFontModal}
        transparent
        animationType="slide"
        onRequestClose={closeFontModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.textSize')}</AppText>
            {FONT_SIZES.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.langRow, fontSize === size && styles.langRowSelected]}
                onPress={() => handleSelectFont(size)}
                activeOpacity={0.7}
              >
                <AppText style={[
                  styles.langNative,
                  fontSize === size && { color: '#16A34A' },
                  size === 'Small' && { fontSize: 14 },
                  size === 'Large' && { fontSize: 20 },
                ]}>
                  {size}
                </AppText>
                {fontSize === size && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeFontModal}>
              <AppText style={styles.modalCancelText}>{t('common.cancel')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Change Password / OTP ────────────────────────────────────── */}
      <Modal
        visible={showChangePassModal}
        transparent
        animationType="slide"
        onRequestClose={closeChangePassModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Reset Password</Text>
              <TouchableOpacity onPress={closeChangePassModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBanner, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              <Text style={[styles.infoBannerText, { color: '#1E40AF' }]}>
                PashuSetu uses OTP-based authentication. To reset your login, we will send a one-time password to your registered contact.
              </Text>
            </View>

            <View style={styles.infoRowModal}>
              <Ionicons name="person-circle-outline" size={18} color="#64748B" />
              <Text style={styles.infoRowText}>
                {userProfile?.email || userProfile?.mobile || 'No contact on file'}
              </Text>
            </View>

            {otpSent ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <Text style={styles.successText}>
                  OTP sent! Check your email / SMS and use it to log in with a new session.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, otpSending && { opacity: 0.6 }]}
                onPress={handleSendOtpReset}
                disabled={otpSending}
              >
                {otpSending
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryBtnText}>Send OTP to Reset</Text>}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Privacy Settings ─────────────────────────────────────────── */}
      <Modal
        visible={showPrivacySettingsModal}
        transparent
        animationType="slide"
        onRequestClose={closePrivacyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Privacy Settings</Text>
              <TouchableOpacity onPress={closePrivacyModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { key: 'locationData', label: 'Location Data', sub: 'Allow PashuSetu to use your location for nearby listings', color: '#16A34A' },
              { key: 'marketingNotifications', label: 'Marketing Notifications', sub: 'Receive promotions and new feature announcements', color: '#2563EB' },
              { key: 'analytics', label: 'Usage Analytics', sub: 'Help us improve the app with anonymous usage data', color: '#8B5CF6' },
            ].map(item => (
              <View key={item.key} style={styles.privacyRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.privacyLabel, { color: T.text }]}>{item.label}</Text>
                  <Text style={styles.privacySub}>{item.sub}</Text>
                </View>
                <Switch
                  value={privacyToggles[item.key]}
                  onValueChange={(v) => setPrivacyToggles(prev => ({ ...prev, [item.key]: v }))}
                  trackColor={{ false: '#E2E8F0', true: item.color + '40' }}
                  thumbColor={privacyToggles[item.key] ? item.color : '#94A3B8'}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 8 }]}
              onPress={closePrivacyModal}
            >
              <Text style={styles.primaryBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Help & Support ───────────────────────────────────────────── */}
      <Modal
        visible={showHelpModal}
        transparent
        animationType="slide"
        onRequestClose={closeHelpModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetTall, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={closeHelpModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.helpCard, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="headset-outline" size={24} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.helpCardTitle, { color: '#15803D' }]}>Live Support</Text>
                  <Text style={styles.helpCardSub}>Mon–Sat, 9 AM – 6 PM IST</Text>
                </View>
                <TouchableOpacity onPress={handleContactPhone} style={styles.helpCardBtn}>
                  <Text style={styles.helpCardBtnText}>Call</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.helpCard, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="mail-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.helpCardTitle, { color: '#1D4ED8' }]}>Email Support</Text>
                  <Text style={styles.helpCardSub}>{SUPPORT_EMAIL}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleContactEmail}
                  style={[styles.helpCardBtn, { backgroundColor: '#2563EB' }]}
                >
                  <Text style={styles.helpCardBtnText}>Email</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.subSectionTitle, { color: T.text }]}>Common Topics</Text>
              {[
                { icon: 'add-circle-outline', label: 'How to post a listing', onPress: () => { closeHelpModal(); setShowFaqModal(true); } },
                { icon: 'camera-outline', label: 'Photo & video requirements', onPress: () => { closeHelpModal(); setShowFaqModal(true); } },
                { icon: 'shield-outline', label: 'Account & security', onPress: () => { closeHelpModal(); setShowPrivacySettingsModal(true); } },
                { icon: 'star-outline', label: 'Rate the app', onPress: handleRateApp },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.helpTopicRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={18} color="#64748B" />
                  <Text style={[styles.helpTopicText, { color: T.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <Modal
        visible={showFaqModal}
        transparent
        animationType="slide"
        onRequestClose={closeFaqModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetTall, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={closeFaqModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {FAQ_DATA.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.faqItem, expandedFaq === i && { backgroundColor: '#F0FDF4' }]}
                  onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  activeOpacity={0.75}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQ, { color: T.text }]}>{item.q}</Text>
                    <Ionicons
                      name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#94A3B8"
                    />
                  </View>
                  {expandedFaq === i && (
                    <Text style={styles.faqA}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              ))}

              <View style={[styles.infoBanner, { backgroundColor: '#F1F5F9', marginTop: 8 }]}>
                <Ionicons name="mail-outline" size={16} color="#64748B" />
                <Text style={[styles.infoBannerText, { color: '#475569' }]}>
                  Didn't find your answer? Email us at {SUPPORT_EMAIL}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── About PashuSetu ─────────────────────────────────────────── */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        onRequestClose={closeAboutModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>About PashuSetu</Text>
              <TouchableOpacity onPress={closeAboutModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutLogoRow}>
              <View style={styles.aboutLogo}>
                <MaterialCommunityIcons name="cow" size={40} color="#16A34A" />
              </View>
              <Text style={[styles.aboutAppName, { color: T.text }]}>PashuSetu</Text>
              <Text style={styles.aboutTagline}>Connecting Farmers & Livestock Buyers</Text>
            </View>

            <View style={styles.aboutGrid}>
              {[
                { label: 'Version', value: `v${APP_VERSION}` },
                { label: 'Platform', value: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web' },
                { label: 'Language', value: currentLang.label },
                { label: 'Build', value: 'Production' },
              ].map(item => (
                <View key={item.label} style={styles.aboutGridItem}>
                  <Text style={styles.aboutGridLabel}>{item.label}</Text>
                  <Text style={[styles.aboutGridValue, { color: T.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.infoBanner, { backgroundColor: '#DCFCE7', marginTop: 4 }]}>
              <Ionicons name="leaf-outline" size={16} color="#16A34A" />
              <Text style={[styles.infoBannerText, { color: '#15803D' }]}>
                PashuSetu empowers rural farmers across India to buy, sell, and connect through a trusted livestock marketplace.
              </Text>
            </View>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeAboutModal}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Privacy Policy ───────────────────────────────────────────── */}
      <Modal
        visible={showPolicyModal}
        transparent
        animationType="slide"
        onRequestClose={closePolicyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetFull, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Privacy Policy</Text>
              <TouchableOpacity onPress={closePolicyModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.legalHeading}>Privacy Policy — PashuSetu</Text>
              <Text style={styles.legalDate}>Effective Date: 1 July 2025</Text>
              {POLICY_SECTIONS.map(([heading, body]) => (
                <View key={heading} style={styles.legalSection}>
                  <Text style={styles.legalSectionTitle}>{heading}</Text>
                  <Text style={styles.legalBody}>{body}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginBottom: 8, marginTop: 12 }]}
              onPress={closePolicyModal}
            >
              <Text style={styles.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Terms & Conditions ───────────────────────────────────────── */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={closeTermsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetFull, { backgroundColor: T.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: T.text }]}>Terms & Conditions</Text>
              <TouchableOpacity onPress={closeTermsModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={styles.legalHeading}>Terms & Conditions — PashuSetu</Text>
              <Text style={styles.legalDate}>Effective Date: 1 July 2025</Text>
              {TERMS_SECTIONS.map(([heading, body]) => (
                <View key={heading} style={styles.legalSection}>
                  <Text style={styles.legalSectionTitle}>{heading}</Text>
                  <Text style={styles.legalBody}>{body}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginBottom: 8, marginTop: 12 }]}
              onPress={closeTermsModal}
            >
              <Text style={styles.primaryBtnText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  placeholderBox: { width: 36 },
  scrollContent: { paddingBottom: 48 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  menuTitle: { fontSize: 13, fontWeight: '600' },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValueText: { fontSize: 12, color: '#64748B', fontWeight: '700', marginRight: 8 },
  versionText: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  divider: { height: 1 },
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
    marginTop: 4,
    marginBottom: 20,
  },
  logoutIcon: { marginRight: 6 },
  logoutButtonText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

  // ── Modal base ──────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 32,
  },
  modalSheetTall: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 32,
    maxHeight: '88%',
  },
  modalSheetFull: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 24,
    height: '92%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#CBD5E1',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalCancelBtn: {
    borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', marginTop: 12,
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  // ── Language / Font picker ─────────────────────────────────────────────
  langRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 6, backgroundColor: '#F8FAFC',
  },
  langRowSelected: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#16A34A' },
  langNative: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  langSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // ── Info banners ───────────────────────────────────────────────────────
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, padding: 12, borderRadius: 12, marginBottom: 16,
  },
  infoBannerText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },

  // ── Change password ────────────────────────────────────────────────────
  infoRowModal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingHorizontal: 4 },
  infoRowText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#DCFCE7',
  },
  successText: { flex: 1, fontSize: 13, color: '#15803D', fontWeight: '600', lineHeight: 18 },

  // ── Primary button ─────────────────────────────────────────────────────
  primaryBtn: {
    backgroundColor: '#16A34A', height: 50,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // ── Privacy settings ───────────────────────────────────────────────────
  privacyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  privacyLabel: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  privacySub: { fontSize: 11, color: '#64748B', lineHeight: 15 },

  // ── Help modal ─────────────────────────────────────────────────────────
  helpCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10 },
  helpCardTitle: { fontSize: 14, fontWeight: '700' },
  helpCardSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  helpCardBtn: { backgroundColor: '#16A34A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  helpCardBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  subSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  helpTopicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  helpTopicText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // ── FAQ ────────────────────────────────────────────────────────────────
  faqItem: { borderRadius: 12, padding: 14, marginBottom: 6, backgroundColor: '#F8FAFC' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 13, fontWeight: '700', marginRight: 8, lineHeight: 18 },
  faqA: { fontSize: 12, color: '#475569', lineHeight: 18, marginTop: 8 },

  // ── About ──────────────────────────────────────────────────────────────
  aboutLogoRow: { alignItems: 'center', marginBottom: 16 },
  aboutLogo: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  aboutAppName: { fontSize: 22, fontWeight: '800' },
  aboutTagline: { fontSize: 12, color: '#64748B', marginTop: 4 },
  aboutGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  aboutGridItem: { width: '50%', padding: 10 },
  aboutGridLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  aboutGridValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  // ── Legal ──────────────────────────────────────────────────────────────
  legalHeading: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  legalDate: { fontSize: 11, color: '#94A3B8', marginBottom: 16 },
  legalSection: { marginBottom: 16 },
  legalSectionTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  legalBody: { fontSize: 12, color: '#475569', lineHeight: 19 },
});
