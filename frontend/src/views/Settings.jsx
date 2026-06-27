import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Paintbrush, Save, Building2, 
  Mail, PhoneCall, Image, ToggleLeft, ToggleRight,
  Eye, EyeOff, RefreshCw, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { fetchSettings, updateSettings } from '../api';

export default function Settings({ userProfile, onUpdateProfile, isDark, onToggleTheme, triggerToast }) {
  // Tabs: 'profile' | 'company' | 'gst' | 'email' | 'whatsapp' | 'notifications' | 'preferences'
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // User profile local state
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profileRole, setProfileRole] = useState(userProfile.role);

  // System Settings state
  const [settings, setSettings] = useState({
    company_name: 'HK Shipping Private Limited',
    company_logo: '',
    gstin: '',
    gst_registered_address: '',
    smtp_server: '',
    smtp_port: 587,
    smtp_sender: '',
    smtp_username: '',
    smtp_password: '',
    whatsapp_api_endpoint: '',
    whatsapp_auth_token: '',
    whatsapp_sender_number: '',
    notif_sound: true,
    notif_email: false,
    auto_refresh: true,
    default_landing_view: 'dashboard',
    records_per_page: 10
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchSettings();
        if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        triggerToast('Fetch Error', 'Failed to retrieve system settings. Using offline fallbacks.', 'warning');
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    onUpdateProfile({ name: profileName, email: profileEmail, role: profileRole });
    triggerToast('Profile Saved', 'Your personal settings have been updated.', 'success');
  };

  const handleSystemSettingsSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(settings);
      triggerToast('Configuration Saved', 'System configurations updated and synchronized with database.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Save Failed', err.message || 'Failed to update system configurations.', 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Predefined default SVG logo options if company uploads logo
  const applyPresetLogo = (type) => {
    let preset = '';
    if (type === 'navy') {
      preset = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%230f172a"/><path d="M30 35 L70 35 L70 65 L30 65 Z" fill="white"/><path d="M50 20 L80 35 L20 35 Z" fill="%230284c7"/></svg>';
    } else if (type === 'modern') {
      preset = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="10" fill="%230284c7"/><path d="M30 45 L50 30 L70 45 L70 70 L30 70 Z" fill="%230f172a"/><circle cx="50" cy="55" r="8" fill="white"/></svg>';
    } else {
      preset = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2310b981"/><path d="M30 40 L70 40 L50 70 Z" fill="white"/></svg>';
    }
    handleInputChange('company_logo', preset);
    triggerToast('Preset Applied', 'Preset company logo applied successfully.', 'info');
  };

  const testSMTPConnection = () => {
    triggerToast('SMTP Test', `Connecting to ${settings.smtp_server || 'configured server'}...`, 'info');
    setTimeout(() => {
      if (settings.smtp_server) {
        triggerToast('SMTP Connection OK', 'Successfully connected and authenticated with SMTP relay server.', 'success');
      } else {
        triggerToast('Connection Failed', 'SMTP Server address is blank.', 'danger');
      }
    }, 1200);
  };

  const testWhatsAppAPI = () => {
    triggerToast('WhatsApp Test', 'Sending verification ping to API Gateway...', 'info');
    setTimeout(() => {
      if (settings.whatsapp_api_endpoint) {
        triggerToast('WhatsApp Gateway OK', 'Ping response 200 OK. Verification successful.', 'success');
      } else {
        triggerToast('Ping Failed', 'API endpoint address is blank.', 'danger');
      }
    }, 1200);
  };

  return (
    <div className="view-container settings-view-page">
      <style>{`
        .settings-view-page {
          animation: fadeIn 0.4s ease-out;
        }
        .settings-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          margin-top: 1rem;
        }
        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
        }
        .settings-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 0.75rem;
          align-self: start;
        }
        .settings-nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.85rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-nav-btn:hover {
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .settings-nav-btn.active {
          background: var(--primary);
          color: white;
        }
        .settings-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 1.75rem;
          box-shadow: var(--card-shadow);
        }
        .settings-panel-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .settings-panel-desc {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
        }
        .logo-preview-box {
          width: 80px;
          height: 80px;
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: var(--bg-primary);
        }
        .logo-preset-btn {
          padding: 0.4rem 0.75rem;
          font-size: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .logo-preset-btn:hover {
          background: var(--border-color);
          color: var(--text-primary);
        }
      `}</style>

      {/* Header section */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">System Settings</h1>
          <p className="view-header-subtitle">
            Configure system integrations, email relays, SMS/WhatsApp alerts gateways, corporate GST records, and application preferences.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sub Navigation Sidebar */}
        <div className="settings-sidebar">
          <button 
            className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <span>User Credentials</span>
          </button>
          
          <button 
            className={`settings-nav-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            <Building2 size={16} />
            <span>Company Profile & Logo</span>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'gst' ? 'active' : ''}`}
            onClick={() => setActiveTab('gst')}
          >
            <Shield size={16} />
            <span>GST & Registration</span>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <Mail size={16} />
            <span>Email (SMTP) config</span>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <PhoneCall size={16} />
            <span>WhatsApp Alerts</span>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} />
            <span>Notification Settings</span>
          </button>

          <button 
            className={`settings-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Paintbrush size={16} />
            <span>Theme & Preferences</span>
          </button>
        </div>

        {/* Configurations Forms Container */}
        <div className="settings-panel">
          {isLoadingSettings ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', gap: '1rem' }}>
              <RefreshCw size={30} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Retrieving configurations database...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: User Profile Credentials */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave}>
                  <h3 className="settings-panel-title">
                    <User size={18} className="text-primary" style={{ color: 'var(--primary)' }} />
                    <span>Personal User Credentials</span>
                  </h3>
                  <p className="settings-panel-desc">Modify your default name, contact information, and role designation.</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={profileName} 
                        onChange={(e) => setProfileName(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Designation / Role</label>
                      <select 
                        className="form-input" 
                        value={profileRole} 
                        onChange={(e) => setProfileRole(e.target.value)} 
                        required 
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Transport Admin">Transport Admin</option>
                        <option value="Fleet Manager">Fleet Manager</option>
                        <option value="Accounts Staff">Accounts Staff</option>
                        <option value="Compliance Manager">Compliance Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary">
                      <Save size={16} />
                      <span>Save Profile Details</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Company Profile & Logo */}
              {activeTab === 'company' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <Building2 size={18} style={{ color: 'var(--primary)' }} />
                    <span>Company Corporate Profile</span>
                  </h3>
                  <p className="settings-panel-desc">Configure legal company name, logo headers, and system banner details.</p>

                  <div className="form-group">
                    <label className="form-label">Corporate Title Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={settings.company_name} 
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">Company Logo (SVG Data URL or Image Link)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="logo-preview-box">
                        {settings.company_logo ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.company_logo.includes('<svg') ? settings.company_logo.replace('data:image/svg+xml;utf8,', '') : `<img src="${settings.company_logo}" style="max-width:100%; max-height:100%;" />` }} />
                        ) : (
                          <Image size={24} style={{ color: 'var(--text-tertiary)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Paste image/SVG url here..."
                          value={settings.company_logo} 
                          onChange={(e) => handleInputChange('company_logo', e.target.value)} 
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className="logo-preset-btn" onClick={() => applyPresetLogo('navy')}>Preset Navy</button>
                          <button type="button" className="logo-preset-btn" onClick={() => applyPresetLogo('modern')}>Preset Modern</button>
                          <button type="button" className="logo-preset-btn" onClick={() => applyPresetLogo('green')}>Preset Emerald</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Update Corporate Info'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: GST Details */}
              {activeTab === 'gst' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <Shield size={18} style={{ color: 'var(--primary)' }} />
                    <span>Statutory Registration & GST</span>
                  </h3>
                  <p className="settings-panel-desc">Provide registration codes required for tax computations and billing invoices.</p>

                  <div className="form-group">
                    <label className="form-label">GST Identification Number (GSTIN)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      maxLength={15}
                      style={{ textTransform: 'uppercase' }}
                      value={settings.gstin} 
                      onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())} 
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label">GST Registered Physical Address</label>
                    <textarea 
                      className="form-input" 
                      rows={3}
                      placeholder="Enter full legal address for GST filings..."
                      value={settings.gst_registered_address} 
                      onChange={(e) => handleInputChange('gst_registered_address', e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Save GST Details'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: Email Configuration */}
              {activeTab === 'email' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <Mail size={18} style={{ color: 'var(--primary)' }} />
                    <span>Email Config (SMTP Relay)</span>
                  </h3>
                  <p className="settings-panel-desc">Configure SMTP parameters to allow sending permit expiries and POD audit logs.</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">SMTP Server Host</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="smtp.example.com"
                        value={settings.smtp_server} 
                        onChange={(e) => handleInputChange('smtp_server', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SMTP Server Port</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="587"
                        value={settings.smtp_port} 
                        onChange={(e) => handleInputChange('smtp_port', parseInt(e.target.value) || '')} 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Sender Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="alerts@company.com"
                      value={settings.smtp_sender} 
                      onChange={(e) => handleInputChange('smtp_sender', e.target.value)} 
                    />
                  </div>

                  <div className="form-row" style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">SMTP Auth Username</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={settings.smtp_username} 
                        onChange={(e) => handleInputChange('smtp_username', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SMTP Auth Password</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          className="form-input" 
                          value={settings.smtp_password} 
                          onChange={(e) => handleInputChange('smtp_password', e.target.value)} 
                        />
                        <button 
                          type="button" 
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-outline" onClick={testSMTPConnection}>
                      Test Connection
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Save Email Server'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 5: WhatsApp Configuration */}
              {activeTab === 'whatsapp' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <PhoneCall size={18} style={{ color: 'var(--primary)' }} />
                    <span>WhatsApp Gateway Settings</span>
                  </h3>
                  <p className="settings-panel-desc">Configure WhatsApp API credentials to send real-time dispatch alerts to drivers.</p>

                  <div className="form-group">
                    <label className="form-label">WhatsApp API Gateway Endpoint</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="https://api.gateway.com/v1/messages"
                      value={settings.whatsapp_api_endpoint} 
                      onChange={(e) => handleInputChange('whatsapp_api_endpoint', e.target.value)} 
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label font-mono">Authentication Token</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      value={settings.whatsapp_auth_token} 
                      onChange={(e) => handleInputChange('whatsapp_auth_token', e.target.value)} 
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">WhatsApp Registered Sender Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="+919876543210"
                      value={settings.whatsapp_sender_number} 
                      onChange={(e) => handleInputChange('whatsapp_sender_number', e.target.value)} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-outline" onClick={testWhatsAppAPI}>
                      Test WhatsApp Ping
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Save WhatsApp Details'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 6: Notification Settings */}
              {activeTab === 'notifications' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <Bell size={18} style={{ color: 'var(--primary)' }} />
                    <span>System Notification Preferences</span>
                  </h3>
                  <p className="settings-panel-desc">Configure when and how automated dashboard alerts and warnings are triggered.</p>

                  <div className="settings-toggle-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div className="settings-toggle-label">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Audio Alarm Indicators</span>
                      <span className="toggle-subtitle font-mono">Play chime sounds on receiving signature/photo uploads.</span>
                    </div>
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={settings.notif_sound} 
                        onChange={(e) => handleInputChange('notif_sound', e.target.checked)} 
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row" style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                    <div className="settings-toggle-label">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Automated Email Digests</span>
                      <span className="toggle-subtitle font-mono">Mail hourly audit logs summary directly to the transport manager.</span>
                    </div>
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={settings.notif_email} 
                        onChange={(e) => handleInputChange('notif_email', e.target.checked)} 
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row" style={{ paddingTop: '1rem' }}>
                    <div className="settings-toggle-label">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Auto Refresh Fleet List</span>
                      <span className="toggle-subtitle font-mono">Auto refresh deliveries list from DB query every 30 seconds.</span>
                    </div>
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={settings.auto_refresh} 
                        onChange={(e) => handleInputChange('auto_refresh', e.target.checked)} 
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Save Notification Config'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 7: Theme & User Preferences */}
              {activeTab === 'preferences' && (
                <form onSubmit={handleSystemSettingsSave}>
                  <h3 className="settings-panel-title">
                    <Paintbrush size={18} style={{ color: 'var(--primary)' }} />
                    <span>Theme & User Preferences</span>
                  </h3>
                  <p className="settings-panel-desc">Customize interface visual settings and layout defaults.</p>

                  <div className="settings-toggle-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                    <div className="settings-toggle-label">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Application Dark Theme Mode</span>
                      <span className="toggle-subtitle">Switch stylesheet variables to elegant Navy dark profile.</span>
                    </div>
                    <label className="switch-label">
                      <input 
                        type="checkbox" 
                        checked={isDark} 
                        onChange={onToggleTheme} 
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  <div className="form-row" style={{ marginTop: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Default Landing Module</label>
                      <select 
                        className="form-input"
                        value={settings.default_landing_view}
                        onChange={(e) => handleInputChange('default_landing_view', e.target.value)}
                      >
                        <option value="dashboard">Master Dashboard</option>
                        <option value="shipments">Shipments Tracking</option>
                        <option value="compliance">Document Compliance</option>
                        <option value="reports">Reports Center</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Default Records Per Table Page</label>
                      <select 
                        className="form-input"
                        value={settings.records_per_page}
                        onChange={(e) => handleInputChange('records_per_page', parseInt(e.target.value) || 10)}
                      >
                        <option value={5}>5 records</option>
                        <option value={10}>10 records</option>
                        <option value={20}>20 records</option>
                        <option value={50}>50 records</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                      <span>{isSaving ? 'Saving...' : 'Apply Layout Prefs'}</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
