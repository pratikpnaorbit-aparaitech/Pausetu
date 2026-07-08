import React from 'react';

export default function HelpCenterPage() {
  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', marginBottom: 20 }}>Documentation & Support</h2>
      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 24, border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: '700' }}>Frequently Asked Questions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>How does the approval workflow operate?</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Farmers submit images and videos via the mobile app. Once submitted, listing metadata routes here in the Pending queue. Approvals post them publicly.</p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: '700', color: 'var(--text-heading)' }}>Can blocked sellers still view listings?</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No, blocked credentials trigger authentication rejection at OTP check and protect middleware on the server.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
