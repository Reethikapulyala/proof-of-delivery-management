import React, { useState } from 'react';
import { Users, Plus, Trash2, Mail, Phone, Shield } from 'lucide-react';

export default function DriverManager() {
  const [drivers, setDrivers] = useState([
    { id: 1, name: 'John Miller', license: 'DL-MH-12-20230048', phone: '+91 98765 43210', vehicle: 'MH-12-GQ-5524', status: 'Active' },
    { id: 2, name: 'Robert Chen', license: 'DL-DL-01-20220092', phone: '+91 99887 76655', vehicle: 'DL-01-AL-9872', status: 'In Transit' },
    { id: 3, name: 'David Miller', license: 'DL-KA-03-20240019', phone: '+91 97766 55443', vehicle: 'KA-03-MP-4122', status: 'Off Duty' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', license: '', phone: '', vehicle: '', status: 'Active' });

  const handleAdd = (e) => {
    e.preventDefault();
    setDrivers([...drivers, { id: Date.now(), ...formData }]);
    setShowModal(false);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Driver & Courier Center</h1>
          <p className="view-header-subtitle">Manage fleet drivers licenses, contact numbers, and shifts assignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ name: '', license: '', phone: '', vehicle: '', status: 'Active' });
          setShowModal(true);
        }}>
          <Plus size={16} />
          <span>Register Driver</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }} className="card">
        <table className="delivery-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>License Number</th>
              <th>Contact Details</th>
              <th>Assigned Vehicle</th>
              <th>Duty Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.license}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                    <span>{d.phone}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{d.vehicle || 'Unassigned'}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: d.status === 'Active' ? 'var(--success-light)' : (d.status === 'In Transit' ? 'var(--info-light)' : 'var(--warning-light)'),
                    color: d.status === 'Active' ? 'var(--success)' : (d.status === 'In Transit' ? 'var(--info)' : 'var(--warning)')
                  }}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => setDrivers(drivers.filter(x => x.id !== d.id))} style={{ color: 'var(--danger)', padding: '0.3rem' }}>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register Fleet Driver</h3>
            
            <div>
              <label className="form-label">Full Name</label>
              <input required className="form-input" placeholder="e.g. John Doe" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="form-label">License Number</label>
              <input required className="form-input" placeholder="DL-..." type="text" value={formData.license} onChange={e => setFormData({ ...formData, license: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Phone Contact</label>
              <input required className="form-input" placeholder="e.g. +91 98765 43210" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Vehicle Assignment</label>
                <input className="form-input" placeholder="MH-12-..." type="text" value={formData.vehicle} onChange={e => setFormData({ ...formData, vehicle: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Initial Status</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
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
