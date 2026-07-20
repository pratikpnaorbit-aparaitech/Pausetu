import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AppText from './AppText';
import { useTranslation } from 'react-i18next';

export default function SectionHeader({ title, actionText, onActionPress }) {
  const { t } = useTranslation();
  const displayActionText = actionText || t('common.viewAll');

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      {onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <AppText style={styles.actionText}>{displayActionText}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600', // SemiBold
    color: '#111827', // Primary Text
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600', // SemiBold
    color: '#16A34A', // Primary Green
  },
});
