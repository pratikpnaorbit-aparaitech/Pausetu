import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AdminContext } from '../context/AdminContext';
import {
  Bell, Send, Users, Shield, Award, Layers, Sparkles, CheckCircle2,
  AlertCircle, Smartphone, Image as ImageIcon, Link as LinkIcon, Trash2, RefreshCw, Filter, UploadCloud
} from 'lucide-react';
import axios, { API_BASE_URL } from '../api/axios';
import { useWebAutoRefresh } from '../hooks/useWebAutoRefresh';
import { refreshManager, REFRESH_EVENTS } from '../services/refreshManager';

export default function NotificationsPage() {
  const adminCtx = useContext(AdminContext) || {};
  // Fix TypeError: use showToast exported by AdminContext with fallback
  const notify = (msg, type = 'info') => {
    if (typeof adminCtx.showToast === 'function') {
      adminCtx.showToast(msg, type);
    } else if (typeof adminCtx.addToast === 'function') {
      adminCtx.addToast(msg, type);
    } else {
      console.log(`[Notification Toast ${type.toUpperCase()}]`, msg);
    }
  };

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  // DOM Refs for File Input Triggers
  const dropzoneInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [channelId, setChannelId] = useState('admin');
  const [priority, setPriority] = useState('high');
  const [notificationType, setNotificationType] = useState('ADMIN_BROADCAST');
  const [targetAudience, setTargetAudience] = useState('everyone');
  const [targetScreen, setTargetScreen] = useState('Notifications');
  const [specificUserId, setSpecificUserId] = useState('');

  const fetchNotificationHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/notifications/admin/list?page=${pagination.page}&limit=10`);
      if (res?.status === 'success') {
        setHistory(res.data?.notifications || []);
        setPagination(res.data?.pagination || { page: 1, total: 0, pages: 1 });
      }
    } catch (err) {
      console.warn('[NotificationsPage] Error fetching history:', err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page]);

  useEffect(() => {
    fetchNotificationHistory();
  }, [fetchNotificationHistory]);

  // Enterprise Auto Refresh Hook: 30-sec polling, tab visibility, focus, and event-driven
  useWebAutoRefresh(fetchNotificationHistory, {
    events: [REFRESH_EVENTS.NOTIFICATION_SENT, REFRESH_EVENTS.NOTIFICATION_UPDATED],
    pageKey: 'PushNotificationManager'
  });

  // Cloudinary Single Image Upload Handler
  const handleImageUpload = async (file) => {
    if (!file) {
      console.warn('[NOTIFICATION UPLOAD] No file provided');
      return;
    }

    console.log('[NOTIFICATION UPLOAD] File Selected:', file);
    console.log('[NOTIFICATION UPLOAD] File Meta:', { name: file.name, type: file.type, size: file.size });

    // Validate format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileType = (file.type || '').toLowerCase();
    const fileExt = file.name ? file.name.split('.').pop().toLowerCase() : '';
    const isValidType = validTypes.includes(fileType) || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);

    if (!isValidType) {
      notify('Invalid file format. Please upload JPG, PNG, or WEBP images only.', 'error');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      notify('File size too large. Maximum image size allowed is 5 MB.', 'error');
      return;
    }

    console.log('[NOTIFICATION UPLOAD] Uploading...', file);

    // 1. Create instant local Blob URL for immediate UI preview
    let tempLocalUrl = '';
    try {
      tempLocalUrl = URL.createObjectURL(file);
      console.log('[NOTIFICATION UPLOAD] Created temporary Blob preview URL:', tempLocalUrl);
      setImageUrl(tempLocalUrl);
    } catch (blobErr) {
      console.warn('[NOTIFICATION UPLOAD] Blob creation warning:', blobErr.message);
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[NOTIFICATION UPLOAD] Sending POST /api/upload');

      let res;
      try {
        res = await axios.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (firstErr) {
        if (firstErr?.response?.status === 404) {
          console.warn('[NOTIFICATION UPLOAD] /upload returned 404, trying /uploads fallback');
          res = await axios.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          throw firstErr;
        }
      }

      console.log('[NOTIFICATION UPLOAD] Server Raw Response:', res);

      if (res?.status === 'success' || res?.data?.fileUrl || res?.fileUrl) {
        let remoteUrl = res?.data?.fileUrl ||
                        res?.data?.url ||
                        res?.data?.upload?.url ||
                        res?.data?.upload?.secure_url ||
                        res?.fileUrl ||
                        res?.url ||
                        res?.secure_url;

        if (remoteUrl) {
          if (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://')) {
            const serverBase = API_BASE_URL.replace(/\/api\/?$/, '');
            remoteUrl = `${serverBase}${remoteUrl.startsWith('/') ? '' : '/'}${remoteUrl}`;
          }
          console.log('[NOTIFICATION UPLOAD] Cloudinary URL:', remoteUrl);
          setImageUrl(remoteUrl);
          console.log('[NOTIFICATION UPLOAD] React State imageUrl Updated to:', remoteUrl);
          notify('Notification banner image uploaded to Cloudinary successfully!', 'success');
        } else {
          console.warn('[NOTIFICATION UPLOAD] Remote URL missing in response, keeping temp local URL:', tempLocalUrl);
        }
      }
    } catch (err) {
      console.error('[NOTIFICATION UPLOAD ERROR]', err?.response?.data || err.message);
      setImageUrl('');
      notify(err.response?.data?.message || err.message || 'Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    console.log('[NOTIFICATION UPLOAD] handleFileSelect called');
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset file input value to allow selecting same file again
    e.target.value = null;
  };

  // Drag & Drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      notify('Please enter both title and message for the notification.', 'warning');
      return;
    }

    setSending(true);
    try {
      let endpoint = '/notifications/broadcast';
      let payload = {
        title,
        message,
        imageUrl: imageUrl.trim() || null,
        channelId,
        priority,
        notificationType,
        targetAudience,
        deepLink: {
          screen: targetScreen,
          params: {}
        }
      };

      if (targetAudience === 'specific') {
        if (!specificUserId.trim()) {
          notify('Please enter a User ID for specific recipient targeting.', 'warning');
          setSending(false);
          return;
        }
        endpoint = '/notifications/send';
        payload.userId = specificUserId.trim();
      }

      console.log('[NOTIFICATION DISPATCH] Payload:', payload);

      const res = await axios.post(endpoint, payload);

      if (res?.status === 'success') {
        notify(res.message || 'Notification dispatched successfully!', 'success');
        // Reset Form
        setTitle('');
        setMessage('');
        setImageUrl('');
        setSpecificUserId('');
        // Trigger auto refresh bus
        refreshManager.emit(REFRESH_EVENTS.NOTIFICATION_SENT);
      }
    } catch (err) {
      notify(err.response?.data?.message || err.message || 'Failed to dispatch notification', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={24} color="#7C3AED" /> Push Notification Manager
          </h2>
          <p className="page-subtitle">
            Compose and broadcast real-time Firebase FCM push notifications to PashuSetu mobile app users.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchNotificationHistory} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh History
        </button>
      </div>

      {/* ── Main Layout: Left Form + Right Live Preview ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, marginBottom: 32 }}>
        
        {/* Left Card: Notification Composer */}
        <div className="card-flat" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Send size={18} color="#7C3AED" /> Compose Notification
          </h3>

          <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Notification Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 🎉 Special Monsoon Discount on Premium!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Message Body *
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Unlock AI Feed Planner and Unlimited Listings today at 20% off."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Target Audience & Channel Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Target Audience
                </label>
                <select
                  className="input"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                >
                  <option value="everyone">🌐 Everyone (All App Users)</option>
                  <option value="premium">👑 Premium Subscribers Only</option>
                  <option value="free">⚡ Free Users Only</option>
                  <option value="sellers">🐮 Livestock Sellers (Farmers)</option>
                  <option value="buyers">🛒 Cattle Buyers / Traders</option>
                  <option value="verified">✅ Verified Farmers Only</option>
                  <option value="specific">👤 Specific User (ID)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Android Channel
                </label>
                <select
                  className="input"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                >
                  <option value="admin">📢 Admin Announcements</option>
                  <option value="marketplace">🛒 Marketplace Updates</option>
                  <option value="premium">👑 PashuSetu Premium</option>
                  <option value="orders">💳 Orders & Payments</option>
                  <option value="general">🔔 General Alerts</option>
                  <option value="high_priority">🚨 High Priority Alert</option>
                </select>
              </div>
            </div>

            {/* Specific User ID Field if selected */}
            {targetAudience === 'specific' && (
              <div>
                <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                  Target User ID *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Paste MongoDB User ID (e.g. 66f1a8c9b...)"
                  value={specificUserId}
                  onChange={(e) => setSpecificUserId(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Deep Link Screen */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Deep Link Screen
              </label>
              <select
                className="input"
                value={targetScreen}
                onChange={(e) => setTargetScreen(e.target.value)}
              >
                <option value="Notifications">🔔 Notification Center</option>
                <option value="Subscription">👑 Subscription Screen</option>
                <option value="FeedPlanner">🌾 AI Feed Planner</option>
                <option value="Bid">📈 Cow Price Estimator</option>
                <option value="MyListings">📋 My Listings</option>
                <option value="Profile">👤 User Profile</option>
                <option value="Verification">🛡️ Farmer Verification</option>
              </select>
            </div>

            {/* Enterprise Cloudinary Banner Image Upload Dropzone */}
            <div>
              <label style={{ fontSize: 12.5, fontWeight: '700', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Notification Banner Image (Cloudinary Upload)
              </label>

              {/* Hidden Inputs Placed OUTSIDE Container to Prevent Bubbling Traps */}
              <input
                ref={dropzoneInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                disabled={uploading}
              />

              {imageUrl ? (
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 12,
                  padding: 12,
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <img
                    src={imageUrl}
                    alt="Notification Banner"
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 12
                    }}
                    onError={(e) => console.warn('[PREVIEW WARNING] Image failed to load:', imageUrl)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                      {imageUrl}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={uploading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          replaceInputRef.current?.click();
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <RefreshCw size={13} className={uploading ? 'spin' : ''} /> {uploading ? 'Uploading...' : 'Replace'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={uploading}
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setImageUrl('');
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    dropzoneInputRef.current?.click();
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? '#7C3AED' : 'var(--border-color)'}`,
                    borderRadius: 12,
                    padding: '24px 16px',
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'rgba(124, 58, 237, 0.05)' : 'var(--bg-secondary)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={24} color="#7C3AED" className="spin" />
                      <span style={{ fontSize: 13, fontWeight: '700', color: '#7C3AED' }}>Uploading to Cloudinary...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <UploadCloud size={32} color={isDragging ? '#7C3AED' : '#94A3B8'} />
                      <span style={{ fontSize: 13, fontWeight: '700', color: 'var(--text-heading)' }}>
                        Drag & Drop banner image here or <strong style={{ color: '#7C3AED' }}>browse</strong>
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Supports JPG, PNG, WEBP (Max 5 MB)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: 8, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || uploading}
                style={{ padding: '10px 24px', backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
              >
                {sending ? (
                  <>
                    <RefreshCw size={14} className="spin" /> Dispatching Push...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Dispatch Push Notification 🚀
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Card: Live Android Notification Phone Preview */}
        <div className="card-flat" style={{ padding: 24, backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: 15, fontWeight: '800', color: '#f8fafc', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={18} color="#A78BFA" /> Live Android Preview
          </h3>
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 20 }}>
            This is how your push notification will appear on Android devices:
          </p>

          {/* Android Phone Notification Card Mockup */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: 16,
            padding: 16,
            border: '1px solid #334155',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={12} color="#fff" />
                </div>
                <span style={{ fontSize: 12, fontWeight: '700', color: '#e2e8f0' }}>PashuSetu</span>
                <span style={{ fontSize: 10, color: '#64748b' }}>• Now</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: '800', color: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.15)', padding: '2px 6px', borderRadius: 4 }}>
                {channelId.toUpperCase()}
              </span>
            </div>

            {/* Title & Body */}
            <h4 style={{ fontSize: 14, fontWeight: '800', color: '#ffffff', margin: '0 0 4px' }}>
              {title || 'Sample Notification Title'}
            </h4>
            <p style={{ fontSize: 12.5, color: '#cbd5e1', margin: '0 0 10px', lineHeight: 1.4 }}>
              {message || 'Sample notification message description will appear here as the user receives the push alert on Android.'}
            </p>

            {/* Image Preview Banner */}
            {Boolean(imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) ? (
              <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', marginTop: 8, backgroundColor: '#0f172a' }}>
                <img src={imageUrl} alt="Notification Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}

            {/* Deep link badge */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8' }}>
              <LinkIcon size={12} color="#a78bfa" /> Opens Screen: <strong style={{ color: '#e2e8f0' }}>{targetScreen}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ── Broadcast History Table ────────────────────────────────────── */}
      <div className="card-flat" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} color="#7C3AED" /> Recent Broadcast Logs
        </h3>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading notification logs...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            No recent broadcast logs found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Message</th>
                  <th>Audience</th>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Status</th>
                  <th>Sent Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: 13.5 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.message}</div>
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ textTransform: 'uppercase', fontSize: 10 }}>
                        {item.targetAudience || 'specific'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: 10 }}>
                        {item.channelId || 'general'}
                      </span>
                    </td>
                    <td>
                      {item.recipient ? (
                        <div style={{ fontSize: 12, fontWeight: '600' }}>
                          {item.recipient.fullName || item.recipient.name} ({item.recipient.mobile})
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Broadcast</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: 10 }}>
                        {item.status?.toUpperCase() || 'SENT'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
