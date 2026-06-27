import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Eye, 
  Download, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  MapPin,
  User,
  Truck
} from 'lucide-react';

export default function DeliveryTrackingTable({ 
  deliveries, 
  onSelectDelivery, 
  onUpdateStatus, 
  onDeleteDelivery 
}) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sorting State
  const [sortColumn, setSortColumn] = useState('delivery_time');
  const [sortDirection, setSortDirection] = useState('desc');

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [tempStatus, setTempStatus] = useState('');

  // Formatter helpers
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

  // Handle Header Sorting
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Download POD text report helper
  const handleDownloadPOD = (delivery) => {
    const reportText = `================================================
HK SHIPPING PRIVATE LIMITED - POD INVOICE REPORT
================================================
Consignment No:  ${delivery.consignment_no}
Customer Name:   ${delivery.customer_name}
Receiver Name:   ${delivery.receiver_name}
Driver Name:     ${delivery.driver_name || 'N/A'}
Vehicle Number:  ${delivery.vehicle_number || 'N/A'}
Pickup Location: ${delivery.pickup_location}
Delivery Place:  ${delivery.delivery_location}
Delivery Time:   ${delivery.delivery_time}
POD Status:      ${delivery.pod_status}
Transit Status:  ${delivery.status}
Remarks:         ${delivery.remarks || 'None'}
================================================
Generated on:    ${new Date().toLocaleString()}
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POD-${delivery.consignment_no}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sort Logic
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    let valA = a[sortColumn] || '';
    let valB = b[sortColumn] || '';

    // Handle string case-insensitive comparisons
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalRows = sortedDeliveries.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = sortedDeliveries.slice(indexOfFirstRow, indexOfLastRow);

  const startEditing = (item) => {
    setEditingId(item.id);
    setTempStatus(item.status);
  };

  const saveStatus = (id) => {
    if (onUpdateStatus) {
      onUpdateStatus(id, tempStatus);
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  // Reset page index if pages shrink
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Table Container */}
      <div className="table-responsive">
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              
              {/* Consignment No */}
              <th onClick={() => handleSort('consignment_no')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Consignment Number</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Customer Name */}
              <th onClick={() => handleSort('customer_name')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Customer Name</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Driver Name */}
              <th onClick={() => handleSort('driver_name')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Driver Name</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Vehicle Number */}
              <th onClick={() => handleSort('vehicle_number')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Vehicle Number</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Pickup Location */}
              <th onClick={() => handleSort('pickup_location')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Pickup Location</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Delivery Location */}
              <th onClick={() => handleSort('delivery_location')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Delivery Location</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Delivery Date */}
              <th onClick={() => handleSort('delivery_time')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Delivery Date</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* POD Status */}
              <th onClick={() => handleSort('pod_status')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>POD Status</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Current Status */}
              <th onClick={() => handleSort('status')} style={{ padding: '0.85rem 1rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Current Status</span>
                  <ArrowUpDown size={12} className="text-secondary" />
                </div>
              </th>

              {/* Actions */}
              <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)' }}>
                  No tracking records found.
                </td>
              </tr>
            ) : (
              currentRows.map((delivery) => (
                <tr key={delivery.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {/* Consignment No */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {delivery.consignment_no}
                  </td>

                  {/* Customer Name */}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                    {delivery.customer_name}
                  </td>

                  {/* Driver Name */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{delivery.driver_name || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Vehicle Number */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Truck size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{delivery.vehicle_number || 'N/A'}</span>
                    </div>
                  </td>

                  {/* Pickup Location */}
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={12} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={delivery.pickup_location}>
                        {delivery.pickup_location}
                      </span>
                    </div>
                  </td>

                  {/* Delivery Location */}
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                      <MapPin size={12} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={delivery.delivery_location}>
                        {delivery.delivery_location}
                      </span>
                    </div>
                  </td>

                  {/* Delivery Date */}
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{formatDeliveryDate(delivery.delivery_time)}</span>
                    </div>
                  </td>

                  {/* POD Status */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      backgroundColor: delivery.pod_status === 'Uploaded' ? 'var(--success-light)' : 'var(--bg-tertiary)',
                      color: delivery.pod_status === 'Uploaded' ? 'var(--success-dark)' : 'var(--text-secondary)'
                    }}>
                      {delivery.pod_status || 'Pending'}
                    </span>
                  </td>

                  {/* Current Status */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    {editingId === delivery.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <select
                          className="form-select"
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          style={{ padding: '0.2rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Out For Delivery">Out For Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Failed">Failed</option>
                        </select>
                        <button 
                          className="header-action-btn"
                          style={{ color: 'var(--success)', padding: '0.25rem' }}
                          onClick={() => saveStatus(delivery.id)}
                          title="Save status"
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          className="header-action-btn"
                          style={{ color: 'var(--danger)', padding: '0.25rem' }}
                          onClick={cancelEditing}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge badge-${delivery.status.toLowerCase().replace(/ /g, '')}`}>
                          <span className="badge-dot-indicator" />
                          <span>{delivery.status}</span>
                        </span>
                        <button 
                          className="header-action-btn"
                          style={{ padding: '0.25rem', color: 'var(--text-tertiary)', display: 'inline-flex' }}
                          onClick={() => startEditing(delivery)}
                          title="Edit Transit Status"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                      {/* View Details */}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => onSelectDelivery(delivery)}
                        title="View Details"
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>

                      {/* Download POD report */}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleDownloadPOD(delivery)}
                        title="Download POD Report"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                      
                      {/* Delete Record */}
                      <button 
                        className="header-action-btn"
                        style={{ color: 'var(--danger)', padding: '0.45rem' }}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete consignment ${delivery.consignment_no} from database?`)) {
                            onDeleteDelivery(delivery.id);
                          }
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Page Info & Rows per page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>
            Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, totalRows)} of {totalRows} records
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '0.2rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              {[5, 10, 20, 50].map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Page buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            className="filter-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              padding: '0.35rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            <ChevronLeft size={14} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: currentPage === page ? 'var(--primary)' : 'var(--bg-secondary)',
                color: currentPage === page ? 'white' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {page}
            </button>
          ))}

          <button
            className="filter-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              padding: '0.35rem 0.65rem',
              display: 'flex',
              alignItems: 'center',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
