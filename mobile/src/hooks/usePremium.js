import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { premiumApi } from '../api/premiumApi';
import { AppContext } from '../context/AppContext';

export const usePremium = () => {
  const { userProfile, refreshProfileData, userToken } = useContext(AppContext);
  const [isPremium, setIsPremium] = useState(Boolean(userProfile?.isPremium));
  const [premiumExpiresAt, setPremiumExpiresAt] = useState(userProfile?.premiumExpiresAt || null);
  const [loading, setLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Sync premium status directly whenever userProfile changes
  useEffect(() => {
    setIsPremium(Boolean(userProfile?.isPremium));
    setPremiumExpiresAt(userProfile?.premiumExpiresAt || null);
    setLoading(false);
  }, [userProfile?.isPremium, userProfile?.premiumExpiresAt]);

  // Stable check function that does NOT recreate itself endlessly
  const checkPremiumStatus = useCallback(async (forceFetch = false) => {
    if (!userToken || userToken === 'guest') {
      setIsPremium(false);
      setLoading(false);
      return;
    }
    if (forceFetch && refreshProfileData) {
      setLoading(true);
      try {
        await refreshProfileData();
      } catch (err) {
        console.warn('[usePremium] Failed to check status:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setIsPremium(Boolean(userProfile?.isPremium));
      setLoading(false);
    }
  }, [userToken, refreshProfileData, userProfile?.isPremium]);

  // Fetch all chat history / sessions list safely
  const loadChatSessions = useCallback(async () => {
    if (!userToken || userToken === 'guest') {
      setChatSessions([]);
      return;
    }
    try {
      const res = await premiumApi.getChatHistory();
      if (res?.status === 'success' && res.data) {
        setChatSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.warn('[usePremium] Failed to load chat sessions:', err.message);
    }
  }, [userToken]);

  // Fetch messages for a specific session safely
  const loadSessionMessages = useCallback(async (sessionId) => {
    if (!sessionId || !userToken || userToken === 'guest') return;
    setChatLoading(true);
    try {
      const res = await premiumApi.getChatHistory(sessionId);
      if (res?.status === 'success' && res.data) {
        setChatMessages(res.data.messages || []);
        setActiveSessionId(sessionId);
        const matchingSession = chatSessions.find(s => s._id === sessionId);
        if (matchingSession) {
          setActiveSessionTitle(matchingSession.title);
        }
      }
    } catch (err) {
      console.error('[usePremium] Failed to load session messages:', err.message);
    } finally {
      setChatLoading(false);
    }
  }, [chatSessions, userToken]);

  // Send message
  const sendMessage = async (text, imageUrl = null) => {
    if (!text && !imageUrl) return;
    setChatLoading(true);
    
    // Add user message optimistically to UI
    const tempUserMessage = {
      _id: `temp_u_${Date.now()}`,
      role: 'user',
      message: text,
      imageUrl: imageUrl,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, tempUserMessage]);

    try {
      const res = await premiumApi.sendChatMessage(text, activeSessionId, activeSessionTitle || null, imageUrl);
      if (res?.status === 'success' && res.data) {
        const { sessionId, sessionTitle, aiMessage } = res.data;
        
        // Update active session metadata
        if (!activeSessionId) {
          setActiveSessionId(sessionId);
          setActiveSessionTitle(sessionTitle);
        }
        
        // Replace user message with db record and add AI response
        setChatMessages(prev => {
          const filtered = prev.filter(m => m._id !== tempUserMessage._id);
          return [...filtered, res.data.userMessage || tempUserMessage, aiMessage];
        });

        // Refresh sessions list in background
        loadChatSessions();
      }
    } catch (err) {
      // Add error message indicator
      const errorMsg = {
        _id: `temp_err_${Date.now()}`,
        role: 'assistant',
        message: 'Error: Could not connect to AI. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Clear messages or sessions
  const clearSession = async (sessionId = null) => {
    const target = sessionId || activeSessionId;
    if (!target) return;
    try {
      await premiumApi.clearChatHistory(target);
      if (target === activeSessionId) {
        setChatMessages([]);
        setActiveSessionId(null);
        setActiveSessionTitle('');
      }
      loadChatSessions();
    } catch (err) {
      console.error('[usePremium] Failed to clear history:', err.message);
    }
  };

  // Start new chat thread
  const startNewChat = () => {
    setChatMessages([]);
    setActiveSessionId(null);
    setActiveSessionTitle('');
  };

  return {
    isPremium,
    premiumExpiresAt,
    loading,
    chatSessions,
    activeSessionId,
    activeSessionTitle,
    chatMessages,
    chatLoading,
    checkPremiumStatus,
    loadChatSessions,
    loadSessionMessages,
    sendMessage,
    clearSession,
    startNewChat
  };
};

