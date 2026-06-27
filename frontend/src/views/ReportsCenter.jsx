import React, { useState } from 'react';
import { FileText, Calendar, Filter, Download, Printer, Settings, Plus, Trash2 } from 'lucide-react';

export default function ReportsCenter() {
  const [selectedReport, setSelectedReport] = useState('Shipment Report');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Custom report builder states
  const [customColumns, setCustomColumns] = useState([
    { id: 'consignment_no', label: 'Consignment No', active: true },
    { id: 'customer', label: 'Customer', active: true },
    { id: 'driver', label: 'Driver Assigned', active: true },
    { id: 'date', label: 'Timestamp Date', active: true },
    { id: 'status', label: 'Transit Status', active: true },
    { id: 'amount', label: 'Billing Amount (₹)', active: false }
  ]);

  const [generatedData, setGeneratedData] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  // Mock datasets for the 8 statutory reports
  const mockReportDatabase = {
    'Shipment Report': [
      { 'Consignment No': 'HKS-802495', 'Customer': 'Nova Pharma Inc', 'Route': 'Seattle ➔ Portland', 'Driver': 'John Miller', 'Date': '2026-06-18', 'Status': 'Delivered' },
      { 'Consignment No': 'HKS-392817', 'Customer': 'Apex Industrial Supply', 'Route': 'Detroit ➔ Chicago', 'Driver': 'Robert Chen', 'Date': '2026-06-18', 'Status': 'In Transit' },
      { 'Consignment No': 'HKS-601932', 'Customer': 'HoloTech Systems', 'Route': 'Boston ➔ New York', 'Driver': 'David Miller', 'Date': '2026-06-18', 'Status': 'Booked' }
    ],
    'POD Report': [
      { 'Consignment No': 'HKS-802495', 'Receiver Name': 'Dr. Karen Vance', 'Delivery Date': '2026-06-18', 'POD Image Path': 'uploads/sample_photo_1.png', 'POD Status': 'Uploaded' },
      { 'Consignment No': 'HKS-392817', 'Receiver Name': 'Marcus Thorne', 'Delivery Date': '2026-06-18', 'POD Image Path': 'uploads/sample_photo_2.png', 'POD Status': 'Uploaded' }
    ],
    'Fleet Report': [
      { 'Vehicle Number': 'MH-12-GQ-5524', 'Manufacturer': 'Tata Motors', 'Model': 'Prima 4028', 'Type': 'Heavy Truck', 'Status': 'Active' },
      { 'Vehicle Number': 'DL-01-AL-9872', 'Manufacturer': 'Mahindra', 'Model': 'Blazo X', 'Type': 'Multi-axle Truck', 'Status': 'Maintenance' },
      { 'Vehicle Number': 'KA-03-MP-4122', 'Manufacturer': 'BharatBenz', 'Model': '1617R', 'Type': 'Light Truck', 'Status': 'Active' }
    ],
    'Driver Report': [
      { 'Driver Name': 'John Miller', 'License Number': 'DL-MH-12-20230048', 'Phone Number': '+91 98765 43210', 'Vehicle': 'MH-12-GQ-5524', 'Duty Status': 'Active' },
      { 'Driver Name': 'Robert Chen', 'License Number': 'DL-DL-01-20220092', 'Phone Number': '+91 99887 76655', 'Vehicle': 'DL-01-AL-9872', 'Duty Status': 'In Transit' }
    ],
    'Customer Report': [
      { 'Client Name': 'Nova Pharma Inc', 'Email Contact': 'logistics@novapharma.com', 'Active Cargo': '12 units', 'Outstanding Balance': '₹15,000.00' },
      { 'Client Name': 'Apex Industrial Supply', 'Email Contact': 'shipping@apexindustrial.com', 'Active Cargo': '8 units', 'Outstanding Balance': '₹8,500.00' },
      { 'Client Name': 'HoloTech Systems', 'Email Contact': 'ops@holotech.io', 'Active Cargo': '5 units', 'Outstanding Balance': '₹0.00' }
    ],
    'Invoice Report': [
      { 'Invoice No': 'INV-2026-1024', 'Customer': 'Nova Pharma Inc', 'Base Amount': '₹4,800.00', 'CGST (9%)': '₹432.00', 'SGST (9%)': '₹432.00', 'Grand Total': '₹5,664.00', 'Due Date': '2026-06-15', 'Status': 'Paid' },
      { 'Invoice No': 'INV-2026-1025', 'Customer': 'Apex Industrial Supply', 'Base Amount': '₹6,200.00', 'IGST (18%)': '₹1,116.00', 'Grand Total': '₹7,316.00', 'Due Date': '2026-06-10', 'Status': 'Overdue' }
    ],
    'Payment Report': [
      { 'Payment Ref': 'PAY-88210', 'Invoice No': 'INV-2026-1024', 'Customer': 'Nova Pharma Inc', 'Amount Paid': '₹4,800.00', 'Payment Mode': 'UPI', 'Settlement Date': '2026-06-15' }
    ],
    'Compliance Report': [
      { 'Vehicle Number': 'DL-01-AL-9872', 'Document Type': 'Permit', 'Document Number': 'PERMIT-SP-9872B', 'Expiry Date': '2026-06-30', 'Days Remaining': '12 days', 'Status': 'Expiring Soon' },
      { 'Vehicle Number': 'KA-03-MP-4122', 'Document Type': 'Insurance', 'Document Number': 'INS-POL-4122C', 'Expiry Date': '2026-06-15', 'Days Remaining': '-3 days', 'Status': 'Expired' }
    ]
  };

  const handleGenerateReport = () => {
    // Generate data from the selected report
    const data = mockReportDatabase[selectedReport] || [];
    setGeneratedData(data);
    setIsGenerated(true);
  };

  const handleExportCSV = () => {
    if (generatedData.length === 0) return;
    const headers = Object.keys(generatedData[0]).join(',');
    const rows = generatedData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HK_Shipping_${selectedReport.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleColumn = (id) => {
    setCustomColumns(customColumns.map(col => col.id === id ? { ...col, active: !col.active } : col));
  };

  return (
    <div className="view-container">
      {/* Header Panel */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Corporate Reports Center</h1>
          <p className="view-header-subtitle">
            Configure statutory shipping logs, generate invoices balance ledgers, and export audits spreadsheets.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }}>
        {/* Left config side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={16} />
              <span>Report Configurations</span>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Select Report Template</label>
                <select 
                  className="form-input" 
                  value={selectedReport} 
                  onChange={e => {
                    setSelectedReport(e.target.value);
                    setIsGenerated(false);
                  }}
                >
                  <option value="Shipment Report">Shipment Report</option>
                  <option value="POD Report">POD Report</option>
                  <option value="Fleet Report">Fleet Report</option>
                  <option value="Driver Report">Driver Report</option>
                  <option value="Customer Report">Customer Report</option>
                  <option value="Invoice Report">Invoice Report</option>
                  <option value="Payment Report">Payment Report</option>
                  <option value="Compliance Report">Compliance Report</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label">Filter Status</label>
                <select className="form-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed / Paid / Valid</option>
                  <option value="Pending">Pending / Active</option>
                  <option value="Failed">Failed / Overdue / Expired</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleGenerateReport} style={{ marginTop: '0.5rem' }}>
                Generate Preview
              </button>
            </div>
          </div>

          {/* Custom Builder */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Custom Report Builder</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.75rem' }}>
              Toggle fields to customize preview columns:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {customColumns.map(col => (
                <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={col.active} onChange={() => toggleColumn(col.id)} />
                  <span style={{ color: col.active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right preview side */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ color: 'var(--primary)' }} />
              <span>Report Preview Pane</span>
            </h3>
            
            {isGenerated && generatedData.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={handlePrint} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Printer size={14} />
                  <span>Print PDF</span>
                </button>
                <button className="btn btn-outline" onClick={handleExportCSV} style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>

          {!isGenerated ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', minHeight: '300px' }}>
              <FileText size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>Select configurations on the left and click "Generate Preview" to review reports.</p>
            </div>
          ) : generatedData.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: '0.85rem' }}>No records found matching date filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="delivery-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    {Object.keys(generatedData[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} style={{ fontWeight: cellIdx === 0 ? 600 : 'normal' }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
