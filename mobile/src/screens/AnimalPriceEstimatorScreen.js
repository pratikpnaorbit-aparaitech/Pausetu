// AnimalPriceEstimatorScreen.js
// 10-step interactive wizard for cattle price estimation with auto-advancing options.

import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../context/AppContext';
import AppText from '../components/AppText';
import CustomHeader from '../components/CustomHeader';
import PriceCard from '../components/PriceCard';
import ConfidenceMeter from '../components/ConfidenceMeter';
import MarketTrendCard from '../components/MarketTrendCard';
import valuationEngine from '../services/valuationEngine';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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

  const renderHeader = () => (
    <CustomHeader
      title={t('estimator.title', { defaultValue: 'किंमत अंदाजक' })}
      subtitle={t('estimator.subtitle', { defaultValue: 'AI द्वारे अचूक मूल्यांकन' })}
      rightComponent={
        <TouchableOpacity style={styles.refreshBtn} onPress={handleReset} activeOpacity={0.7}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      }
      centered={false}
      gradientColors={['#16A34A', '#15803D']}
      textColor="#FFFFFF"
      iconColor="#FFFFFF"
      showBorder={false}
      safeArea={true}
      titleStyle={{ fontSize: 22, fontWeight: '800' }}
      subtitleStyle={{ fontSize: 14, fontWeight: '600', color: '#DCFCE7', marginTop: 4 }}
      style={{
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 8,
      }}
    />
  );

  const renderQuestionBubble = (text) => (
    <View style={styles.bubbleWrapper}>
      <View style={styles.bubbleAvatar}>
        <MaterialCommunityIcons name="robot-outline" size={26} color="#16A34A" />
      </View>
      <View style={styles.assistantBubble}>
        <AppText style={styles.questionText}>{text}</AppText>
      </View>
    </View>
  );

  const renderNumericStep = (question, value, setValue, stepSize, placeholder, unit) => {
    const num = parseFloat(value) || 0;
    return (
      <View style={styles.stepContainer}>
        {renderQuestionBubble(question)}
        <View style={styles.numericRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.adjustBtn} onPress={() => setValue(String(Math.max(0, num - stepSize)))}>
            <MaterialCommunityIcons name="minus" size={28} color="#16A34A" />
          </TouchableOpacity>
          <View style={styles.numericInputContainer}>
            <TextInput
              style={styles.numericInput}
              keyboardType="numeric"
              value={value}
              onChangeText={setValue}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
            />
            <AppText style={styles.unitText}>{unit}</AppText>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.adjustBtn} onPress={() => setValue(String(num + stepSize))}>
            <MaterialCommunityIcons name="plus" size={28} color="#16A34A" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOptionStep = (question, options, selected, setSelected, keyPrefix) => {
    return (
      <View style={styles.stepContainer}>
        {renderQuestionBubble(question)}
        <View style={styles.optionGrid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              style={[styles.optionCard, selected === opt && styles.selectedOptionCard]}
              onPress={() => { setSelected(opt); if(step < 10) setStep(step + 1); }}
            >
              <AppText style={[styles.optionCardText, selected === opt && styles.selectedOptionCardText]}>
                {t(`${keyPrefix}.${opt}`)}
              </AppText>
              {selected === opt && <MaterialCommunityIcons name="check-circle" size={24} color="#16A34A" style={styles.optionCheckIcon} />}
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
            {renderQuestionBubble(t('estimator.steps.selectAnimal'))}
            <View style={styles.grid}>
              {ANIMALS.map((type) => (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.7}
                  style={[styles.card, animalType === type && styles.selectedCard]}
                  onPress={() => handleSelectAnimal(type)}
                >
                  <View style={[styles.iconCircle, animalType === type && styles.selectedIconCircle]}>
                    <MaterialCommunityIcons
                      name={type === 'cow' ? 'cow' : type === 'buffalo' ? 'water' : 'sheep'}
                      size={42}
                      color={animalType === type ? '#16A34A' : '#64748B'}
                    />
                  </View>
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
            {renderQuestionBubble(t('estimator.steps.selectBreed'))}
            <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
              {BREEDS[animalType].map((b) => (
                <TouchableOpacity
                  key={b}
                  activeOpacity={0.7}
                  style={[styles.listItem, breed === b && styles.selectedListItem]}
                  onPress={() => { setBreed(b); setStep(3); }}
                >
                  <AppText style={[styles.listItemText, breed === b && styles.selectedListItemText]}>
                    {t(`estimator.breeds.${animalType}.${b}`)}
                  </AppText>
                  {breed === b && <MaterialCommunityIcons name="check-circle" size={24} color="#16A34A" />}
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
            {renderQuestionBubble(t('estimator.steps.pregnancy'))}
            <View style={styles.row}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.choiceBtn, isPregnant && styles.selectedChoiceBtn]} onPress={() => setIsPregnant(true)}>
                <AppText style={[styles.choiceBtnText, isPregnant && styles.selectedChoiceBtnText]}>{t('estimator.pregnant.yes')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={[styles.choiceBtn, !isPregnant && styles.selectedChoiceBtn]} onPress={() => { setIsPregnant(false); setStep(7); }}>
                <AppText style={[styles.choiceBtnText, !isPregnant && styles.selectedChoiceBtnText]}>{t('estimator.pregnant.no')}</AppText>
              </TouchableOpacity>
            </View>
            {isPregnant && (
              <View style={styles.subContainer}>
                {renderQuestionBubble(t('estimator.steps.pregnancyMonth'))}
                <View style={styles.monthGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
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
            {renderQuestionBubble(t('estimator.steps.location'))}
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectState') + ' *'} placeholderTextColor="#94A3B8" value={state} onChangeText={setState} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectDistrict') + ' *'} placeholderTextColor="#94A3B8" value={district} onChangeText={setDistrict} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.selectTaluka') + ' *'} placeholderTextColor="#94A3B8" value={taluka} onChangeText={setTaluka} />
              <TextInput style={styles.input} placeholder={t('estimator.placeholders.enterVillage')} placeholderTextColor="#94A3B8" value={village} onChangeText={setVillage} />
            </ScrollView>
          </View>
        );
      case 10:
        return (
          <View style={styles.stepContainer}>
            {renderQuestionBubble(t('estimator.steps.verification'))}
            <View style={styles.grid}>
              <TouchableOpacity activeOpacity={0.7} style={[styles.card, isVerified && styles.selectedCard]} onPress={() => setIsVerified(true)}>
                <View style={[styles.iconCircle, isVerified && styles.selectedIconCircle]}>
                  <MaterialCommunityIcons name="check-decagram" size={42} color={isVerified ? '#16A34A' : '#64748B'} />
                </View>
                <AppText style={[styles.cardText, isVerified && styles.selectedCardText]}>{t('estimator.verified.yes')}</AppText>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={[styles.card, !isVerified && styles.selectedCard]} onPress={() => setIsVerified(false)}>
                <View style={[styles.iconCircle, !isVerified && styles.selectedIconCircle]}>
                  <MaterialCommunityIcons name="close-circle-outline" size={42} color={!isVerified ? '#16A34A' : '#64748B'} />
                </View>
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
        {renderHeader()}
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <PriceCard minPrice={result.minPrice} expectedPrice={result.expectedPrice} premiumPrice={result.premiumPrice} />
          <ConfidenceMeter score={result.confidenceScore} />
          <MarketTrendCard demand={result.demand} suggestions={result.suggestions} />
          <View style={styles.reasoningContainer}>
            <AppText style={styles.reasoningTitle}>{t('estimator.result.reasoning')}</AppText>
            {result.reasoningKeys.map((key, i) => (
              <View key={i} style={styles.reasoningItem}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#16A34A" style={styles.reasoningIcon} />
                <AppText style={styles.reasoningText}>{t(key)}</AppText>
              </View>
            ))}
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.resetBtnAction} onPress={handleReset}>
            <AppText style={styles.resetBtnActionText}>{t('estimator.actions.recalculate')}</AppText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.scrollContainer}>
        <View style={styles.progressSection}>
          <View style={styles.progressHeaderRow}>
            <AppText style={styles.progressText}>{t('estimator.steps.header', { current: step })} / 10</AppText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / 10) * 100}%` }]} />
          </View>
        </View>
        
        {renderStepContent()}
        
        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity activeOpacity={0.7} style={styles.footerBtnBack} onPress={handleBack}>
              <AppText style={styles.footerBtnTextBack}>{t('estimator.actions.back')}</AppText>
            </TouchableOpacity>
          )}
          {step < 10 ? (
            <TouchableOpacity activeOpacity={0.8} style={styles.footerBtnNext} onPress={handleNext}>
              <AppText style={styles.footerBtnTextNext}>{t('estimator.actions.next')}</AppText>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{marginLeft: 8}} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8} style={styles.footerBtnNext} onPress={handleCalculate}>
              <AppText style={styles.footerBtnTextNext}>{t('estimator.actions.calculate')}</AppText>
              <MaterialCommunityIcons name="calculator" size={20} color="#FFFFFF" style={{marginLeft: 8}} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4FBF7' // Clean off-white with subtle green tint
  },
  
  // Header Styles
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: { 
    flexGrow: 1, 
    padding: 24, 
    justifyContent: 'space-between' 
  },

  // Progress Section
  progressSection: { 
    marginBottom: 32,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#1E293B' 
  },
  progressBarBg: { 
    width: '100%', 
    height: 10, 
    backgroundColor: '#E2E8F0', 
    borderRadius: 5, 
    overflow: 'hidden' 
  },
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#16A34A', 
    borderRadius: 5 
  },

  // Assistant Bubble
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  bubbleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  questionText: { 
    fontSize: 19, 
    fontWeight: '700', 
    color: '#0F172A', 
    lineHeight: 28 
  },

  stepContainer: { 
    flex: 1, 
    justifyContent: 'center' 
  },

  // Selection Grids and Cards
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    marginVertical: 8 
  },
  card: { 
    width: '47%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 16, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: { 
    borderColor: '#16A34A', 
    backgroundColor: '#F0FDF4' 
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedIconCircle: {
    backgroundColor: '#DCFCE7',
  },
  cardText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#475569',
    textAlign: 'center',
  },
  selectedCardText: { 
    color: '#16A34A' 
  },

  listContainer: { 
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  listItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 18, 
    marginBottom: 12, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedListItem: { 
    borderColor: '#16A34A', 
    backgroundColor: '#F0FDF4' 
  },
  listItemText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#334155' 
  },
  selectedListItemText: { 
    color: '#16A34A' 
  },

  // Numeric Inputs
  numericRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 16,
  },
  adjustBtn: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#F0FDF4', 
    borderWidth: 1.5, 
    borderColor: '#DCFCE7', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  numericInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 18, 
    paddingHorizontal: 20, 
    marginHorizontal: 20, 
    width: 150, 
    height: 60,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  numericInput: { 
    flex: 1, 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0F172A', 
    textAlign: 'center' 
  },
  unitText: { 
    fontSize: 16, 
    color: '#64748B', 
    fontWeight: '700' 
  },

  // Binary Choices
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20,
    marginTop: 8,
  },
  choiceBtn: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 20, 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    marginHorizontal: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedChoiceBtn: { 
    borderColor: '#16A34A', 
    backgroundColor: '#F0FDF4' 
  },
  choiceBtnText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#475569' 
  },
  selectedChoiceBtnText: { 
    color: '#16A34A' 
  },

  // Sub-sections
  subContainer: { 
    marginTop: 12,
  },
  monthGrid: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 8,
  },
  monthBtn: { 
    width: '18%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 10, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  selectedMonthBtn: { 
    borderColor: '#16A34A', 
    backgroundColor: '#F0FDF4' 
  },
  monthBtnText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#475569' 
  },
  selectedMonthBtnText: { 
    color: '#16A34A' 
  },

  // Options
  optionGrid: { 
    flexDirection: 'column',
    marginTop: 8,
  },
  optionCard: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    padding: 20, 
    marginBottom: 14, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: { 
    borderColor: '#16A34A', 
    backgroundColor: '#F0FDF4' 
  },
  optionCardText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#334155' 
  },
  selectedOptionCardText: { 
    color: '#16A34A' 
  },
  optionCheckIcon: {
    marginLeft: 8,
  },

  // Location inputs
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 18, 
    padding: 18, 
    fontSize: 17, 
    fontWeight: '600',
    color: '#0F172A', 
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },

  // Footer Navigation
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 24, 
    paddingBottom: 16 
  },
  footerBtnBack: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 18, 
    borderWidth: 1.5, 
    borderColor: '#CBD5E1', 
    backgroundColor: '#FFFFFF', 
    marginRight: 8 
  },
  footerBtnNext: { 
    flex: 2, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 18, 
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  footerBtnTextBack: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#475569' 
  },
  footerBtnTextNext: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '800' 
  },

  // Result UI
  resultScroll: { 
    padding: 24, 
    paddingBottom: 40 
  },
  reasoningContainer: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    marginVertical: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  reasoningTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#1E293B', 
    marginBottom: 16 
  },
  reasoningItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginVertical: 6 
  },
  reasoningIcon: { 
    marginTop: 2, 
    marginRight: 10 
  },
  reasoningText: { 
    fontSize: 15, 
    color: '#475569', 
    lineHeight: 22, 
    flex: 1,
    fontWeight: '600'
  },
  resetBtnAction: { 
    backgroundColor: '#1E293B', 
    padding: 18, 
    borderRadius: 18, 
    alignItems: 'center', 
    marginVertical: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  resetBtnActionText: { 
    color: '#FFFFFF', 
    fontSize: 17, 
    fontWeight: '800' 
  },
});
