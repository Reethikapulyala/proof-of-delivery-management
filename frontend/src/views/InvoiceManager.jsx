import React, { useState } from 'react';
import { FileText, Coins, ArrowUpRight, Search, Plus, Trash2, Printer, CheckCircle } from 'lucide-react';

export default function InvoiceManager() {
  const [invoices, setInvoices] = useState([
    { id: 1, invoice_no: 'INV-2026-1024', customer: 'Nova Pharma Inc', amount: 4800.00, cgst: 432.00, sgst: 432.00, igst: 0.00, status: 'Paid', date: '2026-06-15' },
    { id: 2, invoice_no: 'INV-2026-1025', customer: 'Apex Industrial Supply', amount: 6200.00, cgst: 0.00, sgst: 0.00, igst: 1116.00, status: 'Overdue', date: '2026-06-10' },
    { id: 3, invoice_no: 'INV-2026-1026', customer: 'HoloTech Systems', amount: 3500.00, cgst: 315.00, sgst: 315.00, igst: 0.00, status: 'Pending', date: '2026-06-18' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    invoice_no: '',
    customer: '',
    amount: '',
    taxType: 'CGST+SGST', // CGST+SGST, IGST
    status: 'Pending',
    date: ''
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount) || 0;
    const isLocal = formData.taxType === 'CGST+SGST';
    
    const newInv = {
      id: Date.now(),
      invoice_no: formData.invoice_no,
      customer: formData.customer,
      amount: amt,
      cgst: isLocal ? amt * 0.09 : 0.00,
      sgst: isLocal ? amt * 0.09 : 0.00,
      igst: !isLocal ? amt * 0.18 : 0.00,
      status: formData.status,
      date: formData.date
    };

    setInvoices([...invoices, newInv]);
    setShowModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Invoice & GST Billing</h1>
          <p className="view-header-subtitle">Manage corporate shipping invoices, SGST/CGST split-taxes, and payment receipts.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={15} />
            <span>Print Ledger</span>
          </button>
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              invoice_no: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              customer: '',
              amount: '',
              taxType: 'CGST+SGST',
              status: 'Pending',
              date: new Date().toISOString().split('T')[0]
            });
            setShowModal(true);
          }}>
            <Plus size={15} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }} className="card">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={16} />
            <input
              type="text"
              className="form-input"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem', width: '100%' }}
            />
          </div>
        </div>

        <table className="delivery-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Base Value</th>
              <th>CGST (9%)</th>
              <th>SGST (9%)</th>
              <th>IGST (18%)</th>
              <th>Grand Total</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices
              .filter(i => i.invoice_no.toLowerCase().includes(searchQuery.toLowerCase()) || i.customer.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(i => {
                const total = i.amount + i.cgst + i.sgst + i.igst;
                return (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.invoice_no}</td>
                    <td>{i.customer}</td>
                    <td>₹{i.amount.toFixed(2)}</td>
                    <td>₹{i.cgst.toFixed(2)}</td>
                    <td>₹{i.sgst.toFixed(2)}</td>
                    <td>₹{i.igst.toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                    <td>{i.date}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: i.status === 'Paid' ? 'var(--success-light)' : (i.status === 'Pending' ? 'var(--warning-light)' : 'var(--danger-light)'),
                        color: i.status === 'Paid' ? 'var(--success)' : (i.status === 'Pending' ? 'var(--warning)' : 'var(--danger)')
                      }}>
                        {i.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-outline" onClick={() => setInvoices(invoices.map(inv => inv.id === i.id ? { ...inv, status: 'Paid' } : inv))} style={{ color: 'var(--success)', padding: '0.3rem', minWidth: 'auto' }} title="Mark Paid">
                          <CheckCircle size={13} />
                        </button>
                        <button className="btn btn-outline" onClick={() => setInvoices(invoices.filter(x => x.id !== i.id))} style={{ color: 'var(--danger)', padding: '0.3rem', minWidth: 'auto' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreate} className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Generate Customer Invoice</h3>
            
            <div>
              <label className="form-label">Invoice Reference</label>
              <input required className="form-input" placeholder="INV-..." type="text" value={formData.invoice_no} onChange={e => setFormData({ ...formData, invoice_no: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Client Customer</label>
              <input required className="form-input" placeholder="e.g. Nova Pharma" type="text" value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Base Value (₹)</label>
                <input required className="form-input" placeholder="e.g. 5000" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Tax Split Class</label>
                <select className="form-input" value={formData.taxType} onChange={e => setFormData({ ...formData, taxType: e.target.value })}>
                  <option value="CGST+SGST">Local (CGST+SGST 18%)</option>
                  <option value="IGST">Interstate (IGST 18%)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Due Date</label>
                <input required className="form-input" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Payment Status</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Generate Invoice</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
