import React, { useState, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';

const ROLES = [
  { key: 'profileCompletion.farmer', value: 'Farmer' },
  { key: 'profileCompletion.doctor', value: 'Veterinary Doctor' },
  { key: 'profileCompletion.merchant', value: 'Merchant / Cattle Buyer' }
];

export default function ProfileCompletionScreen() {
  const { completeProfile } = useContext(AppContext);
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES[0].value);

  const handleSubmit = () => {
    if (fullName.trim().length > 2) {
      completeProfile({
        name: fullName.trim(),
        role: selectedRole,
      });
    } else {
      Alert.alert(t('common.error'), t('profileCompletion.enterNameAlert'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppText style={styles.title}>{t('profileCompletion.title')}</AppText>
            <AppText style={styles.subtitle}>{t('profileCompletion.subtitle')}</AppText>
          </View>

          {/* Inputs */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t('profileCompletion.fullName')}</AppText>
              <TextInput
                style={styles.input}
                placeholder={t('profileCompletion.enterName')}
                placeholderTextColor="#90A4AE"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Role Picker */}
            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t('profileCompletion.selectRole')}</AppText>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.value;
                return (
                  <TouchableOpacity
                    key={role.value}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <AppText style={[styles.roleOptionText, isSelected && styles.roleOptionTextSelected]}>
                      {t(role.key)}
                    </AppText>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <View style={styles.checkInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <AppText style={styles.submitButtonText}>{t('profileCompletion.saveContinue')}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  input: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    color: '#111827',
    fontSize: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  roleOptionSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#16A34A',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    borderColor: '#16A34A',
  },
  checkInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
