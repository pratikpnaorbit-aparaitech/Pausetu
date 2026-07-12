import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { animalApi } from '../api/animalApi';
import { verificationApi } from '../api/verificationApi';
import AppText from '../components/AppText';

export default function VerificationScreen({ navigation }) {
  const { t } = useTranslation();
  const { refreshProfileData } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // { uri, name, type, size }
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // Auto compress helper
  const compressImage = async (uri) => {
    setStatusText(t('verification.optimizing'));
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // maintains aspect ratio automatically
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (err) {
      console.warn('[Image Compression Error]', err);
      return uri; // fallback to original if compression fails
    }
  };

  const handleCameraLaunch = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('verification.cameraPermission', { defaultValue: 'Camera permissions are required.' }));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
        size: asset.fileSize || 0,
        isImage: true
      });
    }
  };

  const handleGalleryLaunch = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('verification.galleryPermission', { defaultValue: 'Gallery permissions are required.' }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || 'receipt.jpg',
        type: 'image/jpeg',
        size: asset.fileSize || 0,
        isImage: true
      });
    }
  };

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
        setSelectedFile({
          uri: asset.uri,
          name: asset.name || 'receipt.pdf',
          type: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
          isImage: false
        });
      }
    } catch (err) {
      console.warn('[PDF Selection Error]', err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);
    try {
      let finalUri = selectedFile.uri;

      // 1. Silent Image Compression
      if (selectedFile.isImage) {
        finalUri = await compressImage(selectedFile.uri);
      }

      // 2. Build FormData Payload
      setStatusText(t('verification.uploading'));
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const resBlob = await fetch(finalUri);
        const blob = await resBlob.blob();
        formData.append('file', blob, selectedFile.name);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? finalUri : finalUri.replace('file://', ''),
          name: selectedFile.isImage ? 'receipt.jpg' : selectedFile.name,
          type: selectedFile.isImage ? 'image/jpeg' : selectedFile.type,
        });
      }

      // 3. Upload File via animalApi.uploadFile
      const uploadRes = await animalApi.uploadFile(formData, (percent) => {
        setUploadProgress(percent);
      });

      if (uploadRes && uploadRes.data && uploadRes.data.fileUrl) {
        const receiptUrl = uploadRes.data.fileUrl;

        // 4. Submit Verification request
        await verificationApi.submitVerification(receiptUrl);

        // 5. Sync profile details
        await refreshProfileData();

        // 6. Set success screen state
        setIsSubmittedSuccess(true);
      } else {
        throw new Error('Upload response did not return a valid file URL.');
      }
    } catch (err) {
      Alert.alert(t('common.error'), err.message || t('verification.errorMsg'));
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

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

          {/* Actions */}
          <TouchableOpacity 
            style={styles.primaryActionBtn} 
            onPress={() => navigation.goBack()}
          >
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{t('verification.title')}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={20} color="#15803D" style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <AppText style={styles.infoTitle}>{t('verification.instructionsTitle')}</AppText>
            <AppText style={styles.infoText}>{t('verification.instructionsText')}</AppText>
          </View>
        </View>

        {/* Selection Box / Preview */}
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

        {/* Source Action Buttons */}
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

        {/* Loading / Progress Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16A34A" />
            <AppText style={styles.loadingText}>{statusText}</AppText>
            {uploadProgress > 0 && (
              <AppText style={styles.progressText}>{uploadProgress}%</AppText>
            )}
          </View>
        )}

        {/* Submit Action Button */}
        {selectedFile && !loading && (
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <AppText style={styles.submitButtonText}>{t('verification.submitBtn')}</AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
});
