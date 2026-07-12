import instance from './api';

export const verificationApi = {
  submitVerification: async (receiptUrl) => {
    return instance.post('/verification/submit', { receiptUrl });
  },

  getVerificationStatus: async () => {
    return instance.get('/verification/status');
  }
};

export default verificationApi;
