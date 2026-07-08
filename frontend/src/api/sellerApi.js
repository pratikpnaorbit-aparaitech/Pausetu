import axios from './axios';

export const sellerApi = {
  getAll: async () => {
    try {
      const res = await axios.get('/admin/users?role=seller');
      if (res && res.status === 'success' && res.data.users) {
        // Fetch animals to calculate listing counts per seller
        let animals = [];
        try {
          const animRes = await axios.get('/animals?limit=1000');
          if (animRes && animRes.status === 'success' && animRes.data.animals) {
            animals = animRes.data.animals;
          }
        } catch (animErr) {
          console.warn('[Seller API] Failed to fetch animals for listings count:', animErr.message);
        }

        return res.data.users.map(u => {
          const sellerAnimals = animals.filter(a => a.sellerId?._id === u._id || a.sellerId === u._id);
          return {
            id: u._id,
            name: u.fullName || u.name || 'Unnamed',
            email: u.email,
            phone: u.mobile || u.phoneNumber || 'N/A',
            village: u.village || 'N/A',
            district: u.district || 'N/A',
            state: u.state || 'N/A',
            totalListings: sellerAnimals.length,
            approvedListings: sellerAnimals.filter(a => a.status === 'approved').length,
            pendingListings: sellerAnimals.filter(a => a.status === 'pending').length,
            status: u.isBlocked ? 'Blocked' : 'Active',
            isDeleted: false,
            photo: u.profilePhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
          };
        });
      }
    } catch (e) {
      console.error('[Seller API Error]', e);
    }
    return [];
  },
  toggleBlock: async (id) => {
    return axios.patch(`/admin/manage-user/${id}`, { action: 'toggleBlock' });
  }
};
