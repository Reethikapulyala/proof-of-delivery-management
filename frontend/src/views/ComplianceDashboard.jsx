import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Calendar, AlertTriangle, AlertCircle, 
  Search, Plus, Trash2, Edit2, CheckCircle2, RotateCw, Filter, FileText, Download 
} from 'lucide-react';
import { 
  fetchComplianceDashboard, fetchComplianceAlerts, fetchComplianceReports, createComplianceReport,
  fetchPermits, createPermit, updatePermit, renewPermit, deletePermit,
  fetchInsurance, createInsurance, updateInsurance, renewInsurance, deleteInsurance,
  fetchFitness, createFitness, updateFitness, renewFitness, deleteFitness,
  fetchPollution, createPollution, updatePollution, renewPollution, deletePollution
} from '../api';

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, permits, insurance, fitness, pollution, reports
  const [kpis, setKpis] = useState({
    totalVehicles: 0,
    totalDocuments: 0,
    activeDocuments: 0,
    expiringDocuments: 0,
    expiredDocuments: 0,
    compliancePercentage: 100
  });
  const [alerts, setAlerts] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active records listing for managers
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subTypeFilter, setSubTypeFilter] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);
  
  // Dynamic Form State
  const [formData, setFormData] = useState({
    vehicle_number: '',
    permit_type: 'National Permit',
    permit_number: '',
    insurance_provider: '',
    policy_number: '',
    coverage_amount: '',
    premium_amount: '',
    certificate_number: '',
    inspection_center: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: ''
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchComplianceDashboard();
      if (data) {
        setKpis(data.kpis || {});
        setAlerts(data.alerts || []);
      }
      const repData = await fetchComplianceReports();
      setReports(repData || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync with database compliance service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else {
      loadRecords();
    }
  }, [activeTab, searchQuery, statusFilter, subTypeFilter]);

  const loadRecords = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let data = [];
      const params = {
        search: searchQuery,
        status: statusFilter
      };

      switch (activeTab) {
        case 'permits':
          params.type = subTypeFilter;
          data = await fetchPermits(params);
          break;
        case 'insurance':
          data = await fetchInsurance(params);
          break;
        case 'fitness':
          data = await fetchFitness(params);
          break;
        case 'pollution':
          data = await fetchPollution(params);
          break;
        default:
          break;
      }
      setRecords(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(`Failed to retrieve ${activeTab} data.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({
      vehicle_number: '',
      permit_type: 'National Permit',
      permit_number: '',
      insurance_provider: '',
      policy_number: '',
      coverage_amount: '',
      premium_amount: '',
      certificate_number: '',
      inspection_center: '',
      issuing_authority: '',
      issue_date: '',
      expiry_date: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (rec) => {
    setModalMode('edit');
    setEditingId(rec.id);
    
    // Map dates properly to YYYY-MM-DD
    const formatDateForInput = (dStr) => {
      if (!dStr) return '';
      return dStr.split('T')[0];
    };

    setFormData({
      vehicle_number: rec.vehicle_number || '',
      permit_type: rec.permit_type || 'National Permit',
      permit_number: rec.permit_number || '',
      insurance_provider: rec.insurance_provider || '',
      policy_number: rec.policy_number || '',
      coverage_amount: rec.coverage_amount || '',
      premium_amount: rec.premium_amount || '',
      certificate_number: rec.certificate_number || '',
      inspection_center: rec.inspection_center || '',
      issuing_authority: rec.issuing_authority || '',
      issue_date: formatDateForInput(rec.issue_date || rec.start_date),
      expiry_date: formatDateForInput(rec.expiry_date)
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (modalMode === 'add') {
        switch (activeTab) {
          case 'permits':
            await createPermit(formData);
            break;
          case 'insurance':
            await createInsurance(formData);
            break;
          case 'fitness':
            await createFitness(formData);
            break;
          case 'pollution':
            await createPollution(formData);
            break;
        }
      } else {
        switch (activeTab) {
          case 'permits':
            await updatePermit(editingId, formData);
            break;
          case 'insurance':
            await updateInsurance(editingId, formData);
            break;
          case 'fitness':
            await updateFitness(editingId, formData);
            break;
          case 'pollution':
            await updatePollution(editingId, formData);
            break;
        }
      }
      setShowModal(false);
      loadRecords();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Operation failed. Verify duplicate credentials.');
    }
  };

  const handleRenew = async (id) => {
    setErrorMsg('');
    if (!window.confirm('Renew this document for 1 year?')) return;
    try {
      switch (activeTab) {
        case 'permits':
          await renewPermit(id);
          break;
        case 'insurance':
          await renewInsurance(id);
          break;
        case 'fitness':
          await renewFitness(id);
          break;
        case 'pollution':
          await renewPollution(id);
          break;
      }
      loadRecords();
    } catch (err) {
      setErrorMsg('Failed to process renewal.');
    }
  };

  const handleDelete = async (id) => {
    setErrorMsg('');
    if (!window.confirm('Are you sure you want to delete this compliance record?')) return;
    try {
      switch (activeTab) {
        case 'permits':
          await deletePermit(id);
          break;
        case 'insurance':
          await deleteInsurance(id);
          break;
        case 'fitness':
          await deleteFitness(id);
          break;
        case 'pollution':
          await deletePollution(id);
          break;
      }
      loadRecords();
    } catch (err) {
      setErrorMsg('Failed to delete record.');
    }
  };

  const handleGenerateReport = async (reportType, statusType) => {
    try {
      const filters = { status: statusType };
      const recordCount = records.filter(r => statusType === 'All' || r.status === statusType).length;
      
      const newReport = await createComplianceReport({
        report_type: reportType,
        generated_by: 'Logistics Admin',
        filters_applied: filters,
        record_count: recordCount
      });
      
      alert(`Report generated successfully!\nType: ${reportType}\nRecord Count: ${recordCount}`);
      const repData = await fetchComplianceReports();
      setReports(repData || []);
    } catch (err) {
      alert('Failed to log report generation.');
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map(r => 
      Object.values(r).map(val => `"${val}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HK_Shipping_Compliance_${activeTab}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-container">
      {/* View Header */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Corporate Compliance & Expiry Center</h1>
          <p className="view-header-subtitle">
            Manage fleet vehicles documents, national permits, and statutory checklists.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab !== 'dashboard' && activeTab !== 'reports' && (
            <>
              <button className="btn btn-outline" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={15} />
                <span>Export CSV</span>
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={15} />
                <span>Add Record</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="filter-btn-group" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        {[
          { id: 'dashboard', label: 'Summary Statistics' },
          { id: 'permits', label: 'Vehicle Permits' },
          { id: 'insurance', label: 'Insurance Policies' },
          { id: 'fitness', label: 'Fitness Certificates' },
          { id: 'pollution', label: 'Pollution (PUC)' },
          { id: 'reports', label: 'Audits Log' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
              setStatusFilter('');
              setSubTypeFilter('');
            }}
            style={{
              padding: '0.55rem 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              background: 'none',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              borderRadius: '0'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>{errorMsg}</p>
        </div>
      )}

      {/* RENDER VIEW ACCORDING TO SELECTED TAB */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <RotateCw size={24} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Retrieving statutory documents...</p>
        </div>
      ) : activeTab === 'dashboard' ? (
        <>
          {/* KPI Dashboard Analytics Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="stat-header">
                <span className="stat-title">Fleet Compliance Score</span>
                <ShieldCheck size={20} style={{ color: 'var(--success)' }} />
              </div>
              <div className="stat-value">{kpis.compliancePercentage}%</div>
              <div className="stat-footer">
                <span>Valid statutory documents ratio</span>
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="stat-header">
                <span className="stat-title">Valid Records</span>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              </div>
              <div className="stat-value">{kpis.activeDocuments}</div>
              <div className="stat-footer">
                <span>Documents in force</span>
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div className="stat-header">
                <span className="stat-title">Expiring Soon (30 Days)</span>
                <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
              </div>
              <div className="stat-value">{kpis.expiringDocuments}</div>
              <div className="stat-footer">
                <span>Requires immediate renewal</span>
              </div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div className="stat-header">
                <span className="stat-title">Expired Documents</span>
                <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
              </div>
              <div className="stat-value">{kpis.expiredDocuments}</div>
              <div className="stat-footer">
                <span>Critical vehicle suspension</span>
              </div>
            </div>
          </div>

          {/* Warnings board and Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert style={{ color: 'var(--danger)' }} />
                <span>Fleet Warnings & Notifications Feed</span>
              </h3>
              {alerts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No active document violations reported.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {alerts.map(alert => (
                    <div key={alert.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: alert.priority === 'High' ? '4px solid var(--danger)' : '4px solid var(--warning)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          Vehicle {alert.vehicle_number} - {alert.document_type} {alert.days_remaining <= 0 ? 'Expired' : 'Expiring'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {alert.days_remaining <= 0 ? `Expired ${Math.abs(alert.days_remaining)} days ago` : `Expires in ${alert.days_remaining} days`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: alert.priority === 'High' ? 'var(--danger-light)' : 'var(--warning-light)', color: alert.priority === 'High' ? 'var(--danger)' : 'var(--warning)' }}>
                          {alert.priority} Priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Instant Reports Logger</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Trigger and save compliance reports logs in the central database:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => handleGenerateReport('All Permits Summary', 'All')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start' }}>
                  Generate General Permits Summary
                </button>
                <button className="btn btn-outline" onClick={() => handleGenerateReport('Expired Document Audits', 'Expired')} style={{ fontSize: '0.8rem', justifyContent: 'flex-start', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Audit Expired Documents
                </button>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'reports' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Statutory Audits History</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="delivery-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Report Name</th>
                  <th>Logged By</th>
                  <th>Filters Applied</th>
                  <th>Records Found</th>
                  <th>Generated At</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No audits reports logged.</td>
                  </tr>
                ) : (
                  reports.map(rep => (
                    <tr key={rep.id}>
                      <td>#{rep.id}</td>
                      <td style={{ fontWeight: 600 }}>{rep.report_type}</td>
                      <td>{rep.generated_by}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{rep.filters_applied}</td>
                      <td style={{ fontWeight: 600 }}>{rep.record_count} items</td>
                      <td>{new Date(rep.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Document listing with live Search and Status Filtering */
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={16} />
              <input
                type="text"
                placeholder="Search Vehicle, Document Number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.5rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="">All Statuses</option>
                <option value="Valid">Valid</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Expired">Expired</option>
              </select>

              {activeTab === 'permits' && (
                <select
                  value={subTypeFilter}
                  onChange={e => setSubTypeFilter(e.target.value)}
                  style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">All Permit Types</option>
                  <option value="National Permit">National Permit</option>
                  <option value="State Permit">State Permit</option>
                  <option value="Goods Permit">Goods Permit</option>
                  <option value="Special Permit">Special Permit</option>
                </select>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="delivery-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  {activeTab === 'permits' && <th>Permit Type</th>}
                  {activeTab === 'insurance' && <th>Provider</th>}
                  <th>Document Number</th>
                  {activeTab === 'insurance' && <th>Coverage</th>}
                  {activeTab === 'fitness' && <th>Center</th>}
                  {activeTab === 'pollution' && <th>Authority</th>}
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No compliance documents matching filters.</td>
                  </tr>
                ) : (
                  records.map(rec => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 600 }}>{rec.vehicle_number}</td>
                      {activeTab === 'permits' && <td>{rec.permit_type}</td>}
                      {activeTab === 'insurance' && <td>{rec.insurance_provider}</td>}
                      <td>{rec.permit_number || rec.policy_number || rec.certificate_number}</td>
                      {activeTab === 'insurance' && <td>₹{parseFloat(rec.coverage_amount).toLocaleString()}</td>}
                      {activeTab === 'fitness' && <td>{rec.inspection_center}</td>}
                      {activeTab === 'pollution' && <td>{rec.issuing_authority}</td>}
                      <td>{(rec.issue_date || rec.start_date || '').split('T')[0]}</td>
                      <td style={{ fontWeight: 600 }}>{(rec.expiry_date || '').split('T')[0]}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: rec.status === 'Valid' ? 'var(--success-light)' : (rec.status === 'Expired' ? 'var(--danger-light)' : 'var(--warning-light)'),
                          color: rec.status === 'Valid' ? 'var(--success)' : (rec.status === 'Expired' ? 'var(--danger)' : 'var(--warning)')
                        }}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleOpenEditModal(rec)} className="btn btn-outline" style={{ padding: '0.3rem', minWidth: 'auto' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleRenew(rec.id)} className="btn btn-outline" style={{ padding: '0.3rem', minWidth: 'auto', color: 'var(--success)' }} title="Renew 1 Year">
                            <RotateCw size={13} />
                          </button>
                          <button onClick={() => handleDelete(rec.id)} className="btn btn-outline" style={{ padding: '0.3rem', minWidth: 'auto', color: 'var(--danger)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{modalMode === 'add' ? 'Add Statutory Document' : 'Edit statutory Document'}</h3>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Vehicle Number</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={formData.vehicle_number}
                  onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })}
                />
              </div>

              {activeTab === 'permits' && (
                <>
                  <div>
                    <label className="form-label">Permit Type</label>
                    <select
                      className="form-input"
                      value={formData.permit_type}
                      onChange={e => setFormData({ ...formData, permit_type: e.target.value })}
                    >
                      <option value="National Permit">National Permit</option>
                      <option value="State Permit">State Permit</option>
                      <option value="Goods Permit">Goods Permit</option>
                      <option value="Special Permit">Special Permit</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Permit Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.permit_number}
                      onChange={e => setFormData({ ...formData, permit_number: e.target.value })}
                    />
                  </div>
                </>
              )}

              {activeTab === 'insurance' && (
                <>
                  <div>
                    <label className="form-label">Insurance Provider</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.insurance_provider}
                      onChange={e => setFormData({ ...formData, insurance_provider: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Policy Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.policy_number}
                      onChange={e => setFormData({ ...formData, policy_number: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="form-label">Coverage Amount</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.coverage_amount}
                        onChange={e => setFormData({ ...formData, coverage_amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Premium Amount</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.premium_amount}
                        onChange={e => setFormData({ ...formData, premium_amount: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'fitness' && (
                <>
                  <div>
                    <label className="form-label">Certificate Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.certificate_number}
                      onChange={e => setFormData({ ...formData, certificate_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Inspection Center</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.inspection_center}
                      onChange={e => setFormData({ ...formData, inspection_center: e.target.value })}
                    />
                  </div>
                </>
              )}

              {activeTab === 'pollution' && (
                <>
                  <div>
                    <label className="form-label">Certificate Number</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.certificate_number}
                      onChange={e => setFormData({ ...formData, certificate_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Issuing Authority</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={formData.issuing_authority}
                      onChange={e => setFormData({ ...formData, issuing_authority: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">Issue Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.issue_date}
                    onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.expiry_date}
                    onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
