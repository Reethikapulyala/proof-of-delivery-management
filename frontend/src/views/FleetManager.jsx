import React, { useState } from 'react';
import { Truck, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function FleetManager() {
  const [vehicles, setVehicles] = useState([
    { id: 1, vehicle_number: 'MH-12-GQ-5524', make: 'Tata Motors', model: 'Prima 4028', type: 'Heavy Commercial Vehicle', status: 'Active' },
    { id: 2, vehicle_number: 'DL-01-AL-9872', make: 'Mahindra', model: 'Blazo X', type: 'Multi-axle Truck', status: 'Maintenance' },
    { id: 3, vehicle_number: 'KA-03-MP-4122', make: 'BharatBenz', model: '1617R', type: 'Light Commercial Vehicle', status: 'Active' }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ vehicle_number: '', make: '', model: '', type: 'Heavy Commercial Vehicle', status: 'Active' });

  const handleAdd = (e) => {
    e.preventDefault();
    setVehicles([...vehicles, { id: Date.now(), ...formData }]);
    setShowModal(false);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Fleet & Truck Registry</h1>
          <p className="view-header-subtitle">Manage corporate logistics trucks, container registrations, and mechanical statuses.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ vehicle_number: '', make: '', model: '', type: 'Heavy Commercial Vehicle', status: 'Active' });
          setShowModal(true);
        }}>
          <Plus size={16} />
          <span>Register Vehicle</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {vehicles.map(v => (
          <div key={v.id} className="card" style={{ padding: '1.5rem', borderLeft: v.status === 'Active' ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{v.vehicle_number}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v.make} - {v.model}</p>
              </div>
              <span style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: v.status === 'Active' ? 'var(--success-light)' : 'var(--warning-light)',
                color: v.status === 'Active' ? 'var(--success)' : 'var(--warning)'
              }}>
                {v.status}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{v.type}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setVehicles(vehicles.filter(x => x.id !== v.id))} style={{ color: 'var(--danger)', padding: '0.35rem', minWidth: 'auto' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAdd} className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register Transport Truck</h3>
            
            <div>
              <label className="form-label">Vehicle License Plate</label>
              <input required className="form-input" placeholder="e.g. MH-12-GQ-5524" type="text" value={formData.vehicle_number} onChange={e => setFormData({ ...formData, vehicle_number: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Manufacturer</label>
                <input required className="form-input" placeholder="e.g. Tata" type="text" value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Model Series</label>
                <input required className="form-input" placeholder="e.g. Prima" type="text" value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="form-label">Truck Classification</label>
              <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="Heavy Commercial Vehicle">Heavy Commercial Vehicle</option>
                <option value="Multi-axle Truck">Multi-axle Truck</option>
                <option value="Light Commercial Vehicle">Light Commercial Vehicle</option>
                <option value="Container Vessel">Container Vessel</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Register Vehicle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
