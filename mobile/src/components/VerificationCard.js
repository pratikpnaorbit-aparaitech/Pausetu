import React, { useContext } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import { resolveMediaUrl } from '../api/api';
import AppText from './AppText';

export default function VerificationCard({ navigation }) {
  const { t } = useTranslation();
  const { userProfile, isGuest } = useContext(AppContext);

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
          border: '#FEF3C7',
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
          bg: '#F1F5F9',
          border: '#E2E8F0',
          iconColor: '#475569',
          iconName: 'shield-alert-outline',
          textColor: '#334155',
          badgeText: t('verification.unverified')
        };
    }
  };

  const stylesObj = getStatusStyles();

  return (
    <View style={[styles.card, { backgroundColor: stylesObj.bg, borderColor: stylesObj.border }]}>
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

      <View style={styles.body}>
        {status === 'approved' && (
          <AppText style={styles.description}>
            {t('verification.approvedDesc', { defaultValue: 'Your account is verified as a trusted Dairy Farmer.' })}
          </AppText>
        )}
        {status === 'pending' && (
          <AppText style={styles.description}>
            {t('verification.pendingDesc')}
          </AppText>
        )}
        {status === 'rejected' && (
          <View>
            <AppText style={styles.description}>
              {t('verification.rejectedDesc', { reason: verification.rejectedReason || 'No reason specified' })}
            </AppText>
          </View>
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
        >
          <MaterialCommunityIcons name="upload" size={18} color="#FFFFFF" style={styles.buttonIcon} />
          <AppText style={styles.buttonText}>
            {t('verification.uploadNewBtn')}
          </AppText>
        </TouchableOpacity>
      )}

      {/* Verification Details metadata */}
      {status !== 'unverified' && (
        <View style={styles.metaContainer}>
          {verification.submittedAt && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.uploadDate')}:</AppText>
              <AppText style={styles.metaValue}>
                {new Date(verification.submittedAt).toLocaleDateString()}
              </AppText>
            </View>
          )}
          {status === 'approved' && verification.approvedAt && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.approvalDate')}:</AppText>
              <AppText style={styles.metaValue}>
                {new Date(verification.approvedAt).toLocaleDateString()}
              </AppText>
            </View>
          )}
          {status === 'rejected' && (
            <View style={styles.metaRow}>
              <AppText style={styles.metaLabel}>{t('verification.rejectedReasonLabel')}:</AppText>
              <AppText style={[styles.metaValue, { color: '#DC2626' }]}>
                {verification.rejectedReason || 'No reason specified'}
              </AppText>
            </View>
          )}
        </View>
      )}

      {/* Receipt Preview */}
      {status !== 'unverified' && verification.receiptUrl && (
        <View style={styles.previewContainer}>
          <AppText style={styles.previewLabel}>
            {t('verification.receiptPreview', { defaultValue: 'Uploaded Document:' })}
          </AppText>
          {verification.receiptUrl.toLowerCase().endsWith('.pdf') ? (
            <TouchableOpacity
              style={styles.pdfCard}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(resolveMediaUrl(verification.receiptUrl))}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" />
              <View style={styles.pdfInfo}>
                <AppText style={styles.pdfName} numberOfLines={1}>
                  {verification.receiptUrl.split('/').pop() || 'receipt.pdf'}
                </AppText>
                <AppText style={styles.pdfSub}>
                  {t('verification.clickToView', { defaultValue: 'Tap to view PDF' })}
                </AppText>
              </View>
            </TouchableOpacity>
          ) : (
            <Image
              source={{ uri: resolveMediaUrl(verification.receiptUrl) }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}
        </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    borderTopColor: 'rgba(0,0,0,0.05)',
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
  previewContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  pdfInfo: {
    marginLeft: 10,
    flex: 1,
  },
  pdfName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  pdfSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});
