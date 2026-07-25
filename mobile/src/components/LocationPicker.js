import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  Keyboard,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import AppText from './AppText';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = Math.round(SCREEN_H * 0.52); // ~50-52% of screen height
const DISMISS_THRESHOLD = 70;

export default function LocationPicker({ visible, onClose, onSelectLocation }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [pincode, setPincode] = useState('');

  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const getCloseAccessibilityLabel = () => {
    const lang = i18n.language || 'en';
    if (lang.startsWith('mr')) return 'बंद करा';
    if (lang.startsWith('hi')) return 'बंद करें';
    return 'Close';
  };

  // PanResponder for swipe-down dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4
          }).start();
        }
      }
    })
  ).current;

  const animateIn = () => {
    dragY.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_H,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true
      })
    ]).start(() => {
      dragY.setValue(0);
      if (typeof onClose === 'function') {
        onClose();
      }
    });
  };

  // Reset state and animate when modal opens
  useEffect(() => {
    if (visible) {
      setPincode('');
      setLoading(false);
      setGpsSuccess(false);
      animateIn();
    }
  }, [visible]);

  // Multi-provider reverse geocoding helper (Expo -> OpenStreetMap Nominatim -> BigDataCloud)
  const reverseGeocodeCoords = async (latitude, longitude) => {
    // Strategy 1: Expo Location API (Native iOS / Android)
    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverse && reverse.length > 0 && (reverse[0].region || reverse[0].district || reverse[0].city)) {
        const addr = reverse[0];
        console.log('[LocationPicker] Raw Expo reverseGeocodeAsync:', addr);

        const state = addr.administrativeArea || addr.region || 'Maharashtra';
        let district = addr.subAdministrativeArea || addr.state_district || addr.subregion;
        if (!district && addr.district) {
          const dLower = addr.district.toLowerCase();
          const cityLower = (addr.city || '').toLowerCase();
          const locLower = (addr.locality || '').toLowerCase();
          if (dLower !== cityLower && dLower !== locLower) {
            district = addr.district;
          }
        }
        if (!district) {
          district = addr.subregion || addr.district || 'Pune';
        }

        const taluka = addr.city || addr.locality || addr.district || 'Baramati';
        const village = addr.subLocality || addr.street || addr.name || '';

        return {
          state,
          district: district.replace(/ District$/i, '').replace(/ Division$/i, '').trim(),
          taluka: taluka.replace(/ Taluka$/i, '').replace(/ Sub-District$/i, '').trim(),
          village,
          latitude,
          longitude
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
          const district = a.state_district || a.county || a.city || 'Pune';
          const taluka = a.town || a.subdistrict || a.municipality || a.county || 'Baramati';
          const village = a.suburb || a.village || a.neighbourhood || a.hamlet || '';

          return {
            state,
            district: district.replace(/ District$/i, '').replace(/ Division$/i, '').trim(),
            taluka: taluka.replace(/ Taluka$/i, '').replace(/ Sub-District$/i, '').trim(),
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
        setGpsSuccess(true);
        onSelectLocation(selected);
      }
    } catch (e) {
      console.error('[LocationPicker] Exception in handleUseCurrentLocation:', e);
      Alert.alert(
        t('locationPicker.errorTitle') || 'Location Error',
        t('locationPicker.offlineError') || 'Unable to detect GPS location. Keeping existing location settings.'
      );
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
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        {/* Dim Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: Animated.add(translateY, dragY)
                }
              ]
            }
          ]}
        >
          {/* Drag Handle Area (Swipe Down to Dismiss) */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.dragHandle} />
          </View>

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
              onPress={handleDismiss} 
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={getCloseAccessibilityLabel()}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <AppText style={styles.loaderText}>{t('locationPicker.detecting')}</AppText>
              </View>
            ) : (
              <View style={styles.menuContainer}>
                {/* Option 1: GPS Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryGpsButton,
                    loading && styles.primaryGpsButtonDisabled
                  ]}
                  onPress={handleUseCurrentLocation}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <AppText style={styles.primaryGpsButtonText}>
                        स्थान शोधत आहे...
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <AppText style={styles.primaryGpsButtonText}>
                        📍 माझा सध्याचा पत्ता वापरा
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>

                {gpsSuccess && (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <AppText style={styles.successText}>
                      ✅ वर्तमान स्थान सापडले
                    </AppText>
                  </View>
                )}

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
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  modalContent: {
    maxHeight: SHEET_H,
    minHeight: Math.round(SHEET_H * 0.85),
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0px -6px 20px rgba(0, 0, 0, 0.15)',
      }
    }),
    overflow: 'hidden'
  },
  dragArea: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF'
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
      }
    }),
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  loaderText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  menuContainer: {
    paddingTop: 4
  },
  primaryGpsButton: {
    height: 50,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 6px rgba(22, 163, 74, 0.2)',
      }
    }),
  },
  primaryGpsButtonDisabled: {
    backgroundColor: '#86EFAC',
    shadowOpacity: 0,
    elevation: 0
  },
  primaryGpsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '600'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14
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
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  pinCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10
  },
  pinInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12
  },
  pinIcon: {
    marginRight: 8
  },
  pinTextInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '500',
    padding: 0
  },
  pinSubmitButton: {
    flexDirection: 'row',
    height: 46,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 4px 6px rgba(22, 163, 74, 0.15)',
      }
    }),
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
