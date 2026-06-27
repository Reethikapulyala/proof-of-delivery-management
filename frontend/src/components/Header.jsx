import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown, User, LogOut, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function Header({ 
  activeView, 
  activeSubView,
  onMenuToggle, 
  notifications, 
  onMarkAllAsRead, 
  onMarkAsRead,
  userProfile,
  onViewChange,
  onLogout
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getViewTitle = () => {
    if (activeView === 'shipments') {
      switch (activeSubView) {
        case 'shipments_core': return 'Cargo Tracker';
        case 'fleet': return 'Fleet Registry';
        case 'drivers': return 'Driver Directory';
        case 'crm': return 'Customers CRM';
        case 'invoices': return 'Invoices & GST';
        case 'pricing': return 'Freight Pricing';
        case 'compliance': return 'Document Compliance';
        case 'history': return 'Delivery History';
        case 'reports': return 'Reports Center';
        case 'analytics': return 'Business Analytics';
        case 'users': return 'User Management';
        case 'notifications': return 'Notification Hub';
        case 'logs': return 'Audit Logs';
        case 'settings': return 'Settings';
        default: return 'Shipments Tracking';
      }
    }

    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'pod-form': return 'Proof of Delivery (POD) Form';
      case 'history': return 'Delivery History Logs';
      case 'reports': return 'Reports Center';
      case 'analytics': return 'Executive Business Analytics';
      case 'settings': return 'System Settings';
      default: return 'HK Shipping POD System';
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
      case 'warning': return <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />;
      default: return <Clock size={16} style={{ color: 'var(--info)' }} />;
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onMenuToggle}>
          <Menu size={22} />
        </button>
        <h2 className="view-header-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>
          {getViewTitle()}
        </h2>
      </div>

      <div className="header-right">
        {/* Notifications Dropdown */}
        <div className="position-relative" style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="header-action-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge-dot" />}
          </button>

          {showNotifications && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="dropdown-footer-btn" onClick={onMarkAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <ul className="dropdown-list">
                {notifications.length === 0 ? (
                  <li className="dropdown-item" style={{ justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    No new notifications
                  </li>
                ) : (
                  notifications.map((notif) => (
                    <li 
                      key={notif.id} 
                      className={`dropdown-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => onMarkAsRead(notif.id)}
                    >
                      <div className="toast-icon" style={{ marginTop: '0.15rem' }}>
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="dropdown-item-content">
                        <div className="dropdown-item-title">{notif.title}</div>
                        <div className="dropdown-item-desc">{notif.message}</div>
                        <div className="dropdown-item-time">{notif.time}</div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              <div className="dropdown-footer" style={{ padding: '0.5rem', textAlign: 'center' }}>
                <button 
                  className="dropdown-footer-btn"
                  onClick={() => {
                    onViewChange('notifications');
                    setShowNotifications(false);
                  }}
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="position-relative" style={{ position: 'relative' }} ref={profileRef}>
          <button 
            className="user-profile-trigger"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="avatar">
              {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD'}
            </div>
            <div className="avatar-info">
              <div className="avatar-name">{userProfile.name}</div>
              <div className="avatar-role">{userProfile.role}</div>
            </div>
            <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu" style={{ width: '220px' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                <div className="avatar" style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem auto', fontSize: '1.25rem' }}>
                  {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD'}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{userProfile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{userProfile.email}</div>
              </div>
              <ul className="dropdown-list">
                <li className="dropdown-item" onClick={() => { onViewChange('settings'); setShowProfileMenu(false); }}>
                  <User size={16} />
                  <span style={{ fontSize: '0.85rem' }}>My Profile</span>
                </li>
              </ul>
              <div className="dropdown-footer" style={{ padding: '0.5rem' }}>
                <button 
                  className="dropdown-footer-btn" 
                  style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
