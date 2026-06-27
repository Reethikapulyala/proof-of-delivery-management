import React, { useState } from 'react';
import { Smile, Plus, Trash2, Mail, Phone, Briefcase } from 'lucide-react';

export default function CustomerCRM() {
  const [customers, setCustomers] = useState([
    { id: 1, name: 'Nova Pharma Inc', email: 'logistics@novapharma.com', phone: '+1 206 555 0192', activeShipments: 12, balance: 15000.00 },
    { id: 2, name: 'Apex Industrial Supply', email: 'shipping@apexindustrial.com', phone: '+1 313 555 0148', activeShipments: 8, balance: 8500.00 },
    { id: 3, name: 'HoloTech Systems', email: 'ops@holotech.io', phone: '+1 617 555 0110', activeShipments: 5, balance: 0.00 }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', activeShipments: 0, balance: 0.00 });

  const handleAdd = (e) => {
    e.preventDefault();
    setCustomers([...customers, { id: Date.now(), ...formData, activeShipments: parseInt(formData.activeShipments) || 0, balance: parseFloat(formData.balance) || 0 }]);
    setShowModal(false);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Customer CRM Portal</h1>
          <p className="view-header-subtitle">Manage client accounts, contact options, active cargo counts, and outstanding invoice balances.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ name: '', email: '', phone: '', activeShipments: 0, balance: 0.00 });
          setShowModal(true);
        }}>
          <Plus size={16} />
          <span>Add Account</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }} className="card">
        <table className="delivery-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Client Corporate Name</th>
              <th>Email Address</th>
              <th>Phone Number</th>
              <th>Active Shipments</th>
              <th>Outstanding Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td style={{ fontWeight: 600 }}>{c.activeShipments} units</td>
                <td style={{ fontWeight: 600, color: c.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  ₹{parseFloat(c.balance).toLocaleString()}
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => setCustomers(customers.filter(x => x.id !== c.id))} style={{ color: 'var(--danger)', padding: '0.3rem' }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAdd} className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add Customer CRM Account</h3>
            
            <div>
              <label className="form-label">Corporate Name</label>
              <input required className="form-input" placeholder="e.g. Nova Pharma" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Contact Email</label>
              <input required className="form-input" placeholder="e.g. ops@client.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Phone Contact</label>
              <input required className="form-input" placeholder="e.g. +1 555-0199" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Active Cargo</label>
                <input className="form-input" type="number" value={formData.activeShipments} onChange={e => setFormData({ ...formData, activeShipments: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Initial Balance (₹)</label>
                <input className="form-input" type="number" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Profile</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
