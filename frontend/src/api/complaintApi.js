import axios from './axios';

export const complaintApi = {
  getComplaints: async (filters = {}) => {
    const query = Object.keys(filters)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`)
      .join('&');
    return axios.get(`/complaints${query ? `?${query}` : ''}`);
  },
  
  updateComplaintStatus: async (id, status) => {
    return axios.patch(`/complaints/${id}/status`, { status });
  },
  
  deleteComplaint: async (id) => {
    return axios.delete(`/complaints/${id}`);
  }
};
