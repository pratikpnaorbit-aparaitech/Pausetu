import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import { usePremium } from '../../hooks/usePremium';
import PremiumAdvisorLockScreen from './PremiumAdvisorLockScreen';
import PremiumAdvisorPaymentScreen from './PremiumAdvisorPaymentScreen';
import GuidedChatScreen from '../../chatbot/screens/GuidedChatScreen';

export default function PremiumAdvisorContainer({ visible, onClose }) {
  const { isPremium, loading, checkPremiumStatus } = usePremium();
  const [currentScreen, setCurrentScreen] = useState('chat'); // 'lock' | 'payment' | 'chat'

  // Sync premium status when the container becomes visible
  useEffect(() => {
    if (visible) {
      checkPremiumStatus(true).then(() => {
        setCurrentScreen('chat');
      });
    }
  }, [visible, checkPremiumStatus]);

  const handlePaymentSuccess = () => {
    checkPremiumStatus(true).then(() => {
      setCurrentScreen('chat');
    });
  };

  const handleBackToLock = () => {
    setCurrentScreen('chat');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      );
    }

    switch (currentScreen) {
      case 'lock':
        return (
          <PremiumAdvisorLockScreen
            onUnlock={() => setCurrentScreen('payment')}
            onClose={onClose}
          />
        );
      case 'payment':
        return (
          <PremiumAdvisorPaymentScreen
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBackToLock}
          />
        );
      case 'chat':
        return (
          <GuidedChatScreen
            onClose={onClose}
            isPremium={isPremium}
            onShowPayment={() => setCurrentScreen('payment')}
          />
        );
      default:
        return (
          <GuidedChatScreen
            onClose={onClose}
            isPremium={isPremium}
            onShowPayment={() => setCurrentScreen('payment')}
          />
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {renderContent()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
