import React, { useContext, useState, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Save, Shield, Sliders } from 'lucide-react';
import { verificationApi } from '../api/verificationApi';

// Reusable form field
function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

// Section card wrapper
function SettingsSection({ icon: Icon, title, children }) {
  return (
    <div className="card-flat" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color="var(--color-primary)" />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: '700', color: 'var(--text-heading)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// Polished switch toggle
function Switch({ isChecked, toggle, label }) {
  return (
    <button
      className="switch"
      onClick={toggle}
      role="switch"
      aria-checked={isChecked}
      aria-label={label}
      style={{ backgroundColor: isChecked ? 'var(--color-primary)' : '#d1d5db' }}
    >
      <div className="switch-thumb" style={{ left: isChecked ? 23 : 3 }} />
    </button>
  );
}

export default function SettingsPage() {
  const { generalSettings, setGeneralSettings, passwordForm, setPasswordForm, showToast } = useContext(AdminContext);

  const [verificationSettings, setVerificationSettings] = useState({
    verificationMode: 'manual',
    maxUploadSize: 5,
    allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp', 'pdf']
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchVerificationSettings = async () => {
      const data = await verificationApi.getSettings();
      if (data) {
        setVerificationSettings({
          verificationMode: data.verificationMode || 'manual',
          maxUploadSize: data.maxUploadSize || 5,
          allowedFileTypes: data.allowedFileTypes || ['jpeg', 'jpg', 'png', 'webp', 'pdf']
        });
      }
    };
    fetchVerificationSettings();
  }, []);

  const handleSaveVerificationSettings = async () => {
    setSavingSettings(true);
    try {
      const success = await verificationApi.updateSettings(verificationSettings);
      if (success) {
        showToast('Verification settings saved successfully!');
      } else {
        alert('Failed to save verification settings.');
      }
    } catch (e) {
      alert(e.message || 'Error saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.22s both' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage application configuration and admin credentials.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left col */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SettingsSection icon={Sliders} title="General Configuration">
            <Field label="Application Title">
              <input
                className="input"
                type="text"
                value={generalSettings.appName}
                onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                placeholder="PashuSetu Admin"
              />
            </Field>

            <Field label="Max Photos Per Listing">
              <input
                className="input"
                type="number"
                min={1} max={20}
                value={generalSettings.maxPhotos}
                onChange={(e) => setGeneralSettings({ ...generalSettings, maxPhotos: e.target.value })}
              />
            </Field>

            <Field label="SMTP Host">
              <input
                className="input"
                type="text"
                value={generalSettings.smtpHost}
                onChange={(e) => setGeneralSettings({ ...generalSettings, smtpHost: e.target.value })}
                placeholder="smtp.brevo.com"
              />
            </Field>

            {/* Auto-Approve toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
            }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: '700', color: 'var(--text-heading)' }}>
                  Auto-Approve Listings
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                  Automatically publish listings without admin review
                </p>
              </div>
              <Switch
                isChecked={generalSettings.autoApprove}
                toggle={() => setGeneralSettings({ ...generalSettings, autoApprove: !generalSettings.autoApprove })}
                label="Toggle auto-approve"
              />
            </div>

            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end' }}
              onClick={() => showToast('General settings saved!')}
            >
              <Save size={13} /> Save Settings
            </button>
          </SettingsSection>
        </div>

        {/* Right col */}
        <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SettingsSection icon={Shield} title="Admin Credentials">
            <Field label="Current Password">
              <input
                className="input"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </Field>

            <Field label="New Password">
              <input
                className="input"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                className="input"
                type="password"
                value={passwordForm.confirmNew}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmNew: e.target.value })}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </Field>

            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end' }}
              onClick={() => {
                showToast('Credentials updated successfully!');
                setPasswordForm({ oldPassword: '', newPassword: '', confirmNew: '' });
              }}
            >
              <Shield size={13} /> Update Credentials
            </button>
          </SettingsSection>

          <SettingsSection icon={Shield} title="Verification Settings">
            {/* Mode selection radio list */}
            <Field label="Verification Mode">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="radio"
                    name="verificationMode"
                    value="manual"
                    checked={verificationSettings.verificationMode === 'manual'}
                    onChange={() => setVerificationSettings({ ...verificationSettings, verificationMode: 'manual' })}
                  />
                  <span>Manual Verification (Default)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="radio"
                    name="verificationMode"
                    value="auto"
                    checked={verificationSettings.verificationMode === 'auto'}
                    onChange={() => setVerificationSettings({ ...verificationSettings, verificationMode: 'auto' })}
                  />
                  <span>Automatic Verification (Approve immediately)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text-main)' }}>
                  <input
                    type="radio"
                    name="verificationMode"
                    value="ocr_manual"
                    checked={verificationSettings.verificationMode === 'ocr_manual'}
                    onChange={() => setVerificationSettings({ ...verificationSettings, verificationMode: 'ocr_manual' })}
                  />
                  <span>OCR + Manual Review (Future)</span>
                </label>
              </div>
            </Field>

            {/* Auto Approval Toggle (Syncs with verificationMode === 'auto') */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
            }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: '700', color: 'var(--text-heading)' }}>
                  Auto-Approve Receipts
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                  Approve farmer verification immediately on upload
                </p>
              </div>
              <Switch
                isChecked={verificationSettings.verificationMode === 'auto'}
                toggle={() => setVerificationSettings({
                  ...verificationSettings,
                  verificationMode: verificationSettings.verificationMode === 'auto' ? 'manual' : 'auto'
                })}
                label="Toggle auto-approve receipts"
              />
            </div>

            <Field label="Maximum Upload Size (MB)">
              <input
                className="input"
                type="number"
                min={1}
                value={verificationSettings.maxUploadSize}
                onChange={(e) => setVerificationSettings({ ...verificationSettings, maxUploadSize: Number(e.target.value) })}
              />
            </Field>

            <Field label="Allowed File Types">
              <input
                className="input"
                type="text"
                value={verificationSettings.allowedFileTypes.join(', ')}
                onChange={(e) => setVerificationSettings({
                  ...verificationSettings,
                  allowedFileTypes: e.target.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
                })}
                placeholder="e.g. jpeg, jpg, png, webp, pdf"
              />
            </Field>

            <button
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-end' }}
              onClick={handleSaveVerificationSettings}
              disabled={savingSettings}
            >
              <Save size={13} /> {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
