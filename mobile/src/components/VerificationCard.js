import React, { useContext, useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Platform
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { resolveMediaUrl } from '../api/api';
import AppText from './AppText';

// Memoized Progressive Document Image with Shimmer Skeleton
const DocumentPreviewImage = React.memo(({ uri, onOpenViewer, t }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation for shimmer skeleton placeholder
  useEffect(() => {
    let loop;
    if (loading && !error) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.8,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }
    return () => loop && loop.stop();
  }, [loading, error]);

  const handleLoadSuccess = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadError = () => {
    setLoading(false);
    setError(true);
  };

  if (error || !uri) {
    return (
      <View style={styles.errorPlaceholder}>
        <MaterialCommunityIcons name="file-document-alert-outline" size={32} color="#94A3B8" />
        <AppText style={styles.errorText}>
          📄 {t('verification.docNotAvailable')}
        </AppText>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.imagePreviewWrapper}
      activeOpacity={0.9}
      onPress={onOpenViewer}
    >
      {/* Shimmer Skeleton Placeholder - NEVER BLANK */}
      {loading && (
        <Animated.View style={[styles.skeletonPlaceholder, { opacity: shimmerAnim }]}>
          <ActivityIndicator size="small" color="#16A34A" />
        </Animated.View>
      )}

      {/* Smooth Progressive Fade-In Image */}
      <Animated.Image
        source={{ uri }}
        style={[styles.previewImage, { opacity: fadeAnim }]}
        resizeMode="contain"
        onLoadEnd={handleLoadSuccess}
        onError={handleLoadError}
      />

      {/* Tap to View Badge */}
      {!loading && (
        <View style={styles.tapToViewBadge}>
          <Ionicons name="scan-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <AppText style={styles.tapToViewText}>
            {t('verification.viewDocument')}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
});

function VerificationCard({ navigation }) {
  const { t } = useTranslation();
  const { userProfile, isGuest } = useContext(AppContext);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  // If user is guest, verification is not applicable
  if (isGuest || !userProfile) return null;

  const verification = userProfile.verification || { status: 'unverified' };
  const status = verification.status || 'unverified';

  const getStatusStyles = () => {
    switch (status) {
      case 'approved':
        return {
          bg: '#F0FDF4',
          border: '#DCFCE7',
          iconColor: '#16A34A',
          iconName: 'check-decagram',
          textColor: '#15803D',
          badgeText: t('verification.approved')
        };
      case 'pending':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          iconColor: '#D97706',
          iconName: 'clock-outline',
          textColor: '#B45309',
          badgeText: t('verification.pending')
        };
      case 'rejected':
        return {
          bg: '#FEF2F2',
          border: '#FEE2E2',
          iconColor: '#DC2626',
          iconName: 'alert-decagram-outline',
          textColor: '#B91C1C',
          badgeText: t('verification.rejected')
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#E2E8F0',
          iconColor: '#475569',
          iconName: 'shield-alert-outline',
          textColor: '#334155',
          badgeText: t('verification.unverified')
        };
    }
  };

  const stylesObj = getStatusStyles();
  const documentUri = verification.receiptUrl ? resolveMediaUrl(verification.receiptUrl) : null;
  const isPdf = verification.receiptUrl ? verification.receiptUrl.toLowerCase().endsWith('.pdf') : false;

  return (
    <View style={[styles.card, { backgroundColor: stylesObj.bg, borderColor: stylesObj.border }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={stylesObj.iconName} size={28} color={stylesObj.iconColor} />
        <View style={styles.headerText}>
          <AppText style={[styles.title, { color: stylesObj.textColor }]}>
            {stylesObj.badgeText}
          </AppText>
          <AppText style={styles.subtitle}>
            {t('verification.cardTitle')}
          </AppText>
        </View>
      </View>

      {/* Body Description */}
      <View style={styles.body}>
        {status === 'approved' && (
          <AppText style={styles.description}>
            {t('verification.approvedDesc')}
          </AppText>
        )}
        {status === 'pending' && (
          <AppText style={styles.description}>
            {t('verification.pendingDesc')}
          </AppText>
        )}
        {status === 'rejected' && (
          <AppText style={styles.description}>
            {t('verification.rejectedDesc', { reason: verification.rejectedReason || 'N/A' })}
          </AppText>
        )}
        {status === 'unverified' && (
          <AppText style={styles.description}>
            {t('verification.unverifiedDesc')}
          </AppText>
        )}
      </View>

      {/* Upload button for unverified or rejected states */}
      {(status === 'unverified' || status === 'rejected') && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Verification')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="upload" size={18} color="#FFFFFF" style={styles.buttonIcon} />
          <AppText style={styles.buttonText}>
            {t('verification.uploadNewBtn')}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Verification Details Metadata */}
      {status !== 'unverified' && (
        <View style={styles.metaContainer}>
          {verification.submittedAt && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.submittedDate')}:</AppText>
              <AppText style={styles.metaValue}>
                {new Date(verification.submittedAt).toLocaleDateString()}
              </AppText>
            </View>
          )}
          {status === 'approved' && verification.approvedAt && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.approvedDate')}:</AppText>
              <AppText style={styles.metaValue}>
                {new Date(verification.approvedAt).toLocaleDateString()}
              </AppText>
            </View>
          )}
          {status === 'rejected' && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.rejectedReasonLabel')}:</AppText>
              <AppText style={[styles.metaValue, { color: '#DC2626' }]}>
                {verification.rejectedReason || 'N/A'}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Document Preview Card */}
      {status !== 'unverified' && documentUri && (
        <View style={styles.previewSection}>
          <AppText style={styles.previewLabel}>
            {t('verification.uploadedDocument')}
          </AppText>

          {isPdf ? (
            <TouchableOpacity
              style={styles.pdfCard}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(documentUri)}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={36} color="#EF4444" />
              <View style={styles.pdfInfo}>
                <AppText style={styles.pdfName} numberOfLines={1}>
                  {verification.receiptUrl.split('/').pop() || 'document.pdf'}
                </AppText>
                <AppText style={styles.pdfSub}>
                  {t('verification.clickToView')}
                </AppText>
              </View>
              <Ionicons name="open-outline" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <DocumentPreviewImage
              uri={documentUri}
              onOpenViewer={() => setIsViewerVisible(true)}
              t={t}
            />
          )}
        </View>
      )}

      {/* Full-Screen Document Viewer Modal */}
      {!isPdf && documentUri && (
        <Modal
          visible={isViewerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsViewerVisible(false)}
        >
          <SafeAreaView style={styles.modalBackdrop}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle}>
                {t('verification.uploadedDocument')}
              </AppText>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalIconBtn}
                  onPress={() => Linking.openURL(documentUri)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalIconBtn}
                  onPress={() => setIsViewerVisible(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: documentUri }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  body: {
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  metaContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  previewSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  imagePreviewWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  skeletonPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6
  },
  tapToViewBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  tapToViewText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  pdfInfo: {
    marginLeft: 10,
    flex: 1,
  },
  pdfName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  pdfSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    justifyContent: 'space-between'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    paddingBottom: 16
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  }
});

export default React.memo(VerificationCard);
