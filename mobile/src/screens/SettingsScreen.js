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
import { usePremium } from '../hooks/usePremium';
import PremiumAdvisorContainer from './PremiumAdvisor/PremiumAdvisorContainer';
import PremiumBadge from '../components/PremiumAdvisor/PremiumBadge';

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

// ── FAQ data keys ─────────────────────────────────────────────────────────
const FAQ_DATA = [
  { qKey: 'settings.faq1_q', aKey: 'settings.faq1_a' },
  { qKey: 'settings.faq2_q', aKey: 'settings.faq2_a' },
  { qKey: 'settings.faq3_q', aKey: 'settings.faq3_a' },
  { qKey: 'settings.faq4_q', aKey: 'settings.faq4_a' },
  { qKey: 'settings.faq5_q', aKey: 'settings.faq5_a' },
  { qKey: 'settings.faq6_q', aKey: 'settings.faq6_a' },
];

// ── Privacy Policy sections keys ──────────────────────────────────────────
const POLICY_SECTIONS = [
  ['settings.policy1_h', 'settings.policy1_b'],
  ['settings.policy2_h', 'settings.policy2_b'],
  ['settings.policy3_h', 'settings.policy3_b'],
  ['settings.policy4_h', 'settings.policy4_b'],
  ['settings.policy5_h', 'settings.policy5_b'],
  ['settings.policy6_h', 'settings.policy6_b'],
  ['settings.policy7_h', 'settings.policy7_b'],
];

// ── Terms sections keys ───────────────────────────────────────────────────
const TERMS_SECTIONS = [
  ['settings.terms1_h', 'settings.terms1_b'],
  ['settings.terms2_h', 'settings.terms2_b'],
  ['settings.terms3_h', 'settings.terms3_b'],
  ['settings.terms4_h', 'settings.terms4_b'],
  ['settings.terms5_h', 'settings.terms5_b'],
  ['settings.terms6_h', 'settings.terms6_b'],
  ['settings.terms7_h', 'settings.terms7_b'],
  ['settings.terms8_h', 'settings.terms8_b'],
  ['settings.terms9_h', 'settings.terms9_b'],
  ['settings.terms10_h', 'settings.terms10_b'],
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

export default function SettingsScreen({ navigation }) {
  const {
    logout, exitGuestSession, isGuest, userToken,
    language, completeOnboarding,
    isDarkMode, toggleDarkMode,
    fontSize, setAppFontSize,
    userProfile,
  } = useContext(AppContext);
  const { t } = useTranslation();

  const { isPremium } = usePremium();
  const [showPremiumAdvisor, setShowPremiumAdvisor] = useState(false);

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
      const msg = isGuestUser ? t('settings.exitGuestConfirm') : t('settings.confirmLogout');
      if (window.confirm(msg)) {
        isGuestUser ? exitGuestSession() : logout();
      }
      return;
    }
    Alert.alert(
      isGuestUser ? t('settings.exitSession') : t('settings.title'),
      isGuestUser
        ? t('settings.exitGuestConfirm')
        : t('settings.confirmLogout'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isGuestUser ? t('common.exit') : t('settings.logoutAccount'),
          style: 'destructive',
          onPress: async () => { isGuestUser ? await exitGuestSession() : await logout(); },
        },
      ]
    );
  }, [isGuest, userToken, exitGuestSession, logout, t]);

  const handleSelectLanguage = useCallback(async (code) => {
    try {
      await completeOnboarding(code);
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.saveLangError'));
    } finally {
      setShowLangModal(false);
    }
  }, [completeOnboarding, t]);

  const currentLang = useMemo(
    () => LANGUAGES.find(l => l.code === language) || LANGUAGES[0],
    [language]
  );

  const handleThemeToggle = useCallback(async () => {
    try {
      await toggleDarkMode();
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.saveThemeError'));
    }
  }, [toggleDarkMode, t]);

  const handleSelectFont = useCallback(async (size) => {
    try {
      await setAppFontSize(size);
    } catch (e) {
      Alert.alert(t('common.error'), t('settings.saveFontError'));
    } finally {
      setShowFontModal(false);
    }
  }, [setAppFontSize, t]);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('Profile');
  }, [navigation]);

  const handleSendOtpReset = useCallback(async () => {
    if (!userProfile?.email && !userProfile?.mobile) {
      Alert.alert(t('settings.noContactFound'), t('settings.noContactMsg'));
      return;
    }
    setOtpSending(true);
    try {
      const identifier = userProfile.email || String(userProfile.mobile);
      await api.sendOtp(identifier);
      setOtpSent(true);
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('otp.otpError'));
    } finally {
      setOtpSending(false);
    }
  }, [userProfile, t]);

  const handleContactEmail = useCallback(async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=PashuSetu Support Request`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) { await Linking.openURL(url); }
      else { Alert.alert(t('settings.noEmailApp'), `${t('settings.didNotFindAnswer')} ${SUPPORT_EMAIL}`); }
    } catch (e) {
      Alert.alert(t('settings.noEmailApp'), `${t('settings.didNotFindAnswer')} ${SUPPORT_EMAIL}`);
    }
  }, [t]);

  const handleContactPhone = useCallback(async () => {
    const url = `tel:${SUPPORT_PHONE}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) { await Linking.openURL(url); }
      else { Alert.alert(t('settings.cannotCall'), `Please call us at ${SUPPORT_PHONE}`); }
    } catch (e) {
      Alert.alert(t('settings.cannotCall'), `Please call us at ${SUPPORT_PHONE}`);
    }
  }, [t]);

  const handleContactWeb = useCallback(async () => {
    try {
      const ok = await Linking.canOpenURL(SUPPORT_WEBSITE);
      if (ok) { await Linking.openURL(SUPPORT_WEBSITE); }
      else { Alert.alert(t('settings.cannotOpen'), `Visit ${SUPPORT_WEBSITE}`); }
    } catch (e) {
      Alert.alert(t('settings.cannotOpen'), `Visit ${SUPPORT_WEBSITE}`);
    }
  }, [t]);

  const handleContactUs = useCallback(() => {
    if (Platform.OS === 'web') {
      Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => { });
      return;
    }
    Alert.alert(
      t('settings.contactPashuSetu'),
      t('settings.chooseContact'),
      [
        { text: t('settings.emailSupportOption'), onPress: handleContactEmail },
        { text: t('settings.callSupportOption'), onPress: handleContactPhone },
        { text: t('settings.visitWebsite'), onPress: handleContactWeb },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [handleContactEmail, handleContactPhone, handleContactWeb, t]);

  const handleRateApp = useCallback(async () => {
    if (Platform.OS === 'web') {
      try { await Linking.openURL(PLAY_STORE_WEB_URL); } catch (e) { }
      return;
    }

    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;

    if (!url) {
      Alert.alert(
        t('settings.ratePashuSetu'),
        `${t('settings.rateNotPublished')} ${SUPPORT_EMAIL}`,
        [
          { text: t('settings.emailFeedback'), onPress: handleContactEmail },
          { text: t('common.close'), style: 'cancel' },
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
        Alert.alert(t('settings.storeUnavailable'), t('settings.storeUnavailableMsg'));
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        try { await Linking.openURL(PLAY_STORE_WEB_URL); } catch (e) {
          Alert.alert(t('settings.storeUnavailable'), t('settings.storeUnavailableMsg'));
        }
      } else {
        Alert.alert(t('settings.storeUnavailable'), t('settings.storeUnavailableMsg'));
      }
    }
  }, [handleContactEmail, t]);

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
            value: t(`settings.fontSize_${fontSize.toLowerCase()}`),
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
          <View style={[styles.divider, { backgroundColor: T.border }]} />

          {renderMenuRow({
            iconName: 'sparkles-outline', iconBg: '#F5F3FF', iconColor: '#8B5CF6',
            title: t('premiumAdvisor.lockScreen.title'),
            rightElement: isPremium ? <PremiumBadge /> : undefined,
            onPress: () => setShowPremiumAdvisor(true),
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
                  {t(`settings.fontSize_${size.toLowerCase()}`)}
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.resetPassword')}</AppText>
              <TouchableOpacity onPress={closeChangePassModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.infoBanner, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#2563EB" />
              <AppText style={[styles.infoBannerText, { color: '#1E40AF' }]}>
                {t('settings.otpAuthInfo')}
              </AppText>
            </View>

            <View style={styles.infoRowModal}>
              <Ionicons name="person-circle-outline" size={18} color="#64748B" />
              <AppText style={styles.infoRowText}>
                {userProfile?.email || userProfile?.mobile || t('settings.noContactFound')}
              </AppText>
            </View>

            {otpSent ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                <AppText style={styles.successText}>
                  {t('settings.otpSent')}
                </AppText>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, otpSending && { opacity: 0.6 }]}
                onPress={handleSendOtpReset}
                disabled={otpSending}
              >
                {otpSending
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <AppText style={styles.primaryBtnText}>{t('settings.sendOtpReset')}</AppText>}
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.privacySettingsTitle')}</AppText>
              <TouchableOpacity onPress={closePrivacyModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {[
              { key: 'locationData', label: t('settings.locationData'), sub: t('settings.locationDataSub'), color: '#16A34A' },
              { key: 'marketingNotifications', label: t('settings.marketingNotifications'), sub: t('settings.marketingNotificationsSub'), color: '#2563EB' },
              { key: 'analytics', label: t('settings.analytics'), sub: t('settings.analyticsSub'), color: '#8B5CF6' },
            ].map(item => (
              <View key={item.key} style={styles.privacyRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <AppText style={[styles.privacyLabel, { color: T.text }]}>{item.label}</AppText>
                  <AppText style={styles.privacySub}>{item.sub}</AppText>
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
              <AppText style={styles.primaryBtnText}>{t('settings.savePreferences')}</AppText>
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.helpSupportTitle')}</AppText>
              <TouchableOpacity onPress={closeHelpModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.helpCard, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="headset-outline" size={24} color="#16A34A" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText style={[styles.helpCardTitle, { color: '#15803D' }]}>{t('settings.liveSupport')}</AppText>
                  <AppText style={styles.helpCardSub}>{t('settings.liveSupportHours')}</AppText>
                </View>
                <TouchableOpacity onPress={handleContactPhone} style={styles.helpCardBtn}>
                  <AppText style={styles.helpCardBtnText}>{t('common.call')}</AppText>
                </TouchableOpacity>
              </View>

              <View style={[styles.helpCard, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="mail-outline" size={24} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText style={[styles.helpCardTitle, { color: '#1D4ED8' }]}>{t('settings.emailSupport')}</AppText>
                  <AppText style={styles.helpCardSub}>{SUPPORT_EMAIL}</AppText>
                </View>
                <TouchableOpacity
                  onPress={handleContactEmail}
                  style={[styles.helpCardBtn, { backgroundColor: '#2563EB' }]}
                >
                  <AppText style={styles.helpCardBtnText}>{t('common.email')}</AppText>
                </TouchableOpacity>
              </View>

              <AppText style={[styles.subSectionTitle, { color: T.text }]}>{t('settings.commonTopics')}</AppText>
              {[
                { icon: 'add-circle-outline', label: t('settings.howToPost'), onPress: () => { closeHelpModal(); setShowFaqModal(true); } },
                { icon: 'camera-outline', label: t('settings.photoVideoReq'), onPress: () => { closeHelpModal(); setShowFaqModal(true); } },
                { icon: 'shield-outline', label: t('settings.accountSecurity'), onPress: () => { closeHelpModal(); setShowPrivacySettingsModal(true); } },
                { icon: 'star-outline', label: t('settings.rateAppTopic'), onPress: handleRateApp },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.helpTopicRow}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={18} color="#64748B" />
                  <AppText style={[styles.helpTopicText, { color: T.text }]}>{item.label}</AppText>
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.faqTitle')}</AppText>
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
                    <AppText style={[styles.faqQ, { color: T.text }]}>{t(item.qKey)}</AppText>
                    <Ionicons
                      name={expandedFaq === i ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#94A3B8"
                    />
                  </View>
                  {expandedFaq === i && (
                    <AppText style={styles.faqA}>{t(item.aKey)}</AppText>
                  )}
                </TouchableOpacity>
              ))}

              <View style={[styles.infoBanner, { backgroundColor: '#F1F5F9', marginTop: 8 }]}>
                <Ionicons name="mail-outline" size={16} color="#64748B" />
                <AppText style={[styles.infoBannerText, { color: '#475569' }]}>
                  {t('settings.didNotFindAnswer')} {SUPPORT_EMAIL}
                </AppText>
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.aboutTitle')}</AppText>
              <TouchableOpacity onPress={closeAboutModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutLogoRow}>
              <View style={styles.aboutLogo}>
                <MaterialCommunityIcons name="cow" size={40} color="#16A34A" />
              </View>
              <AppText style={[styles.aboutAppName, { color: T.text }]}>PashuSetu</AppText>
              <AppText style={styles.aboutTagline}>{t('settings.aboutTagline')}</AppText>
            </View>

            <View style={styles.aboutGrid}>
              {[
                { label: t('settings.aboutVersion'), value: `v${APP_VERSION}` },
                { label: t('settings.aboutPlatform'), value: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web' },
                { label: t('settings.language'), value: currentLang.label },
                { label: t('settings.aboutBuild'), value: 'Production' },
              ].map(item => (
                <View key={item.label} style={styles.aboutGridItem}>
                  <AppText style={styles.aboutGridLabel}>{item.label}</AppText>
                  <AppText style={[styles.aboutGridValue, { color: T.text }]}>{item.value}</AppText>
                </View>
              ))}
            </View>

            <View style={[styles.infoBanner, { backgroundColor: '#DCFCE7', marginTop: 4 }]}>
              <Ionicons name="leaf-outline" size={16} color="#16A34A" />
              <AppText style={[styles.infoBannerText, { color: '#15803D' }]}>
                {t('settings.aboutEmpower')}
              </AppText>
            </View>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={closeAboutModal}>
              <AppText style={styles.modalCancelText}>{t('common.close')}</AppText>
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.privacyPolicyTitle')}</AppText>
              <TouchableOpacity onPress={closePolicyModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <AppText style={styles.legalHeading}>{t('settings.privacyPolicy')}</AppText>
              <AppText style={styles.legalDate}>{t('settings.lastUpdated')}</AppText>
              {POLICY_SECTIONS.map(([heading, body]) => (
                <View key={heading} style={styles.legalSection}>
                  <AppText style={styles.legalSectionTitle}>{t(heading)}</AppText>
                  <AppText style={styles.legalBody}>{t(body)}</AppText>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginBottom: 8, marginTop: 12 }]}
              onPress={closePolicyModal}
            >
              <AppText style={styles.primaryBtnText}>{t('common.confirm')}</AppText>
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
              <AppText style={[styles.modalTitle, { color: T.text }]}>{t('settings.termsTitle')}</AppText>
              <TouchableOpacity onPress={closeTermsModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <AppText style={styles.legalHeading}>{t('settings.termsConditions')}</AppText>
              <AppText style={styles.legalDate}>{t('settings.lastUpdated')}</AppText>
              {TERMS_SECTIONS.map(([heading, body]) => (
                <View key={heading} style={styles.legalSection}>
                  <AppText style={styles.legalSectionTitle}>{t(heading)}</AppText>
                  <AppText style={styles.legalBody}>{t(body)}</AppText>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.primaryBtn, { marginBottom: 8, marginTop: 12 }]}
              onPress={closeTermsModal}
            >
              <AppText style={styles.primaryBtnText}>{t('common.confirm')}</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PremiumAdvisorContainer
        visible={showPremiumAdvisor}
        onClose={() => setShowPremiumAdvisor(false)}
      />

    </SafeAreaView>
  );
}

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
  backButton: { width: 36, height: 36, justifycontent: 'center', alignItems: 'center' },
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
