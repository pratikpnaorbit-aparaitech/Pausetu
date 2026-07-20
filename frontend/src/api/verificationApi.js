import axios from './axios';

export const verificationApi = {
  getRequests: async (status = '') => {
    try {
      const url = status ? `/verification/requests?status=${status}` : '/verification/requests';
      const res = await axios.get(url);
      if (res && res.status === 'success' && res.data.requests) {
        return res.data.requests.map(u => ({
          id: u._id,
          name: u.fullName || u.name || 'Unnamed User',
          phone: u.mobile || u.phoneNumber || 'N/A',
          role: u.role || 'buyer',
          receiptUrl: u.verification?.receiptUrl || '',
          farmerName: u.verification?.farmerName || '',
          dairyName: u.verification?.dairyName || '',
          receiptDate: u.verification?.receiptDate ? new Date(u.verification.receiptDate).toLocaleDateString() : '',
          submittedAt: u.verification?.submittedAt ? new Date(u.verification.submittedAt).toLocaleDateString() : 'N/A',
          approvedAt: u.verification?.approvedAt ? new Date(u.verification.approvedAt).toLocaleDateString() : '',
          status: u.verification?.status || 'unverified',
          rejectedReason: u.verification?.rejectedReason || '',
          photo: u.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
        }));
      }
    } catch (e) {
      console.error('[Verification API Error]', e);
    }
    return [];
  },

  updateStatus: async (id, status, rejectedReason = '') => {
    try {
      const res = await axios.patch(`/verification/update/${id}`, {
        status,
        rejectedReason
      });
      return res && res.status === 'success';
    } catch (e) {
      console.error('[Verification API Update Error]', e);
      throw e;
    }
  },

  getSettings: async () => {
    try {
      const res = await axios.get('/verification/settings');
      if (res && (res.status === 'success' || res.settings || res.data?.settings)) {
        return res.data?.settings || res.settings || res;
      }
    } catch (e) {
      console.error('[Verification API Get Settings Error]', e);
    }
    return null;
  },

  updateSettings: async (settingsData) => {
    try {
      const res = await axios.put('/verification/settings', settingsData);
      if (res && (res.status === 'success' || res.settings || res.data?.settings)) {
        return res.data?.settings || res.settings || res;
      }
      return res;
    } catch (e) {
      console.error('[Verification API Update Settings Error]', e);
      throw e;
    }
  }
};
