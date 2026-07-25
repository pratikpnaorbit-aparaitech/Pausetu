import React, { useState, useContext, useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  // Animation values
  
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

  const isValidEmail = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val.trim().toLowerCase());
  };

  const handleSendOtp = async () => {
    console.log('[AUTH DEBUG] Continue button pressed');
    const emailTrimmed = email.trim();
    if (isValidEmail(emailTrimmed)) {
      console.log('[AUTH DEBUG] Validation passed for email:', emailTrimmed);
      setLoading(true);
      try {
        console.log('[AUTH DEBUG] Calling sendOtp API...');
        const res = await api.sendOtp(emailTrimmed);
        console.log('[AUTH DEBUG] API response received:', res);
        if (res && res.status === 'fail') {
          console.warn('[AUTH DEBUG] API returned fail status:', res.message);
          Alert.alert(t('common.error'), res.message || t('auth.otpError'));
          return;
        }
        console.log('[AUTH DEBUG] Navigation called to OtpVerification with email:', emailTrimmed);
        navigation.navigate('OtpVerification', { email: emailTrimmed });
      } catch (err) {
        console.error('[AUTH DEBUG] OTP Error caught:', err.message || err);
        Alert.alert(t('common.error'), err.message || t('auth.otpError'));
      } finally {
        setLoading(false);
      }
    } else {
      console.warn('[AUTH DEBUG] Validation failed for input:', emailTrimmed);
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
    if (lang.startsWith('mr')) return 'नोंदणी न करता अॅप वापरा';
    if (lang.startsWith('hi')) return 'बिना पंजीकरण के ऐप उपयोग करें';
    return 'Use app without registration';
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
      <StatusBar barStyle="dark-content" backgroundColor="#F4FBF7" />
      
      <LinearGradient
        colors={['#F4FBF7', '#FFFFFF']}
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
          {/* Header – Logo */}
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
              <Image 
                source={require('../../assets/logo-icon.png')}
                style={styles.fullLogo}
                resizeMode="contain"
              />
              <AppText style={styles.brandAppTitle}>पशुसेतू</AppText>
              <AppText style={styles.brandTitle}>जनावर बाजार</AppText>
              <AppText style={styles.brandSubtitle}>शेतकऱ्यांसाठी सुरक्षित जनावर खरेदी-विक्री</AppText>
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
                  isEmailFocused && styles.inputContainerFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={isEmailFocused ? '#16A34A' : '#94A3B8'}
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
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
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
    backgroundColor: '#F4FBF7',
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

  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 28,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  fullLogo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  brandAppTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
    textAlign: 'center',
  },

  /* Floating Card Shadow */
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
    backgroundColor: 'transparent',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
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
    height: 56,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputContainerFocused: {
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
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
    borderRadius: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  sendButtonGradient: {
    height: 56,
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
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
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
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});