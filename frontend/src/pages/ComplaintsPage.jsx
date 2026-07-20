import React, { useState, useEffect, useContext } from 'react';
import { 
  AlertCircle, 
  Search, 
  Trash2, 
  CheckCircle,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { complaintApi } from '../api/complaintApi';
import { AdminContext } from '../context/AdminContext';
import { API_BASE_URL } from '../api/axios';

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const serverBase = API_BASE_URL.replace(/\/api$/, '');
  if (url.startsWith('/')) return `${serverBase}${url}`;
  return url;
};

export default function ComplaintsPage() {
  const { globalSearchQuery, triggerConfirm } = useContext(AdminContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const res = await complaintApi.getComplaints(filters);
      if (res?.status === 'success') {
        setComplaints(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const handleResolve = (complaint) => {
    triggerConfirm(
      'Mark as Resolved',
      complaint._id,
      'Are you sure you want to mark this complaint as resolved?',
      async () => {
        try {
          await complaintApi.updateComplaintStatus(complaint._id, 'resolved');
          fetchComplaints();
        } catch (e) {
          console.error(e);
          alert('Failed to resolve complaint.');
        }
      }
    );
  };

  const handleDelete = (complaint) => {
    triggerConfirm(
      'Delete Complaint',
      complaint._id,
      'Are you sure you want to permanently delete this complaint?',
      async () => {
        try {
          await complaintApi.deleteComplaint(complaint._id);
          fetchComplaints();
        } catch (e) {
          console.error(e);
          alert('Failed to delete complaint.');
        }
      }
    );
  };

  const filteredComplaints = complaints.filter(c => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    const animalName = (c.animalId?.title || '').toLowerCase();
    const reporterName = (c.reporterId?.name || '').toLowerCase();
    const sellerName = (c.sellerId?.name || '').toLowerCase();
    const message = (c.message || '').toLowerCase();
    return animalName.includes(q) || reporterName.includes(q) || sellerName.includes(q) || message.includes(q);
  });

  return (
    <div className="page-container" style={{ padding: 24, maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: '700', color: '#0f172a', margin: 0 }}>Complaints & Reports</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Manage and resolve user reports for animal listings.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', backgroundColor: '#fff', fontSize: 14, color: '#334155', cursor: 'pointer', outline: 'none' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <button 
            onClick={fetchComplaints} 
            className="action-btn secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#475569' }}>Listing</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#475569' }}>Reporter</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#475569' }}>Seller</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#475569' }}>Complaint Message</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 13, fontWeight: '600', color: '#475569' }}>Status</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw className="spin" size={24} style={{ marginBottom: 12, opacity: 0.5 }} />
                    <p>Loading complaints...</p>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                    <AlertCircle size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p style={{ fontSize: 16, fontWeight: '500', color: '#475569' }}>No complaints found</p>
                    <p style={{ fontSize: 14, marginTop: 4 }}>Everything looks good!</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          {c.animalId?.photos?.[0] ? (
                            <img src={resolveMediaUrl(c.animalId.photos[0])} alt="Animal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐾</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: '600', color: '#1e293b' }}>{c.animalId?.title || 'Unknown Animal'}</div>
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>₹{c.animalId?.price?.toLocaleString() || '0'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>{c.reporterId?.name || 'Unknown User'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.reporterId?.mobile || 'No Mobile'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>{c.sellerId?.name || 'Unknown Seller'}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.sellerId?.mobile || 'No Mobile'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: 300 }}>
                      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={c.message}>
                        {c.message}
                      </p>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {c.status === 'resolved' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: '600', backgroundColor: '#dcfce7', color: '#16a34a' }}>
                          <CheckCircle size={12} /> Resolved
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: '600', backgroundColor: '#fef3c7', color: '#d97706' }}>
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {c.status === 'pending' && (
                          <button 
                            onClick={() => handleResolve(c)}
                            className="action-icon-btn success"
                            title="Mark as Resolved"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(c)}
                          className="action-icon-btn danger"
                          title="Delete Complaint"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
