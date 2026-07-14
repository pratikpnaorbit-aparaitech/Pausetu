import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';

export default function OptionButtons({ options, onSelect }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((opt, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.button} 
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <AppText style={styles.text}>
              {t(opt.labelKey, { defaultValue: opt.value })}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C084FC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  }
});
