import React, { useState, useEffect } from 'react';
import { 
  Activity, Search, Filter, Download, Calendar, 
  ArrowRight, User, RefreshCw, FileText, CheckCircle2 
} from 'lucide-react';
import { fetchActivityLogs } from '../api';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch activity logs
  const loadLogs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params = {
        search: searchQuery || undefined,
        module: moduleFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
      const data = await fetchActivityLogs(params);
      setLogs(data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sync audit logs with server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [searchQuery, moduleFilter, startDate, endDate]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = 'ID,Operator,Source Module,Action Description,Timestamp,IP Address';
    const rows = logs.map(l => 
      `"${l.id}","${l.user}","${l.module}","${l.action.replace(/"/g, '""')}","${l.timestamp}","${l.ip_address || l.ip || ''}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HK_Shipping_Audit_Ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="view-container activity-log-page">
      <style>{`
        .activity-log-page {
          animation: fadeIn 0.4s ease-out;
        }
        .audit-tag {
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .audit-tag.shipments { background-color: rgba(2, 132, 199, 0.12); color: #0284c7; }
        .audit-tag.pod { background-color: rgba(16, 185, 129, 0.12); color: #10b981; }
        .audit-tag.fleet { background-color: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .audit-tag.drivers { background-color: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .audit-tag.invoices { background-color: rgba(236, 72, 153, 0.12); color: #ec4899; }
        .audit-tag.customers { background-color: rgba(20, 184, 166, 0.12); color: #14b8a6; }
        .audit-tag.default { background-color: rgba(100, 116, 139, 0.12); color: #64748b; }
      `}</style>

      {/* Header Panel */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Audit Trail Management</h1>
          <p className="view-header-subtitle">
            Secure, searchable audit ledger logging user actions, record additions/updates, and transit status transitions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint}>Print Audit Ledger</button>
          <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-header">
            <span className="stat-title">Total Logs</span>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value">{isLoading ? '...' : logs.length}</div>
          <div className="stat-footer">
            <span>Overall actions audited</span>
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-header">
            <span className="stat-title">Shipment & POD Events</span>
            <Activity size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div className="stat-value">
            {isLoading ? '...' : logs.filter(l => ['Shipments', 'POD'].includes(l.module)).length}
          </div>
          <div className="stat-footer">
            <span>Delivery & document modifications</span>
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-header">
            <span className="stat-title">Fleet & Driver Edits</span>
            <Activity size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div className="stat-value">
            {isLoading ? '...' : logs.filter(l => ['Fleet', 'Drivers'].includes(l.module)).length}
          </div>
          <div className="stat-footer">
            <span>Asset registries alterations</span>
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-header">
            <span className="stat-title">Invoice & Customer CRM</span>
            <Activity size={18} style={{ color: 'var(--info)' }} />
          </div>
          <div className="stat-value">
            {isLoading ? '...' : logs.filter(l => ['Invoices', 'Customers'].includes(l.module)).length}
          </div>
          <div className="stat-footer">
            <span>Financial & client audit actions</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          {/* Text Search */}
          <div style={{ position: 'relative', flex: 1.5, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={16} />
            <input
              type="text"
              placeholder="Search by User, Action description, or IP..."
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* Module Selector */}
          <div style={{ flex: 0.8, minWidth: '150px' }}>
            <select
              className="form-input"
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">All Source Modules</option>
              <option value="Shipments">Shipments</option>
              <option value="POD">POD</option>
              <option value="Fleet">Fleet</option>
              <option value="Drivers">Drivers</option>
              <option value="Invoices">Invoices</option>
              <option value="Customers">Customers</option>
              <option value="Compliance">Compliance</option>
              <option value="Identity Management">Identity & Users</option>
            </select>
          </div>

          {/* Date Picker Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1.2, minWidth: '280px' }}>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              title="Start Date"
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>to</span>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              title="End Date"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Audit Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
              <RefreshCw size={28} className="spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Syncing Audit Ledger...</span>
            </div>
          ) : (
            <table className="delivery-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '140px' }}>User / Operator</th>
                  <th style={{ width: '130px' }}>Source Module</th>
                  <th>User Action / Status Changes</th>
                  <th style={{ width: '120px' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                      No audit trails found matching parameters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const modClass = (log.module || '').toLowerCase().replace(' ', '');
                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.825rem' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`audit-tag ${['shipments', 'pod', 'fleet', 'drivers', 'invoices', 'customers'].includes(modClass) ? modClass : 'default'}`}>
                            {log.module}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                          {log.action}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
