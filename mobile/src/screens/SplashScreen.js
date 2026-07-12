import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

export default function SplashScreen() {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={['#F0FDF4', '#DCFCE7']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <AppText style={styles.logoText}>PS</AppText>
        </View>
        <AppText style={styles.title}>PashuSetu</AppText>
        <AppText style={styles.subtitle}>{t('splash.subtitle')}</AppText>
        <ActivityIndicator size="large" color="#16A34A" style={styles.loader} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
