// FeedPlannerScreen.js
// Premium WhatsApp-style Guided Feed Planner Chatbot for Maharashtra dairy farmers.

import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import CustomHeader from '../../components/CustomHeader';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';
import { usePremium } from '../../hooks/usePremium';
import { AppContext } from '../../context/AppContext';
import { verificationApi } from '../../api/verificationApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { REFRESH_EVENTS } from '../../services/refreshManager';
import { useNavigation } from '@react-navigation/native';
import { hasFeatureAccess } from '../../utils/featureAccess';
import { feedPlannerService } from '../../services/feedPlannerService';
import TypingIndicator from '../../chatbot/components/TypingIndicator';

const QUESTIONS = [
  {
    id: 'animal',
    questionKey: 'feedPlanner.chat.qAnimal',
    getOptions: () => ['cow', 'buffalo'],
    getOptionLabel: (opt, t) => t(`feedPlanner.animal.${opt}`)
  },
  {
    id: 'breed',
    questionKey: 'feedPlanner.chat.qBreed',
    getOptions: (answers) => answers.animal === 'buffalo' 
      ? ['murrah', 'mehsana', 'surti', 'pandharpuri', 'local', 'other']
      : ['jersey', 'hf', 'gir', 'sahiwal', 'desi', 'other'],
    getOptionLabel: (opt, t, answers) => t(`feedPlanner.breeds.${answers.animal}.${opt}`)
  },
  {
    id: 'weight',
    questionKey: 'feedPlanner.chat.qWeight',
    getOptions: () => ['lt_300', 'w300_400', 'w400_500', 'gt_500'],
    getOptionLabel: (opt, t) => t(`feedPlanner.options.weight.${opt}`)
  },
  {
    id: 'milk',
    questionKey: 'feedPlanner.chat.qMilk',
    getOptions: () => ['dry', 'm5_10', 'm10_15', 'm15_20', 'gt_20'],
    getOptionLabel: (opt, t) => t(`feedPlanner.options.milk.${opt}`)
  },
  {
    id: 'pregnant',
    questionKey: 'feedPlanner.chat.qPregnant',
    getOptions: () => ['yes', 'no'],
    getOptionLabel: (opt, t) => t(`feedPlanner.options.pregnant.${opt}`)
  },
  {
    id: 'goal',
    questionKey: 'feedPlanner.chat.qGoal',
    getOptions: () => ['inc_milk', 'gain_wt', 'maintenance', 'preg_support'],
    getOptionLabel: (opt, t) => t(`feedPlanner.options.goal.${opt}`)
  },
  {
    id: 'green',
    questionKey: 'feedPlanner.chat.qGreen',
    getOptions: () => ['yes', 'no'],
    getOptionLabel: (opt, t) => t(`feedPlanner.options.green.${opt}`)
  }
];

function FeedPlannerChatAssistant({ onRestart, onClose }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { userProfile } = useContext(AppContext);
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [globalUnlock, setGlobalUnlock] = useState(false);

  const fetchUnlockSettings = async () => {
    try {
      const res = await verificationApi.getSettings();
      const fpUnlock = res?.feedPlannerGlobalUnlock ?? res?.data?.settings?.feedPlannerGlobalUnlock;
      if (fpUnlock !== undefined) {
        setGlobalUnlock(!!fpUnlock);
      }
    } catch (err) {
      console.warn('[FeedPlannerScreen] Error fetching unlock settings:', err.message);
    }
  };

  useAutoRefresh(
    () => fetchUnlockSettings(),
    {
      events: [REFRESH_EVENTS.VERIFICATION_UPDATED],
      screenKey: 'FeedPlannerScreen'
    }
  );

  useEffect(() => {
    setIsTyping(true);
    timerRef.current = setTimeout(() => {
      setIsTyping(false);
      setMessages([{ id: 'greeting', sender: 'bot', text: t('feedPlanner.chat.qAnimal') }]);
    }, 600);

    fetchUnlockSettings();

    return () => timerRef.current && clearTimeout(timerRef.current);
  }, []);

  const hasAccess = hasFeatureAccess(userProfile, { feedPlannerGlobalUnlock: globalUnlock }, 'feedPlanner');
  const isComplete = currentQuestionIndex >= QUESTIONS.length || messages.some(m => m.isResultCard || m.id === 'locked_note');

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
          text: t(nextQ.questionKey, { animal: t(`feedPlanner.animal.${nextAnswers.animal}`) })
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
          const feedResult = feedPlannerService.calculateFeedPlan(nextAnswers);
          setMessages(prev => [...prev, {
            id: 'result',
            sender: 'bot',
            isResultCard: true,
            result: feedResult
          }]);
        }, 1500);
      }, 800);
    }
  };

  const handlePressRestart = () => {
    if (Platform.OS === 'web') {
      const confirmText = `${t('feedPlanner.chat.restartTitle', { defaultValue: 'Restart Feed Planner Assistant?' })}\n\n${t('feedPlanner.chat.restartMessage', { defaultValue: 'All answers, history, and generated recipe will be cleared.' })}`;
      if (window.confirm(confirmText)) onRestart();
    } else {
      Alert.alert(
        t('feedPlanner.chat.restartTitle', { defaultValue: 'Restart Feed Planner Assistant?' }),
        t('feedPlanner.chat.restartMessage', { defaultValue: 'All answers, history, and generated recipe will be cleared.' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('estimator.actions.restart'), style: 'destructive', onPress: onRestart }
        ]
      );
    }
  };

  const activeQ = QUESTIONS[currentQuestionIndex];
  const options = (currentQuestionIndex < QUESTIONS.length && !analyzing && !isComplete) ? activeQ.getOptions(answers) : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Enterprise Status Badge using CustomHeader */}
      <CustomHeader
        title={t('feedPlanner.title')}
        subtitle={isTyping || analyzing ? t('common.loading') : t('common.online')}
        leftComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {onClose ? (
              <TouchableOpacity style={{ marginRight: 8, padding: 4 }} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="sprout" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.onlineDot} />
            </View>
          </View>
        }
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.headerStatusPill, hasAccess ? styles.pillUnlocked : styles.pillLocked]}>
              <MaterialCommunityIcons
                name={hasAccess ? 'lock-open-variant' : 'lock'}
                size={11}
                color={hasAccess ? '#059669' : '#DC2626'}
                style={{ marginRight: 3 }}
              />
              <AppText style={[styles.headerStatusPillText, { color: hasAccess ? '#059669' : '#DC2626' }]}>
                {hasAccess ? t('common.available', { defaultValue: 'Available' }) : t('common.premium', { defaultValue: 'Premium' })}
              </AppText>
            </View>

            <TouchableOpacity style={styles.restartBtn} onPress={handlePressRestart} aria-label="Restart feed planner">
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
        centered={false}
        backgroundColor="#16A34A"
        textColor="#FFFFFF"
        iconColor="#FFFFFF"
        showBorder={false}
        safeArea={false}
        style={{
          height: 64, // Chat-specific taller header height
        }}
      />

      <View style={styles.progressContainer}>
        <AppText style={styles.progressText}>
          {t('estimator.steps.header', { current: Math.min(7, currentQuestionIndex + 1) })}
        </AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(Math.min(7, currentQuestionIndex + 1) / 7) * 100}%` }]} />
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={() => (
          <View style={styles.dateSeparator}>
            <AppText style={styles.dateText}>{t('common.today')}</AppText>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.isSummaryCard) {
            return (
              <View style={[styles.bubble, styles.botBubble, styles.summaryCard]}>
                <AppText style={styles.summaryTitle}>{t('feedPlanner.chat.summaryCard')}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.selectAnimal')}: {t(`feedPlanner.animal.${item.answers.animal}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.selectBreed')}: {t(`feedPlanner.breeds.${item.answers.animal}.${item.answers.breed}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.weight')}: {t(`feedPlanner.options.weight.${item.answers.weight}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.steps.milkProduction')}: {t(`feedPlanner.options.milk.${item.answers.milk}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('estimator.chat.qPregnant', { animal: '' }).replace('?', '')}: {t(`feedPlanner.options.pregnant.${item.answers.pregnant}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('feedPlanner.chat.qGoal')}: {t(`feedPlanner.options.goal.${item.answers.goal}`)}</AppText>
                <AppText style={styles.summaryText}>• {t('feedPlanner.chat.greenFodder')}: {t(`feedPlanner.options.green.${item.answers.green}`)}</AppText>
              </View>
            );
          }
          if (item.isResultCard) {
            return <ResultCard result={item.result} onRecalculate={handlePressRestart} />;
          }
          const isBot = item.sender === 'bot';
          return (
            <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
              <AppText style={styles.bubbleText}>{item.text}</AppText>
            </View>
          );
        }}
        ListFooterComponent={() => (
          <View style={{ paddingVertical: 8 }}>
            {isTyping && <TypingIndicator />}
            {analyzing && (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="small" color="#16A34A" style={{ marginRight: 8 }} />
                <AppText style={styles.analyzingText}>{t('feedPlanner.chat.generating')}</AppText>
              </View>
            )}
          </View>
        )}
      />

      {options.length > 0 && !isTyping ? (
        <View style={styles.optionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionChip} onPress={() => handleSelectOption(opt)}>
                <AppText style={styles.optionChipText}>{activeQ.getOptionLabel(opt, t, answers)}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : isComplete ? (
        <View style={styles.completedNotice}>
          <MaterialCommunityIcons name="information" size={16} color="#B45309" style={{ marginRight: 6 }} />
          <AppText style={styles.completedText}>{t('feedPlanner.chat.completedNotice')}</AppText>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ResultCard({ result, onRecalculate }) {
  const { t } = useTranslation();
  return (
    <View style={styles.resCard}>
      <AppText style={styles.resHeader}>{t('feedPlanner.chat.resultsTitle')}</AppText>
      
      {[
        { label: t('feedPlanner.chat.greenFodder'), val: `${result.greenFodder} kg` },
        { label: t('feedPlanner.chat.dryFodder'), val: `${result.dryFodder} kg` },
        { label: t('feedPlanner.chat.concentrate'), val: `${result.concentrate} kg` },
        { label: t('feedPlanner.chat.cottonSeedCake'), val: `${result.cottonSeedCake} kg` },
        { label: t('feedPlanner.chat.mineralMixture'), val: `${result.mineralMixture} g` },
        { label: t('feedPlanner.chat.salt'), val: `${result.salt} g` },
        { label: t('feedPlanner.chat.water'), val: `${result.water} L` }
      ].map((item, index) => (
        <View key={index} style={styles.resRow}>
          <AppText style={styles.resLabel}>{item.label}</AppText>
          <AppText style={styles.resVal}>{item.val}</AppText>
        </View>
      ))}

      <View style={styles.costBox}>
        <AppText style={styles.costVal}>{t('feedPlanner.chat.dailyCost')}: ₹{result.dailyCost}</AppText>
        <AppText style={styles.costValSub}>{t('feedPlanner.chat.monthlyCost')}: ₹{result.monthlyCost}</AppText>
      </View>

      {result.milkImprovement > 0 && (
        <View style={styles.yieldBox}>
          <MaterialCommunityIcons name="trending-up" size={18} color="#16A34A" />
          <AppText style={styles.yieldText}>{t('feedPlanner.chat.milkImprovement')}: +{result.milkImprovement} L/day</AppText>
        </View>
      )}

      <AppText style={styles.confidence}>AI Confidence: {result.confidenceScore}%</AppText>

      {result.tips.length > 0 && (
        <View style={styles.block}>
          <AppText style={styles.blockTitle}>{t('feedPlanner.chat.tipsTitle')}</AppText>
          {result.tips.map((tip, i) => (
            <AppText key={i} style={styles.blockText}>• {t(tip, { defaultValue: tip })}</AppText>
          ))}
        </View>
      )}

      {result.warnings.length > 0 && (
        <View style={styles.block}>
          <AppText style={styles.blockTitleWarn}>{t('feedPlanner.chat.warningsTitle')}</AppText>
          {result.warnings.map((warn, i) => (
            <AppText key={i} style={styles.blockTextWarn}>⚠ {t(warn, { defaultValue: warn })}</AppText>
          ))}
        </View>
      )}

      <AppText style={styles.maharashtraNote}>{t('feedPlanner.chat.maharashtraNote')}</AppText>

      <TouchableOpacity style={styles.recalcBtn} onPress={onRecalculate}>
        <AppText style={styles.recalcText}>{t('estimator.actions.recalculate')}</AppText>
      </TouchableOpacity>
    </View>
  );
}

export default function FeedPlannerScreen({ onClose }) {
  const [sessionKey, setSessionKey] = useState(0);
  const handleRestart = () => setSessionKey(prev => prev + 1);
  return <FeedPlannerChatAssistant key={sessionKey} onRestart={handleRestart} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DDD5' },

  avatarContainer: { position: 'relative', marginRight: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
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

  restartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressText: { fontSize: 12, fontWeight: '700', color: '#16A34A', marginBottom: 6 },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 3 },
  chatList: { padding: 16, paddingBottom: 170 },
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
  dateText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
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
  bubbleText: { fontSize: 14.5, lineHeight: 20, color: '#0F172A' },
  summaryCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#16A34A', padding: 16, width: '90%' },
  summaryTitle: { fontSize: 14.5, fontWeight: '800', color: '#16A34A', marginBottom: 8 },
  summaryText: { fontSize: 13, color: '#334155', marginVertical: 2 },
  analyzingBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginVertical: 8 },
  analyzingText: { fontSize: 14, color: '#16A34A', fontWeight: '600' },
  optionsContainer: { position: 'absolute', bottom: 82, left: 0, right: 0, paddingVertical: 12 },
  optionsScroll: { paddingHorizontal: 16 },
  optionChip: {
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
  optionChipText: { fontSize: 13.5, fontWeight: '700', color: '#16A34A' },
  completedNotice: {
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
  },
  completedText: { fontSize: 12.5, color: '#B45309', fontWeight: '600' },
  resCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#16A34A',
    width: '100%',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  resHeader: { fontSize: 15.5, fontWeight: '800', color: '#16A34A', marginBottom: 12 },
  resRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  resLabel: { fontSize: 13.5, color: '#475569' },
  resVal: { fontSize: 13.5, fontWeight: '700', color: '#0F172A' },
  costBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginVertical: 12, alignItems: 'center' },
  costVal: { fontSize: 14.5, fontWeight: '800', color: '#16A34A' },
  costValSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  yieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 10, borderRadius: 8, marginVertical: 6 },
  yieldText: { fontSize: 13.5, color: '#16A34A', fontWeight: '700', marginLeft: 6 },
  confidence: { fontSize: 12, color: '#64748B', textAlign: 'center', marginVertical: 6 },
  block: { marginTop: 12 },
  blockTitle: { fontSize: 13.5, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  blockTitleWarn: { fontSize: 13.5, fontWeight: '700', color: '#DC2626', marginBottom: 4 },
  blockText: { fontSize: 12.5, color: '#475569', lineHeight: 18 },
  blockTextWarn: { fontSize: 12.5, color: '#DC2626', lineHeight: 18 },
  maharashtraNote: { fontSize: 11.5, color: '#64748B', textAlign: 'center', marginTop: 14 },
  recalcBtn: { backgroundColor: '#16A34A', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  recalcText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  pillLocked: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  pillUnlocked: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  headerStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
  }
});
