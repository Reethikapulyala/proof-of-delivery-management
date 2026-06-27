import React, { useState } from 'react';
import { Mail, Lock, KeyRound, Eye, EyeOff, RefreshCw, Package, ArrowRight, ShieldCheck, User } from 'lucide-react';
import { loginUser } from '../api';

export default function Login({ onLoginSuccess, triggerToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await loginUser(email, password);
      triggerToast('Access Granted', `Welcome back, ${data.user.name}!`, 'success');
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
      triggerToast('Auth Failed', err.message || 'Verification rejected.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPreset = (presetEmail) => {
    setEmail(presetEmail);
    setPassword('admin123');
    setErrorMsg(null);
  };

  return (
    <div className="login-page-container">
      <style>{`
        .login-page-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          font-family: 'Outfit', 'Inter', sans-serif;
          padding: 1.5rem;
          box-sizing: border-box;
        }

        .login-card-new {
          display: flex;
          width: 100%;
          max-width: 920px;
          min-height: 560px;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
        }

        .login-left {
          flex: 1.1;
          background-color: #eef2ff;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .login-left-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-illustration-img {
          width: 100%;
          max-width: 340px;
          height: auto;
          align-self: center;
          margin: 1.5rem 0;
        }

        .login-left-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1e3a8a;
          line-height: 1.2;
          margin: 0;
        }

        .login-left-desc {
          font-size: 0.95rem;
          color: #475569;
          margin: 0.5rem 0 0 0;
          line-height: 1.5;
          font-weight: 500;
        }

        .login-right {
          flex: 0.9;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          background: #ffffff;
        }

        .login-right-form-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          flex-grow: 1;
        }

        .login-right-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .login-right-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0 0 1.75rem 0;
        }

        .login-input-wrapper-new {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .login-input-icon-new {
          position: absolute;
          left: 16px;
          color: #64748b;
        }

        .login-field-new {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 2.85rem;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          color: #0f172a;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .login-field-new:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }

        .login-toggle-pwd-new {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }

        .login-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #475569;
          cursor: pointer;
        }

        .login-forgot-link {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }

        .login-forgot-link:hover {
          text-decoration: underline;
        }

        .login-btn-submit-new {
          width: 100%;
          padding: 0.85rem;
          background: #4f46e5;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .login-btn-submit-new:hover:not(:disabled) {
          background: #4338ca;
        }

        .login-btn-submit-new:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer-new {
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 1.75rem;
        }

        .presets-container-new {
          margin-top: 1.25rem;
          border-top: 1px dashed #e2e8f0;
          padding-top: 0.75rem;
        }

        .presets-title-new {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
          letter-spacing: 0.5px;
          text-align: center;
        }

        .presets-grid-new {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.35rem;
        }

        .preset-btn-new {
          padding: 0.35rem 0.4rem;
          font-size: 0.7rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .preset-btn-new:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #4f46e5;
        }

        @media (max-width: 768px) {
          .login-card-new {
            flex-direction: column;
            max-width: 450px;
            min-height: auto;
          }
          .login-left {
            padding: 2rem;
          }
          .login-right {
            padding: 2rem;
          }
          .presets-grid-new {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="login-card-new">
        {/* Left column: Illustration & Info */}
        <div className="login-left">
          <img 
            src="./login_illustration.png" 
            alt="Proof of Delivery Illustration" 
            className="login-illustration-img"
          />
          <div className="login-left-content">
            <h2 className="login-left-title">
              Proof of Delivery<br />Management System
            </h2>
            <p className="login-left-desc">
              Delivering Excellence,<br />Everytime, Everywhere!
            </p>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="login-right">
          <div className="login-right-form-container">
            <h2 className="login-right-title">Welcome Back!</h2>
            <p className="login-right-subtitle">Please login to your account</p>

            {errorMsg && (
              <div className="login-error-alert" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: '#ef4444',
                fontSize: '0.8rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              {/* Username Input */}
              <div className="login-input-wrapper-new">
                <User size={18} className="login-input-icon-new" />
                <input 
                  type="text" 
                  className="login-field-new" 
                  placeholder="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Input */}
              <div className="login-input-wrapper-new">
                <Lock size={18} className="login-input-icon-new" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="login-field-new" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="login-toggle-pwd-new"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Options: Remember Me & Forgot Password */}
              <div className="login-options-row">
                <label className="login-checkbox-label">
                  <input type="checkbox" style={{ cursor: 'pointer' }} />
                  <span>Remember Me</span>
                </label>
                <a href="#forgot" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
                  Forgot Password?
                </a>
              </div>

              {/* Submit button */}
              <button type="submit" className="login-btn-submit-new" disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Quick Prefills */}
            <div className="presets-container-new">
              <div className="presets-title-new">Quick Role Prefills</div>
              <div className="presets-grid-new">
                <button type="button" className="preset-btn-new" onClick={() => applyPreset('admin@hkshipping.com')}>
                  Super Admin
                </button>
                <button type="button" className="preset-btn-new" onClick={() => applyPreset('transport@hkshipping.com')}>
                  Transport Admin
                </button>
                <button type="button" className="preset-btn-new" onClick={() => applyPreset('fleet@hkshipping.com')}>
                  Fleet Mgr
                </button>
                <button type="button" className="preset-btn-new" onClick={() => applyPreset('compliance@hkshipping.com')}>
                  Compliance Mgr
                </button>
                <button type="button" className="preset-btn-new" style={{ gridColumn: 'span 2' }} onClick={() => applyPreset('accounts@hkshipping.com')}>
                  Accounts Staff
                </button>
              </div>
            </div>
          </div>

          {/* Footer copyright */}
          <div className="login-footer-new">
            © 2026 POD Management System
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Alert icon component to prevent import breaks
function AlertTriangle(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
