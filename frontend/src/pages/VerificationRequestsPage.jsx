import React, { useEffect, useState, useContext } from 'react';
import { verificationApi } from '../api/verificationApi';
import { AdminContext } from '../context/AdminContext';
import {
  Check, X, Eye, Search, AlertCircle, RefreshCw, Loader2, ShieldAlert
} from 'lucide-react';

export default function VerificationRequestsPage() {
  const { loadDashboardData } = useContext(AdminContext);
  const resolveMediaUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const host = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
    return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [previewRequest, setPreviewRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      const data = await verificationApi.getRequests(tab);
      setRequests(data || []);
    } catch (err) {
      setError('Failed to fetch verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this verification request?')) return;
    setActionLoading(true);
    try {
      const success = await verificationApi.updateStatus(id, 'approved');
      if (success) {
        loadRequests(activeTab);
        if (loadDashboardData) {
          loadDashboardData(true);
        }
      } else {
        alert('Failed to approve request.');
      }
    } catch (err) {
      alert(err.message || 'Error occurred while approving.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      const success = await verificationApi.updateStatus(rejectRequest.id, 'rejected', rejectReason);
      if (success) {
        setRejectRequest(null);
        setRejectReason('');
        loadRequests(activeTab);
        if (loadDashboardData) {
          loadDashboardData(true);
        }
      } else {
        alert('Failed to reject request.');
      }
    } catch (err) {
      alert(err.message || 'Error occurred while rejecting.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Verification Requests</h2>
          <p className="page-subtitle">Moderate milk dairy receipts submitted by buyers and sellers.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input input-search"
            style={{ paddingLeft: 34 }}
            type="text"
            placeholder="Search by name or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={24} color="var(--color-danger)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => loadRequests(activeTab)} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert size={32} color="var(--text-muted)" />
          <h3>No Requests Found</h3>
          <p>No verification requests match your filter or tab selection.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredRequests.map((req) => (
            <div key={req.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <img
                    src={resolveMediaUrl(req.photo)}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'; }}
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                    alt="Profile"
                  />
                  <div>
                    <h4 style={{ margin: 0, fontWeight: '800', color: 'var(--text-heading)' }}>{req.name}</h4>
                    <span className="badge badge-info" style={{ marginTop: 4, display: 'inline-block', fontSize: 11, textTransform: 'capitalize' }}>
                      {req.role}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', marginBottom: 14 }}>
                  <div><strong>Mobile:</strong> {req.phone}</div>
                  <div><strong>Submitted:</strong> {req.submittedAt}</div>
                  {req.farmerName && <div><strong>OCR Farmer Name:</strong> {req.farmerName}</div>}
                  {req.dairyName && <div><strong>OCR Dairy Name:</strong> {req.dairyName}</div>}
                  {req.receiptDate && <div><strong>OCR Receipt Date:</strong> {req.receiptDate}</div>}
                  {req.status === 'rejected' && (
                    <div style={{ color: 'var(--color-danger)' }}>
                      <strong>Reason:</strong> {req.rejectedReason}
                    </div>
                  )}
                </div>

                {/* Receipt Preview */}
                {req.receiptUrl ? (
                  <div 
                    onClick={() => setPreviewRequest(req)}
                    style={{ 
                      cursor: 'pointer',
                      height: 100, 
                      borderRadius: 'var(--radius-sm)', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-color)',
                      marginBottom: 14,
                      position: 'relative'
                    }}
                  >
                    {req.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#ef4444' }}>PDF Document</span>
                      </div>
                    ) : (
                      <img
                        src={resolveMediaUrl(req.receiptUrl)}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="Receipt"
                      />
                    )}
                  </div>
                ) : (
                  <div style={{ height: 100, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>
                    No receipt document attached
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => setPreviewRequest(req)}
                  >
                    <Eye size={14} /> View
                  </button>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    onClick={() => setRejectRequest(req)}
                    disabled={actionLoading}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Receipt Verification Document</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setPreviewRequest(null)}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              {previewRequest.receiptUrl.toLowerCase().endsWith('.pdf') ? (
                <div style={{ padding: 24 }}>
                  <p style={{ marginBottom: 12 }}>PDF Document cannot be directly rendered inside preview</p>
                  <a href={resolveMediaUrl(previewRequest.receiptUrl)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    Open PDF in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={resolveMediaUrl(previewRequest.receiptUrl)}
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'; }}
                  style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }}
                  alt="Receipt Document"
                />
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
                <a
                  href={resolveMediaUrl(previewRequest.receiptUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  View Full Screen
                </a>
                <a
                  href={resolveMediaUrl(previewRequest.receiptUrl)}
                  download={`receipt-${previewRequest.name.replace(/\s+/g, '_')}${previewRequest.receiptUrl.toLowerCase().endsWith('.pdf') ? '.pdf' : '.jpg'}`}
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Download Receipt
                </a>
              </div>
            </div>
            {previewRequest.status === 'pending' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={() => { setPreviewRequest(null); handleApprove(previewRequest.id); }}>
                  Approve Verification
                </button>
                <button className="btn btn-secondary" style={{ color: 'var(--color-danger)' }} onClick={() => { setPreviewRequest(null); setRejectRequest(previewRequest); }}>
                  Reject Verification
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRequest && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <form className="card" onSubmit={handleRejectSubmit} style={{ width: '100%', maxWidth: 450, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Reject Verification Request</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setRejectRequest(null); setRejectReason(''); }}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: 'var(--text-main)' }}>
                Rejection Reason (Required)
              </label>
              <textarea
                className="input"
                style={{ width: '100%', minHeight: 100, padding: 12, resize: 'vertical' }}
                placeholder="Enter the reason why the receipt is rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setRejectRequest(null); setRejectReason(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)' }} disabled={actionLoading}>
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
