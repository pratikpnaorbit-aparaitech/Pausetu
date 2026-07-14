import { useState, useEffect, useCallback, useContext } from 'react';
import { premiumApi } from '../api/premiumApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';

export const usePremium = () => {
  const { userProfile, refreshProfileData } = useContext(AppContext);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Sync premium status from local state or backend
  const checkPremiumStatus = useCallback(async (forceFetch = false) => {
    setLoading(true);
    try {
      // Fast path: check local storage cache first
      const cachedStatus = await AsyncStorage.getItem('premium_status');
      const cachedExpiry = await AsyncStorage.getItem('premium_expires_at');
      
      if (cachedStatus && !forceFetch) {
        setIsPremium(cachedStatus === 'true');
        setPremiumExpiresAt(cachedExpiry || null);
        setLoading(false);
        return;
      }

      // Slow path: fetch from API
      const res = await premiumApi.getPremiumStatus();
      if (res?.status === 'success' && res.data) {
        const premiumActive = res.data.isPremium;
        const expiry = res.data.premiumExpiresAt;
        
        setIsPremium(premiumActive);
        setPremiumExpiresAt(expiry);
        
        await AsyncStorage.setItem('premium_status', premiumActive ? 'true' : 'false');
        if (expiry) {
          await AsyncStorage.setItem('premium_expires_at', String(expiry));
        } else {
          await AsyncStorage.removeItem('premium_expires_at');
        }
      }
    } catch (err) {
      console.warn('[usePremium] Failed to fetch premium status:', err.message);
      // Fallback to userProfile value if backend fails
      if (userProfile?.verification?.status === 'approved') {
        // Handled differently or check custom profile fields if any
      }
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // Boot status verification
  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  // Subscribe to premium plan
  const subscribe = useCallback(async (planType, price, provider = 'UPI') => {
    setLoading(true);
    try {
      const res = await premiumApi.subscribePremium(planType, price, provider);
      if (res?.status === 'success' && res.data) {
        setIsPremium(true);
        setPremiumExpiresAt(res.data.premiumExpiresAt);
        await AsyncStorage.setItem('premium_status', 'true');
        if (res.data.premiumExpiresAt) {
          await AsyncStorage.setItem('premium_expires_at', String(res.data.premiumExpiresAt));
        }
        // Force refresh core user profile context
        if (refreshProfileData) {
          await refreshProfileData();
        }
        return { success: true, transactionId: res.data.transactionId };
      }
      return { success: false, error: 'Activation failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Payment failed' };
    } finally {
      setLoading(false);
    }
  }, [refreshProfileData]);

  // Fetch all chat history / sessions list
  const loadChatSessions = useCallback(async () => {
    try {
      const res = await premiumApi.getChatHistory();
      if (res?.status === 'success' && res.data) {
        setChatSessions(res.data.sessions || []);
      }
    } catch (err) {
      console.warn('[usePremium] Failed to load chat sessions:', err.message);
    }
  }, []);

  // Fetch messages for a specific session
  const loadSessionMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
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
  }, [chatSessions]);

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
          return [...filtered, res.data.userMessage, aiMessage];
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

  const unlockLifetimeMarketPrice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await premiumApi.unlockMarketPrice(1);
      if (res?.status === 'success' && res.data) {
        if (refreshProfileData) {
          await refreshProfileData();
        }
        return { success: true, marketPriceAccess: res.data.marketPriceAccess };
      }
      return { success: false, error: 'Unlock failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Payment failed' };
    } finally {
      setLoading(false);
    }
  }, [refreshProfileData]);

  const unlockLifetimeFeedPlanner = useCallback(async () => {
    setLoading(true);
    try {
      const res = await premiumApi.unlockFeedPlanner(1);
      if (res?.status === 'success' && res.data) {
        if (refreshProfileData) {
          await refreshProfileData();
        }
        return { success: true, feedPlannerAccess: res.data.feedPlannerAccess };
      }
      return { success: false, error: 'Unlock failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Payment failed' };
    } finally {
      setLoading(false);
    }
  }, [refreshProfileData]);

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
    subscribe,
    unlockLifetimeMarketPrice,
    unlockLifetimeFeedPlanner,
    loadChatSessions,
    loadSessionMessages,
    sendMessage,
    clearSession,
    startNewChat
  };
};
