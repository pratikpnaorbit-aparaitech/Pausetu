import instance from './api';

export const verificationApi = {
  submitVerification: async (verificationData) => {
    const payload = typeof verificationData === 'string'
      ? { receiptUrl: verificationData }
      : verificationData;
    return instance.post('/verification/submit', payload);
  },

  extractReceiptDetails: async (receiptUrl) => {
    return instance.post('/verification/extract', { receiptUrl });
  },

  getVerificationStatus: async () => {
    return instance.get('/verification/status');
  },

  getSettings: async () => {
    return instance.get('/verification/settings');
  }
};

export default verificationApi;
