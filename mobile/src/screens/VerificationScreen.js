import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
  Modal} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { animalApi } from '../api/animalApi';
import { verificationApi } from '../api/verificationApi';
import AppText from '../components/AppText';
import CustomHeader from '../components/CustomHeader';

// ─── Date Picker Helper ───────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Format a Date object to YYYY-MM-DD */
function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Build the days array for a given month/year */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Inline Date Picker Modal ─────────────────────────────────────────────────

function DatePickerModal({ visible, onClose, onConfirm, initialDate }) {
  const today = new Date();
  const init   = initialDate ? new Date(initialDate) : today;

  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [day,   setDay]   = useState(init.getDate());

  const daysInMonth = getDaysInMonth(year, month);
  // Clamp day if switching to a shorter month
  const safeDay = Math.min(day, daysInMonth);

  const years = [];
  for (let y = today.getFullYear(); y >= 2000; y--) years.push(y);

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const isFuture = new Date(year, month, safeDay) > today;

  const handleConfirm = () => {
    if (isFuture) {
      Alert.alert('Invalid Date', 'Receipt date cannot be in the future.');
      return;
    }
    onConfirm(formatDate(new Date(year, month, safeDay)));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dp.overlay}>
        <View style={dp.sheet}>
          <AppText style={dp.title}>Select Receipt Date</AppText>

          {/* Scrollable columns */}
          <View style={dp.columns}>
            {/* Day */}
            <View style={dp.col}>
              <AppText style={dp.colLabel}>Day</AppText>
              <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
                {days.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[dp.item, safeDay === d && dp.itemSelected]}
                    onPress={() => setDay(d)}
                  >
                    <AppText style={[dp.itemText, safeDay === d && dp.itemTextSelected]}>
                      {pad(d)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month */}
            <View style={[dp.col, { flex: 2 }]}>
              <AppText style={dp.colLabel}>Month</AppText>
              <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
                {MONTHS.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[dp.item, month === i && dp.itemSelected]}
                    onPress={() => setMonth(i)}
                  >
                    <AppText style={[dp.itemText, month === i && dp.itemTextSelected]}>
                      {m}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year */}
            <View style={dp.col}>
              <AppText style={dp.colLabel}>Year</AppText>
              <ScrollView style={dp.scroll} showsVerticalScrollIndicator={false}>
                {years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[dp.item, year === y && dp.itemSelected]}
                    onPress={() => setYear(y)}
                  >
                    <AppText style={[dp.itemText, year === y && dp.itemTextSelected]}>
                      {y}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {isFuture && (
            <AppText style={dp.futureWarning}>
              ⚠ Future dates are not allowed
            </AppText>
          )}

          {/* Actions */}
          <View style={dp.actions}>
            <TouchableOpacity style={dp.cancelBtn} onPress={onClose}>
              <AppText style={dp.cancelText}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dp.confirmBtn, isFuture && dp.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={isFuture}
            >
              <AppText style={dp.confirmText}>Confirm</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VerificationScreen({ navigation }) {
  const { t } = useTranslation();
  const { refreshProfileData } = useContext(AppContext);

  const [loading,             setLoading]             = useState(false);
  const [statusText,          setStatusText]          = useState('');
  const [selectedFile,        setSelectedFile]        = useState(null);
  const [uploadProgress,      setUploadProgress]      = useState(0);
  const [isSubmittedSuccess,  setIsSubmittedSuccess]  = useState(false);

  const [receiptDate,         setReceiptDate]         = useState('');
  const [showDatePicker,      setShowDatePicker]      = useState(false);
  const [showForm,            setShowForm]            = useState(false);
  const [uploadedReceiptUrl,  setUploadedReceiptUrl]  = useState('');

  // ── Image compression ───────────────────────────────────────────────────────
  const compressImage = async (uri) => {
    setStatusText(t('verification.optimizing'));
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (err) {
      console.warn('[Image Compression Error]', err);
      return uri;
    }
  };

  // ── Camera ──────────────────────────────────────────────────────────────────
  const handleCameraLaunch = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionDenied'),
        t('verification.cameraPermission', { defaultValue: 'Camera permissions are required.' })
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({ uri: asset.uri, name: 'receipt.jpg', type: 'image/jpeg', size: asset.fileSize || 0, isImage: true });
    }
  };

  // ── Gallery ─────────────────────────────────────────────────────────────────
  const handleGalleryLaunch = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('common.permissionDenied'),
        t('verification.galleryPermission', { defaultValue: 'Gallery permissions are required.' })
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({ uri: asset.uri, name: asset.fileName || 'receipt.jpg', type: 'image/jpeg', size: asset.fileSize || 0, isImage: true });
    }
  };

  // ── PDF ─────────────────────────────────────────────────────────────────────
  const handlePdfLaunch = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.size && asset.size > 5 * 1024 * 1024) {
          Alert.alert(t('common.error'), t('verification.sizeLimitError'));
          return;
        }
        setSelectedFile({ uri: asset.uri, name: asset.name || 'receipt.pdf', type: asset.mimeType || 'application/pdf', size: asset.size || 0, isImage: false });
      }
    } catch (err) {
      console.warn('[PDF Selection Error]', err);
    }
  };

  // ── Step 1: Upload receipt image ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile) {
      console.warn('[VerificationScreen] No file selected.');
      return;
    }

    console.log('[VerificationScreen] Upload initiated. File:', selectedFile.name);
    setLoading(true);
    setUploadProgress(0);

    try {
      let finalUri = selectedFile.uri;

      if (selectedFile.isImage) {
        console.log('[VerificationScreen] Compressing image...');
        finalUri = await compressImage(selectedFile.uri);
      }

      setStatusText(t('verification.uploading'));
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const resBlob = await fetch(finalUri);
        const blob    = await resBlob.blob();
        formData.append('file', blob, selectedFile.name);
      } else {
        formData.append('file', {
          uri:  Platform.OS === 'android' ? finalUri : finalUri.replace('file://', ''),
          name: selectedFile.isImage ? 'receipt.jpg' : selectedFile.name,
          type: selectedFile.isImage ? 'image/jpeg' : selectedFile.type,
        });
      }

      const uploadRes = await animalApi.uploadFile(formData, (percent) => {
        setUploadProgress(percent);
      });
      console.log('[VerificationScreen] Upload response:', uploadRes);

      if (uploadRes && uploadRes.data && uploadRes.data.fileUrl) {
        setUploadedReceiptUrl(uploadRes.data.fileUrl);
        setReceiptDate('');
        setShowForm(true);
      } else {
        throw new Error('Upload response did not return a valid file URL.');
      }
    } catch (err) {
      console.error('[VerificationScreen] Upload failed:', err);
      Alert.alert(t('common.error'), err.message || t('verification.errorMsg'));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // ── Step 2: Submit verification with date ───────────────────────────────────
  const handleFinalSubmit = async () => {
    console.log('[VerificationScreen] handleFinalSubmit triggered');

    if (loading) return;

    // Validate receipt date
    if (!receiptDate || !receiptDate.trim()) {
      Alert.alert(
        t('common.error'),
        t('verification.receiptDateRequired', { defaultValue: 'Please select a receipt date.' })
      );
      return;
    }

    // Guard against future date (double-check server-side semantics)
    const selected = new Date(receiptDate);
    if (isNaN(selected.getTime()) || selected > new Date()) {
      Alert.alert(
        t('common.error'),
        t('verification.invalidDate', { defaultValue: 'Receipt date cannot be in the future.' })
      );
      return;
    }

    console.log('[VerificationScreen] Submitting:', { receiptUrl: uploadedReceiptUrl, receiptDate });
    setLoading(true);
    setStatusText(t('verification.submitting', { defaultValue: 'Submitting verification...' }));

    try {
      const response = await verificationApi.submitVerification({
        receiptUrl:  uploadedReceiptUrl,
        receiptDate: receiptDate.trim(),
        // farmerName and dairyName are intentionally omitted — backend treats them as optional
      });
      console.log('[VerificationScreen] Submission successful:', response);

      if (refreshProfileData) {
        await refreshProfileData(true);
      }
      setIsSubmittedSuccess(true);
    } catch (err) {
      console.error('[VerificationScreen] Submission failed:', err);
      Alert.alert(
        t('common.error'),
        err.message || t('verification.errorMsg', { defaultValue: 'Submission failed. Please try again.' })
      );
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSubmittedSuccess) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>

          <AppText style={styles.successTitle}>{t('verification.submittedTitle')}</AppText>
          <AppText style={styles.successDesc}>{t('verification.submittedDesc')}</AppText>

          {/* Status badge */}
          <View style={styles.statusSection}>
            <AppText style={styles.statusLabelTitle}>Status:</AppText>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <AppText style={styles.statusBadgeText}>{t('verification.pendingReview')}</AppText>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.checklistCard}>
            <AppText style={styles.checklistTitle}>{t('verification.untilApproval')}</AppText>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextAllowed}>{t('verification.allowBrowse')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#16A34A" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextAllowed}>{t('verification.allowSearch')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextBlocked}>{t('verification.blockBuy')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextBlocked}>{t('verification.blockSell')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextBlocked}>{t('verification.blockChat')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextBlocked}>{t('verification.blockCall')}</AppText>
            </View>
            <View style={styles.checkItem}>
              <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <AppText style={styles.checkTextBlocked}>{t('verification.blockWhatsApp')}</AppText>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryActionBtn} onPress={() => navigation.goBack()}>
            <AppText style={styles.primaryActionBtnText}>{t('verification.btnViewStatus')}</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => navigation.navigate('MainApp', { screen: 'Buy' })}
          >
            <AppText style={styles.secondaryActionBtnText}>{t('verification.btnGoToHome')}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Main screen ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
            <CustomHeader
        title={t('verification.title')}
        onBackPress={() => {
          if (showForm) {
            setShowForm(false);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── STEP 2: Date + Submit form ──────────────────────────────────── */}
        {showForm ? (
          <View style={styles.formContainer}>
            <AppText style={styles.formSectionTitle}>
              {t('verification.enterReceiptDetails', { defaultValue: 'Enter Receipt Details' })}
            </AppText>

            {/* Compact image / PDF preview */}
            {selectedFile && (
              <View style={[styles.previewContainer, { height: 160 }]}>
                {selectedFile.isImage ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <View style={styles.pdfPreviewBox}>
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color="#EF4444" />
                    <AppText style={styles.pdfName} numberOfLines={1}>{selectedFile.name}</AppText>
                  </View>
                )}
              </View>
            )}

            {/* Receipt Date — tap to open picker */}
            <View style={styles.inputGroup}>
              <AppText style={styles.inputLabel}>
                {t('verification.receiptDate', { defaultValue: 'Receipt Date' })}
              </AppText>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={20}
                  color={receiptDate ? '#16A34A' : '#94A3B8'}
                  style={{ marginRight: 10 }}
                />
                <AppText style={receiptDate ? styles.datePickerValueText : styles.datePickerPlaceholderText}>
                  {receiptDate || t('verification.selectDate', { defaultValue: 'Tap to select date' })}
                </AppText>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </View>

            {/* Actions */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <AppText style={styles.loadingText}>{statusText}</AppText>
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <TouchableOpacity style={styles.submitButton} onPress={handleFinalSubmit}>
                  <AppText style={styles.submitButtonText}>{t('common.confirm')}</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { marginTop: 10, marginBottom: 20 }]}
                  onPress={() => {
                    setShowForm(false);
                    setSelectedFile(null);
                    setUploadedReceiptUrl('');
                    setReceiptDate('');
                  }}
                >
                  <AppText style={styles.secondaryActionBtnText}>{t('common.cancel')}</AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (

        /* ── STEP 1: Upload screen ────────────────────────────────────────── */
          <>
            {/* Info card */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information" size={20} color="#15803D" style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <AppText style={styles.infoTitle}>{t('verification.instructionsTitle')}</AppText>
                <AppText style={styles.infoText}>{t('verification.instructionsText')}</AppText>
              </View>
            </View>

            {/* Preview / placeholder */}
            {selectedFile ? (
              <View style={styles.previewContainer}>
                {selectedFile.isImage ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <View style={styles.pdfPreviewBox}>
                    <MaterialCommunityIcons name="file-pdf-box" size={64} color="#EF4444" />
                    <AppText style={styles.pdfName} numberOfLines={1}>{selectedFile.name}</AppText>
                    <AppText style={styles.pdfSize}>
                      {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </AppText>
                  </View>
                )}
                <TouchableOpacity style={styles.clearButton} onPress={() => setSelectedFile(null)}>
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadBoxPlaceholder}>
                <MaterialCommunityIcons name="cloud-upload-outline" size={48} color="#64748B" />
                <AppText style={styles.uploadBoxText}>{t('verification.noReceiptSelected')}</AppText>
                <AppText style={styles.uploadBoxSubtext}>{t('verification.pdfNote')}</AppText>
              </View>
            )}

            {/* Source buttons */}
            {!selectedFile && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCameraLaunch}>
                  <MaterialCommunityIcons name="camera" size={24} color="#16A34A" />
                  <AppText style={styles.actionButtonText}>{t('verification.camera')}</AppText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleGalleryLaunch}>
                  <MaterialCommunityIcons name="image" size={24} color="#16A34A" />
                  <AppText style={styles.actionButtonText}>{t('verification.gallery')}</AppText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handlePdfLaunch}>
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color="#16A34A" />
                  <AppText style={styles.actionButtonText}>{t('verification.pdf')}</AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Progress indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <AppText style={styles.loadingText}>{statusText}</AppText>
                {uploadProgress > 0 && (
                  <AppText style={styles.progressText}>{uploadProgress}%</AppText>
                )}
              </View>
            )}

            {/* Upload button */}
            {selectedFile && !loading && (
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <AppText style={styles.submitButtonText}>{t('verification.submitBtn')}</AppText>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        initialDate={receiptDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setReceiptDate(date);
          setShowDatePicker(false);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#3F6212',
    lineHeight: 18,
    fontWeight: '500',
  },
  previewContainer: {
    height: 240,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  pdfPreviewBox: {
    alignItems: 'center',
    padding: 20,
  },
  pdfName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
    maxWidth: 240,
    textAlign: 'center',
  },
  pdfSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  uploadBoxPlaceholder: {
    height: 240,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 24,
  },
  uploadBoxText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  uploadBoxSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#16A34A',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  // Success screen
  successContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  successContent: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statusLabelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  checklistCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkTextAllowed: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
  },
  checkTextBlocked: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: '#16A34A',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  secondaryActionBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  // Detail form
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  // Date picker trigger button
  datePickerBtn: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  datePickerValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  datePickerPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
});

// ─── Date Picker Modal Styles ─────────────────────────────────────────────────

const dp = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 16,
  },
  columns: {
    flexDirection: 'row',
    height: 220,
    gap: 8,
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  item: {
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  itemSelected: {
    backgroundColor: '#DCFCE7',
  },
  itemText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  itemTextSelected: {
    color: '#16A34A',
    fontWeight: '800',
  },
  futureWarning: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
