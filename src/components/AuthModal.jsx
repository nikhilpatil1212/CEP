import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, AlertCircle, Sparkles, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login', 
  promptMessage = '', 
  onSuccess 
}) {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'reset'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: 'PICT Pune',
    role: 'Student Builder'
  });
  const [resetData, setResetData] = useState({
    email: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      await login(loginData.email, loginData.password);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (registerData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(
        registerData.name,
        registerData.email,
        registerData.password,
        registerData.confirmPassword,
        registerData.college,
        registerData.role
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (resetData.newPassword !== resetData.confirmNewPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (resetData.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPassword(resetData.email, resetData.newPassword, resetData.confirmNewPassword);
      setSuccessMsg(res.message || 'Password reset successfully!');
      setLoginData(prev => ({ ...prev, email: resetData.email, password: '' }));
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('Password updated! Please log in with your new password.');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Please check your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '460px' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.35rem' }}>
              {mode === 'reset' ? 'Account Recovery' : 'Student Authentication'}
            </span>
            <h2 className="modal-title" style={{ fontSize: '1.35rem' }}>
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Student Account'}
              {mode === 'reset' && 'Reset Your Password'}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Prompt message banner if redirected from protected action */}
        {promptMessage && mode !== 'reset' && (
          <div style={{
            margin: '0 1.5rem 0.5rem',
            padding: '0.65rem 0.85rem',
            background: 'var(--primary-light)',
            border: '1px solid #c7d2fe',
            color: 'var(--primary)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} />
            <span>{promptMessage}</span>
          </div>
        )}

        {/* Tab switch buttons (Shown for Login and Register) */}
        {mode !== 'reset' && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            margin: '0 1.5rem 1.25rem',
            gap: '0.5rem'
          }}>
            <button
              type="button"
              className={`category-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ flex: 1, textAlign: 'center', padding: '0.55rem 0' }}
            >
              Log In
            </button>
            <button
              type="button"
              className={`category-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              style={{ flex: 1, textAlign: 'center', padding: '0.55rem 0' }}
            >
              Register
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div style={{
            margin: '0 1.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--accent-emerald-light)',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div style={{
            margin: '0 1.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'var(--accent-rose-light)',
            border: '1px solid #fecdd3',
            color: 'var(--accent-rose)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'login' && (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit}>
            <div className="modal-body" style={{ paddingTop: 0 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Student Email <span className="required-star">*</span>
                </label>
                <input 
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. onkar.patil@pict.edu"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="login-password">
                  Password <span className="required-star">*</span>
                </label>
                <input 
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {/* Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button 
                  type="button" 
                  id="forgot-password-trigger"
                  onClick={() => { 
                    setResetData(prev => ({ ...prev, email: loginData.email }));
                    setMode('reset'); 
                    setErrorMsg(''); 
                    setSuccessMsg(''); 
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary)', 
                    fontSize: '0.82rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Demo Hint */}
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                background: '#f8fafc',
                border: '1px dashed var(--border)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                💡 <em>Demo account: <strong>onkar.patil@pict.edu</strong> / <strong>Password123!</strong></em>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                id="submit-login-btn"
                disabled={isSubmitting}
              >
                <LogIn size={15} />
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div className="modal-body" style={{ paddingTop: 0 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">
                  Full Name <span className="required-star">*</span>
                </label>
                <input 
                  id="register-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Priya Sharma"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">
                  Student Email <span className="required-star">*</span>
                </label>
                <input 
                  id="register-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. priya.sharma@college.edu"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="register-college">
                    College / Campus
                  </label>
                  <input 
                    id="register-college"
                    type="text"
                    className="form-input"
                    placeholder="e.g. PICT Pune"
                    value={registerData.college}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, college: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-role">
                    Role / Major
                  </label>
                  <input 
                    id="register-role"
                    type="text"
                    className="form-input"
                    placeholder="e.g. UI/UX & React"
                    value={registerData.role}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, role: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="register-password">
                    Password <span className="required-star">*</span>
                  </label>
                  <input 
                    id="register-password"
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="register-confirm">
                    Confirm Password <span className="required-star">*</span>
                  </label>
                  <input 
                    id="register-confirm"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                id="submit-register-btn"
                disabled={isSubmitting}
              >
                <UserPlus size={15} />
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        )}

        {mode === 'reset' && (
          /* RESET PASSWORD FORM */
          <form onSubmit={handleResetSubmit}>
            <div className="modal-body" style={{ paddingTop: 0 }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Enter your registered student email and a new password below to reset your account credentials.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">
                  Registered Email Address <span className="required-star">*</span>
                </label>
                <input 
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. onkar.patil@pict.edu"
                  value={resetData.email}
                  onChange={(e) => setResetData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-new-password">
                  New Password <span className="required-star">*</span>
                </label>
                <input 
                  id="reset-new-password"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm-password">
                  Confirm New Password <span className="required-star">*</span>
                </label>
                <input 
                  id="reset-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={resetData.confirmNewPassword}
                  onChange={(e) => setResetData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ArrowLeft size={15} />
                <span>Back to Log In</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  id="submit-reset-password-btn"
                  disabled={isSubmitting}
                >
                  <KeyRound size={15} />
                  <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
