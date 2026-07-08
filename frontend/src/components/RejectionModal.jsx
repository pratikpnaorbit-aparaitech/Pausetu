import React from 'react';
import { XCircle } from 'lucide-react';

export default function RejectionModal({ modalState, onClose, onExecute, onChangeReason }) {
  if (!modalState.visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 480, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <XCircle color="var(--color-danger)" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: '700', color: 'var(--text-dark)', marginBottom: 8 }}>Reject Animal Listing</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>Please state the reason for rejecting the listing. The seller will be notified immediately.</p>
            <textarea
              style={{ width: '100%', minHeight: 100, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 14, outline: 'none', resize: 'vertical' }}
              placeholder="e.g., Photos are blurred / Video lacks walkthrough / Inaccurate specifications..."
              value={modalState.reason}
              onChange={(e) => onChangeReason(e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justify: 'flex-end', gap: 12 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, fontWeight: '600' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onExecute(modalState.data, modalState.reason)}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: '700' }}
          >
            Reject Listing
          </button>
        </div>
      </div>
    </div>
  );
}
