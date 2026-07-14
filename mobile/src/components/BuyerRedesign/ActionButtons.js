// ActionButtons.js
// Modern touch buttons for dialing the seller or initializing WhatsApp messaging directly.

import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../AppText';

export default function ActionButtons() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.btn, styles.btnCall]} activeOpacity={0.85}>
        <Ionicons name="call" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <AppText style={styles.btnText}>{t('buy.callSeller')}</AppText>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.btn, styles.btnWhatsapp]} activeOpacity={0.85}>
        <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <AppText style={styles.btnText}>{t('buy.whatsapp')}</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    height: 64, // Production grade large touch targets
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  btnCall: {
    backgroundColor: '#0F172A',
  },
  btnWhatsapp: {
    backgroundColor: '#16A34A',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
