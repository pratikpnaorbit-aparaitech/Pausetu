import axiosInstance from './api';

export const premiumApi = {
  getPremiumStatus: async () => {
    return axiosInstance.get('/premium/status');
  },
  
  subscribePremium: async (planType, amount, paymentMethod = 'UPI') => {
    return axiosInstance.post('/premium/subscribe', {
      planType,
      amount,
      paymentMethod
    });
  },
  
  getChatHistory: async (sessionId = null) => {
    const url = sessionId ? `/premium/history?sessionId=${sessionId}` : '/premium/history';
    return axiosInstance.get(url);
  },
  
  sendChatMessage: async (message, sessionId = null, sessionTitle = null, imageUrl = null) => {
    return axiosInstance.post('/premium/chat', {
      message,
      sessionId,
      sessionTitle,
      imageUrl
    });
  },
  
  clearChatHistory: async (sessionId = null) => {
    return axiosInstance.post('/premium/history/clear', { sessionId });
  },

  unlockMarketPrice: async (amount = 1, paymentMethod = 'UPI') => {
    return axiosInstance.post('/premium/unlock-market-price', {
      amount,
      paymentMethod
    });
  },
  
  unlockFeedPlanner: async (amount = 1, paymentMethod = 'UPI') => {
    return axiosInstance.post('/premium/unlock-feed-planner', {
      amount,
      paymentMethod
    });
  }
};
