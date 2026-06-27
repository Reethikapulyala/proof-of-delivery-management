import React from 'react';
import DeliveryTrackingTimeline from '../components/DeliveryTrackingTimeline';
import { 
  ArrowLeft, 
  Printer, 
  Clock, 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Building,
  FileCheck2,
  Package
} from 'lucide-react';

export default function DeliveryDetails({ delivery, onBack }) {
  if (!delivery) {
    return (
      <div className="view-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
        <h3>No Delivery Selected</h3>
        <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '1rem' }}>
          Go Back
        </button>
      </div>
    );
  }

  // Format helper functions
  const formatDate = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return timeStr.slice(0, 10);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr.slice(11, 16);
    }
  };

  // Helper to calculate offset times for tracking simulation
  const getOffsetTimeStr = (timeStr, offsetHours) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      d.setHours(d.getHours() - offsetHours);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe variables mapping (handle frontend aliases and raw database keys)
  const consignmentNo = delivery.consignment_no || delivery.consignment_number;
  const customerName = delivery.customer_name;
  const driverName = delivery.driver_name || 'Not Assigned';
  const vehicleNumber = delivery.vehicle_number || 'Not Assigned';
  const pickupLoc = delivery.pickup_location || 'HK Shipping Hub Depot';
  const deliveryLoc = delivery.delivery_location || 'Destination Address';
  const deliveryTime = delivery.delivery_time;
  const remarks = delivery.remarks || delivery.delivery_remarks;
  const receiverName = delivery.receiver_name || 'N/A';
  const signature = delivery.signature_image || delivery.receiver_signature;
  const photo = delivery.photo || delivery.delivery_photo;
  const status = delivery.status || 'Pending';
  const podStatus = delivery.pod_status || 'Pending';

  // Calculate simulated Shipment Date and Pickup Time
  const shipmentDate = formatDate(deliveryTime);
  const shipmentTime = getOffsetTimeStr(deliveryTime, 24);
  const pickupTimeStr = getOffsetTimeStr(deliveryTime, 12);

  // Status badges color map
  const statusClass = status.toLowerCase().replace(/ /g, '');

  return (
    <div className="view-container delivery-details-page">
      {/* Styles for print optimization */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .sidebar, .header, .details-action-bar, .no-print {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .view-container {
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .details-card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: #fff !important;
            margin-bottom: 20px !important;
            break-inside: avoid;
          }
          .print-header {
            display: block !important;
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .print-badge {
            border: 1px solid #000 !important;
            background: none !important;
            color: #000 !important;
            padding: 2px 6px !important;
          }
        }
        .print-header {
          display: none;
        }
        .details-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }
        .details-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          box-shadow: var(--card-shadow);
          padding: 1.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .details-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
        }
        .details-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          color: var(--text-primary);
        }
        .details-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          margin-bottom: 0.85rem;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        .details-label {
          color: var(--text-tertiary);
          font-weight: 500;
        }
        .details-value {
          color: var(--text-primary);
          font-weight: 600;
        }
        .details-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .proof-img-container {
          background-color: var(--bg-tertiary);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          padding: 0.75rem;
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
          max-height: 220px;
          overflow: hidden;
        }
        .proof-img {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 4px;
          transition: transform 0.3s ease;
        }
        .proof-img:hover {
          transform: scale(1.03);
        }
        .timeline-container {
          position: relative;
          padding-left: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .timeline-line {
          position: absolute;
          left: 7px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background-color: var(--border-color);
          z-index: 1;
        }
        .timeline-item {
          position: relative;
        }
        .timeline-dot {
          position: absolute;
          left: -25px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 3px solid var(--bg-secondary);
          z-index: 2;
        }
        .timeline-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .timeline-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .timeline-time {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          font-weight: 500;
        }
      `}</style>

      {/* Print-Only Header */}
      <div className="print-header">
        <h2 style={{ margin: '0 0 5px 0', color: '#0c2340', fontFamily: "'Outfit', sans-serif" }}>HK SHIPPING PRIVATE LIMITED</h2>
        <p style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: '#555' }}>Proof of Delivery (POD) Invoice / Consignment Report</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', margin: '10px 0', borderTop: '1px solid #000', paddingTop: '10px' }}>
          <span><strong>Consignment Number:</strong> {consignmentNo}</span>
          <span><strong>Status:</strong> {status}</span>
          <span><strong>Report Date:</strong> {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Breadcrumb / Action Bar */}
      <div className="details-action-bar">
        <button 
          className="btn btn-secondary no-print" 
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back to List</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* Print Button */}
          <button 
            className="btn btn-primary" 
            onClick={handlePrint}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem' }}
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Details layout */}
      <div className="details-grid">
        
        {/* Left Column: Consignment Info & Tracking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Consignment Info Card */}
          <div className="details-card">
            <h4 className="details-card-title">
              <Package size={18} style={{ color: 'var(--primary)' }} />
              <span>Consignment Information</span>
            </h4>
            
            <div className="details-row">
              <span className="details-label">Consignment No</span>
              <span className="details-value" style={{ color: 'var(--primary)', letterSpacing: '0.5px' }}>{consignmentNo}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Customer Name</span>
              <span className="details-value">{customerName}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Shipment Date</span>
              <span className="details-value">{shipmentDate}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Driver Name</span>
              <span className="details-value">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{driverName}</span>
                </div>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Vehicle Number</span>
              <span className="details-value">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span>{vehicleNumber}</span>
                </div>
              </span>
            </div>

            <div className="details-row" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
              <span className="details-label">Pickup Hub</span>
              <span className="details-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{pickupLoc}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Delivery Place</span>
              <span className="details-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{deliveryLoc}</span>
            </div>
          </div>

          {/* Tracking Information / Timeline Card */}
          <div className="details-card">
            <h4 className="details-card-title">
              <Clock size={18} style={{ color: 'var(--primary)' }} />
              <span>Tracking & Transit History</span>
            </h4>
            <DeliveryTrackingTimeline delivery={delivery} />
          </div>

        </div>

        {/* Right Column: Proof of Delivery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Proof of Delivery Details Card */}
          <div className="details-card">
            <h4 className="details-card-title">
              <FileCheck2 size={18} style={{ color: 'var(--success)' }} />
              <span>Proof of Delivery (POD)</span>
            </h4>

            <div className="details-row">
              <span className="details-label">POD Status</span>
              <span className={`details-badge ${podStatus === 'Uploaded' ? 'print-badge' : ''}`} style={{
                backgroundColor: podStatus === 'Uploaded' ? 'var(--success-light)' : 'var(--bg-tertiary)',
                color: podStatus === 'Uploaded' ? 'var(--success-dark)' : 'var(--text-secondary)',
                fontWeight: 700
              }}>
                {podStatus}
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Transit Status</span>
              <span className={`badge badge-${statusClass} print-badge`}>
                <span className="badge-dot-indicator no-print" />
                <span>{status}</span>
              </span>
            </div>

            <div className="details-row">
              <span className="details-label">Receiver Name</span>
              <span className="details-value">{receiverName}</span>
            </div>

            <div className="details-row">
              <span className="details-label">Delivery Time</span>
              <span className="details-value">{formatDate(deliveryTime)} at {formatTime(deliveryTime)}</span>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span className="details-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Remarks / Handover Notes</span>
              <div className="details-value" style={{ 
                fontSize: '0.85rem', 
                fontWeight: 500, 
                backgroundColor: 'var(--bg-tertiary)', 
                padding: '0.75rem', 
                borderRadius: '6px',
                borderLeft: '3px solid var(--primary)',
                fontStyle: remarks ? 'normal' : 'italic',
                color: remarks ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}>
                {remarks ? `"${remarks}"` : 'No delivery remarks provided.'}
              </div>
            </div>

            {/* Signature Pad Rendering */}
            <div style={{ marginTop: '1.5rem' }}>
              <span className="details-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Receiver Signature</span>
              {signature ? (
                <div style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  padding: '0.5rem', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  maxHeight: '110px'
                }}>
                  <img 
                    src={signature} 
                    alt="Receiver Signature" 
                    style={{ 
                      maxHeight: '90px', 
                      maxWidth: '100%', 
                      objectFit: 'contain', 
                      filter: 'contrast(1.2)' 
                    }} 
                  />
                </div>
              ) : (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-tertiary)', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  No signature proof recorded.
                </div>
              )}
            </div>
          </div>

          {/* Photographic Proof of Drop Card */}
          <div className="details-card">
            <h4 className="details-card-title">
              <Camera size={18} style={{ color: 'var(--primary)' }} />
              <span>Photographic Proof</span>
            </h4>

            {photo ? (
              <div>
                <span className="details-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Drop-off Location Photo</span>
                <div className="proof-img-container">
                  <img 
                    src={photo} 
                    alt="Proof of Delivery Drop-off" 
                    className="proof-img" 
                  />
                </div>
              </div>
            ) : (
              <div style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-tertiary)', 
                backgroundColor: 'var(--bg-tertiary)', 
                padding: '2rem', 
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px dashed var(--border-color)'
              }}>
                <Camera size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem auto' }} />
                <span>No photographic drop-off proof uploaded.</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
