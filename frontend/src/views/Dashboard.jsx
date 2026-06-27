import React, { useState, useEffect } from 'react';
import { 
  Users, Truck, Shield, ShieldCheck, CreditCard, Clock, CheckCircle2, AlertCircle,
  PlusCircle, FileText, UserPlus, Link, ArrowUpRight, ArrowRight, Bell, Activity,
  Wrench, AlertTriangle, Play, HelpCircle, CheckCircle
} from 'lucide-react';
import { fetchComplianceDashboard } from '../api';

export default function Dashboard({ 
  deliveries = [], 
  onViewChange, 
  onSelectDelivery,
  onNavigateToSubView
}) {
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  
  useEffect(() => {
    async function loadComplianceData() {
      try {
        const data = await fetchComplianceDashboard();
        if (data) {
          setCriticalAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error('Failed to pre-fetch compliance alerts:', err);
      } finally {
        setIsLoadingAlerts(false);
      }
    }
    loadComplianceData();
  }, []);

  // Compute metrics dynamically
  const totalShipments = deliveries.length;
  const deliveredShipments = deliveries.filter(d => d.status === 'Delivered').length;
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;
  const inTransitShipments = deliveries.filter(d => d.status === 'In Transit' || d.status === 'Out For Delivery').length;
  
  const activeDrivers = new Set(deliveries.map(d => d.driver_name).filter(Boolean)).size || 3;
  const activeVehicles = new Set(deliveries.map(d => d.vehicle_number).filter(Boolean)).size || 4;
  const totalCustomers = new Set(deliveries.map(d => d.customer_name).filter(Boolean)).size || 3;

  // Mock financial estimates for dashboard KPIs
  const revenueGenerated = 28500.00;
  const outstandingPayments = 14700.00;

  // ====================================================================
  // RULE-BASED SMART ALERT & RECOMMENDATION ENGINE
  // ====================================================================
  const generateSmartAlerts = () => {
    const engineAlerts = [];

    // Rule 1: Delayed Shipment Alerts
    deliveries.forEach(d => {
      if (d.status === 'Failed') {
        engineAlerts.push({
          id: `delay-${d.id}`,
          type: 'shipment',
          severity: 'High',
          title: `Failed Shipment: ${d.consignment_no}`,
          message: `Delivery exception occurred for customer ${d.customer_name}. Remarks: ${d.remarks || 'None'}.`,
          actionLabel: 'Reschedule',
          actionView: 'history'
        });
      } else if (d.status === 'In Transit' && d.shipment_date) {
        // If shipment has been in transit for more than 24 hours (simulated check)
        const hrs = (new Date() - new Date(d.created_at || d.shipment_date)) / (1000 * 60 * 60);
        if (hrs > 24) {
          engineAlerts.push({
            id: `delay-${d.id}`,
            type: 'shipment',
            severity: 'Medium',
            title: `Transit Delay: ${d.consignment_no}`,
            message: `Consignment is in transit for over 24 hours. Driver: ${d.driver_name || 'Unassigned'}.`,
            actionLabel: 'Contact Driver',
            actionView: 'drivers'
          });
        }
      }
    });

    // Rule 2: Compliance Expiry Alerts
    criticalAlerts.forEach(alert => {
      if (alert.status === 'Expired') {
        engineAlerts.push({
          id: `compliance-exp-${alert.id}`,
          type: 'compliance',
          severity: 'High',
          title: `Expired Document: ${alert.document_type}`,
          message: `Vehicle ${alert.vehicle_number} has an expired ${alert.document_type.toLowerCase()} (${alert.days_remaining} days).`,
          actionLabel: 'Renew Permit',
          actionView: 'compliance'
        });
      } else if (alert.status === 'Expiring Soon') {
        engineAlerts.push({
          id: `compliance-soon-${alert.id}`,
          type: 'compliance',
          severity: 'Medium',
          title: `Expiring Soon: ${alert.document_type}`,
          message: `Vehicle ${alert.vehicle_number} document expires in ${alert.days_remaining} days.`,
          actionLabel: 'Initiate Renewal',
          actionView: 'compliance'
        });
      }
    });

    // Rule 3: Outstanding Payment Alerts
    if (outstandingPayments > 10000) {
      engineAlerts.push({
        id: 'finance-due',
        type: 'payment',
        severity: 'Medium',
        title: 'Outstanding Dues Over Limit',
        message: `Outstanding payments balance of ₹${outstandingPayments.toLocaleString()} exceeds warning threshold.`,
        actionLabel: 'Review Invoices',
        actionView: 'invoices'
      });
    }

    // Rule 4: Vehicle Maintenance Alerts
    // If vehicle status is 'Maintenance' in seeded permit data or fleet
    const vehiclesInMaintenance = ['DL-01-AL-9872']; 
    vehiclesInMaintenance.forEach(v => {
      engineAlerts.push({
        id: `maintenance-${v}`,
        type: 'maintenance',
        severity: 'Medium',
        title: `Vehicle Maintenance: ${v}`,
        message: `Vehicle is currently flagged under maintenance. Avoid dispatch allocations.`,
        actionLabel: 'Registry Details',
        actionView: 'fleet'
      });
    });

    // Rule 5: Driver Availability Alerts
    // If a driver is assigned to a vehicle currently under maintenance or has overloaded active tasks
    deliveries.forEach(d => {
      if (d.status === 'In Transit' && d.driver_name && d.vehicle_number === 'DL-01-AL-9872') {
        engineAlerts.push({
          id: `driver-avail-${d.id}`,
          type: 'driver',
          severity: 'High',
          title: `Driver Conflict: ${d.driver_name}`,
          message: `Driver assigned to vehicle ${d.vehicle_number} which is flagged in maintenance.`,
          actionLabel: 'Reassign Driver',
          actionView: 'drivers'
        });
      }
    });

    return engineAlerts;
  };

  const smartAlerts = generateSmartAlerts();

  // Create localized recommendation suggestions based on alerts
  const generateRecommendations = () => {
    const list = [];
    if (smartAlerts.some(a => a.type === 'compliance' && a.severity === 'High')) {
      list.push({
        id: 'rec-1',
        title: 'Immediate Compliance Renewals Needed',
        desc: 'Renew expired National Permits to avoid regulatory fines and dispatch lockdowns.',
        priority: 'Critical'
      });
    }
    if (smartAlerts.some(a => a.type === 'shipment' && a.severity === 'High')) {
      list.push({
        id: 'rec-2',
        title: 'Re-route Failed Shipments',
        desc: 'Contact receiver and assign alternative dispatch routes for failed cargo dropoffs.',
        priority: 'High'
      });
    }
    if (outstandingPayments > 12000) {
      list.push({
        id: 'rec-3',
        title: 'Initiate Collections Run',
        desc: 'Generate overdue statements for Nova Pharma and Apex Supply accounts.',
        priority: 'Medium'
      });
    }
    // Default recommendations if no active alerts
    if (list.length === 0) {
      list.push({
        id: 'rec-4',
        title: 'Optimize Fleet Dispatches',
        desc: 'Review driver shift allocations and schedule preventive maintenance audits.',
        priority: 'Low'
      });
    }
    return list;
  };

  const recommendations = generateRecommendations();

  // Mock latest activities feed
  const activities = [
    { id: 1, type: 'status', msg: 'Consignment HKS-802495 changed status to Delivered', time: '10 mins ago' },
    { id: 2, type: 'pod', msg: 'POD upload completed by John Miller for HKS-802495', time: '12 mins ago' },
    { id: 3, type: 'shipment', msg: 'New shipment HKS-601932 booked for HoloTech Systems', time: '45 mins ago' },
    { id: 4, type: 'driver', msg: 'Driver Robert Chen assigned to vehicle DL-01-AL-9872', time: '1 hr ago' }
  ];

  return (
    <div className="view-container dashboard-view-page">
      <style>{`
        .dashboard-view-page {
          animation: fadeIn 0.4s ease-out;
        }
        .recommendation-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-left: 4px solid var(--primary);
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .recommendation-priority {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .priority-critical { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .priority-high { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .priority-medium { background: rgba(59, 130, 246, 0.1); color: var(--primary); }
        .priority-low { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        
        .alert-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .alert-item-row:last-child {
          border-bottom: none;
        }
      `}</style>

      {/* Header Panel */}
      <div className="view-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="view-header-title">POD Admin Console</h1>
          <p className="view-header-subtitle">Centralized logistics operations, cash flow tracking, and fleet compliance hub.</p>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Card 1: Total Customers */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('crm')}
          style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Customers</span>
            <Users size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalCustomers}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Active corporate CRM accounts</div>
        </div>

        {/* Card 2: Total Shipments */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('shipments_core')}
          style={{ borderLeft: '4px solid var(--info)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Shipments</span>
            <Truck size={16} style={{ color: 'var(--info)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalShipments}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Bookings logged in database</div>
        </div>

        {/* Card 3: Active Vehicles */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('fleet')}
          style={{ borderLeft: '4px solid var(--success)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Vehicles</span>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeVehicles}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Registered fleet trucks en route</div>
        </div>

        {/* Card 4: Active Drivers */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('drivers')}
          style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Active Drivers</span>
            <Users size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeDrivers}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Couriers on duty shifts</div>
        </div>

        {/* Card 5: Delivered Shipments */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('history')}
          style={{ borderLeft: '4px solid var(--success)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Delivered Cargo</span>
            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{deliveredShipments}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Successfully completed dropoffs</div>
        </div>

        {/* Card 6: Pending Deliveries */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('history')}
          style={{ borderLeft: '4px solid var(--warning)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Deliveries</span>
            <Clock size={16} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingDeliveries}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Awaiting hub handover</div>
        </div>

        {/* Card 7: Revenue Generated */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('invoices')}
          style={{ borderLeft: '4px solid var(--primary)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue Generated</span>
            <CreditCard size={16} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{revenueGenerated.toLocaleString()}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Settled invoice billing value</div>
        </div>

        {/* Card 8: Outstanding Payments */}
        <div 
          className="card stat-card" 
          onClick={() => onNavigateToSubView && onNavigateToSubView('invoices')}
          style={{ borderLeft: '4px solid var(--danger)', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="stat-title" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Outstanding Due</span>
            <CreditCard size={16} style={{ color: 'var(--danger)' }} />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{outstandingPayments.toLocaleString()}</div>
          <div className="stat-footer" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Unpaid/Overdue balance</div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Console Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => onViewChange('shipments')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={16} />
            <span>Create Shipment</span>
          </button>
          
          <button className="btn btn-outline" onClick={() => onViewChange('invoices')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} />
            <span>Generate Invoice</span>
          </button>
          
          <button className="btn btn-outline" onClick={() => onViewChange('crm')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={16} />
            <span>Add Customer</span>
          </button>
          
          <button className="btn btn-outline" onClick={() => onViewChange('drivers')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link size={16} />
            <span>Assign Driver</span>
          </button>
          
          <button className="btn btn-outline" onClick={() => onViewChange('pod-form')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={16} />
            <span>Upload POD</span>
          </button>
        </div>
      </div>

      {/* SMART ALERT & RECOMMENDATIONS ENGINE PANEL */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderTop: '4px solid var(--primary)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} className="text-primary" style={{ color: 'var(--primary)' }} />
          <span>Smart Alerts & Priority Recommendations Engine</span>
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Priority Action Alerts list */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Priority Exception Alerts
            </h4>
            {isLoadingAlerts ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Evaluating metrics data...</p>
            ) : smartAlerts.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                <CheckCircle size={28} style={{ color: 'var(--success)', margin: '0 auto 0.5rem auto' }} />
                <span>All operations, vehicles, and billing accounts in compliance.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '280px', overflowY: 'auto' }}>
                {smartAlerts.map(alert => {
                  let icon = <AlertCircle size={16} />;
                  let iconColor = 'var(--warning)';
                  if (alert.type === 'maintenance') { icon = <Wrench size={16} />; iconColor = 'var(--warning)'; }
                  else if (alert.type === 'payment') { icon = <CreditCard size={16} />; iconColor = 'var(--danger)'; }
                  else if (alert.type === 'compliance' && alert.severity === 'High') { icon = <AlertTriangle size={16} />; iconColor = 'var(--danger)'; }

                  return (
                    <div key={alert.id} className="alert-item-row">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
                        <span style={{ color: iconColor }}>{icon}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{alert.title}</span>
                          <span className={`recommendation-priority priority-${alert.severity.toLowerCase()}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{alert.message}</p>
                      </div>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => onViewChange(alert.actionView)}
                      >
                        {alert.actionLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Core Recommendations */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Suggested Actions & Advice
            </h4>
            <div>
              {recommendations.map(rec => (
                <div key={rec.id} className="recommendation-card" style={{ borderLeftColor: rec.priority === 'Critical' ? 'var(--danger)' : rec.priority === 'High' ? 'var(--warning)' : 'var(--primary)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{rec.title}</span>
                      <span className={`recommendation-priority ${rec.priority === 'Critical' ? 'priority-critical' : rec.priority === 'High' ? 'priority-high' : rec.priority === 'Medium' ? 'priority-medium' : 'priority-low'}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{rec.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Feed Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Latest Activities */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} className="text-primary" style={{ color: 'var(--primary)' }} />
            <span>Latest Logistics Activities</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map(act => (
              <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{act.msg}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & warnings */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'var(--warning)' }} />
            <span>Compliance Expiry alerts</span>
          </h3>
          {criticalAlerts.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No statutory document alerts active.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {criticalAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} style={{ display: 'flex', gap: '10px', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', borderLeft: alert.priority === 'High' ? '3px solid var(--danger)' : '3px solid var(--warning)' }}>
                  <AlertCircle size={16} style={{ color: alert.priority === 'High' ? 'var(--danger)' : 'var(--warning)', marginTop: '2px' }} />
                  <div style={{ fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600 }}>Vehicle {alert.vehicle_number}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{alert.document_type} Expiry in {alert.days_remaining} days</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
