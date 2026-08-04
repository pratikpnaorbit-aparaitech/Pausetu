import axiosInstance from './api';

export const premiumApi = {
  getPremiumStatus: async () => {
    return axiosInstance.get('/subscriptions/status');
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
  }
};

export default premiumApi;
