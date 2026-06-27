const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Calculate document status and remaining days
function calculateStatusAndDays(expiryDateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0,0,0,0);
  const diffTime = expiry - today;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let status = 'Valid';
  if (daysRemaining <= 0) {
    status = 'Expired';
  } else if (daysRemaining <= 30) {
    status = 'Expiring Soon';
  }
  return { status, daysRemaining };
}

// Helper: Sync document with compliance alerts
async function syncAlert(documentType, documentId, vehicleNumber, expiryDateStr) {
  const { status, daysRemaining } = calculateStatusAndDays(expiryDateStr);
  
  if (db.isInMemory()) {
    let alerts = db.getMockAlerts();
    // Remove existing alert for this document
    alerts = alerts.filter(a => !(a.document_type === documentType && a.permit_id === documentId));
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      alerts.push({
        id: alerts.length > 0 ? Math.max(...alerts.map(a => a.id)) + 1 : 1,
        document_type: documentType,
        permit_id: documentId,
        insurance_id: null,
        fitness_id: null,
        pollution_id: null,
        vehicle_number: vehicleNumber,
        alert_date: new Date().toISOString().split('T')[0],
        days_remaining: daysRemaining,
        priority,
        email_status: 'Pending',
        whatsapp_status: 'Pending',
        created_at: new Date()
      });
    }
    db.setMockAlerts(alerts);
  } else {
    // Delete existing alert
    await db.query(
      `DELETE FROM compliance_alerts WHERE document_type = ? AND permit_id = ?`,
      [documentType, documentId]
    );
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      await db.query(
        `INSERT INTO compliance_alerts (document_type, permit_id, vehicle_number, alert_date, days_remaining, priority, email_status, whatsapp_status) 
         VALUES (?, ?, ?, CURDATE(), ?, ?, 'Pending', 'Pending')`,
        [documentType, documentId, vehicleNumber, daysRemaining, priority]
      );
    }
  }
}

// GET /api/permits - List all permits
router.get('/', async (req, res) => {
  const { search = '', status = '', type = '' } = req.query;
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockPermits();
      
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        data = data.filter(p => 
          p.vehicle_number.toLowerCase().includes(query) || 
          p.permit_number.toLowerCase().includes(query)
        );
      }
      if (status.trim() !== '') {
        data = data.filter(p => p.status.toLowerCase() === status.toLowerCase());
      }
      if (type.trim() !== '') {
        data = data.filter(p => p.permit_type.toLowerCase() === type.toLowerCase());
      }
      
      return res.json(data);
    }
    
    // MySQL query
    let queryStr = 'SELECT * FROM permits WHERE 1=1';
    const params = [];
    
    if (search.trim() !== '') {
      queryStr += ' AND (vehicle_number LIKE ? OR permit_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status.trim() !== '') {
      queryStr += ' AND status = ?';
      params.push(status);
    }
    if (type.trim() !== '') {
      queryStr += ' AND permit_type = ?';
      params.push(type);
    }
    
    queryStr += ' ORDER BY expiry_date ASC';
    const [rows] = await db.query(queryStr, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed', message: err.message });
  }
});

// POST /api/permits - Create a permit
router.post('/', async (req, res) => {
  const { vehicle_number, permit_type, permit_number, issue_date, expiry_date } = req.body;
  
  if (!vehicle_number || !permit_type || !permit_number || !issue_date || !expiry_date) {
    return res.status(400).json({ error: 'Validation Error', message: 'All permit fields are required.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockPermits();
      if (data.some(p => p.permit_number.toLowerCase() === permit_number.toLowerCase())) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Permit number ${permit_number} already exists.` });
      }
      
      const newPermit = {
        id: data.length > 0 ? Math.max(...data.map(p => p.id)) + 1 : 1,
        vehicle_number,
        permit_type,
        permit_number,
        issue_date,
        expiry_date,
        status,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      data.push(newPermit);
      db.setMockPermits(data);
      
      await syncAlert('Permit', newPermit.id, vehicle_number, expiry_date);
      return res.status(201).json(newPermit);
    }
    
    // MySQL execution
    const [existing] = await db.query('SELECT id FROM permits WHERE permit_number = ?', [permit_number]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Permit number ${permit_number} already exists.` });
    }
    
    const [result] = await db.query(
      'INSERT INTO permits (vehicle_number, permit_type, permit_number, issue_date, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [vehicle_number, permit_type, permit_number, issue_date, expiry_date, status]
    );
    
    const insertId = result.insertId;
    await syncAlert('Permit', insertId, vehicle_number, expiry_date);
    
    res.status(201).json({ id: insertId, vehicle_number, permit_type, permit_number, issue_date, expiry_date, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// PUT /api/permits/:id - Update a permit
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vehicle_number, permit_type, permit_number, issue_date, expiry_date } = req.body;
  const permitId = parseInt(id);
  
  if (!vehicle_number || !permit_type || !permit_number || !issue_date || !expiry_date) {
    return res.status(400).json({ error: 'Validation Error', message: 'All permit fields are required.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockPermits();
      const idx = data.findIndex(p => p.id === permitId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'Permit not found.' });
      }
      
      if (data.some(p => p.permit_number.toLowerCase() === permit_number.toLowerCase() && p.id !== permitId)) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Permit number ${permit_number} already exists.` });
      }
      
      data[idx] = {
        ...data[idx],
        vehicle_number,
        permit_type,
        permit_number,
        issue_date,
        expiry_date,
        status,
        updated_at: new Date()
      };
      
      db.setMockPermits(data);
      await syncAlert('Permit', permitId, vehicle_number, expiry_date);
      
      return res.json(data[idx]);
    }
    
    // MySQL Update
    const [existing] = await db.query('SELECT id FROM permits WHERE permit_number = ? AND id != ?', [permit_number, permitId]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Permit number ${permit_number} already exists.` });
    }
    
    const [result] = await db.query(
      'UPDATE permits SET vehicle_number = ?, permit_type = ?, permit_number = ?, issue_date = ?, expiry_date = ?, status = ? WHERE id = ?',
      [vehicle_number, permit_type, permit_number, issue_date, expiry_date, status, permitId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Permit not found.' });
    }
    
    await syncAlert('Permit', permitId, vehicle_number, expiry_date);
    res.json({ id: permitId, vehicle_number, permit_type, permit_number, issue_date, expiry_date, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// DELETE /api/permits/:id - Delete a permit
router.put('/renew/:id', async (req, res) => {
  // Simple renewal helper to update expiry date by 1 year
  const { id } = req.params;
  const permitId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockPermits();
      const idx = data.findIndex(p => p.id === permitId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      const newExpiry = new Date(data[idx].expiry_date);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      const expiryStr = newExpiry.toISOString().split('T')[0];
      
      const { status } = calculateStatusAndDays(expiryStr);
      data[idx].expiry_date = expiryStr;
      data[idx].status = status;
      data[idx].updated_at = new Date();
      
      db.setMockPermits(data);
      await syncAlert('Permit', permitId, data[idx].vehicle_number, expiryStr);
      return res.json(data[idx]);
    }
    
    const [rows] = await db.query('SELECT expiry_date, vehicle_number FROM permits WHERE id = ?', [permitId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not Found' });
    
    const newExpiry = new Date(rows[0].expiry_date);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const expiryStr = newExpiry.toISOString().split('T')[0];
    const { status } = calculateStatusAndDays(expiryStr);
    
    await db.query('UPDATE permits SET expiry_date = ?, status = ? WHERE id = ?', [expiryStr, status, permitId]);
    await syncAlert('Permit', permitId, rows[0].vehicle_number, expiryStr);
    res.json({ id: permitId, expiry_date: expiryStr, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const permitId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockPermits();
      const idx = data.findIndex(p => p.id === permitId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'Permit not found.' });
      }
      
      data.splice(idx, 1);
      db.setMockPermits(data);
      
      // Clean corresponding alert
      let alerts = db.getMockAlerts();
      alerts = alerts.filter(a => !(a.document_type === 'Permit' && a.permit_id === permitId));
      db.setMockAlerts(alerts);
      
      return res.json({ message: 'Permit deleted successfully.' });
    }
    
    // MySQL execution (alerts will automatically cascade delete due to foreign key constraints!)
    const [result] = await db.query('DELETE FROM permits WHERE id = ?', [permitId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Permit not found.' });
    }
    
    res.json({ message: 'Permit deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
