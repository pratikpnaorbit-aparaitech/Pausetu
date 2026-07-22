import React, { useState, useContext } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Layers, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { loginAdmin } = useContext(AdminContext);

  const [email, setEmail] = useState('admin@pashusetu.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      await loginAdmin(email.trim(), password, rememberMe);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="enterprise-login-page">
      <div className="enterprise-login-card">
        {/* Official PashuSetu Logo & Branding Header */}
        <div className="enterprise-brand-header">
          <div className="enterprise-logo-box">
            <Layers size={28} color="#ffffff" />
          </div>
          <h1 className="enterprise-brand-title">PashuSetu</h1>
          <h2 className="enterprise-brand-subtitle">Administration Portal</h2>
          <p className="enterprise-brand-caption">
            Secure access for authorized administrators only
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="enterprise-error-alert" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="enterprise-login-form">
          {/* Email Field */}
          <div className="enterprise-form-group">
            <label className="enterprise-label" htmlFor="admin-email">
              Email Address
            </label>
            <div className="enterprise-input-wrapper">
              <Mail size={18} className="enterprise-input-icon" />
              <input
                id="admin-email"
                type="email"
                className="enterprise-input"
                placeholder="admin@pashusetu.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="enterprise-form-group">
            <label className="enterprise-label" htmlFor="admin-password">
              Password
            </label>
            <div className="enterprise-input-wrapper">
              <Lock size={18} className="enterprise-input-icon" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="enterprise-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="enterprise-toggle-pw"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="enterprise-options-row">
            <label className="enterprise-remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="enterprise-checkbox"
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="enterprise-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={19} className="spin-icon" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        {/* Enterprise Footer */}
        <div className="enterprise-footer">
          <p>&copy; {new Date().getFullYear()} PashuSetu</p>
          <p className="enterprise-footer-sub">Secure Administration Portal</p>
        </div>
      </div>
    </div>
  );
}
