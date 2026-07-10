import React, { useContext } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { AdminContext } from '../context/AdminContext';

export default function ConfirmModal({ modalState, onClose, onExecute }) {
  const { isActionLoading } = useContext(AdminContext);

  if (!modalState.visible) return null;

  const isDangerous = ['Delete', 'Logout', 'Reject'].includes(modalState.type);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 460, backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <div style={{
            flexShrink: 0, width: 44, height: 44, borderRadius: '50%',
            backgroundColor: isDangerous ? 'rgba(239, 68, 68, 0.1)' : 'rgba(22, 163, 74, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isDangerous
              ? <AlertTriangle color="var(--color-danger)" size={22} />
              : <CheckCircle2 color="var(--color-primary)" size={22} />
            }
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 6px' }}>
              {modalState.type} Confirmation
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              {modalState.message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
            onClick={onExecute}
            disabled={isActionLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 20px', border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isDangerous ? 'var(--color-danger)' : 'var(--color-primary)',
              color: '#fff',
              cursor: isActionLoading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: '700',
              opacity: isActionLoading ? 0.6 : 1
            }}
          >
            {isActionLoading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
              : `Confirm ${modalState.type}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
