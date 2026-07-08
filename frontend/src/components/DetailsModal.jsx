import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Activity, Check, Info } from 'lucide-react';

export default function DetailsModal({ modalState, onClose, onApprove, onReject }) {
  const { visible, data: animal } = modalState;
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!visible || !animal) return null;

  const photoList = animal.photos || [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '80%', maxWidth: 850, maxHeight: '90vh', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: '800', color: 'var(--text-heading)' }}>Review Listing Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content Layout */}
        <div style={{ padding: 24, display: 'flex', gap: 24, flexDirection: 'row', flexWrap: 'wrap' }}>
          
          {/* Left Media Block */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Main Photo */}
            <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {photoList.length > 0 ? (
                <img src={photoList[activePhotoIdx]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Livestock" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Photo Attached</div>
              )}
              {animal.negotiable && (
                <span style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'var(--color-primary)', color: '#fff', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: '700' }}>
                  Negotiable
                </span>
              )}
            </div>

            {/* Thumbnail carousel strip */}
            {photoList.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {photoList.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    style={{ width: 60, height: 60, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: idx === activePhotoIdx ? '2.5px solid var(--color-primary)' : '1px solid var(--border-color)', cursor: 'pointer', padding: 0 }}
                  >
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </button>
                ))}
              </div>
            )}

            {/* Video Player */}
            {animal.video && (
              <div style={{ marginTop: 8 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: '700', color: 'var(--text-heading)' }}>Attached Verification Video</h4>
                <video src={animal.video} controls style={{ width: '100%', borderRadius: 'var(--radius-md)', backgroundColor: '#000', maxHeight: 180 }} />
              </div>
            )}
          </div>

          {/* Right Info Panels */}
          <div style={{ flex: '1.2 1 400px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Title / Price */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: '800', color: 'var(--text-heading)' }}>{animal.title}</h2>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status: {animal.status}</span>
                </div>
                <span style={{ fontSize: 24, fontWeight: '900', color: 'var(--color-primary)' }}>₹{animal.price.toLocaleString()}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>{animal.description}</p>
            </div>

            {/* Livestock Details */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={14} color="var(--color-info)" />
                <span>Animal Traits</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{animal.gender || 'Female'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Age:</span> <strong>{animal.age || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Weight:</span> <strong>{animal.weight ? `${animal.weight} kg` : 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Color:</span> <strong>{animal.color || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Health Checklist */}
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: 14 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="var(--color-primary)" />
                <span>Health Report</span>
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, backgroundColor: '#fff', padding: '6px 12px', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Check size={14} color="var(--color-primary)" />
                  <span>Vaccinated: {animal.health?.vaccinated ? 'Yes' : 'No'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, backgroundColor: '#fff', padding: '6px 12px', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Check size={14} color="var(--color-primary)" />
                  <span>Healthy: {animal.health?.healthy ? 'Yes' : 'No'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, backgroundColor: '#fff', padding: '6px 12px', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Check size={14} color="var(--color-primary)" />
                  <span>Pregnant: {animal.health?.pregnant ? 'Yes' : 'No'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, backgroundColor: '#fff', padding: '6px 12px', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Check size={14} color="var(--color-primary)" />
                  <span>Daily Yield: {animal.health?.milkCapacity || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Seller & Location details */}
            <div style={{ display: 'flex', gap: 12, flexDirection: 'row', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: '700', color: 'var(--text-heading)' }}>Seller Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: '700' }}>{animal.sellerName}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {animal.mobile || 'N/A'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} /> {animal.email || 'N/A'}</span>
                </div>
              </div>

              <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: '700', color: 'var(--text-heading)' }}>Address Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {animal.village}, {animal.district}</span>
                  <span>{animal.state}</span>
                  {animal.latitude && <span>GPS: {animal.latitude.toFixed(4)}, {animal.longitude?.toFixed(4)}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={() => onReject(animal)}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--color-danger)', fontWeight: '700', cursor: 'pointer', fontSize: 13 }}
          >
            Reject Listing
          </button>
          <button
            onClick={() => onApprove(animal)}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: 13 }}
          >
            Approve & Release Live
          </button>
        </div>

      </div>
    </div>
  );
}
