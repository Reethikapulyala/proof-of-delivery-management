const express = require('express');
const router = express.Router();
const db = require('../db');

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

async function syncAlert(documentType, documentId, vehicleNumber, expiryDateStr) {
  const { status, daysRemaining } = calculateStatusAndDays(expiryDateStr);
  
  if (db.isInMemory()) {
    let alerts = db.getMockAlerts();
    alerts = alerts.filter(a => !(a.document_type === documentType && a.insurance_id === documentId));
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      alerts.push({
        id: alerts.length > 0 ? Math.max(...alerts.map(a => a.id)) + 1 : 1,
        document_type: documentType,
        permit_id: null,
        insurance_id: documentId,
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
    await db.query(
      `DELETE FROM compliance_alerts WHERE document_type = ? AND insurance_id = ?`,
      [documentType, documentId]
    );
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      await db.query(
        `INSERT INTO compliance_alerts (document_type, insurance_id, vehicle_number, alert_date, days_remaining, priority, email_status, whatsapp_status) 
         VALUES (?, ?, ?, CURDATE(), ?, ?, 'Pending', 'Pending')`,
        [documentType, documentId, vehicleNumber, daysRemaining, priority]
      );
    }
  }
}

// GET /api/insurance
router.get('/', async (req, res) => {
  const { search = '', status = '' } = req.query;
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockInsurance();
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        data = data.filter(i => 
          i.vehicle_number.toLowerCase().includes(query) || 
          i.policy_number.toLowerCase().includes(query) ||
          i.insurance_provider.toLowerCase().includes(query)
        );
      }
      if (status.trim() !== '') {
        data = data.filter(i => i.status.toLowerCase() === status.toLowerCase());
      }
      return res.json(data);
    }
    
    let queryStr = 'SELECT * FROM insurance_records WHERE 1=1';
    const params = [];
    if (search.trim() !== '') {
      queryStr += ' AND (vehicle_number LIKE ? OR policy_number LIKE ? OR insurance_provider LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status.trim() !== '') {
      queryStr += ' AND status = ?';
      params.push(status);
    }
    queryStr += ' ORDER BY expiry_date ASC';
    const [rows] = await db.query(queryStr, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed', message: err.message });
  }
});

// POST /api/insurance
router.post('/', async (req, res) => {
  const { vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount } = req.body;
  
  if (!vehicle_number || !insurance_provider || !policy_number || !start_date || !expiry_date) {
    return res.status(400).json({ error: 'Validation Error', message: 'Required insurance fields are missing.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockInsurance();
      if (data.some(i => i.policy_number.toLowerCase() === policy_number.toLowerCase())) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Policy number ${policy_number} already exists.` });
      }
      
      const newRecord = {
        id: data.length > 0 ? Math.max(...data.map(i => i.id)) + 1 : 1,
        vehicle_number,
        insurance_provider,
        policy_number,
        coverage_amount: parseFloat(coverage_amount) || 0.00,
        start_date,
        expiry_date,
        premium_amount: parseFloat(premium_amount) || 0.00,
        status,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      data.push(newRecord);
      db.setMockInsurance(data);
      await syncAlert('Insurance', newRecord.id, vehicle_number, expiry_date);
      return res.status(201).json(newRecord);
    }
    
    const [existing] = await db.query('SELECT id FROM insurance_records WHERE policy_number = ?', [policy_number]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Policy number ${policy_number} already exists.` });
    }
    
    const [result] = await db.query(
      'INSERT INTO insurance_records (vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicle_number, insurance_provider, policy_number, coverage_amount || 0.00, start_date, expiry_date, premium_amount || 0.00, status]
    );
    
    const insertId = result.insertId;
    await syncAlert('Insurance', insertId, vehicle_number, expiry_date);
    res.status(201).json({ id: insertId, vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// PUT /api/insurance/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount } = req.body;
  const recId = parseInt(id);
  
  if (!vehicle_number || !insurance_provider || !policy_number || !start_date || !expiry_date) {
    return res.status(400).json({ error: 'Validation Error', message: 'Required fields are missing.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockInsurance();
      const idx = data.findIndex(i => i.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      if (data.some(i => i.policy_number.toLowerCase() === policy_number.toLowerCase() && i.id !== recId)) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Policy number ${policy_number} already exists.` });
      }
      
      data[idx] = {
        ...data[idx],
        vehicle_number,
        insurance_provider,
        policy_number,
        coverage_amount: parseFloat(coverage_amount) || 0.00,
        start_date,
        expiry_date,
        premium_amount: parseFloat(premium_amount) || 0.00,
        status,
        updated_at: new Date()
      };
      
      db.setMockInsurance(data);
      await syncAlert('Insurance', recId, vehicle_number, expiry_date);
      return res.json(data[idx]);
    }
    
    const [existing] = await db.query('SELECT id FROM insurance_records WHERE policy_number = ? AND id != ?', [policy_number, recId]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Policy number ${policy_number} already exists.` });
    }
    
    const [result] = await db.query(
      'UPDATE insurance_records SET vehicle_number = ?, insurance_provider = ?, policy_number = ?, coverage_amount = ?, start_date = ?, expiry_date = ?, premium_amount = ?, status = ? WHERE id = ?',
      [vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount, status, recId]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not Found' });
    
    await syncAlert('Insurance', recId, vehicle_number, expiry_date);
    res.json({ id: recId, vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// POST /api/insurance/renew/:id
router.put('/renew/:id', async (req, res) => {
  const { id } = req.params;
  const recId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockInsurance();
      const idx = data.findIndex(i => i.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      const newExpiry = new Date(data[idx].expiry_date);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      const expiryStr = newExpiry.toISOString().split('T')[0];
      const { status } = calculateStatusAndDays(expiryStr);
      
      data[idx].expiry_date = expiryStr;
      data[idx].status = status;
      data[idx].updated_at = new Date();
      
      db.setMockInsurance(data);
      await syncAlert('Insurance', recId, data[idx].vehicle_number, expiryStr);
      return res.json(data[idx]);
    }
    
    const [rows] = await db.query('SELECT expiry_date, vehicle_number FROM insurance_records WHERE id = ?', [recId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not Found' });
    
    const newExpiry = new Date(rows[0].expiry_date);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const expiryStr = newExpiry.toISOString().split('T')[0];
    const { status } = calculateStatusAndDays(expiryStr);
    
    await db.query('UPDATE insurance_records SET expiry_date = ?, status = ? WHERE id = ?', [expiryStr, status, recId]);
    await syncAlert('Insurance', recId, rows[0].vehicle_number, expiryStr);
    res.json({ id: recId, expiry_date: expiryStr, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// DELETE /api/insurance/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const recId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockInsurance();
      const idx = data.findIndex(i => i.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      data.splice(idx, 1);
      db.setMockInsurance(data);
      
      let alerts = db.getMockAlerts();
      alerts = alerts.filter(a => !(a.document_type === 'Insurance' && a.insurance_id === recId));
      db.setMockAlerts(alerts);
      return res.json({ message: 'Insurance record deleted.' });
    }
    
    const [result] = await db.query('DELETE FROM insurance_records WHERE id = ?', [recId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not Found' });
    res.json({ message: 'Insurance record deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
