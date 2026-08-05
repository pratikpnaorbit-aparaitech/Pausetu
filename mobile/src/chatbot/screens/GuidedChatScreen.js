import React, { useEffect, useState, useRef, useContext } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../../components/AppText';
import { AppContext } from '../../context/AppContext';
import { useChatEngine } from '../engine/ChatEngine';
import { chatbotService } from '../services/chatbotService';
import BotMessage from '../components/BotMessage';
import UserMessage from '../components/UserMessage';
import OptionButtons from '../components/OptionButtons';
import TypingIndicator from '../components/TypingIndicator';
import ProgressIndicator from '../components/ProgressIndicator';
import SummaryCard from '../components/SummaryCard';
import ChatHeader from '../components/ChatHeader';
import FeedPlannerScreen from '../../screens/PremiumAdvisor/FeedPlannerScreen';

import { useNavigation } from '@react-navigation/native';
import { hasFeatureAccess } from '../../utils/featureAccess';

export default function GuidedChatScreen({ onClose, isPremium, onShowPayment }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedFlowId, setSelectedFlowId] = useState(null);
  const flows = chatbotService.getFlows();

  const {
    messages,
    currentStep,
    isTyping,
    isComplete,
    startFlow,
    selectOption,
    getAnswers,
    getProgress
  } = useChatEngine(flows, selectedFlowId, t);

  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isTyping]);

  const { userProfile } = useContext(AppContext);

  const handleStartFlow = (flowId) => {
    const accessAllowed = isPremium || hasFeatureAccess(userProfile, null, 'aiAdvisor');
    if (!accessAllowed) {
      if (onShowPayment) onShowPayment();
      return;
    }
    if (flowId === 'marketPrice') {
      if (onClose) onClose();
      navigation.navigate('MainApp', { screen: 'Bid' });
      return;
    }
    setSelectedFlowId(flowId);
    startFlow(flowId);
  };

  const handleRestart = () => {
    setSelectedFlowId(null);
  };

  const renderItem = ({ item }) => {
    if (item.role === 'bot') {
      return <BotMessage message={item} />;
    }
    return <UserMessage message={item} />;
  };

  if (selectedFlowId === 'feedPlanner') {
    return <FeedPlannerScreen onClose={handleRestart} />;
  }

  if (!selectedFlowId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>
            {t('premiumAdvisor.chatbot.title', { defaultValue: 'AI Pashu Advisor' })}
          </AppText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.flowPickerContainer}>
          <AppText style={styles.pickerTitle}>
            {t('premiumAdvisor.guidedChat.selectTopic', { defaultValue: 'Select guided topic to begin:' })}
          </AppText>

          {Object.values(flows).map((flow) => (
            <TouchableOpacity
              key={flow.id}
              style={styles.flowCard}
              onPress={() => handleStartFlow(flow.id)}
              activeOpacity={0.8}
            >
              <View style={styles.flowIconBox}>
                <Ionicons 
                  name={flow.id === 'feedPlanner' ? 'restaurant-outline' : (flow.id === 'marketPrice' ? 'cash-outline' : (flow.id === 'diseaseChecker' ? 'shield-checkmark-outline' : (flow.id === 'breedingAdvisor' ? 'git-branch-outline' : 'calendar-outline')))} 
                  size={22} 
                  color="#8B5CF6" 
                />
              </View>
              <View style={styles.flowDetails}>
                <AppText style={styles.flowName}>
                  {t(flow.titleKey, { defaultValue: flow.id })}
                </AppText>
                <AppText style={styles.flowDesc}>
                  {t(`premiumAdvisor.guidedChat.flows.${flow.id}.desc`, { defaultValue: `Guided advisor helper for ${flow.id}` })}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ChatHeader 
        title={t(flows[selectedFlowId]?.titleKey || '', { defaultValue: selectedFlowId })} 
        onClose={handleRestart} 
      />
      
      <ProgressIndicator progress={getProgress()} />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => {
          if (isTyping) {
            return <TypingIndicator />;
          }
          if (isComplete) {
            if (isPremium) {
              return <SummaryCard answers={getAnswers()} onRestart={handleRestart} />;
            } else {
              return (
                <View style={styles.lockContainer}>
                  <Ionicons name="lock-closed" size={44} color="#D97706" />
                  <AppText style={styles.lockTitle}>
                    {t('premiumAdvisor.guidedChat.premiumRequired', { defaultValue: 'Premium Advisor Required' })}
                  </AppText>
                  <AppText style={styles.lockDesc}>
                    {t('premiumAdvisor.guidedChat.premiumRequiredDesc', { defaultValue: 'Upgrade to premium membership to unlock your generated report and suggestions.' })}
                  </AppText>
                  <TouchableOpacity style={styles.payBtn} onPress={onShowPayment} activeOpacity={0.8}>
                    <AppText style={styles.payBtnText}>
                      {t('premiumAdvisor.membership.goPremiumBtn', { defaultValue: 'Go Premium' })}
                    </AppText>
                  </TouchableOpacity>
                </View>
              );
            }
          }
          return null;
        }}
      />

      {currentStep && (
        <OptionButtons 
          options={currentStep.options} 
          onSelect={selectOption} 
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  flowPickerContainer: {
    padding: 16,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  flowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  flowIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flowDetails: {
    flex: 1,
  },
  flowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  flowDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  listContent: {
    paddingVertical: 12,
  },
  lockContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78350F',
    marginTop: 10,
    marginBottom: 6,
  },
  lockDesc: {
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  payBtn: {
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  }
});
