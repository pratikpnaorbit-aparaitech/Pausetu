import React, { useContext } from 'react';
import { AdminContext } from '../context/AdminContext';

export default function SettingsPage() {
  const {
    generalSettings,
    setGeneralSettings,
    passwordForm,
    setPasswordForm,
    showToast
  } = useContext(AdminContext);

  return (
    <div style={{ animation: 'fadeIn 0.25s', display: 'flex', gap: 24 }}>
      {/* Application Config Forms */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: '700' }}>General Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Application Title</label>
              <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={generalSettings.appName} onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: '700', color: 'var(--text-heading)' }}>Auto-Approve Listings</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>Automatically approve and list livestock post upload</span>
              </div>
              <Switch isChecked={generalSettings.autoApprove} toggle={() => setGeneralSettings({ ...generalSettings, autoApprove: !generalSettings.autoApprove })} />
            </div>
          </div>
        </div>

        {/* Admin profile and Password fields */}
        <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: '700' }}>Admin Credentials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Current Password</label>
              <input type="password" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>New Password</label>
              <input type="password" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </div>
            <button
              onClick={() => {
                showToast('Password Saved Successfully!');
                setPasswordForm({ oldPassword: '', newPassword: '', confirmNew: '' });
              }}
              style={{ width: 'fit-content', padding: '8px 16px', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', fontSize: 13, alignSelf: 'flex-end', marginTop: 12 }}
            >
              Update Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline switch component
function Switch({ isChecked, toggle }) {
  return (
    <button
      onClick={toggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: isChecked ? 'var(--color-primary)' : '#cbd5e1',
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        transition: 'background-color 0.2s',
        padding: 0
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: '#fff',
          position: 'absolute',
          top: 3,
          left: isChecked ? 23 : 3,
          transition: 'left 0.2s'
        }}
      />
    </button>
  );
}
