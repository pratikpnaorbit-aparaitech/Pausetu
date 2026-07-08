import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ modalState, onClose, onExecute }) {
  if (!modalState.visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 440, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <AlertTriangle color="var(--color-warning)" size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: '700', color: 'var(--text-dark)', marginBottom: 8 }}>{modalState.type} Confirmation</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{modalState.message}</p>
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
            onClick={onExecute}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-sm)', backgroundColor: modalState.type === 'Delete' || modalState.type === 'Logout' ? 'var(--color-danger)' : 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: '700' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
