import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import PodForm from './views/PodForm';
import DeliveryHistory from './views/DeliveryHistory';
import Reports from './views/Reports';
import Settings from './views/Settings';
import DeliveryDetails from './views/DeliveryDetails';
import ComplianceDashboard from './views/ComplianceDashboard';
import ShipmentManager from './views/ShipmentManager';
import FleetManager from './views/FleetManager';
import DriverManager from './views/DriverManager';
import CustomerCRM from './views/CustomerCRM';
import InvoiceManager from './views/InvoiceManager';
import FreightPricing from './views/FreightPricing';
import UserManager from './views/UserManager';
import NotificationCenter from './views/NotificationCenter';
import ActivityLog from './views/ActivityLog';
import ReportsCenter from './views/ReportsCenter';
import Login from './views/Login';
import { X, Printer, Check, Info, AlertCircle, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchDeliveries, updateDeliveryStatus, deleteDelivery } from './api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hk_shipping_token') || null);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeSubView, setActiveSubView] = useState('shipments_core');
  const [previousView, setPreviousView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const handleSelectDelivery = (delivery) => {
    setPreviousView(activeView);
    setSelectedDelivery(delivery);
    setActiveView('details');
  };
  
  // API loading states
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // User details
  const [userProfile, setUserProfile] = useState(() => {
    const storedUser = localStorage.getItem('hk_shipping_user');
    return storedUser ? JSON.parse(storedUser) : {
      name: 'Guest User',
      role: 'Guest',
      email: 'guest@hkshipping.com'
    };
  });

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'System Initialized',
      message: 'Connected to HK Shipping database services.',
      type: 'info',
      time: 'Just now',
      read: false
    }
  ]);

  // Toast Alerts State
  const [toasts, setToasts] = useState([]);

  // Load deliveries from DB on startup
  const loadDeliveries = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDeliveries();
      setDeliveries(data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error(err);
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('session')) {
        handleLogout();
      } else {
        setLoadError('Database API Connection Error. Please verify the backend service is running and MySQL is active.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newToken, user) => {
    localStorage.setItem('hk_shipping_token', newToken);
    localStorage.setItem('hk_shipping_user', JSON.stringify(user));
    setToken(newToken);
    setUserProfile(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('hk_shipping_token');
    localStorage.removeItem('hk_shipping_user');
    setToken(null);
    setUserProfile({
      name: 'Guest User',
      role: 'Guest',
      email: 'guest@hkshipping.com'
    });
    triggerToast('Session Ended', 'You have been successfully logged out.', 'info');
  };

  useEffect(() => {
    if (token) {
      loadDeliveries();
    }
  }, [token]);

  // Apply dark theme when state changes
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  // Handle toast alert triggers
  const triggerToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State modifications sync'd to DB
  const handleAddDelivery = async (newDelivery, shouldRedirect = true) => {
    // Reload deliveries from the database to synchronize dashboard metrics
    await loadDeliveries();
    
    // Add Notification
    const newNotif = {
      id: Date.now(),
      title: 'POD Recorded Successfully',
      message: `Consignment ${newDelivery.consignment_no || newDelivery.consignment_number} logged under ${newDelivery.receiver_name}.`,
      type: 'success',
      time: 'Just now',
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
    
    // Navigate back to the Dashboard control hub
    if (shouldRedirect) {
      setActiveView('dashboard');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDeliveryStatus(id, newStatus);
      
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
      
      const target = deliveries.find(d => d.id === id);
      triggerToast('Status Updated', `Consignment ${target?.consignment_number} is now ${newStatus}.`, 'info');
      
      // Add Notification
      const newNotif = {
        id: Date.now(),
        title: 'Delivery Status Updated',
        message: `Consignment ${target?.consignment_number} updated to ${newStatus}.`,
        type: 'info',
        time: 'Just now',
        read: false
      };
      setNotifications((prev) => [newNotif, ...prev]);
    } catch (err) {
      triggerToast('Update Failed', err.message || 'Failed to update record status.', 'danger');
    }
  };

  const handleDeleteDelivery = async (id) => {
    const target = deliveries.find(d => d.id === id);
    try {
      await deleteDelivery(id);
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      triggerToast('Record Removed', `Delivery log ${target?.consignment_number} deleted.`, 'danger');
    } catch (err) {
      triggerToast('Delete Failed', err.message || 'Failed to remove delivery record.', 'danger');
    }
  };

  const handleUpdateProfile = (profileData) => {
    setUserProfile(profileData);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    triggerToast('Cleaned Inbox', 'All notifications marked as read.', 'success');
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper date formatter functions
  const formatDeliveryDate = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return timeStr.slice(0, 10);
    }
  };

  const formatDeliveryTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr.slice(11, 16);
    }
  };

  const getTimelineTimestamp = (timeStr, offsetHours) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      d.setHours(d.getHours() - offsetHours);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Select component views
  const renderView = () => {
    const hasPermission = (role, viewId) => {
      if (role === 'Super Admin') return true;
      if (viewId === 'dashboard' || viewId === 'settings' || viewId === 'details' || viewId === 'notifications') return true;
      
      if (role === 'Transport Admin') {
        return ['shipments', 'pod-form', 'history', 'fleet'].includes(viewId);
      }
      if (role === 'Fleet Manager') {
        return ['fleet', 'drivers'].includes(viewId);
      }
      if (role === 'Accounts Staff') {
        return ['invoices'].includes(viewId);
      }
      if (role === 'Compliance Manager') {
        return ['compliance', 'reports', 'analytics'].includes(viewId);
      }
      return false;
    };

    if (!hasPermission(userProfile.role, activeView)) {
      return (
        <div className="view-container" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="card" style={{ borderColor: 'var(--danger)', borderTop: '4px solid var(--danger)', padding: '2.5rem', maxWidth: '500px', margin: '4rem auto 0 auto', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              You do not have the required statutory authorizations to access the <strong>{activeView}</strong> module.
            </p>
            <button className="btn btn-primary" onClick={() => setActiveView('dashboard')} style={{ margin: '0 auto' }}>
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
          <RefreshCw size={40} className="text-primary" style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Connecting to HK Shipping Database Server...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '4rem auto 0 auto' }}>
          <div className="card" style={{ borderColor: 'var(--danger)', borderTop: '4px solid var(--danger)', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>System Offline</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {loadError}
            </p>
            <button className="btn btn-primary" onClick={loadDeliveries} style={{ margin: '0 auto' }}>
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            deliveries={deliveries} 
            onViewChange={setActiveView} 
            onSelectDelivery={handleSelectDelivery}
            onUpdateStatus={handleUpdateStatus}
            onDeleteDelivery={handleDeleteDelivery}
            onNavigateToSubView={(subViewId) => {
              setActiveView('shipments');
              setActiveSubView(subViewId);
            }}
          />
        );
      case 'pod-form':
        return (
          <PodForm 
            deliveries={deliveries}
            onAddDelivery={handleAddDelivery} 
            triggerToast={triggerToast}
          />
        );
      case 'history':
        return (
          <DeliveryHistory 
            deliveries={deliveries} 
            onUpdateStatus={handleUpdateStatus} 
            onDeleteDelivery={handleDeleteDelivery}
            onSelectDelivery={handleSelectDelivery}
          />
        );
      case 'compliance':
        return <ComplianceDashboard />;
      case 'shipments':
        return (
          <ShipmentManager 
            deliveries={deliveries} 
            onSelectDelivery={handleSelectDelivery}
            onUpdateStatus={handleUpdateStatus}
            onDeleteDelivery={handleDeleteDelivery}
            onAddDelivery={handleAddDelivery}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            isDarkTheme={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
            triggerToast={triggerToast}
            notifications={notifications}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onMarkAsRead={handleMarkAsRead}
            previousView={previousView}
            setActiveView={setActiveView}
            activeSubView={activeSubView}
            setActiveSubView={setActiveSubView}
          />
        );
      case 'fleet':
        return <FleetManager />;
      case 'drivers':
        return <DriverManager />;
      case 'crm':
        return <CustomerCRM />;
      case 'invoices':
        return <InvoiceManager />;
      case 'pricing':
        return <FreightPricing />;
      case 'users':
        return <UserManager />;
      case 'notifications':
        return <NotificationCenter />;
      case 'logs':
        return <ActivityLog />;
      case 'reports':
        return <ReportsCenter />;
      case 'analytics':
        return <Reports deliveries={deliveries} />;
      case 'settings':
        return (
          <Settings 
            userProfile={userProfile} 
            onUpdateProfile={handleUpdateProfile} 
            isDark={isDarkTheme}
            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
            triggerToast={triggerToast}
          />
        );
      case 'details':
        return (
          <DeliveryDetails 
            delivery={selectedDelivery} 
            onBack={() => {
              setActiveView(previousView);
              setSelectedDelivery(null);
            }} 
          />
        );
      default:
        return (
          <Dashboard 
            deliveries={deliveries} 
            onViewChange={setActiveView} 
            onSelectDelivery={handleSelectDelivery}
          />
        );
    }
  };

  if (!token) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} triggerToast={triggerToast} />
        {/* Floating Toast Notification Containers */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <div className="toast-icon">
                {toast.type === 'success' && <Check size={16} />}
                {toast.type === 'info' && <Info size={16} />}
                {toast.type === 'warning' && <AlertCircle size={16} />}
                {toast.type === 'danger' && <X size={16} />}
              </div>
              <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                <div className="toast-message">{toast.message}</div>
              </div>
              <button className="toast-close" onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole={userProfile.role}
      />

      {/* Main app panel */}
      <div className="main-content">
        <Header 
          activeView={activeView} 
          activeSubView={activeSubView}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onMarkAsRead={handleMarkAsRead}
          userProfile={userProfile}
          onViewChange={setActiveView}
          onLogout={handleLogout}
        />

        {/* View Layout Renderer */}
        <main style={{ flex: 1 }}>
          {renderView()}
        </main>
      </div>

      {/* Floating Toast Notification Containers */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <Check size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              {toast.type === 'warning' && <AlertCircle size={16} />}
              {toast.type === 'danger' && <X size={16} />}
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
