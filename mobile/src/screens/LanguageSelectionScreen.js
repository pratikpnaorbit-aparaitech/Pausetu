import React, { useState, useContext } from 'react';
import { StyleSheet, View, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

const LANGUAGES = [
  { code: 'en', label: 'English', subLabel: 'English' },
  { code: 'hi', label: 'हिंदी', subLabel: 'Hindi' },
  { code: 'mr', label: 'मराठी', subLabel: 'Marathi' },
];

export default function LanguageSelectionScreen() {
  const { completeOnboarding } = useContext(AppContext);
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('en');

  const handleConfirm = () => {
    completeOnboarding(selectedLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <AppText style={styles.title}>{t('language.chooseLanguage')}</AppText>
          <AppText style={styles.subtitle}>{t('language.subtitle')}</AppText>
        </View>

        <View style={styles.listContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => setSelectedLang(lang.code)}
              >
                <View style={styles.cardInfo}>
                  <AppText style={[styles.langLabel, isSelected && styles.selectedText]}>
                    {lang.label}
                  </AppText>
                  <AppText style={[styles.langSubLabel, isSelected && styles.selectedSubText]}>
                    {lang.subLabel}
                  </AppText>
                </View>
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <AppText style={styles.confirmButtonText}>{t('language.confirmContinue')}</AppText>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  cardInfo: {
    flex: 1,
  },
  langLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  langSubLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  selectedText: {
    color: '#16A34A',
  },
  selectedSubText: {
    color: '#16A34A',
    opacity: 0.8,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#16A34A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },
  footer: {
    marginBottom: 40,
  },
  confirmButton: {
    height: 56,
    backgroundColor: '#16A34A',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
