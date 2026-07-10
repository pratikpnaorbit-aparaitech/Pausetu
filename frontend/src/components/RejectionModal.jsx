import React from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

export default function RejectionModal({ modalState, onClose, onExecute, onChangeReason }) {
  const { isActionLoading } = useContext(AdminContext);

  if (!modalState.visible) return null;

  const isReasonEmpty = !modalState.reason || modalState.reason.trim() === '';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 500, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <XCircle color="var(--color-danger)" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 4px' }}>
              Reject Animal Listing
            </h3>
            {modalState.data && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                "{modalState.data.title}"
              </p>
            )}
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
          A rejection reason is <strong>mandatory</strong>. The seller will be notified with this message so they can correct the listing.
        </p>

        {/* Reason textarea */}
        <textarea
          style={{
            width: '100%', minHeight: 110,
            border: `1.5px solid ${isReasonEmpty ? '#fca5a5' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-sm)', padding: '12px 14px',
            fontSize: 13, outline: 'none', resize: 'vertical',
            fontFamily: 'inherit', color: 'var(--text-main)',
            transition: 'border-color 0.2s'
          }}
          placeholder="e.g., Photos are blurred / Video lacks walkthrough / Inaccurate price / Missing health details…"
          value={modalState.reason}
          onChange={(e) => onChangeReason(e.target.value)}
          disabled={isActionLoading}
        />

        {/* Validation hint */}
        {isReasonEmpty && (
          <p style={{ fontSize: 11, color: 'var(--color-danger)', margin: '6px 0 0', fontWeight: '600' }}>
            ⚠ Rejection reason is required before submitting.
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            disabled={isActionLoading}
            style={{
              padding: '9px 18px', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', backgroundColor: '#fff',
              color: 'var(--text-muted)', cursor: isActionLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: '600', opacity: isActionLoading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => !isReasonEmpty && !isActionLoading && onExecute(modalState.data, modalState.reason)}
            disabled={isReasonEmpty || isActionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isReasonEmpty ? '#fca5a5' : 'var(--color-danger)',
              color: '#fff',
              cursor: (isReasonEmpty || isActionLoading) ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: '700',
              transition: 'background-color 0.2s'
            }}
          >
            {isActionLoading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Rejecting…</>
              : 'Confirm Rejection'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
