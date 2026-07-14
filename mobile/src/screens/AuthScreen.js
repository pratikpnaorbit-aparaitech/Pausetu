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
            {/* Solid White Login Card */}
            <View style={styles.loginCard}>
              {/* Card Header inside the card */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderIconCircle}>
                  <MaterialCommunityIcons name="email-outline" size={18} color="#16A34A" />
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
                  size={20}
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
                        <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" style={styles.sendButtonIcon} />
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
                    size={22}
                    color="#16A34A"
                    style={styles.guestIcon}
                  />
                  <View style={styles.guestTextContainer}>
                    <AppText style={styles.guestButtonText}>{t('auth.continueAsGuest')}</AppText>
                    <AppText style={styles.guestSubtext}>{getGuestSubtext()}</AppText>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
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
    backgroundColor: '#F4F8F5',
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
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
  },

  /* Header Section */
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoDecoration: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#16A34A',
    letterSpacing: 1,
  },
  titleContainer: {
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
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
    marginVertical: 4,
  },
  shortTagline: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    fontWeight: '700',
    opacity: 0.9,
  },

  /* Floating Card Shadow */
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* Input styling */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#16A34A',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '600',
  },

  /* Continue Button */
  sendButtonTouch: {
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 14,
  },
  sendButtonGradient: {
    height: 48,
    borderRadius: 12,
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
    marginRight: 6,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* OR Divider */
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginHorizontal: 8,
  },
  dividerText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Guest Button */
  guestButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  guestIcon: {
    marginRight: 10,
  },
  guestTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  guestSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },

  /* Footer */
  footer: {
    marginTop: 12,
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    opacity: 0.6,
    textAlign: 'center',
  },
});