// AnimalPriceEstimatorScreen.js
// 10-step interactive wizard for cattle price estimation with auto-advancing options.

import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import AppText from '../components/AppText';
import PriceCard from '../components/PriceCard';
import ConfidenceMeter from '../components/ConfidenceMeter';
import MarketTrendCard from '../components/MarketTrendCard';
import valuationEngine from '../services/valuationEngine';

const ANIMALS = ['cow', 'buffalo', 'goat'];

const BREEDS = {
  cow: ['gir', 'sahiwal', 'hf', 'jersey', 'desi', 'other'],
  buffalo: ['murrah', 'surti', 'nili_ravi', 'mehsana', 'local', 'other'],
  goat: ['sirohi', 'barbari', 'jamnapari', 'osmanabadi', 'local', 'other']
};

export default function AnimalPriceEstimatorScreen() {
  const { t } = useTranslation();
  const { userProfile } = useContext(AppContext);

  const [step, setStep] = useState(1);
  const [isCalculated, setIsCalculated] = useState(false);
  const [result, setResult] = useState(null);

  // Form States
  const [animalType, setAnimalType] = useState('cow');
  const [breed, setBreed] = useState('gir');
  const [age, setAge] = useState('3.5');
  const [weight, setWeight] = useState('350');
  const [milkProduction, setMilkProduction] = useState('10');
  const [isPregnant, setIsPregnant] = useState(false);
  const [pregnancyMonth, setPregnancyMonth] = useState('3');
  const [healthCondition, setHealthCondition] = useState('good');
  const [vaccinationStatus, setVaccinationStatus] = useState('partial');
  const [isVerified, setIsVerified] = useState(false);
  
  // Location States
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');

  useEffect(() => {
    if (userProfile) {
      if (userProfile.state) setState(userProfile.state);
      if (userProfile.district) setDistrict(userProfile.district);
      if (userProfile.taluka) setTaluka(userProfile.taluka);
      if (userProfile.village) setVillage(userProfile.village);
    }
  }, [userProfile]);

  const handleSelectAnimal = (type) => {
    setAnimalType(type);
    setBreed(BREEDS[type][0]);
    if (type === 'goat') {
      setAge('1.5');
      setWeight('35');
      setMilkProduction('1.5');
    } else {
      setAge('3.5');
      setWeight(type === 'buffalo' ? '450' : '350');
      setMilkProduction('10');
    }
    setStep(2);
  };

  const handleNext = () => {
    if (step === 9) {
      if (!state.trim() || !district.trim() || !taluka.trim()) {
        return;
      }
    }
    if (step < 10) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCalculate = () => {
    const valuation = valuationEngine.estimatePrice({
      animalType,
      breed,
      age: parseFloat(age) || 0,
      weight: parseFloat(weight) || 0,
      milkProduction: parseFloat(milkProduction) || 0,
      isPregnant,
      pregnancyMonth: isPregnant ? parseInt(pregnancyMonth, 10) : 0,
      healthCondition,
      vaccinationStatus,
      location: { state, district, taluka, village },
      isVerified
    });
    setResult(valuation);
    setIsCalculated(true);
  };

  const handleReset = () => {
    setStep(1);
    setIsCalculated(false);
    setResult(null);
  };

  const renderNumericStep = (question, value, setValue, stepSize, placeholder, unit) => {
    const num = parseFloat(value) || 0;
    return (
      <View style={styles.stepContainer}>
        <AppText style={styles.question}>{question}</AppText>
        <View style={styles.numericRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setValue(String(Math.max(0, num - stepSize)))}>
            <MaterialCommunityIcons name="minus" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.numericInputContainer}>
            <TextInput
              style={styles.numericInput}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
            />
            <AppText style={styles.unitText}>{unit}</AppText>
          </View>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => setValue(String(num + stepSize))}>
            <MaterialCommunityIcons name="plus" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOptionStep = (question, options, selected, setSelected, keyPrefix) => {
    return (
      <View style={styles.stepContainer}>
        <AppText style={styles.question}>{question}</AppText>
        <View style={styles.optionGrid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.optionCard, selected === opt && styles.selectedOptionCard]}
              onPress={() => { setSelected(opt); if(step < 10) setStep(step + 1); }}
            >
              <AppText style={[styles.optionCardText, selected === opt && styles.selectedOptionCardText]}>
                {t(`${keyPrefix}.${opt}`)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <AppText style={styles.question}>{t('estimator.steps.selectAnimal')}</AppText>
            <View style={styles.grid}>
              {ANIMALS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.card, animalType === type && styles.selectedCard]}
                  onPress={() => handleSelectAnimal(type)}
                >
                  <MaterialCommunityIcons
                    name={type === 'cow' ? 'cow' : type === 'buffalo' ? 'water' : 'sheep'}
                    size={48}
                    color={animalType === type ? '#16A34A' : '#64748B'}
                  />
                  <AppText style={[styles.cardText, animalType === type && styles.selectedCardText]}>
                    {t(`estimator.animal.${type}`)}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <AppText style={styles.question}>{t('estimator.steps.selectBreed')}</AppText>
            <ScrollView contentContainerStyle={styles.listContainer}>
              {BREEDS[animalType].map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.listItem, breed === b && styles.selectedListItem]}
                  onPress={() => { setBreed(b); setStep(3); }}
                >
                  <AppText style={[styles.listItemText, breed === b && styles.selectedListItemText]}>
                    {t(`estimator.breeds.${animalType}.${b}`)}
                  </AppText>
                  {breed === b && <MaterialCommunityIcons name="check" size={20} color="#16A34A" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 3:
        return renderNumericStep(t('estimator.steps.age'), age, setAge, 0.5, t('estimator.placeholders.age'), t('estimator.input.years'));
      case 4:
        return renderNumericStep(t('estimator.steps.weight'), weight, setWeight, 10, t('estimator.placeholders.weight'), 'kg');
      case 5:
        return renderNumericStep(t('estimator.steps.milkProduction'), milkProduction, setMilkProduction, 1, t('estimator.placeholders.milk'), 'L');
      case 6:
        return (
          <View style={styles.stepContainer}>
            <AppText style={styles.question}>{t('estimator.steps.pregnancy')}</AppText>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.choiceBtn, isPregnant && styles.selectedChoiceBtn]} onPress={() => setIsPregnant(true)}>
                <AppText style={[styles.choiceBtnText, isPregnant && styles.selectedChoiceBtnText]}>{t('estimator.pregnant.yes')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.choiceBtn, !isPregnant && styles.selectedChoiceBtn]} onPress={() => { setIsPregnant(false); setStep(7); }}>
                <AppText style={[styles.choiceBtnText, !isPregnant && styles.selectedChoiceBtnText]}>{t('estimator.pregnant.no')}</AppText>
              </TouchableOpacity>
            </View>
            {isPregnant && (
              <View style={styles.subContainer}>
                <AppText style={styles.subQuestion}>{t('estimator.steps.pregnancyMonth')}</AppText>
                <View style={styles.grid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthBtn, pregnancyMonth === String(m) && styles.selectedMonthBtn]}
                      onPress={() => { setPregnancyMonth(String(m)); setStep(7); }}
                    >
                      <AppText style={[styles.monthBtnText, pregnancyMonth === String(m) && styles.selectedMonthBtnText]}>{m}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        );
      case 7:
        return renderOptionStep(t('estimator.steps.health'), ['excellent', 'good', 'average', 'needs_treatment'], healthCondition, setHealthCondition, 'estimator.health');
      case 8:
        return renderOptionStep(t('estimator.steps.vaccination'), ['complete', 'partial', 'unknown'], vaccinationStatus, setVaccinationStatus, 'estimator.vaccination');
      case 9:
        return (
          <View style={styles.stepContainer}>
            <AppText style={styles.question}>{t('estimator.steps.location')}</AppText>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectState') + ' *'} value={state} onChangeText={setState} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectDistrict') + ' *'} value={district} onChangeText={setDistrict} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectTaluka') + ' *'} value={taluka} onChangeText={setTaluka} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.enterVillage')} value={village} onChangeText={setVillage} />
            </ScrollView>
          </View>
        );
      case 10:
        return (
          <View style={styles.stepContainer}>
            <AppText style={styles.question}>{t('estimator.steps.verification')}</AppText>
            <View style={styles.grid}>
              <TouchableOpacity style={[styles.card, isVerified && styles.selectedCard]} onPress={() => setIsVerified(true)}>
                <MaterialCommunityIcons name="check-decagram" size={48} color={isVerified ? '#16A34A' : '#64748B'} />
                <AppText style={[styles.cardText, isVerified && styles.selectedCardText]}>{t('estimator.verified.yes')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.card, !isVerified && styles.selectedCard]} onPress={() => setIsVerified(false)}>
                <MaterialCommunityIcons name="close-circle-outline" size={48} color={!isVerified ? '#16A34A' : '#64748B'} />
                <AppText style={[styles.cardText, !isVerified && styles.selectedCardText]}>{t('estimator.verified.no')}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (isCalculated && result) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <PriceCard minPrice={result.minPrice} expectedPrice={result.expectedPrice} premiumPrice={result.premiumPrice} />
          <ConfidenceMeter score={result.confidenceScore} />
          <MarketTrendCard demand={result.demand} suggestions={result.suggestions} />
          <View style={styles.reasoningContainer}>
            <AppText style={styles.reasoningTitle}>{t('estimator.result.reasoning')}</AppText>
            {result.reasoningKeys.map((key, i) => (
              <View key={i} style={styles.reasoningItem}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#64748B" style={styles.reasoningIcon} />
                <AppText style={styles.reasoningText}>{t(key)}</AppText>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <AppText style={styles.resetBtnText}>{t('estimator.actions.recalculate')}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scrollContainer}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / 10) * 100}%` }]} />
          </View>
          <AppText style={styles.progressText}>{t('estimator.steps.header', { current: step })}</AppText>
        </View>
        
        {renderStepContent()}
        
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.footerBtn} onPress={handleBack}>
              <AppText style={styles.footerBtnText}>{t('estimator.actions.back')}</AppText>
            </TouchableOpacity>
          )}
          {step < 10 ? (
            <TouchableOpacity style={[styles.footerBtn, styles.nextBtn]} onPress={handleNext}>
              <AppText style={[styles.footerBtnText, styles.nextBtnText]}>{t('estimator.actions.next')}</AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.footerBtn, styles.nextBtn]} onPress={handleCalculate}>
              <AppText style={[styles.footerBtnText, styles.nextBtnText]}>{t('estimator.actions.calculate')}</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContainer: { flexGrow: 1, padding: 20, justifyContent: 'space-between' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginRight: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  stepContainer: { flex: 1, justifyContent: 'center' },
  question: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginVertical: 12 },
  card: { width: '45%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedCard: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  cardText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#475569' },
  selectedCardText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#16A34A' },
  listContainer: { paddingVertical: 8 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedListItem: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  listItemText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  selectedListItemText: { fontSize: 15, fontWeight: '600', color: '#16A34A' },
  numericRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adjustBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyView: 'center', justifyContent: 'center' },
  numericInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingHorizontal: 16, marginHorizontal: 16, width: 140, height: 50 },
  numericInput: { flex: 1, fontSize: 18, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  unitText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  choiceBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 8 },
  selectedChoiceBtn: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  choiceBtnText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  selectedChoiceBtnText: { color: '#16A34A', fontSize: 16, fontWeight: '600' },
  subContainer: { marginTop: 20 },
  subQuestion: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, textAlign: 'center' },
  monthBtn: { width: '18%', backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedMonthBtn: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  monthBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  selectedMonthBtnText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  optionGrid: { flexDirection: 'column' },
  optionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  selectedOptionCard: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  optionCardText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  selectedOptionCardText: { fontSize: 15, fontWeight: '600', color: '#16A34A' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingBottom: 10 },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', marginHorizontal: 8 },
  nextBtn: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  footerBtnText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  resultScroll: { padding: 16, paddingBottom: 40 },
  reasoningContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 8 },
  reasoningTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
  reasoningItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4 },
  reasoningIcon: { marginTop: 2, marginRight: 8 },
  reasoningText: { fontSize: 12, color: '#475569', lineHeight: 18, flex: 1 },
  resetBtn: { backgroundColor: '#1E293B', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 16 },
  resetBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
