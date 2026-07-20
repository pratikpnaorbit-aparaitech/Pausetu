import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Image, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AppText from '../../components/AppText';
import { usePremium } from '../../hooks/usePremium';
import { SUGGESTED_QUESTIONS_KEYS } from '../../constants/premiumConstants';
import TypingAnimation from '../../components/PremiumAdvisor/TypingAnimation';
import VoiceInputModal from '../../components/PremiumAdvisor/VoiceInputModal';

export default function PremiumAdvisorChatScreen({ onClose }) {
  const { t } = useTranslation();
  const {
    chatMessages, chatLoading, chatSessions, activeSessionId, activeSessionTitle,
    loadChatSessions, loadSessionMessages, sendMessage, startNewChat, clearSession
  } = usePremium();

  const [inputVal, setInputVal] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);

  const flatListRef = useRef(null);

  // Load chat sessions on mount
  useEffect(() => {
    loadChatSessions();
  }, [loadChatSessions]);

  // Autoscroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages, chatLoading]);

  const handleSend = () => {
    if (!inputVal.trim() && !attachedImage) return;
    sendMessage(inputVal, attachedImage);
    setInputVal('');
    setAttachedImage(null);
  };

  const handleSuggestionPress = (suggestKey) => {
    sendMessage(t(suggestKey));
  };

  const handleSelectSession = (sessionId) => {
    loadSessionMessages(sessionId);
    setShowSessions(false);
  };

  const handleTriggerVoice = () => {
    setShowVoiceModal(true);
  };

  const handleVoiceTranscribed = (text) => {
    setShowVoiceModal(false);
    sendMessage(text);
  };

  const handleAttachImage = async () => {
    // Only attempt image picker if running on native — web has limited support
    if (Platform.OS === 'web') {
      Alert.alert(t('premiumAdvisor.chat.photoAttached'), t('premiumAdvisor.chat.noImagePicker'));
      return;
    }
    try {
      const { launchImageLibraryAsync, MediaType, requestMediaLibraryPermissionsAsync } = await import('expo-image-picker');
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permissionDenied'), t('common.cameraPermissionMsg'));
        return;
      }
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaType.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedImage(result.assets[0].uri);
        Alert.alert(t('premiumAdvisor.chat.photoAttached'), t('premiumAdvisor.chat.photoAttachedDesc'));
      }
    } catch {
      Alert.alert(t('premiumAdvisor.chat.photoAttached'), t('premiumAdvisor.chat.noImagePicker'));
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages in this session?",
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: () => clearSession(), style: 'destructive' }
      ]
    );
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleWrapper, isUser ? styles.bubbleUserWrapper : styles.bubbleAiWrapper]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
        )}
        
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.bubbleImage} resizeMode="cover" />
          )}
          
          <AppText style={[styles.bubbleText, isUser ? styles.bubbleUserText : styles.bubbleAiText]}>
            {item.message}
          </AppText>
          
          <AppText style={[styles.bubbleTime, isUser ? styles.bubbleUserTime : styles.bubbleAiTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <AppText style={styles.headerTitle}>
            {t('premiumAdvisor.chatbot.title')}
          </AppText>
          <AppText style={styles.headerStatus}>
            👑 {t('premiumAdvisor.membership.activeStatus')}
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowSessions(!showSessions)}>
            <Ionicons name="chatbubbles-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={handleClearHistory} disabled={!activeSessionId}>
            <Ionicons name="trash-outline" size={22} color={activeSessionId ? "#EF4444" : "#CBD5E1"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Session selector dropdown list overlay */}
      {showSessions && (
        <View style={styles.sessionsDropdown}>
          <View style={styles.sessionDropdownHeader}>
            <AppText style={styles.sessionDropdownTitle}>{t('premiumAdvisor.suggestions.title')}</AppText>
            <TouchableOpacity style={styles.newChatBtn} onPress={() => { startNewChat(); setShowSessions(false); }}>
              <Ionicons name="add-circle-outline" size={16} color="#8B5CF6" />
              <AppText style={styles.newChatText}>New Chat</AppText>
            </TouchableOpacity>
          </View>
          {chatSessions.length === 0 ? (
            <AppText style={styles.emptySessionText}>No past conversations found</AppText>
          ) : (
            <ScrollView style={{ maxHeight: 180 }}>
              {chatSessions.map((session) => (
                <TouchableOpacity
                  key={session._id}
                  style={[styles.sessionRow, activeSessionId === session._id && styles.sessionRowActive]}
                  onPress={() => handleSelectSession(session._id)}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#64748B" style={{ marginRight: 8 }} />
                  <AppText style={styles.sessionTitle} numberOfLines={1}>
                    {session.title}
                  </AppText>
                  <Ionicons name="chevron-forward" size={12} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Chat message thread */}
        {chatMessages.length === 0 ? (
          <ScrollView contentContainerStyle={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color="#C084FC" />
            </View>
            <AppText style={styles.emptyTitle}>
              {t('premiumAdvisor.chatbot.emptyTitle')}
            </AppText>
            <AppText style={styles.emptyDesc}>
              {t('premiumAdvisor.chatbot.emptyDesc')}
            </AppText>

            {/* Suggestions buttons */}
            <View style={styles.suggestionsContainer}>
              <AppText style={styles.suggestionsTitle}>
                {t('premiumAdvisor.suggestions.title')}
              </AppText>
              {SUGGESTED_QUESTIONS_KEYS.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.suggestCard}
                  onPress={() => handleSuggestionPress(s.key)}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.suggestText}>{t(s.key)}</AppText>
                  <Ionicons name="chevron-forward" size={14} color="#8B5CF6" />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={chatMessages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.chatList}
            ListFooterComponent={chatLoading ? (
              <View style={styles.aiTypingContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.aiTypingBubble}>
                  <TypingAnimation />
                </View>
              </View>
            ) : null}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          {attachedImage && (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: attachedImage }} style={styles.previewImageThumb} />
              <TouchableOpacity style={styles.clearImageBtn} onPress={() => setAttachedImage(null)}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.actionInputBtn} onPress={handleAttachImage}>
              <Ionicons name="image-outline" size={22} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionInputBtn} onPress={handleTriggerVoice}>
              <Ionicons name="mic-outline" size={22} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={inputVal}
              onChangeText={setInputVal}
              placeholder={t('premiumAdvisor.chatbot.placeholder')}
              placeholderTextColor="#94A3B8"
              multiline
            />

            <TouchableOpacity 
              style={[styles.sendBtn, (!inputVal.trim() && !attachedImage) && styles.sendBtnDisabled]} 
              onPress={handleSend}
              disabled={!inputVal.trim() && !attachedImage}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Voice Assistant UI animation */}
      <VoiceInputModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSpeechEnd={handleVoiceTranscribed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerStatus: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 8,
  },
  sessionsDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    zIndex: 99,
    elevation: 4,
  },
  sessionDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingBottom: 8,
  },
  sessionDropdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B5CF6',
    marginLeft: 4,
  },
  emptySessionText: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#F1F5F9',
  },
  sessionRowActive: {
    backgroundColor: '#FAF5FF',
  },
  sessionTitle: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
  },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  suggestText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginRight: 10,
  },
  chatList: {
    padding: 16,
    paddingBottom: 24,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 8,
    width: '100%',
  },
  bubbleUserWrapper: {
    justifyContent: 'flex-end',
  },
  bubbleAiWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: '75%',
  },
  bubbleUser: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  bubbleImage: {
    width: 180,
    height: 120,
    borderRadius: 10,
    marginBottom: 6,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleUserText: {
    color: '#FFFFFF',
  },
  bubbleAiText: {
    color: '#1E293B',
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleAiTime: {
    color: '#94A3B8',
  },
  aiTypingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  aiTypingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderBottomLeftRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  previewImageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImageThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  clearImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionInputBtn: {
    padding: 6,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 13.5,
    color: '#0F172A',
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  }
});
