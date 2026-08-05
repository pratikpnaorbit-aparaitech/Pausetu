import React, { useEffect } from 'react';
import { StyleSheet, View, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePremium } from '../../hooks/usePremium';
import GuidedChatScreen from '../../chatbot/screens/GuidedChatScreen';

export default function PremiumAdvisorContainer({ visible, onClose }) {
  const navigation = useNavigation();
  const { isPremium, loading, checkPremiumStatus } = usePremium();

  useEffect(() => {
    if (visible) {
      checkPremiumStatus(false);
    }
  }, [visible]);

  const handleShowPayment = () => {
    if (onClose) onClose();
    navigation.navigate('Subscription');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      );
    }

    return (
      <GuidedChatScreen
        onClose={onClose}
        isPremium={isPremium}
        onShowPayment={handleShowPayment}
      />
    );
  };

  return (
    <Modal
      visible={Boolean(visible)}
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

