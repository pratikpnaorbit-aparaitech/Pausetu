import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';

export default function LocationPicker({ visible, onClose, onSelectLocation }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState('');

  const getCloseAccessibilityLabel = () => {
    const lang = i18n.language || 'en';
    if (lang.startsWith('mr')) return 'बंद करा';
    if (lang.startsWith('hi')) return 'बंद करें';
    return 'Close';
  };

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPincode('');
      setLoading(false);
    }
  }, [visible]);

  // Multi-provider reverse geocoding helper (Expo -> OpenStreetMap Nominatim -> BigDataCloud)
  const reverseGeocodeCoords = async (latitude, longitude) => {
    // Strategy 1: Expo Location API (Native iOS / Android)
    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverse && reverse.length > 0 && (reverse[0].region || reverse[0].district || reverse[0].city)) {
        const addr = reverse[0];
        return {
          state: addr.region || addr.country || 'Maharashtra',
          district: addr.district || addr.subregion || addr.city || 'Pune',
          taluka: addr.subregion || addr.district || addr.city || 'Baramati',
          village: addr.city || addr.subregion || addr.street || addr.name || ''
        };
      }
    } catch (err) {
      console.warn('[LocationPicker] Strategy 1 (Expo reverseGeocodeAsync) failed:', err.message);
    }

    // Strategy 2: OpenStreetMap Nominatim API (Web & Mobile universal fallback)
    try {
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
        headers: { 'User-Agent': 'PashuSetu-App/1.0' }
      });
      if (osmRes.ok) {
        const data = await osmRes.json();
        if (data && data.address) {
          const a = data.address;
          const state = a.state || a.province || 'Maharashtra';
          const district = a.county || a.state_district || a.city || a.town || 'Pune';
          const taluka = a.municipality || a.suburb || a.town || a.county || 'Baramati';
          const village = a.village || a.neighbourhood || a.suburb || a.city_district || a.town || a.city || '';

          return {
            state,
            district: district.replace(/ District$/i, '').replace(/ Division$/i, ''),
            taluka: taluka.replace(/ Taluka$/i, '').replace(/ Sub-District$/i, ''),
            village,
            latitude,
            longitude
          };
        }
      }
    } catch (osmErr) {
      console.warn('[LocationPicker] Strategy 2 (OSM Nominatim) failed:', osmErr.message);
    }

    // Strategy 3: BigDataCloud Universal Reverse Geocoding API
    try {
      const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      if (bdcRes.ok) {
        const data = await bdcRes.json();
        if (data) {
          const state = data.principalSubdivision || 'Maharashtra';
          const district = data.city || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.administrative?.[1]?.name || 'Pune';
          const taluka = data.locality || data.localityInfo?.administrative?.[3]?.name || district;
          const village = data.localityInfo?.informative?.[0]?.name || data.locality || '';

          return {
            state,
            district,
            taluka,
            village,
            latitude,
            longitude
          };
        }
      }
    } catch (bdcErr) {
      console.warn('[LocationPicker] Strategy 3 (BigDataCloud) failed:', bdcErr.message);
    }

    return null;
  };

  // GPS Current Location Detection (Option 1)
  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('locationPicker.errorTitle') || 'Error',
          t('location.description') || 'Location permission is required.'
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000
      });
      const { latitude, longitude } = loc.coords;

      let selected = await reverseGeocodeCoords(latitude, longitude);

      if (!selected) {
        selected = {
          state: 'Maharashtra',
          district: 'Pune',
          taluka: 'Baramati',
          village: 'Murti',
          latitude,
          longitude
        };
      } else {
        selected.latitude = latitude;
        selected.longitude = longitude;
      }

      if (typeof onSelectLocation === 'function') {
        onSelectLocation(selected);
      }
    } catch (e) {
      console.error('[LocationPicker] Exception in handleUseCurrentLocation:', e);
      const fallbackLoc = {
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Baramati',
        village: 'Murti'
      };
      if (typeof onSelectLocation === 'function') {
        onSelectLocation(fallbackLoc);
      }
    } finally {
      setLoading(false);
    }
  };

  // PIN Code Lookup (Option 2)
  const handlePincodeSearch = async () => {
    const cleanedPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanedPin)) {
      Alert.alert(t('locationPicker.errorTitle') || 'Error', t('locationPicker.invalidPin'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanedPin}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        const selected = {
          state: postOffice.State || '',
          district: postOffice.District || '',
          taluka: postOffice.Block || postOffice.District || '',
          village: postOffice.Name || postOffice.Block || ''
        };
        onSelectLocation(selected);
      } else {
        // Fallback for common PIN codes if API doesn't find it or returns error
        const fallbacks = {
          '411001': { state: 'Maharashtra', district: 'Pune', taluka: 'Pune City', village: 'Pune' },
          '400001': { state: 'Maharashtra', district: 'Mumbai', taluka: 'Mumbai', village: 'Mumbai' },
          '415001': { state: 'Maharashtra', district: 'Satara', taluka: 'Satara', village: 'Satara' },
          '414001': { state: 'Maharashtra', district: 'Ahmednagar', taluka: 'Ahmednagar', village: 'Ahmednagar' },
          '416001': { state: 'Maharashtra', district: 'Kolhapur', taluka: 'Karvir', village: 'Kolhapur' },
          '431001': { state: 'Maharashtra', district: 'Aurangabad', taluka: 'Aurangabad', village: 'Aurangabad' },
          '440001': { state: 'Maharashtra', district: 'Nagpur', taluka: 'Nagpur', village: 'Nagpur' },
          '416416': { state: 'Maharashtra', district: 'Sangli', taluka: 'Miraj', village: 'Sangli' },
          '415002': { state: 'Maharashtra', district: 'Satara', taluka: 'Satara', village: 'Satara Road' }
        };

        if (fallbacks[cleanedPin]) {
          onSelectLocation(fallbacks[cleanedPin]);
        } else {
          Alert.alert(
            t('locationPicker.errorTitle') || 'Error',
            t('locationPicker.invalidPin') || 'Invalid PIN code.'
          );
        }
      }
    } catch (e) {
      console.warn('Pincode resolution failed:', e.message);
      
      // Check if network error
      const isNetworkError = e.message && (
        e.message.toLowerCase().includes('network') ||
        e.message.toLowerCase().includes('failed to fetch') ||
        e.message.toLowerCase().includes('timeout')
      );

      if (isNetworkError) {
        Alert.alert(
          t('locationPicker.errorTitle') || 'Error',
          t('locationPicker.offlineError') || 'Internet is unavailable. Please check your connection.'
        );
      } else {
        // Fallback offline dictionary
        const fallbacks = {
          '411001': { state: 'Maharashtra', district: 'Pune', taluka: 'Pune City', village: 'Pune' },
          '400001': { state: 'Maharashtra', district: 'Mumbai', taluka: 'Mumbai', village: 'Mumbai' },
          '415001': { state: 'Maharashtra', district: 'Satara', taluka: 'Satara', village: 'Satara' },
          '414001': { state: 'Maharashtra', district: 'Ahmednagar', taluka: 'Ahmednagar', village: 'Ahmednagar' },
          '416001': { state: 'Maharashtra', district: 'Kolhapur', taluka: 'Karvir', village: 'Kolhapur' }
        };

        if (fallbacks[cleanedPin]) {
          onSelectLocation(fallbacks[cleanedPin]);
        } else {
          Alert.alert(
            t('locationPicker.errorTitle') || 'Error',
            t('locationPicker.invalidPin') || 'Invalid PIN code.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Button enabling validation condition: pincode must contain exactly 6 numeric digits
  const isPinValid = /^\d{6}$/.test(pincode.trim());

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={styles.titleRow}>
                    <Ionicons name="location" size={22} color="#16A34A" style={{ marginRight: 6 }} />
                    <AppText style={styles.modalTitle}>{t('locationPicker.title')}</AppText>
                  </View>
                  <AppText style={styles.modalSubtitle}>{t('locationPicker.subtitle')}</AppText>
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel={getCloseAccessibilityLabel()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={20} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.modalBody}>
                {loading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#16A34A" />
                    <AppText style={styles.loaderText}>{t('locationPicker.detecting')}</AppText>
                  </View>
                ) : (
                  <View style={styles.menuContainer}>
                    {/* Option 1: Current Location Card */}
                    <View style={styles.gpsCard}>
                      <View style={styles.gpsCardHeader}>
                        <View style={styles.gpsIconCircle}>
                          <Ionicons name="navigate" size={26} color="#16A34A" />
                        </View>
                        <View style={styles.gpsTextContainer}>
                          <AppText style={styles.gpsCardTitle}>{t('locationPicker.useCurrentTitle')}</AppText>
                          <AppText style={styles.gpsCardSub}>{t('locationPicker.useCurrentSubtitle')}</AppText>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.gpsButton} onPress={handleUseCurrentLocation}>
                        <Ionicons name="navigate-sharp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <AppText style={styles.gpsButtonText}>{t('locationPicker.useCurrentBtn')}</AppText>
                      </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <AppText style={styles.dividerText}>
                        {t('locationPicker.dividerText') ? ` ${t('locationPicker.dividerText')} ` : ' OR '}
                      </AppText>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Option 2: PIN Code Card */}
                    <View style={styles.pinCard}>
                      <AppText style={styles.pinCardTitle}>{t('locationPicker.searchPinTitle')}</AppText>
                      <View style={styles.pinInputWrapper}>
                        <Ionicons name="mail-open" size={20} color="#64748B" style={styles.pinIcon} />
                        <TextInput
                          style={styles.pinTextInput}
                          placeholder={t('locationPicker.pinPlaceholder')}
                          placeholderTextColor="#94A3B8"
                          value={pincode}
                          onChangeText={(val) => setPincode(val.replace(/[^0-9]/g, '').slice(0, 6))}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                      <TouchableOpacity
                        style={[styles.pinSubmitButton, !isPinValid && styles.pinSubmitButtonDisabled]}
                        onPress={handlePincodeSearch}
                        disabled={!isPinValid}
                      >
                        <Ionicons name="search" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <AppText style={styles.pinSubmitButtonText}>{t('locationPicker.findLocationBtn')}</AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  keyboardView: {
    width: '100%'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    width: '100%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    paddingRight: 10
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    minHeight: 280
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  menuContainer: {
    paddingTop: 4
  },
  gpsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2
  },
  gpsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  gpsIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  gpsTextContainer: {
    flex: 1
  },
  gpsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B'
  },
  gpsCardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  gpsButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0'
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12
  },
  pinCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  pinCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12
  },
  pinInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14
  },
  pinIcon: {
    marginRight: 8
  },
  pinTextInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '500',
    padding: 0
  },
  pinSubmitButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  pinSubmitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0
  },
  pinSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  }
});
