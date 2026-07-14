import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../AppText';

export default function VoiceInputModal({ visible, onClose, onSpeechEnd }) {
  const pulseVal = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseVal, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseVal, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseVal.setValue(1);
    }
  }, [visible, pulseVal]);

  const simulateSpeech = () => {
    // Mock transcription output after 3 seconds
    setTimeout(() => {
      onSpeechEnd("How to increase daily milk production?");
    }, 2200);
  };

  useEffect(() => {
    if (visible) {
      simulateSpeech();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText style={styles.title}>Listening...</AppText>
          <AppText style={styles.subtitle}>Speak clearly in Hindi, Marathi, or English</AppText>
          
          <View style={styles.animationContainer}>
            <Animated.View style={[
              styles.pulseCircle,
              { transform: [{ scale: pulseVal }] }
            ]} />
            <View style={styles.micCircle}>
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            </View>
          </View>

          <AppText style={styles.statusText}>Try saying: "How to increase milk yield"</AppText>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <AppText style={styles.cancelText}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 35,
  },
  animationContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pulseCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  micCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  statusText: {
    fontSize: 12.5,
    color: '#8B5CF6',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    fontSize: 14.5,
    color: '#EF4444',
    fontWeight: '700',
  }
});
