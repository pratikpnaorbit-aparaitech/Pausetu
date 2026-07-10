import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { AppContext } from '../context/AppContext';
import { api } from '../api/api';

export default function AuthScreen({ navigation }) {
  const { login, loginAsGuest } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
        Alert.alert('त्रुटी / Error', err.message || 'OTP पाठवण्यात अडचण आली. (Failed to send OTP.)');
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert('त्रुटी / Error', 'कृपया वैध ईमेल पत्ता टाका. (Please enter a valid email address.)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>PS</Text>
            </View>
            <Text style={styles.title}>PashuSetu Auth Portal</Text>
            <Text style={styles.subtitle}>Log in to access cattle marketplace, doctors, and resources</Text>
          </View>

          {/* Email Authentication */}
          <View style={styles.phoneSection}>
            <Text style={styles.sectionLabel}>Continue with Email Address</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Email Address"
                placeholderTextColor="#90A4AE"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <TouchableOpacity style={styles.sendButton} onPress={handleSendOtp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Guest Entry */}
          <TouchableOpacity style={styles.guestButton} onPress={loginAsGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  phoneSection: {
    width: '100%',
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#16A34A',
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 17,
  },
  sendButton: {
    height: 50,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
