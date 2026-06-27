import React from 'react';
import { 
  Check, 
  User, 
  Truck, 
  MapPin, 
  Navigation, 
  FileCheck2, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';

export default function DeliveryTrackingTimeline({ delivery }) {
  if (!delivery) return null;

  // Format Helper
  const formatDateTime = (timeStr, offsetHours = 0) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr.replace(' ', 'T'));
      if (offsetHours !== 0) {
        d.setHours(d.getHours() - offsetHours);
      }
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Extract variables
  const status = delivery.status || 'Pending';
  const driverName = delivery.driver_name;
  const vehicleNumber = delivery.vehicle_number;
  const deliveryTime = delivery.delivery_time;
  const receiverName = delivery.receiver_name || 'N/A';
  const remarks = delivery.remarks || delivery.delivery_remarks || '';

  // Get real tracking history if available
  const history = delivery.history || [];
  const getHistoryEntry = (targetStatus) => {
    return history.find(h => h.status === targetStatus);
  };

  // Determine stage active/completion states
  const getStageState = (stageNum) => {
    switch (stageNum) {
      case 1:
        return 'completed'; // Shipment Created is always completed
      case 2:
        return driverName && driverName !== 'Not Assigned' ? 'completed' : 'pending';
      case 3:
        return ['In Transit', 'Out For Delivery', 'Delivered', 'Failed'].includes(status) ? 'completed' : 'pending';
      case 4:
        if (['Out For Delivery', 'Delivered'].includes(status)) return 'completed';
        if (status === 'In Transit') return 'active';
        return 'pending';
      case 5:
        if (status === 'Delivered') return 'completed';
        if (status === 'Out For Delivery') return 'active';
        if (status === 'Failed') return 'failed';
        return 'pending';
      case 6:
        if (status === 'Delivered') return 'completed';
        if (status === 'Failed') return 'failed';
        return 'pending';
      default:
        return 'pending';
    }
  };

  // Extract history entries
  const histPending = getHistoryEntry('Pending');
  const histTransit = getHistoryEntry('In Transit');
  const histOut = getHistoryEntry('Out For Delivery');
  const histDelivered = getHistoryEntry('Delivered');
  const histFailed = getHistoryEntry('Failed');

  const stages = [
    {
      id: 1,
      title: 'Shipment Created',
      icon: Clock,
      state: getStageState(1),
      dateTime: histPending ? formatDateTime(histPending.timestamp) : formatDateTime(deliveryTime, 24),
      remarks: histPending ? histPending.remarks : 'Consignment booked and billing invoice generated at HK Shipping Depot.'
    },
    {
      id: 2,
      title: 'Driver Assigned',
      icon: User,
      state: getStageState(2),
      dateTime: getStageState(2) === 'completed' 
        ? (histTransit ? formatDateTime(histTransit.timestamp) : formatDateTime(deliveryTime, 18)) 
        : '',
      remarks: getStageState(2) === 'completed' 
        ? `Driver ${driverName} assigned to transport consignment cargo.` 
        : 'Consignment queued for driver allocation.'
    },
    {
      id: 3,
      title: 'Vehicle Dispatched',
      icon: Truck,
      state: getStageState(3),
      dateTime: getStageState(3) === 'completed'
        ? (histTransit ? formatDateTime(histTransit.timestamp) : formatDateTime(deliveryTime, 12))
        : '',
      remarks: getStageState(3) === 'completed'
        ? (histTransit ? histTransit.remarks : `Cargo loaded. Vehicle ${vehicleNumber || 'N/A'} dispatched from Seattle Depot.`)
        : 'Awaiting container sealing and vehicle loading.'
    },
    {
      id: 4,
      title: 'In Transit',
      icon: Navigation,
      state: getStageState(4),
      dateTime: getStageState(4) === 'completed'
        ? (histOut ? formatDateTime(histOut.timestamp) : formatDateTime(deliveryTime, 6))
        : getStageState(4) === 'active'
        ? (histTransit ? formatDateTime(histTransit.timestamp) : formatDateTime(deliveryTime, 6))
        : '',
      remarks: getStageState(4) === 'completed'
        ? 'Consignment has completed regional hub transit linehaul.'
        : getStageState(4) === 'active'
        ? (histTransit ? histTransit.remarks : 'Consignment is in regional linehaul transit.')
        : 'Awaiting departure from sorting hub depot.'
    },
    {
      id: 5,
      title: 'Out For Delivery',
      icon: MapPin,
      state: getStageState(5),
      dateTime: ['completed', 'active', 'failed'].includes(getStageState(5))
        ? (histOut ? formatDateTime(histOut.timestamp) : formatDateTime(deliveryTime, 2))
        : '',
      remarks: getStageState(5) === 'completed'
        ? `Consignment arrived at destination area. Cargo handed over to local courier.`
        : getStageState(5) === 'active'
        ? (histOut ? histOut.remarks : `Consignment is out for delivery via vehicle ${vehicleNumber || 'N/A'}.`)
        : getStageState(5) === 'failed'
        ? (histFailed ? histFailed.remarks : `Delivery exception encountered during final route drop-off.`)
        : 'Awaiting local delivery route queue.'
    },
    {
      id: 6,
      title: 'Delivered',
      icon: FileCheck2,
      state: getStageState(6),
      dateTime: getStageState(6) === 'completed' 
        ? (histDelivered ? formatDateTime(histDelivered.timestamp) : formatDateTime(deliveryTime, 0))
        : getStageState(6) === 'failed'
        ? (histFailed ? formatDateTime(histFailed.timestamp) : formatDateTime(deliveryTime, 0))
        : '',
      remarks: getStageState(6) === 'completed'
        ? (histDelivered ? histDelivered.remarks : `Cargo delivered. Received and signed by ${receiverName}. Remarks: ${remarks || 'None'}`)
        : getStageState(6) === 'failed'
        ? (histFailed ? histFailed.remarks : `Delivery failed. Returned to warehouse depot. Reason: ${remarks || 'Recipient not available / Refused delivery'}`)
        : 'Awaiting recipient confirmation and digital signature.'
    }
  ];

  return (
    <div className="timeline-wrapper">
      <style>{`
        .timeline-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 0.25rem 0;
        }
        .timeline-row {
          display: flex;
          gap: 1.25rem;
          position: relative;
        }
        .timeline-connector {
          position: absolute;
          left: 17px;
          top: 36px;
          bottom: -16px;
          width: 3px;
          background-color: var(--border-color);
          z-index: 1;
        }
        .timeline-row:last-child .timeline-connector {
          display: none;
        }
        .timeline-badge-container {
          position: relative;
          z-index: 2;
        }
        .timeline-icon-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--bg-secondary);
          transition: all 0.25s ease;
        }
        .timeline-icon-badge.completed {
          background-color: var(--success-light);
          color: var(--success);
          border-color: var(--success-light);
          box-shadow: 0 0 0 3px var(--success-light);
        }
        .timeline-icon-badge.active {
          background-color: var(--info-light);
          color: var(--primary);
          border-color: var(--info-light);
          box-shadow: 0 0 0 3px var(--info-light);
          animation: pulse-badge 2s infinite;
        }
        .timeline-icon-badge.pending {
          background-color: var(--bg-tertiary);
          color: var(--text-tertiary);
          border-color: var(--bg-tertiary);
        }
        .timeline-icon-badge.failed {
          background-color: var(--danger-light);
          color: var(--danger);
          border-color: var(--danger-light);
          box-shadow: 0 0 0 3px var(--danger-light);
        }
        .timeline-card-content {
          flex: 1;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.85rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          transition: border-color var(--transition-speed);
        }
        .timeline-card-content.completed {
          border-left: 4px solid var(--success);
          background-color: rgba(16, 185, 129, 0.02);
        }
        .timeline-card-content.active {
          border-left: 4px solid var(--primary);
          background-color: rgba(2, 132, 199, 0.02);
        }
        .timeline-card-content.failed {
          border-left: 4px solid var(--danger);
          background-color: rgba(239, 68, 68, 0.02);
        }
        .timeline-header-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .timeline-card-title {
          font-weight: 700;
          font-size: 0.9rem;
          margin: 0;
        }
        .timeline-card-title.completed {
          color: var(--success);
        }
        .timeline-card-title.active {
          color: var(--primary);
        }
        .timeline-card-title.failed {
          color: var(--danger);
        }
        .timeline-card-title.pending {
          color: var(--text-secondary);
        }
        .timeline-card-time {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          font-weight: 600;
        }
        .timeline-card-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 2px 0 0 0;
        }
        @keyframes pulse-badge {
          0% {
            box-shadow: 0 0 0 0px rgba(2, 132, 199, 0.3);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(2, 132, 199, 0);
          }
          100% {
            box-shadow: 0 0 0 0px rgba(2, 132, 199, 0);
          }
        }
      `}</style>

      {stages.map((stage) => {
        const Icon = stage.icon;
        return (
          <div key={stage.id} className="timeline-row">
            <div className="timeline-connector" />
            
            <div className="timeline-badge-container">
              <div className={`timeline-icon-badge ${stage.state}`}>
                {stage.state === 'completed' && stage.id === 6 ? (
                  <Check size={16} strokeWidth={3} />
                ) : stage.state === 'failed' ? (
                  <AlertTriangle size={16} strokeWidth={2.5} />
                ) : (
                  <Icon size={16} strokeWidth={2.5} />
                )}
              </div>
            </div>

            <div className={`timeline-card-content ${stage.state}`}>
              <div className="timeline-header-block">
                <h5 className={`timeline-card-title ${stage.state}`}>
                  {stage.title}
                </h5>
                {stage.dateTime && (
                  <span className="timeline-card-time">
                    {stage.dateTime}
                  </span>
                )}
              </div>
              <p className="timeline-card-desc">
                {stage.remarks}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
