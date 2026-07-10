import axios from './axios';

export const buyerApi = {
  getAll: async () => {
    try {
      const res = await axios.get('/admin/users?role=buyer');
      if (res && res.status === 'success' && res.data.users) {
        return res.data.users.map(u => {
          return {
            id: u._id,
            name: u.fullName || u.name || 'Unnamed',
            email: u.email,
            phone: u.mobile || u.phoneNumber || 'N/A',
            village: u.village || 'N/A',
            district: u.district || 'N/A',
            state: u.state || 'N/A',
            interestedListings: 0,
            status: u.isBlocked ? 'Blocked' : 'Active',
            isDeleted: false,
            photo: u.profilePhoto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80'
          };
        });
      }
    } catch (e) {
      console.error('[Buyer API Error]', e);
    }
    return [];
  },
  toggleBlock: async (id) => {
    return axios.patch(`/admin/manage-user/${id}`, { action: 'toggleBlock' });
  }
};
