import React, { useState } from 'react';
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, AlertCircle, FileText, 
  CreditCard, Users, Trash2, Check, Filter, Calendar 
} from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'Shipment', title: 'New Shipment Booked', msg: 'Consignment HKS-601932 has been booked for HoloTech Systems.', time: '10 mins ago', read: false },
    { id: 2, type: 'POD', title: 'POD Document Uploaded', msg: 'Proof of Delivery photo and signature uploaded for HKS-802495.', time: '15 mins ago', read: false },
    { id: 3, type: 'Invoice', title: 'Invoice Generated', msg: 'Invoice INV-2026-1026 generated for HoloTech Systems (₹3,500.00).', time: '1 hr ago', read: true },
    { id: 4, type: 'Payment', title: 'Payment Received', msg: 'UPI Payment of ₹4,800.00 received from Nova Pharma Inc.', time: '3 hrs ago', read: true },
    { id: 5, type: 'Compliance', title: 'Compliance Expiry Warning', msg: 'Vehicle MH-12-GQ-5524 Fitness Certificate expires in 6 days.', time: '1 day ago', read: false },
    { id: 6, type: 'Driver', title: 'Driver Assignment Sync', msg: 'Driver John Miller assigned to vehicle MH-12-GQ-5524.', time: '1 day ago', read: true }
  ]);

  const [activeFilter, setActiveFilter] = useState('All'); // All, Unread, Shipments, Finance, Compliance

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'Shipment': return <Clock size={16} style={{ color: 'var(--info)' }} />;
      case 'POD': return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
      case 'Invoice': return <FileText size={16} style={{ color: 'var(--warning)' }} />;
      case 'Payment': return <CreditCard size={16} style={{ color: 'var(--success)' }} />;
      case 'Compliance': return <AlertTriangle size={16} style={{ color: 'var(--danger)' }} />;
      case 'Driver': return <Users size={16} style={{ color: 'var(--primary)' }} />;
      default: return <Bell size={16} style={{ color: 'var(--text-tertiary)' }} />;
    }
  };

  const getNotifColor = (type) => {
    switch (type) {
      case 'Shipment': return 'var(--info-light)';
      case 'POD': return 'var(--success-light)';
      case 'Invoice': return 'var(--warning-light)';
      case 'Payment': return 'var(--success-light)';
      case 'Compliance': return 'var(--danger-light)';
      case 'Driver': return 'var(--primary-light)';
      default: return 'var(--bg-secondary)';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Unread') return !n.read;
    if (activeFilter === 'Shipments') return n.type === 'Shipment' || n.type === 'POD' || n.type === 'Driver';
    if (activeFilter === 'Finance') return n.type === 'Invoice' || n.type === 'Payment';
    if (activeFilter === 'Compliance') return n.type === 'Compliance';
    return true;
  });

  return (
    <div className="view-container">
      {/* Header Panel */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Alerts & Notification Hub</h1>
          <p className="view-header-subtitle">
            Stay updated with real-time statutory violations, payment confirmations, and shipment booking events.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={handleMarkAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} />
              <span>Mark All Read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn btn-outline" onClick={handleClearAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              <Trash2 size={16} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="filter-btn-group" style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'All', label: 'All Alerts' },
          { id: 'Unread', label: `Unread (${unreadCount})` },
          { id: 'Shipments', label: 'Shipments & Dispatch' },
          { id: 'Finance', label: 'Finance & Payments' },
          { id: 'Compliance', label: 'Compliance warnings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              backgroundColor: activeFilter === tab.id ? 'var(--primary)' : 'var(--bg-secondary)',
              color: activeFilter === tab.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="card" style={{ padding: '1rem' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <Bell size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p style={{ fontSize: '0.9rem' }}>No updates matching selected category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredNotifications.map(n => (
              <div 
                key={n.id} 
                className="card"
                style={{ 
                  padding: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: n.read ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  borderLeft: `4px solid ${n.read ? 'var(--border-color)' : 'var(--primary)'}`
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: getNotifColor(n.type) 
                  }}>
                    {getNotifIcon(n.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: n.read ? 600 : 700, fontSize: '0.9rem' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {n.msg}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{n.time}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {!n.read && (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{ padding: '0.25rem', minWidth: 'auto', color: 'var(--success)' }}
                        title="Mark Read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button 
                      className="btn btn-outline" 
                      onClick={() => handleDelete(n.id)}
                      style={{ padding: '0.25rem', minWidth: 'auto', color: 'var(--danger)' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
