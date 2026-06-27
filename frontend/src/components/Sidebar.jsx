import React from 'react';
import { 
  LayoutDashboard, FileText, Package, X, Truck, Settings as SettingsIcon
} from 'lucide-react';

export default function Sidebar({ activeView, onViewChange, isOpen, onClose, userRole = 'Super Admin' }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pod-form', label: 'POD Form', icon: FileText },
    { id: 'shipments', label: 'Shipments Tracking', icon: Truck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const hasPermission = (role, viewId) => {
    if (role === 'Super Admin') return true;
    if (viewId === 'dashboard') return true;
    if (viewId === 'pod-form') {
      return ['Super Admin', 'Transport Admin'].includes(role);
    }
    if (viewId === 'shipments' || viewId === 'settings') return true;
    return false;
  };

  const filteredMenuItems = menuItems.filter(item => hasPermission(userRole, item.id));

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose} 
      />
 
      {/* Sidebar Container */}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-logo">
          <Package size={28} className="text-primary" style={{ color: 'var(--primary)' }} />
          <span className="sidebar-logo-text">HK Shipping</span>
          <button 
            className="menu-toggle-btn" 
            onClick={onClose}
            style={{ marginLeft: 'auto', display: isOpen ? 'flex' : 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar-menu">
          {filteredMenuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  className={`sidebar-item-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onViewChange(item.id);
                    onClose(); // Auto-close sidebar on mobile after clicking
                  }}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <p>© 2026 HK Shipping Pvt Ltd</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.65rem' }}>v1.0.0 • Connected</p>
        </div>
      </aside>
    </>
  );
}

