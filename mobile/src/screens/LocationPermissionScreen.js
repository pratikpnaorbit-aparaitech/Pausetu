import React, { useContext } from 'react';
import { StyleSheet, View, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

export default function LocationPermissionScreen() {
  const { grantLocation } = useContext(AppContext);
  const { t } = useTranslation();

  const handleGrantPermission = () => {
    grantLocation();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.mapIconCircle}>
            <Ionicons name="location-outline" size={50} color="#16A34A" />
          </View>
          <AppText style={styles.title}>{t('location.enableTitle')}</AppText>
          <AppText style={styles.description}>
            {t('location.description')}
          </AppText>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-sharp" size={18} color="#16A34A" style={styles.bulletIcon} />
              <AppText style={styles.benefitText}>{t('location.benefit1')}</AppText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-sharp" size={18} color="#16A34A" style={styles.bulletIcon} />
              <AppText style={styles.benefitText}>{t('location.benefit2')}</AppText>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-sharp" size={18} color="#16A34A" style={styles.bulletIcon} />
              <AppText style={styles.benefitText}>{t('location.benefit3')}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.grantButton} onPress={handleGrantPermission}>
            <AppText style={styles.grantButtonText}>{t('location.grantAccess')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={grantLocation}>
            <AppText style={styles.skipButtonText}>{t('location.notNow')}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  mapIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletIcon: {
    marginRight: 12,
  },
  benefitText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginBottom: 40,
  },
  grantButton: {
    height: 56,
    backgroundColor: '#16A34A',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  grantButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
});
