import React, { useState } from 'react';
import { Users, UserPlus, Key, Trash2, Edit2, Shield, Search, Power, Check, X } from 'lucide-react';

export default function UserManager() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Sarah Connor', email: 's.connor@hkshipping.com', role: 'Super Admin', status: 'Active', permissions: ['All Access'] },
    { id: 2, name: 'Marcus Wright', email: 'm.wright@hkshipping.com', role: 'Transport Admin', status: 'Active', permissions: ['Shipments', 'Fleet', 'Drivers'] },
    { id: 3, name: 'John Connor', email: 'j.connor@hkshipping.com', role: 'Fleet Manager', status: 'Active', permissions: ['Fleet', 'Fitness & PUC'] },
    { id: 4, name: 'Kate Brewster', email: 'k.brewster@hkshipping.com', role: 'Dispatcher', status: 'Active', permissions: ['Schedules', 'Driver Assignments'] },
    { id: 5, name: 'John Miller', email: 'j.miller@hkshipping.com', role: 'Driver', status: 'Active', permissions: ['Assigned Cargo', 'POD Upload'] },
    { id: 6, name: 'Grace Harper', email: 'g.harper@hkshipping.com', role: 'Accounts Staff', status: 'Active', permissions: ['Invoices', 'Payments', 'Ledgers'] },
    { id: 7, name: 'Dani Ramos', email: 'd.ramos@hkshipping.com', role: 'Compliance Manager', status: 'Disabled', permissions: ['Permits', 'Insurance Expiries', 'Statutory Audits'] }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Dispatcher',
    status: 'Active'
  });

  const rolePermissionsMap = {
    'Super Admin': ['All Access'],
    'Transport Admin': ['Shipments', 'Fleet', 'Drivers'],
    'Fleet Manager': ['Fleet', 'Fitness & PUC'],
    'Dispatcher': ['Schedules', 'Driver Assignments'],
    'Driver': ['Assigned Cargo', 'POD Upload'],
    'Accounts Staff': ['Invoices', 'Payments', 'Ledgers'],
    'Compliance Manager': ['Permits', 'Insurance Expiries', 'Statutory Audits']
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'Dispatcher', status: 'Active' });
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const perms = rolePermissionsMap[formData.role] || [];

    if (modalMode === 'add') {
      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        permissions: perms
      };
      setUsers([...users, newUser]);
      alert(`User ${formData.name} created successfully! Default password set: TempPass123!`);
    } else {
      setUsers(users.map(u => u.id === editingId ? { ...u, name: formData.name, email: formData.email, role: formData.role, status: formData.status, permissions: perms } : u));
    }
    setShowModal(false);
  };

  const handleToggleStatus = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Active' ? 'Disabled' : 'Active';
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleResetPassword = (name) => {
    alert(`Password reset link sent successfully to ${name}'s verified corporate email!`);
  };

  return (
    <div className="view-container">
      {/* Header Panel */}
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Identity & User Management</h1>
          <p className="view-header-subtitle">Assign corporate roles, manage system module authorizations, and configure security access credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserPlus size={16} />
          <span>Add System User</span>
        </button>
      </div>

      {/* User listing card panel */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} size={16} />
            <input
              type="text"
              placeholder="Search user profile names, emails..."
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem', width: '100%', maxWidth: '350px' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="delivery-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Corporate Email</th>
                <th>Corporate Role</th>
                <th>Authorizations & Permissions</th>
                <th>System Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600 }}>{u.role}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {u.permissions.map((perm, idx) => (
                          <span key={idx} style={{ padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: u.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                        color: u.status === 'Active' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-outline" onClick={() => handleOpenEditModal(u)} style={{ padding: '0.3rem', minWidth: 'auto' }} title="Edit Profile">
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-outline" onClick={() => handleToggleStatus(u.id)} style={{ padding: '0.3rem', minWidth: 'auto', color: u.status === 'Active' ? 'var(--danger)' : 'var(--success)' }} title={u.status === 'Active' ? 'Disable User' : 'Enable User'}>
                          <Power size={13} />
                        </button>
                        <button className="btn btn-outline" onClick={() => handleResetPassword(u.name)} style={{ padding: '0.3rem', minWidth: 'auto', color: 'var(--primary)' }} title="Reset Password">
                          <Key size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleFormSubmit} className="card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--bg-primary)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{modalMode === 'add' ? 'Register System User' : 'Edit User Profile'}</h3>
            
            <div>
              <label className="form-label">Full Name</label>
              <input required className="form-input" placeholder="e.g. Dani Ramos" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label className="form-label">Corporate Email</label>
              <input required className="form-input" placeholder="username@hkshipping.com" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label className="form-label">Assign Role</label>
                <select className="form-input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Transport Admin">Transport Admin</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Driver">Driver</option>
                  <option value="Accounts Staff">Accounts Staff</option>
                  <option value="Compliance Manager">Compliance Manager</option>
                </select>
              </div>
              <div>
                <label className="form-label">Account Status</label>
                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Display Role Permissions mapping dynamically in modal */}
            <div style={{ padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', borderLeft: '3px solid var(--primary)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Role Authorizations:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(rolePermissionsMap[formData.role] || []).map((perm, idx) => (
                  <span key={idx} style={{ padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                    {perm}
                  </span>
                ))}
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
