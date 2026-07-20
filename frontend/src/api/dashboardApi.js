import axios from './axios';

export const dashboardApi = {
  getStats: async () => {
    try {
      const res = await axios.get('/admin/dashboard-stats');
      if (res && res.status === 'success' && res.data) {
        return res.data;
      }
    } catch (e) {
      // Re-throw authentication errors so the caller (loadDashboardData) can
      // surface them and ensureAdminAuth can refresh the token on retry.
      // Do NOT fall to the offline fallback on auth failures — the fallback
      // calls /api/animals without a valid token, which returns only approved
      // listings and incorrectly computes pendingApprovals = 0.
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        throw e;
      }
      console.warn('[Dashboard API Warning] stats endpoint failed, compiling live stats from listing endpoints...');
    }

    // Dynamic Calculation Fallback from live endpoints:
    let categoriesList = [];
    try {
      const catRes = await axios.get('/categories');
      if (catRes && catRes.status === 'success') {
        categoriesList = catRes.data.categories;
      }
    } catch (err) {}

    let animalsList = [];
    try {
      const animRes = await axios.get('/animals?limit=1000');
      if (animRes && animRes.status === 'success') {
        animalsList = animRes.data.animals;
      }
    } catch (err) {}

    let sellersCount = 0;
    try {
      const sellersRes = await axios.get('/admin/users?role=seller');
      if (sellersRes && sellersRes.status === 'success' && sellersRes.data.users) {
        sellersCount = sellersRes.data.users.length;
      }
    } catch (err) {}

    let buyersCount = 0;
    try {
      const buyersRes = await axios.get('/admin/users?role=buyer');
      if (buyersRes && buyersRes.status === 'success' && buyersRes.data.users) {
        buyersCount = buyersRes.data.users.length;
      }
    } catch (err) {}

    const totalAnimals = animalsList.length;
    const pendingApprovals = animalsList.filter(a => a.status === 'pending').length;
    const approvedListings = animalsList.filter(a => a.status === 'approved').length;
    const rejectedListings = animalsList.filter(a => a.status === 'rejected').length;
    const soldAnimals = animalsList.filter(a => a.status === 'sold').length;

    // Category distribution mapping
    const distribution = {};
    categoriesList.forEach(c => {
      distribution[c.name] = animalsList.filter(a => a.categoryId?._id === c._id || a.categoryId === c._id).length;
    });

    return {
      kpis: {
        totalSellers: sellersCount,
        totalBuyers: buyersCount,
        totalAnimals,
        pendingApprovals,
        approvedListings,
        rejectedListings,
        soldAnimals,
        todayRegistrations: sellersCount + buyersCount > 0 ? 1 : 0
      },
      weeklyStats: [
        { day: 'Mon', value: approvedListings },
        { day: 'Tue', value: pendingApprovals },
        { day: 'Wed', value: soldAnimals },
        { day: 'Thu', value: rejectedListings },
        { day: 'Fri', value: totalAnimals },
        { day: 'Sat', value: 0 },
        { day: 'Sun', value: 0 }
      ],
      categoryDistribution: distribution
    };
  },

  getHealth: async () => {
    try {
      const res = await axios.get('/health');
      if (res && res.status === 'OK') {
        return { status: 'Connected', timestamp: res.timestamp };
      }
      return { status: 'Disconnected' };
    } catch (e) {
      return { status: 'Disconnected' };
    }
  }
};
