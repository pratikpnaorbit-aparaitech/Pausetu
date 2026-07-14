// BidScreen.js
// Modern WhatsApp-style Guided Cattle Valuation Assistant screen with access check, lifetime unlock, and restart.

import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../components/AppText';
import { usePremium } from '../hooks/usePremium';
import { AppContext } from '../context/AppContext';
import { verificationApi } from '../api/verificationApi';
import MarketPriceUnlockScreen from './PremiumAdvisor/MarketPriceUnlockScreen';
import PriceCard from '../components/PriceCard';
import ConfidenceMeter from '../components/ConfidenceMeter';
import MarketTrendCard from '../components/MarketTrendCard';
import valuationEngine from '../services/valuationEngine';
import TypingIndicator from '../chatbot/components/TypingIndicator';

const BREEDS = {
  cow: ['gir', 'sahiwal', 'hf', 'jersey', 'desi', 'other'],
  buffalo: ['murrah', 'surti', 'nili_ravi', 'mehsana', 'local', 'other'],
  goat: ['sirohi', 'barbari', 'jamnapari', 'osmanabadi', 'local', 'other']
};

const QUESTIONS = [
  {
    id: 'animal',
    questionKey: 'estimator.chat.qAnimal',
    getOptions: () => ['cow', 'buffalo', 'goat'],
    getOptionLabel: (opt, t) => t(`estimator.animal.${opt}`),
  },
  {
    id: 'breed',
    questionKey: 'estimator.chat.qBreed',
    getOptions: (answers) => BREEDS[answers.animal || 'cow'],
    getOptionLabel: (opt, t, answers) => t(`estimator.breeds.${answers.animal || 'cow'}.${opt}`),
  },
  {
    id: 'age',
    questionKey: 'estimator.chat.qAge',
    getOptions: (answers) => answers.animal === 'goat' 
      ? ['lt_6m', '6_12m', '1_2y', '2_3y', 'gt_3y']
      : ['1_2y', '2_3y', '3_5y', '5_7y', 'gt_7y'],
    getOptionLabel: (opt, t) => t(`estimator.chat.ageOptions.${opt}`),
  },
  {
    id: 'weight',
    questionKey: 'estimator.chat.qWeight',
    getOptions: (answers) => {
      if (answers.animal === 'cow') return ['w150_250', 'w250_350', 'w350_450', 'w450_plus'];
      if (answers.animal === 'buffalo') return ['w250_350', 'w350_450', 'w450_550', 'w550_plus'];
      return ['w10_20', 'w20_30', 'w30_40', 'w40_50', 'w50_plus'];
    },
    getOptionLabel: (opt, t) => t(`estimator.chat.weightOptions.${opt}`),
  },
  {
    id: 'milk',
    questionKey: 'estimator.chat.qMilk',
    getOptions: () => ['m0', 'm1_5', 'm5_10', 'm10_15', 'm15_20', 'm20_plus'],
    getOptionLabel: (opt, t) => t(`estimator.chat.milkOptions.${opt}`),
  },
  {
    id: 'health',
    questionKey: 'estimator.chat.qHealth',
    getOptions: () => ['excellent', 'good', 'average', 'needs_treatment'],
    getOptionLabel: (opt, t) => t(`estimator.health.${opt}`),
  },
  {
    id: 'district',
    questionKey: 'estimator.chat.qDistrict',
    getOptions: () => ['pune', 'satara', 'ahmednagar', 'anand', 'jaipur', 'lucknow', 'other'],
    getOptionLabel: (opt, t) => t(`estimator.chat.districtOptions.${opt}`),
  }
];

function MarketPriceChatAssistant({ onRestart }) {
  const { t } = useTranslation();
  const { userProfile } = useContext(AppContext);
  const { unlockLifetimeMarketPrice } = usePremium();
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [globalUnlock, setGlobalUnlock] = useState(false);

  useEffect(() => {
    setIsTyping(true);
    timerRef.current = setTimeout(() => {
      setIsTyping(false);
      setMessages([{ id: 'greeting', sender: 'bot', text: t('estimator.chat.qAnimal') }]);
    }, 600);

    verificationApi.getSettings()
      .then(res => {
        if (res && res.marketPriceGlobalUnlock !== undefined) {
          setGlobalUnlock(!!res.marketPriceGlobalUnlock);
        }
      })
      .catch(err => console.log('Error settings:', err));

    return () => timerRef.current && clearTimeout(timerRef.current);
  }, []);

  const hasAccess = globalUnlock || userProfile?.marketPriceAccess?.hasAccess || userProfile?.isPremium;
  const isComplete = currentQuestionIndex >= QUESTIONS.length || messages.some(m => m.isResultCard || m.id === 'locked_note');

  const runPriceEstimation = (ans) => {
    let ageNum = 3.5;
    if (ans.age === 'lt_6m') ageNum = 0.4;
    else if (ans.age === '6_12m') ageNum = 0.8;
    else if (ans.age === '1_2y') ageNum = 1.5;
    else if (ans.age === '2_3y') ageNum = 2.5;
    else if (ans.age === '3_5y') ageNum = 4.0;
    else if (ans.age === '5_7y') ageNum = 6.0;
    else if (ans.age === 'gt_3y') ageNum = 4.0;
    else if (ans.age === 'gt_7y') ageNum = 8.5;

    let weightNum = 350;
    if (ans.weight === 'w10_20') weightNum = 15;
    else if (ans.weight === 'w20_30') weightNum = 25;
    else if (ans.weight === 'w30_40') weightNum = 35;
    else if (ans.weight === 'w40_50') weightNum = 45;
    else if (ans.weight === 'w50_plus') weightNum = 55;
    else if (ans.weight === 'w150_250') weightNum = 200;
    else if (ans.weight === 'w250_350') weightNum = 300;
    else if (ans.weight === 'w350_450') weightNum = 400;
    else if (ans.weight === 'w450_plus') weightNum = 480;
    else if (ans.weight === 'w450_550') weightNum = 500;
    else if (ans.weight === 'w550_plus') weightNum = 600;

    let milkNum = 10;
    if (ans.milk === 'm0') milkNum = 0;
    else if (ans.milk === 'm1_5') milkNum = 3;
    else if (ans.milk === 'm5_10') milkNum = 7.5;
    else if (ans.milk === 'm10_15') milkNum = 12.5;
    else if (ans.milk === 'm15_20') milkNum = 17.5;
    else if (ans.milk === 'm20_plus') milkNum = 22.5;

    let state = 'Maharashtra';
    let districtName = 'Pune';
    let taluka = 'Haveli';
    if (ans.district === 'satara') { districtName = 'Satara'; taluka = 'Karad'; }
    else if (ans.district === 'ahmednagar') { districtName = 'Ahmednagar'; taluka = 'Nagar'; }
    else if (ans.district === 'anand') { state = 'Gujarat'; districtName = 'Anand'; taluka = 'Anand'; }
    else if (ans.district === 'jaipur') { state = 'Rajasthan'; districtName = 'Jaipur'; taluka = 'Amber'; }
    else if (ans.district === 'lucknow') { state = 'Uttar Pradesh'; districtName = 'Lucknow'; taluka = 'Lucknow'; }

    return valuationEngine.estimatePrice({
      animalType: ans.animal,
      breed: ans.breed,
      age: ageNum,
      weight: weightNum,
      milkProduction: milkNum,
      isPregnant: false,
      pregnancyMonth: 0,
      healthCondition: ans.health,
      vaccinationStatus: 'complete',
      location: { state, district: districtName, taluka },
      isVerified: true
    });
  };

  const handleSelectOption = (opt) => {
    if (isTyping || analyzing || isComplete) return;

    const currentQ = QUESTIONS[currentQuestionIndex];
    const userMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: currentQ.getOptionLabel(opt, t, answers)
    };

    const nextAnswers = { ...answers, [currentQ.id]: opt };
    setAnswers(nextAnswers);
    setMessages(prev => [...prev, userMessage]);

    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < QUESTIONS.length) {
      setCurrentQuestionIndex(nextIdx);
      setIsTyping(true);
      timerRef.current = setTimeout(() => {
        setIsTyping(false);
        const nextQ = QUESTIONS[nextIdx];
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: t(nextQ.questionKey, { animal: t(`estimator.animal.${nextAnswers.animal}`) })
        }]);
      }, 1000);
    } else {
      setCurrentQuestionIndex(nextIdx);
      setIsTyping(true);
      timerRef.current = setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: 'summary',
          sender: 'bot',
          isSummaryCard: true,
          answers: nextAnswers
        }]);
        setAnalyzing(true);
        timerRef.current = setTimeout(() => {
          setAnalyzing(false);
          const priceResult = runPriceEstimation(nextAnswers);
          if (hasAccess) {
            setMessages(prev => [...prev, {
              id: 'result',
              sender: 'bot',
              isResultCard: true,
              result: priceResult
            }]);
          } else {
            setShowPayment(true);
          }
        }, 1500);
      }, 800);
    }
  };

  const handlePaymentSuccess = async () => {
    const res = await unlockLifetimeMarketPrice();
    if (res.success) {
      setShowPayment(false);
      const priceResult = runPriceEstimation(answers);
      setMessages(prev => [...prev, {
        id: 'result',
        sender: 'bot',
        isResultCard: true,
        result: priceResult
      }]);
    } else {
      Alert.alert(t('common.error'), res.error || 'Payment failed');
    }
  };

  const handlePressRestart = () => {
    if (Platform.OS === 'web') {
      const confirmText = `${t('estimator.chat.restartTitle', { defaultValue: 'Restart Market Price Assistant?' })}\n\n${t('estimator.chat.restartMessage', { defaultValue: 'All answers, chat history, summary, valuation and progress will be cleared.' })}`;
      if (window.confirm(confirmText)) {
        onRestart();
      }
    } else {
      Alert.alert(
        t('estimator.chat.restartTitle', { defaultValue: 'Restart Market Price Assistant?' }),
        t('estimator.chat.restartMessage', { defaultValue: 'All answers, chat history, summary, valuation and progress will be cleared.' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('estimator.actions.restart', { defaultValue: 'Restart' }), style: 'destructive', onPress: onRestart }
        ]
      );
    }
  };

  if (showPayment) {
    return (
      <MarketPriceUnlockScreen
        onUnlock={handlePaymentSuccess}
        onClose={() => {
          setShowPayment(false);
          setMessages(prev => [...prev, {
            id: 'locked_note',
            sender: 'bot',
            text: "🔒 " + t('estimator.chat.premiumRequiredDesc')
          }]);
        }}
      />
    );
  }

  const activeQ = QUESTIONS[currentQuestionIndex];
  const options = (currentQuestionIndex < QUESTIONS.length && !analyzing && !isComplete) ? activeQ.getOptions(answers) : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* WhatsApp Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatarContainer}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="robot" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.onlineBadge} />
        </View>
        <View style={styles.headerInfo}>
          <AppText style={styles.headerTitle}>{t('estimator.title')}</AppText>
          <AppText style={styles.headerSubtitle}>
            {isTyping || analyzing ? t('common.loading') : t('common.online')}
          </AppText>
        </View>
        <TouchableOpacity style={styles.restartHeaderBtn} onPress={handlePressRestart} aria-label="Restart valuation assistant">
          <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <AppText style={styles.progressText}>
          {t('estimator.steps.header', { current: Math.min(7, currentQuestionIndex + 1) })}
        </AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(Math.min(7, currentQuestionIndex + 1) / 7) * 100}%` }]} />
        </View>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={() => (
          <View style={styles.dateSeparator}>
            <AppText style={styles.dateSeparatorText}>{t('common.today')}</AppText>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.isSummaryCard) {
            return (
              <View style={[styles.bubble, styles.botBubble, styles.summaryCard]}>
                <AppText style={styles.summaryTitle}>{t('estimator.chat.summaryCard')}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.selectAnimal')}: {t(`estimator.animal.${item.answers.animal}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.selectBreed')}: {t(`estimator.breeds.${item.answers.animal}.${item.answers.breed}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.age')}: {t(`estimator.chat.ageOptions.${item.answers.age}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.weight')}: {t(`estimator.chat.weightOptions.${item.answers.weight}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.milkProduction')}: {t(`estimator.chat.milkOptions.${item.answers.milk}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.health')}: {t(`estimator.health.${item.answers.health}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.location')}: {t(`estimator.chat.districtOptions.${item.answers.district}`)}</AppText>
              </View>
            );
          }
          if (item.isResultCard) {
            return (
              <View style={styles.resultContainer}>
                <PriceCard minPrice={item.result.minPrice} expectedPrice={item.result.expectedPrice} premiumPrice={item.result.premiumPrice} />
                <ConfidenceMeter score={item.result.confidenceScore} />
                <MarketTrendCard demand={item.result.demand} suggestions={item.result.suggestions} />
                <TouchableOpacity style={styles.resetBtn} onPress={handlePressRestart}>
                  <AppText style={styles.resetBtnText}>{t('estimator.actions.recalculate')}</AppText>
                </TouchableOpacity>
              </View>
            );
          }
          const isBot = item.sender === 'bot';
          return (
            <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
              <AppText style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>{item.text}</AppText>
            </View>
          );
        }}
        ListFooterComponent={() => (
          <View style={{ paddingVertical: 8 }}>
            {isTyping && <TypingIndicator />}
            {analyzing && (
              <View style={styles.analyzingRow}>
                <ActivityIndicator size="small" color="#16A34A" style={{ marginRight: 8 }} />
                <AppText style={styles.analyzingText}>{t('estimator.chat.analyzing')}</AppText>
              </View>
            )}
          </View>
        )}
      />

      {/* Options Footer or Completion Notice */}
      {options.length > 0 && !isTyping ? (
        <View style={styles.optionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionBtn} onPress={() => handleSelectOption(opt)}>
                <AppText style={styles.optionBtnText}>{activeQ.getOptionLabel(opt, t, answers)}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : isComplete ? (
        <View style={styles.completedNoticeContainer}>
          <MaterialCommunityIcons name="information" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <AppText style={styles.completedNoticeText}>
            {t('estimator.chat.completedNotice')}
          </AppText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export default function BidScreen() {
  const [sessionKey, setSessionKey] = useState(0);
  const handleRestart = () => setSessionKey(prev => prev + 1);
  return <MarketPriceChatAssistant key={sessionKey} onRestart={handleRestart} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },
  header: {
    height: 64,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  restartHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressText: { fontSize: 12, fontWeight: '700', color: '#16A34A', marginBottom: 6 },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 3 },
  listContent: { padding: 16, paddingBottom: 170 },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dateSeparatorText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginVertical: 4, maxWidth: '82%' },
  botBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleText: { fontSize: 14.5, lineHeight: 20 },
  botText: { color: '#0F172A' },
  userText: { color: '#0F172A' },
  optionsContainer: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  optionsScroll: { paddingHorizontal: 16 },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  optionBtnText: { fontSize: 13.5, fontWeight: '700', color: '#16A34A' },
  summaryCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#16A34A', padding: 16, width: '90%' },
  summaryTitle: { fontSize: 14.5, fontWeight: '800', color: '#16A34A', marginBottom: 8 },
  summaryText: { fontSize: 13, color: '#334155', marginVertical: 2 },
  analyzingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginVertical: 8 },
  analyzingText: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  resultContainer: { marginVertical: 12, width: '100%' },
  resetBtn: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  resetBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  completedNoticeContainer: {
    position: 'absolute',
    bottom: 82,
    left: 16,
    right: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  completedNoticeText: { fontSize: 12.5, color: '#B45309', fontWeight: '600', textAlign: 'center' }
});
