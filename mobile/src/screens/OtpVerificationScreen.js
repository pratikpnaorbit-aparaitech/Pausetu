import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { api } from '../api/api';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

export default function OtpVerificationScreen({ route, navigation }) {
  const { login } = useContext(AppContext);
  const { t } = useTranslation();
  const { email } = route.params || { email: 'user@example.com' };
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  useEffect(() => {
    console.log('[OTP DEBUG] OTP screen mounted with email:', email);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text) => {
    setOtp(text);
    if (text.length === 6) {
      handleVerify(text);
    }
  };

  const handleVerify = async (codeToVerify = otp) => {
    if (codeToVerify.length === 6) {
      setLoading(true);
      try {
        const body = await api.verifyOtp(email, codeToVerify);
        if (body.status === 'success') {
          setVerifiedSuccess(true);
          setTimeout(() => {
            login(body.data.accessToken, body.data.refreshToken, body.data.user);
          }, 1000);
        } else {
          throw new Error(body.message);
        }
      } catch (err) {
        Alert.alert(t('otp.errorTitle'), err.message || t('otp.verifyFailed'));
        setOtp('');
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert(t('otp.errorTitle'), t('otp.invalidCode'));
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await api.sendOtp(email);
      setTimer(60);
      Alert.alert(t('otp.successTitle'), t('otp.resendSuccess'));
    } catch (err) {
      Alert.alert(t('otp.errorTitle'), err.message || t('otp.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading || verifiedSuccess}>
          <AppText style={styles.backButtonText}>{t('otp.back')}</AppText>
        </TouchableOpacity>

        <View style={styles.content}>
          {verifiedSuccess ? (
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.iconCircle, { borderColor: '#16A34A', backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle-outline" size={38} color="#16A34A" />
              </View>
              <AppText style={styles.title}>{t('otp.verificationSuccess')}</AppText>
              <AppText style={[styles.subtitle, { color: '#16A34A', fontWeight: 'bold' }]}>
                {t('otp.loggingIn')}
              </AppText>
            </View>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={32} color="#16A34A" />
              </View>
              <AppText style={styles.title}>{t('otp.enterCode')}</AppText>
              <AppText style={styles.subtitle}>
                {t('otp.sentTo')}
              </AppText>
              {email ? (
                <AppText style={[styles.subtitle, { color: '#1E293B', fontWeight: 'bold', marginTop: 4 }]}>
                  {email}
                </AppText>
              ) : null}

              <TextInput
                style={styles.otpInput}
                placeholder={t('otp.codePlaceholder')}
                placeholderTextColor="#90A4AE"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={handleOtpChange}
                secureTextEntry={false}
                autoFocus
                editable={!loading}
              />

              <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify()} disabled={loading || otp.length < 6}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText style={styles.verifyButtonText}>{t('otp.verifyProceed')}</AppText>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <AppText style={styles.timerText}>{t('otp.resendIn', { timer })}</AppText>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={loading}>
                    <AppText style={styles.resendText}>{t('otp.resend')}</AppText>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    marginTop: 10,
  },
  backButtonText: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  otpInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  verifyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resendContainer: {
    marginTop: 24,
  },
  timerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendText: {
    color: '#16A34A',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
