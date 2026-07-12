import React, { useState, useContext, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AppContext } from '../context/AppContext';
import { api } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import Constants from 'expo-constants';

export default function AuthScreen({ navigation }) {
  const { login, loginAsGuest } = useContext(AppContext);
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Animation values
  const bgScale = useRef(new Animated.Value(1.12)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const cardTranslateY = useRef(new Animated.Value(45)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // Button scales
  const continueScale = useRef(new Animated.Value(1)).current;
  const guestScale = useRef(new Animated.Value(1)).current;

  const animateButton = (val, toValue) => {
    Animated.spring(val, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  };

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1.0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1.0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Card entrance animation
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(cardTranslateY, {
          toValue: 0,
          tension: 35,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1.0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleImageLoad = () => {
    setImageLoaded(true);
    Animated.parallel([
      Animated.timing(bgScale, {
        toValue: 1.0,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 1.0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isValidEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val.trim().toLowerCase());
  };

  const handleSendOtp = async () => {
    const emailTrimmed = email.trim();
    if (isValidEmail(emailTrimmed)) {
      setLoading(true);
      try {
        await api.sendOtp(emailTrimmed);
        navigation.navigate('OtpVerification', { email: emailTrimmed });
      } catch (err) {
        Alert.alert(t('common.error'), err.message || t('auth.otpError'));
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
    }
  };

  const getMarathiSubtitle = () => {
    const lang = i18n?.language || 'mr';
    if (lang.startsWith('mr')) return 'भारतातील विश्वासार्ह पशुधन मार्केटप्लेस';
    if (lang.startsWith('hi')) return 'भारत का विश्वसनीय पशुधन मार्केटप्लेस';
    return "India's Trusted Livestock Marketplace";
  };

  const getGuestSubtext = () => {
    const lang = i18n?.language || 'mr';
    if (lang.startsWith('mr')) return 'नोंदणी न करता वापरा';
    if (lang.startsWith('hi')) return 'बिना पंजीकरण के उपयोग करें';
    return 'Use without registration';
  };

  const renderTitle = () => {
    const titleText = t('auth.title');
    const parts = titleText.split(/(PashuSetu)/);
    return (
      <AppText style={styles.titleContainer}>
        {parts.map((part, index) => {
          if (part === 'PashuSetu') {
            return (
              <AppText key={index} style={styles.titleBrand}>
                PashuSetu
              </AppText>
            );
          }
          return (
            <AppText key={index} style={styles.titleSuffix}>
              {part}
            </AppText>
          );
        })}
      </AppText>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Background Image Sibling - sharp & unblurred */}
      <Animated.Image
        source={require('../../assets/farmer-bg.webp')}
        style={[
          styles.background,
          {
            opacity: bgOpacity,
            transform: [{ scale: bgScale }],
          },
        ]}
        onLoad={handleImageLoad}
        resizeMode="cover"
      />

      {/* Premium Soft White Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.30)']}
        locations={[0, 0.5, 1.0]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header – Logo & Tagline */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <View style={styles.logoCircle}>
                <AppText style={styles.logoText}>PS</AppText>
              </View>
              <View style={styles.logoDecoration} />
            </Animated.View>
            <Animated.View style={{ opacity: logoOpacity, alignItems: 'center', width: '100%' }}>
              {renderTitle()}
              <MaterialCommunityIcons name="leaf" size={24} color="#16A34A" style={styles.leafEmblem} />
              <AppText style={styles.shortTagline}>{t('auth.subtitle')}</AppText>
            </Animated.View>
          </View>

          {/* Login Card Shadow Wrapper */}
          <Animated.View
            style={[
              styles.cardShadow,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            {/* Glassmorphic Login Card */}
            <BlurView intensity={20} tint="light" style={styles.cardBlurContainer}>
              {/* Card Header inside the card */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIconCircle}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#16A34A" />
                </View>
                <AppText style={styles.cardLabel}>{t('auth.continueWithEmail')}</AppText>
              </View>

              {/* Email Input */}
              <View
                style={[
                  styles.inputContainer,
                  isFocused && styles.inputContainerFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={22}
                  color={isFocused ? '#16A34A' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              {/* Continue Button */}
              <Animated.View style={{ transform: [{ scale: continueScale }] }}>
                <TouchableOpacity
                  style={styles.sendButtonTouch}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.9}
                  onPressIn={() => animateButton(continueScale, 0.96)}
                  onPressOut={() => animateButton(continueScale, 1.0)}
                >
                  <LinearGradient
                    colors={['#22C55E', '#16A34A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sendButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View style={styles.sendButtonContent}>
                        <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" style={styles.sendButtonIcon} />
                        <AppText style={styles.sendButtonText}>{t('auth.continue')}</AppText>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* OR Divider with Pill Chip */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerChip}>
                  <AppText style={styles.dividerText}>
                    {t('common.or', { defaultValue: 'OR' })}
                  </AppText>
                </View>
                <View style={styles.dividerLine} />
              </View>

              {/* Guest Login */}
              <Animated.View style={{ transform: [{ scale: guestScale }] }}>
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={loginAsGuest}
                  activeOpacity={0.9}
                  onPressIn={() => animateButton(guestScale, 0.96)}
                  onPressOut={() => animateButton(guestScale, 1.0)}
                >
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={26}
                    color="#16A34A"
                    style={styles.guestIcon}
                  />
                  <View style={styles.guestTextContainer}>
                    <AppText style={styles.guestButtonText}>{t('auth.continueAsGuest')}</AppText>
                    <AppText style={styles.guestSubtext}>{getGuestSubtext()}</AppText>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* 2x2 Grid Features Section */}
              <View style={styles.featuresGridContainer}>
                {/* Row 1 */}
                <View style={styles.featuresGridRow}>
                  {/* Secure */}
                  <View style={styles.featureGridCol}>
                    <MaterialCommunityIcons name="checkbox-marked-circle" size={20} color="#16A34A" style={styles.featureIcon} />
                    <View style={styles.featureTextWrapper}>
                      <AppText style={styles.featureTitle}>{t('auth.secure', { defaultValue: 'सुरक्षित' })}</AppText>
                      <AppText style={styles.featureSubtext} numberOfLines={2}>{t('auth.secureSub', { defaultValue: 'तुमची माहिती सुरक्षित आहे' })}</AppText>
                    </View>
                  </View>

                  {/* Fast */}
                  <View style={styles.featureGridCol}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#16A34A" style={styles.featureIcon} />
                    <View style={styles.featureTextWrapper}>
                      <AppText style={styles.featureTitle}>{t('auth.fast', { defaultValue: 'जलद' })}</AppText>
                      <AppText style={styles.featureSubtext} numberOfLines={2}>{t('auth.fastSub', { defaultValue: 'फक्त काही सेकंदात लॉगिन' })}</AppText>
                    </View>
                  </View>
                </View>

                {/* Horizontal Separator */}
                <View style={styles.featuresGridDivider} />

                {/* Row 2 */}
                <View style={styles.featuresGridRow}>
                  {/* Farmer Friendly */}
                  <View style={styles.featureGridCol}>
                    <MaterialCommunityIcons name="leaf" size={20} color="#16A34A" style={styles.featureIcon} />
                    <View style={styles.featureTextWrapper}>
                      <AppText style={styles.featureTitle}>{t('auth.farmerFriendly', { defaultValue: 'शेतकरी मित्र' })}</AppText>
                      <AppText style={styles.featureSubtext} numberOfLines={2}>{t('auth.farmerFriendlySub', { defaultValue: 'शेतकर्यांसाठी विशेष बनवलेले' })}</AppText>
                    </View>
                  </View>

                  {/* Simple */}
                  <View style={styles.featureGridCol}>
                    <MaterialCommunityIcons name="account-group" size={20} color="#16A34A" style={styles.featureIcon} />
                    <View style={styles.featureTextWrapper}>
                      <AppText style={styles.featureTitle}>{t('auth.secureLogin', { defaultValue: 'सोपे' })}</AppText>
                      <AppText style={styles.featureSubtext} numberOfLines={2}>{t('auth.secureLoginSub', { defaultValue: 'सोपे आणि सुलभ वापर' })}</AppText>
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer – App Version */}
          <View style={styles.footer}>
            <AppText style={styles.footerText}>
              PashuSetu v{Constants.expoConfig?.version || '1.0.0'}
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8F5', // reverted to light agricultural background blend
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 44 : 36,
  },

  /* Header Section */
  header: {
    alignItems: 'center',
    marginBottom: 40, // increased spacing to match reference
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20, // increased spacing
  },
  logoCircle: {
    width: 110, // increased 10%
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  logoDecoration: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 42, // increased size
    fontWeight: '900',
    color: '#16A34A',
    letterSpacing: 1.5,
  },
  titleContainer: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 10, // increased spacing
  },
  titleBrand: {
    fontWeight: '900',
    color: '#1E293B',
  },
  titleSuffix: {
    fontWeight: '900',
    color: '#16A34A',
  },
  leafEmblem: {
    marginVertical: 12, // increased spacing
  },
  shortTagline: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 360,
    fontWeight: '700', // Subtitle weight 700
    opacity: 0.9, // tagline opacity 0.9
  },

  /* Floating Card Shadow & Blur Container */
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 }, // soft floating shadow
    shadowOpacity: 0.08, // low opacity
    shadowRadius: 36, // large blur radius
    elevation: 14, // soft elevation
    marginBottom: 16,
    borderRadius: 30,
    backgroundColor: 'transparent',
    maxWidth: 490, // increased width slightly
    width: '100%',
    alignSelf: 'center',
  },
  cardBlurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)', // premium white frosted glass
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1.2,
    borderRadius: 30,
    padding: 28, // increased internal padding
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  cardHeaderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },

  /* Input styling */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58, // increased height slightly
    backgroundColor: '#FFFFFF', // solid white input
    borderWidth: 1.5,
    borderColor: '#E2E8F0', // subtle border
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 22, // increased vertical spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#16A34A',
    borderWidth: 2, // better focus border
    backgroundColor: '#FFFFFF',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '600',
  },

  /* Continue Button Gradient */
  sendButtonTouch: {
    borderRadius: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 }, // improved shadow
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 22, // increased vertical spacing
  },
  sendButtonGradient: {
    height: 58, // increased height slightly
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonIcon: {
    marginRight: 8,
    transform: [{ rotate: '-15deg' }],
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* OR Divider with outline chip */
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22, // increased vertical spacing
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginHorizontal: 8,
  },
  dividerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Guest Button - Glass Outlined */
  guestButton: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#16A34A', // outlines the guest button green
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // glass background
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 24, // increased vertical spacing
  },
  guestIcon: {
    marginRight: 12,
  },
  guestTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D', // high contrast green
  },
  guestSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  /* Features grid inside the card */
  featuresGridContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)', // matches card white frosted glass
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1.2,
    borderRadius: 20,
    padding: 16, // spaced out padding
    marginTop: 20,
    width: '100%',
  },
  featuresGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  featureGridCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featureIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D', // solid green
  },
  featureSubtext: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 14,
    fontWeight: '500',
  },
  featuresGridDivider: {
    height: 1,
    backgroundColor: '#E2E8F0', // clean grey grid divider
    marginVertical: 10,
    marginHorizontal: 8,
  },

  /* Footer */
  footer: {
    marginTop: 18,
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    opacity: 0.6,
    textAlign: 'center',
  },
});