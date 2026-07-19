import instance from './api';

export const verificationApi = {
  submitVerification: async (verificationData) => {
    const payload = typeof verificationData === 'string'
      ? { receiptUrl: verificationData }
      : verificationData;
    return instance.post('/verification/submit', payload);
  },

  getVerificationStatus: async () => {
    return instance.get('/verification/status');
  },

  getSettings: async () => {
    const res = await instance.get('/verification/settings');
    if (res && res.status === 'success' && res.data?.settings) {
      return res.data.settings;
    }
    return res?.settings || res;
  }
};

export default verificationApi;
