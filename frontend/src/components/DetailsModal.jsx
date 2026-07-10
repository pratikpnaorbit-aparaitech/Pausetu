import React, { useState, useContext } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Activity, Check, Info, Tag, User, Clock, AlertCircle, Loader2, Video } from 'lucide-react';
import { AdminContext } from '../context/AdminContext';

// Format a date string nicely
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const truncateId = (id) => {
  if (!id || id.length < 8) return id || 'N/A';
  return `${id.slice(0, 8)}…`;
};

export default function DetailsModal({ modalState, onClose, onApprove, onReject }) {
  const { visible, data: animal } = modalState;
  const { isActionLoading } = useContext(AdminContext);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imgError, setImgError] = useState({});

  if (!visible || !animal) return null;

  const photoList = animal.photos || [];

  const handleImgError = (idx) => {
    setImgError((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '88%', maxWidth: 920, maxHeight: '92vh', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: '800', color: 'var(--text-heading)' }}>Review Listing</h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              ID: {animal.id} · Status: <span style={{ color: animal.status === 'pending' ? '#92400e' : animal.status === 'approved' ? 'var(--color-primary)' : 'var(--color-danger)', fontWeight: '700' }}>{animal.status?.toUpperCase()}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}>
            <X size={22} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div style={{ padding: '24px 28px', display: 'flex', gap: 28, flexDirection: 'row', flexWrap: 'wrap' }}>

          {/* Left: Media */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Main Photo */}
            <div style={{ position: 'relative', width: '100%', height: 270, backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              {photoList.length > 0 && !imgError[activePhotoIdx] ? (
                <img
                  key={activePhotoIdx}
                  src={photoList[activePhotoIdx]}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={`${animal.title} — photo ${activePhotoIdx + 1}`}
                  onError={() => handleImgError(activePhotoIdx)}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-muted)' }}>
                  <Tag size={36} strokeWidth={1.5} />
                  <span style={{ fontSize: 12 }}>No image available</span>
                </div>
              )}
              {animal.negotiable && (
                <span style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'var(--color-primary)', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: '700' }}>
                  Negotiable
                </span>
              )}
              <span style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: '700' }}>
                {activePhotoIdx + 1} / {photoList.length || 1}
              </span>
            </div>

            {/* Thumbnail strip */}
            {photoList.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {photoList.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActivePhotoIdx(idx); setImgError((prev) => ({ ...prev, [idx]: false })); }}
                    style={{
                      width: 60, height: 60, flexShrink: 0, borderRadius: 8, overflow: 'hidden',
                      border: idx === activePhotoIdx ? '2.5px solid var(--color-primary)' : '1.5px solid var(--border-color)',
                      cursor: 'pointer', padding: 0, backgroundColor: '#f1f5f9'
                    }}
                  >
                    {!imgError[idx] ? (
                      <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" onError={() => handleImgError(idx)} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertCircle size={16} color="var(--text-muted)" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Verification Video */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Video size={14} color="var(--color-primary)" />
                Verification Video
              </h4>
              {animal.video ? (
                <video
                  src={animal.video}
                  controls
                  controlsList="nodownload"
                  style={{ width: '100%', borderRadius: 8, backgroundColor: '#000', maxHeight: 200 }}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="var(--color-danger)" />
                  <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: '600' }}>No verification video attached</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div style={{ flex: '1.2 1 380px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Title & Price */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: 21, fontWeight: '800', color: 'var(--text-heading)', lineHeight: 1.3 }}>{animal.title}</h2>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {animal.categoryName && (
                      <span style={{ fontSize: 11, fontWeight: '700', padding: '2px 8px', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)', borderRadius: 4 }}>
                        {animal.categoryName}
                      </span>
                    )}
                    {animal.breedName && (
                      <span style={{ fontSize: 11, fontWeight: '700', padding: '2px 8px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 4 }}>
                        {animal.breedName}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: '900', color: 'var(--color-primary)' }}>
                    ₹{(animal.price || 0).toLocaleString('en-IN')}
                  </div>
                  {animal.negotiable && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: '600' }}>Negotiable</div>}
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {animal.description || 'No description provided.'}
              </p>
            </div>

            {/* Animal Traits */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} color="var(--color-info)" />
                Animal Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{animal.gender || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> <strong>{animal.age || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> <strong>{animal.weight ? `${animal.weight} kg` : 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Color:</span> <strong>{animal.color || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong>{animal.categoryName || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Breed:</span> <strong>{animal.breedName || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Health Report */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="var(--color-primary)" />
                Health Report
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { label: `Vaccinated: ${animal.health?.vaccinated ? 'Yes' : 'No'}`, ok: animal.health?.vaccinated },
                  { label: `Healthy: ${animal.health?.healthy ? 'Yes' : 'No'}`, ok: animal.health?.healthy },
                  { label: `Pregnant: ${animal.health?.pregnant ? 'Yes' : 'No'}`, ok: !animal.health?.pregnant },
                  { label: `Milk Yield: ${animal.health?.milkCapacity || 'N/A'}`, ok: !!animal.health?.milkCapacity }
                ].map(({ label, ok }, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
                    backgroundColor: '#fff', padding: '6px 12px', borderRadius: 16,
                    border: `1px solid ${ok ? '#bbf7d0' : 'var(--border-color)'}`
                  }}>
                    <Check size={13} color={ok ? 'var(--color-primary)' : 'var(--text-muted)'} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller & Location */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {/* Seller Info */}
              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={13} />
                  Seller Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: '700', fontSize: 13, color: 'var(--text-heading)' }}>{animal.sellerName || 'N/A'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Phone size={11} />
                    {animal.sellerMobile || 'Not provided'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Mail size={11} />
                    {animal.sellerEmail || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={13} />
                  Location
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{[animal.village, animal.taluka].filter(Boolean).join(', ') || '—'}</span>
                  <span>{[animal.district, animal.state].filter(Boolean).join(', ') || '—'}</span>
                  {animal.latitude && (
                    <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                      GPS: {animal.latitude.toFixed(5)}, {animal.longitude?.toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Submission dates */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 12 }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={12} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>
                  <strong>{formatDate(animal.createdAt)}</strong>
                </div>
                {animal.approvedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} color="var(--color-primary)" />
                    <span style={{ color: 'var(--text-muted)' }}>Approved:</span>
                    <strong>{formatDate(animal.approvedAt)}</strong>
                  </div>
                )}
                {animal.rejectionReason && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexBasis: '100%' }}>
                    <AlertCircle size={12} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span><span style={{ color: 'var(--text-muted)' }}>Rejected — Reason:</span> <strong style={{ color: 'var(--color-danger)' }}>{animal.rejectionReason}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────── */}
        {animal.status === 'pending' && (
          <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--text-muted)', fontWeight: '700', cursor: 'pointer', fontSize: 13 }}>
              Close
            </button>
            <button
              onClick={() => onReject(animal)}
              disabled={isActionLoading}
              style={{ padding: '8px 18px', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--color-danger)', fontWeight: '700', cursor: isActionLoading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: isActionLoading ? 0.6 : 1 }}
            >
              Reject Listing
            </button>
            <button
              onClick={() => onApprove(animal)}
              disabled={isActionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: '700', cursor: isActionLoading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: isActionLoading ? 0.6 : 1 }}
            >
              {isActionLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : '✓ Approve & Release Live'}
            </button>
          </div>
        )}

        {animal.status !== 'pending' && (
          <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--text-main)', fontWeight: '700', cursor: 'pointer', fontSize: 13 }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
