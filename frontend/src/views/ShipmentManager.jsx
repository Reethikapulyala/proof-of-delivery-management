import React, { useState, useEffect } from 'react';
import { 
  Truck, ClipboardList, Users, Smile, CreditCard, Calculator, ShieldCheck, 
  FileText, BarChart3, Bell, Activity, Settings as SettingsIcon, MapPin, 
  Calendar, Clock, Navigation, CheckCircle2, User, Search, Plus, Trash2, Download, Printer
} from 'lucide-react';
import { createDelivery } from '../api';

// Sub-views imports
import DeliveryHistory from './DeliveryHistory';
import Reports from './Reports';
import Settings from './Settings';
import ComplianceDashboard from './ComplianceDashboard';
import FleetManager from './FleetManager';
import DriverManager from './DriverManager';
import CustomerCRM from './CustomerCRM';
import InvoiceManager from './InvoiceManager';
import FreightPricing from './FreightPricing';
import UserManager from './UserManager';
import NotificationCenter from './NotificationCenter';
import ActivityLog from './ActivityLog';
import ReportsCenter from './ReportsCenter';

export default function ShipmentManager({ 
  deliveries = [], 
  onSelectDelivery, 
  onUpdateStatus, 
  onDeleteDelivery, 
  onAddDelivery,
  userProfile = { role: 'Super Admin' }, 
  onUpdateProfile, 
  isDarkTheme, 
  onToggleTheme, 
  triggerToast, 
  notifications, 
  onMarkAllAsRead, 
  onMarkAsRead,
  activeSubView,
  setActiveSubView
}) {
  
  // Cargo Tracker State
  const [shipments, setShipments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    consignment_no: '',
    customer: '',
    source: '',
    destination: '',
    driver: '',
    vehicle: '',
    date: '',
    status: 'Booked'
  });

  // Synchronize shipments with database deliveries prop
  useEffect(() => {
    if (deliveries && deliveries.length > 0) {
      const mapped = deliveries.map(d => ({
        id: d.id,
        consignment_no: d.consignment_no || d.consignment_number,
        customer: d.customer_name,
        source: d.pickup_location || 'Seattle, WA',
        destination: d.delivery_location || 'Portland, OR',
        driver: d.driver_name || 'Unassigned',
        vehicle: d.vehicle_number || 'N/A',
        date: d.delivery_time ? d.delivery_time.slice(0, 10) : (d.created_at ? d.created_at.slice(0, 10) : new Date().toISOString().split('T')[0]),
        status: d.status
      }));
      setShipments(mapped);
    } else {
      // Fallback mocks if database is completely empty
      setShipments([
        { id: 1, consignment_no: 'HKS-802495', customer: 'Nova Pharma Inc', source: 'Seattle, WA', destination: 'Portland, OR', driver: 'John Miller', vehicle: 'MH-12-GQ-5524', date: '2026-06-17', status: 'Delivered' },
        { id: 2, consignment_no: 'HKS-392817', customer: 'Apex Industrial Supply', source: 'Detroit, MI', destination: 'Chicago, IL', driver: 'Robert Chen', vehicle: 'DL-01-AL-9872', date: '2026-06-18', status: 'In Transit' },
        { id: 3, consignment_no: 'HKS-601932', customer: 'HoloTech Systems', source: 'Boston, MA', destination: 'New York, NY', driver: 'David Miller', vehicle: 'KA-03-MP-4122', date: '2026-06-18', status: 'Booked' }
      ]);
    }
  }, [deliveries]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1x1 transparent pixel png as placeholder
      const placeholderImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      
      const payload = {
        consignment_no: formData.consignment_no,
        customer_name: formData.customer,
        receiver_name: 'Pending Receiver',
        signature_image: placeholderImg,
        delivery_time: formData.date + ' 12:00:00',
        pickup_location: formData.source,
        delivery_location: formData.destination,
        remarks: 'Booked via Cargo Tracker Hub.',
        photo: placeholderImg,
        driver_name: formData.driver || 'Unassigned',
        vehicle_number: formData.vehicle || 'N/A',
        status: formData.status === 'Booked' ? 'Pending' : formData.status, // Map 'Booked' to 'Pending' in DB
        pod_status: 'Pending'
      };

      const result = await createDelivery(payload);
      
      if (onAddDelivery) {
        // Trigger parent state reload (passing false to skip dashboard redirect)
        await onAddDelivery(result, false);
      }
      
      setShowModal(false);
      if (triggerToast) triggerToast('Shipment Booked', `Cargo consignment ${formData.consignment_no} registered successfully.`, 'success');
    } catch (err) {
      console.error(err);
      if (triggerToast) triggerToast('Booking Failed', err.message || 'Failed to persist booking.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const target = shipments.find(s => s.id === id);
    if (window.confirm(`Are you sure you want to delete consignment ${target?.consignment_no} record?`)) {
      try {
        if (onDeleteDelivery) {
          await onDeleteDelivery(id);
        } else {
          setShipments(shipments.filter(s => s.id !== id));
          if (triggerToast) triggerToast('Shipment Removed', `Consignment ${target?.consignment_no} has been deleted.`, 'danger');
        }
      } catch (err) {
        console.error(err);
        if (triggerToast) triggerToast('Deletion Failed', err.message || 'Failed to delete record.', 'danger');
      }
    }
  };

  // RBAC Permission gates for Sub-views
  const hasPermission = (role, viewId) => {
    if (role === 'Super Admin') return true;
    if (viewId === 'shipments_core' || viewId === 'settings' || viewId === 'notifications') return true;
    
    if (role === 'Transport Admin') {
      return ['shipments_core', 'history', 'fleet'].includes(viewId);
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

  const subViewsList = [
    { id: 'shipments_core', label: 'Cargo Tracker', icon: Truck },
    { id: 'fleet', label: 'Fleet Registry', icon: ClipboardList },
    { id: 'drivers', label: 'Driver Directory', icon: Users },
    { id: 'crm', label: 'Customers CRM', icon: Smile },
    { id: 'invoices', label: 'Invoices & GST', icon: CreditCard },
    { id: 'pricing', label: 'Freight Pricing', icon: Calculator },
    { id: 'compliance', label: 'Document Compliance', icon: ShieldCheck },
    { id: 'history', label: 'Delivery History', icon: ClipboardList },
    { id: 'reports', label: 'Reports Center', icon: FileText },
    { id: 'analytics', label: 'Business Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Notification Hub', icon: Bell },
    { id: 'logs', label: 'Audit Logs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const allowedSubViews = subViewsList.filter(item => hasPermission(userProfile.role, item.id));

  // Helper to render the progress bar
  const renderProgressBar = (status) => {
    let pct = 25;
    let color = 'var(--warning)'; // amber/yellow
    let label = 'Booked';

    const normalizedStatus = (status || '').toLowerCase().trim();
    if (normalizedStatus === 'pending') {
      pct = 25;
      color = 'var(--warning)';
      label = 'Pending';
    } else if (normalizedStatus === 'in transit') {
      pct = 50;
      color = 'var(--info)'; // blue
      label = 'In Transit';
    } else if (normalizedStatus === 'out for delivery') {
      pct = 75;
      color = '#6366f1'; // indigo
      label = 'Out For Delivery';
    } else if (normalizedStatus === 'delivered') {
      pct = 100;
      color = 'var(--success)'; // green
      label = 'Delivered';
    } else if (normalizedStatus === 'failed') {
      pct = 100;
      color = 'var(--danger)'; // red
      label = 'Failed';
    } else {
      pct = 25;
      color = 'var(--warning)';
      label = status || 'Booked';
    }

    return (
      <div style={{ minWidth: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem', color: 'var(--text-secondary)' }}>
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '10px', transition: 'width 0.4s ease' }} />
        </div>
      </div>
    );
  };

  const getFilteredShipments = () => {
    return shipments.filter(s => {
      const matchesSearch = searchQuery === '' || 
        s.consignment_no.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.customer && s.customer.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' || 
        s.status.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === 'Booked' && (s.status === 'Pending' || s.status === 'Booked'));
        
      const matchesDate = dateFilter === '' || s.date === dateFilter;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const exportToCSV = () => {
    const filtered = getFilteredShipments();
    if (filtered.length === 0) {
      if (triggerToast) triggerToast('Export Alert', 'No data to export.', 'warning');
      return;
    }
    const headers = ['Consignment No', 'Customer', 'Origin', 'Destination', 'Driver', 'Vehicle', 'Booking Date', 'Status'];
    const rows = filtered.map(s => [
      s.consignment_no,
      s.customer,
      s.source,
      s.destination,
      s.driver,
      s.vehicle,
      s.date,
      s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shipments_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (triggerToast) triggerToast('Export Success', 'CSV report downloaded.', 'success');
  };

  const exportToPDF = () => {
    const filtered = getFilteredShipments();
    if (filtered.length === 0) {
      if (triggerToast) triggerToast('Print Alert', 'No data to print.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank');
    
    let tableRows = '';
    filtered.forEach(s => {
      let statusClass = 'status-pending';
      if (s.status === 'Delivered') statusClass = 'status-delivered';
      else if (s.status === 'In Transit' || s.status === 'Out For Delivery') statusClass = 'status-transit';
      else if (s.status === 'Failed') statusClass = 'status-failed';

      tableRows += '<tr>' +
        '<td style="font-weight: 600;">' + s.consignment_no + '</td>' +
        '<td>' + (s.customer || '') + '</td>' +
        '<td>' + s.source + ' ➔ ' + s.destination + '</td>' +
        '<td>' + (s.driver || 'Unassigned') + '</td>' +
        '<td>' + (s.vehicle || 'N/A') + '</td>' +
        '<td>' + s.date + '</td>' +
        '<td><span class="status-badge ' + statusClass + '">' + s.status + '</span></td>' +
        '</tr>';
    });

    printWindow.document.write('<html>' +
      '<head>' +
      '<title>Shipment Tracking Report - POD Admin Console</title>' +
      '<style>' +
      'body { font-family: sans-serif; padding: 2rem; color: #1e293b; }' +
      'h2 { color: #0284c7; margin-bottom: 0.5rem; }' +
      'p { font-size: 0.9rem; color: #64748b; margin-bottom: 2rem; }' +
      'table { width: 100%; border-collapse: collapse; margin-top: 1rem; }' +
      'th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; font-size: 0.85rem; }' +
      'th { background-color: #f8fafc; font-weight: 600; color: #475569; }' +
      '.status-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }' +
      '.status-delivered { background-color: #dcfce7; color: #166534; }' +
      '.status-transit { background-color: #dbeafe; color: #1e40af; }' +
      '.status-pending { background-color: #fef3c7; color: #92400e; }' +
      '.status-failed { background-color: #fee2e2; color: #991b1b; }' +
      '.footer { margin-top: 3rem; font-size: 0.8rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 1rem; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h2>Shipment Tracking Report</h2>' +
      '<p>Generated on ' + new Date().toLocaleString() + ' | Filtered Count: ' + filtered.length + ' Shipments</p>' +
      '<table>' +
      '<thead>' +
      '<tr>' +
      '<th>Consignment</th>' +
      '<th>Customer</th>' +
      '<th>Origin ➔ Destination</th>' +
      '<th>Driver</th>' +
      '<th>Vehicle</th>' +
      '<th>Booking Date</th>' +
      '<th>Status</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      tableRows +
      '</tbody>' +
      '</table>' +
      '<div class="footer">POD Admin Console - Cargo Logistics Management System &copy; ' + new Date().getFullYear() + '</div>' +
      '<script>' +
      'window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };' +
      '</script>' +
      '</body>' +
      '</html>'
    );
    printWindow.document.close();
  };

  // Render correct nested component
  const renderActiveComponent = () => {
    switch (activeSubView) {
      case 'shipments_core':
        return (
          <div className="view-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div className="view-header">
              <div>
                <h1 className="view-header-title">Shipment Management Center</h1>
                <p className="view-header-subtitle">Track cargo transit, routing channels, and vertical stepper checkpoints.</p>
              </div>
              <button className="btn btn-primary" onClick={() => {
                setFormData({
                  consignment_no: `HKS-${Math.floor(100000 + Math.random() * 900000)}`,
                  customer: '',
                  source: '',
                  destination: '',
                  driver: '',
                  vehicle: '',
                  date: new Date().toISOString().split('T')[0],
                  status: 'Booked'
                });
                setShowModal(true);
              }}>
                <Plus size={16} />
                <span>Book Shipment</span>
              </button>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                {/* Search & Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
                    <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={16} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search Customer..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ width: '100%', maxWidth: '160px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Booked">Booked (Pending)</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Failed">Failed</option>
                  </select>

                  {/* Date Picker */}
                  <input
                    type="date"
                    className="form-input"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    style={{ width: '100%', maxWidth: '150px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  />
                  
                  {/* Clear Button */}
                  {(searchQuery || statusFilter !== 'All' || dateFilter) && (
                    <button 
                      className="btn btn-outline" 
                      onClick={() => { setSearchQuery(''); setStatusFilter('All'); setDateFilter(''); }}
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
                    <Download size={14} />
                    <span>Export Excel</span>
                  </button>
                  <button className="btn btn-secondary" onClick={exportToPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
                    <Printer size={14} />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="delivery-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Consignment</th>
                      <th>Customer</th>
                      <th>Route</th>
                      <th>Assignee</th>
                      <th>Vehicle</th>
                      <th>Booking Date</th>
                      <th>Transit Progress</th>
                      <th>Stage Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredShipments().length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                          No shipments match your current filter criteria.
                        </td>
                      </tr>
                    ) : (
                      getFilteredShipments().map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{s.consignment_no}</td>
                          <td>{s.customer}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                              <span>{s.source}</span>
                              <span style={{ color: 'var(--primary)' }}>➔</span>
                              <span>{s.destination}</span>
                            </div>
                          </td>
                          <td>{s.driver || 'Unassigned'}</td>
                          <td>{s.vehicle || 'N/A'}</td>
                          <td>{s.date}</td>
                          <td>
                            {renderProgressBar(s.status)}
                          </td>
                          <td>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: s.status === 'Delivered' ? 'var(--success-light)' : (s.status === 'In Transit' || s.status === 'Out For Delivery' ? 'var(--info-light)' : 'var(--warning-light)'),
                              color: s.status === 'Delivered' ? 'var(--success)' : (s.status === 'In Transit' || s.status === 'Out For Delivery' ? 'var(--info)' : 'var(--warning)')
                            }}>
                              {s.status === 'Pending' ? 'Booked' : s.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-outline" onClick={() => handleDelete(s.id)} style={{ color: 'var(--danger)', padding: '0.3rem' }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
      case 'compliance':
        return <ComplianceDashboard />;
      case 'history':
        return (
          <DeliveryHistory 
            deliveries={deliveries} 
            onUpdateStatus={onUpdateStatus} 
            onDeleteDelivery={onDeleteDelivery}
            onSelectDelivery={onSelectDelivery}
          />
        );
      case 'reports':
        return <ReportsCenter />;
      case 'analytics':
        return <Reports deliveries={deliveries} />;
      case 'users':
        return <UserManager />;
      case 'notifications':
        return (
          <NotificationCenter 
            notifications={notifications}
            onMarkAllAsRead={onMarkAllAsRead}
            onMarkAsRead={onMarkAsRead}
          />
        );
      case 'logs':
        return <ActivityLog />;
      case 'settings':
        return (
          <Settings 
            userProfile={userProfile} 
            onUpdateProfile={onUpdateProfile} 
            isDark={isDarkTheme}
            onToggleTheme={onToggleTheme}
            triggerToast={triggerToast}
          />
        );
      default:
        return <div style={{ padding: '2rem' }}>Module not found.</div>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)', background: 'var(--bg-secondary)' }}>
      {/* Horizontal Workspace Navigation Tabs Row */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {allowedSubViews.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.85rem',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <IconComponent size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Frame */}
      <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
        {renderActiveComponent()}
      </div>

      {/* Cargo Tracker New Shipment Modal */}
      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreate} className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Book New Cargo Shipment</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Customer Name</label>
                <input required className="form-input" type="text" value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Booking Date</label>
                <input required className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Origin Location</label>
                <input required className="form-input" type="text" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Destination Location</label>
                <input required className="form-input" type="text" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Assigned Driver</label>
                <input className="form-input" type="text" value={formData.driver} onChange={e => setFormData({ ...formData, driver: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Assigned Vehicle</label>
                <input className="form-input" type="text" value={formData.vehicle} onChange={e => setFormData({ ...formData, vehicle: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Booking</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
