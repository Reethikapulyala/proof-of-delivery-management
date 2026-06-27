import React, { useState } from 'react';
import { Search, Eye, Trash2, Edit2, Check, X, Calendar, Clock, User, Truck, Hash } from 'lucide-react';

export default function DeliveryHistory({ deliveries, onUpdateStatus, onDeleteDelivery, onSelectDelivery }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [tempStatus, setTempStatus] = useState('');

  // Filtering deliveries based on tab and search query
  const filteredDeliveries = deliveries.filter((item) => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = 
      item.consignment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.driver_name && item.driver_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.vehicle_number && item.vehicle_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  const startEditing = (item) => {
    setEditingId(item.id);
    setTempStatus(item.status);
  };

  const saveStatus = (id) => {
    onUpdateStatus(id, tempStatus);
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

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

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Delivery History Logs</h1>
          <p className="view-header-subtitle">Search, view receipts, and manage historical proof of delivery logs for HK Shipping.</p>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="filters-row">
          {/* Search Input */}
          <div className="search-wrapper">
            <Search className="search-icon-fixed" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by Consignment No, Receiver, Driver, Vehicle..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div className="filter-btn-group">
            {['All', 'Delivered', 'In Transit', 'Pending'].map((tab) => (
              <button
                key={tab}
                className={`filter-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Consignment No.</th>
                <th>Delivery Date & Time</th>
                <th>Receiver Name</th>
                <th>Driver Name</th>
                <th>Vehicle Number</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    No delivery records match your current criteria.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.consignment_number}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                        <Calendar size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{formatDeliveryDate(item.delivery_time)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                        <Clock size={12} />
                        <span>{formatDeliveryTime(item.delivery_time)}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <User size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{item.receiver_name}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: '1rem', marginTop: '0.15rem' }}>
                        {item.receiver_signature ? '✍️ Digitally Signed' : '❌ No Signature'}
                      </div>
                    </td>
                    <td>{item.driver_name || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                        <Truck size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{item.vehicle_number || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      {editingId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <select
                            className="form-select"
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value)}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', minWidth: '110px' }}
                          >
                            <option value="Delivered">Delivered</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                          </select>
                          <button 
                            className="header-action-btn" 
                            style={{ color: 'var(--success)', padding: '0.3rem' }}
                            onClick={() => saveStatus(item.id)}
                            title="Save Status"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="header-action-btn" 
                            style={{ color: 'var(--danger)', padding: '0.3rem' }}
                            onClick={cancelEditing}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                            <span className="badge-dot-indicator" />
                            <span>{item.status}</span>
                          </span>
                          <button 
                            className="header-action-btn" 
                            style={{ padding: '0.25rem', color: 'var(--text-tertiary)' }}
                            onClick={() => startEditing(item)}
                            title="Edit Status"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => onSelectDelivery(item)}
                          title="View POD Details"
                        >
                          <Eye size={14} style={{ marginRight: '4px' }} />
                          <span>Receipt</span>
                        </button>
                        <button 
                          className="header-action-btn" 
                          style={{ color: 'var(--danger)', padding: '0.5rem' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete consignment ${item.consignment_number} record?`)) {
                              onDeleteDelivery(item.id);
                            }
                          }}
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>Showing {filteredDeliveries.length} of {deliveries.length} records</div>
          <div style={{ color: 'var(--text-tertiary)' }}>HK Shipping DB Service</div>
        </div>
      </div>
    </div>
  );
}
