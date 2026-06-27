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
    alerts = alerts.filter(a => !(a.document_type === documentType && a.fitness_id === documentId));
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      alerts.push({
        id: alerts.length > 0 ? Math.max(...alerts.map(a => a.id)) + 1 : 1,
        document_type: documentType,
        permit_id: null,
        insurance_id: null,
        fitness_id: documentId,
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
      `DELETE FROM compliance_alerts WHERE document_type = ? AND fitness_id = ?`,
      [documentType, documentId]
    );
    
    if (status !== 'Valid') {
      const priority = daysRemaining <= 7 ? 'High' : (daysRemaining <= 15 ? 'Medium' : 'Low');
      await db.query(
        `INSERT INTO compliance_alerts (document_type, fitness_id, vehicle_number, alert_date, days_remaining, priority, email_status, whatsapp_status) 
         VALUES (?, ?, ?, CURDATE(), ?, ?, 'Pending', 'Pending')`,
        [documentType, documentId, vehicleNumber, daysRemaining, priority]
      );
    }
  }
}

// GET /api/fitness
router.get('/', async (req, res) => {
  const { search = '', status = '' } = req.query;
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockFitness();
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        data = data.filter(f => 
          f.vehicle_number.toLowerCase().includes(query) || 
          f.certificate_number.toLowerCase().includes(query) ||
          f.inspection_center.toLowerCase().includes(query)
        );
      }
      if (status.trim() !== '') {
        data = data.filter(f => f.status.toLowerCase() === status.toLowerCase());
      }
      return res.json(data);
    }
    
    let queryStr = 'SELECT * FROM fitness_certificates WHERE 1=1';
    const params = [];
    if (search.trim() !== '') {
      queryStr += ' AND (vehicle_number LIKE ? OR certificate_number LIKE ? OR inspection_center LIKE ?)';
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

// POST /api/fitness
router.post('/', async (req, res) => {
  const { vehicle_number, certificate_number, issue_date, expiry_date, inspection_center } = req.body;
  
  if (!vehicle_number || !certificate_number || !issue_date || !expiry_date || !inspection_center) {
    return res.status(400).json({ error: 'Validation Error', message: 'All fitness fields are required.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockFitness();
      if (data.some(f => f.certificate_number.toLowerCase() === certificate_number.toLowerCase())) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Certificate number ${certificate_number} already exists.` });
      }
      
      const newRecord = {
        id: data.length > 0 ? Math.max(...data.map(f => f.id)) + 1 : 1,
        vehicle_number,
        certificate_number,
        issue_date,
        expiry_date,
        inspection_center,
        status,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      data.push(newRecord);
      db.setMockFitness(data);
      await syncAlert('Fitness', newRecord.id, vehicle_number, expiry_date);
      return res.status(201).json(newRecord);
    }
    
    const [existing] = await db.query('SELECT id FROM fitness_certificates WHERE certificate_number = ?', [certificate_number]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Certificate number ${certificate_number} already exists.` });
    }
    
    const [result] = await db.query(
      'INSERT INTO fitness_certificates (vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status) VALUES (?, ?, ?, ?, ?, ?)',
      [vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status]
    );
    
    const insertId = result.insertId;
    await syncAlert('Fitness', insertId, vehicle_number, expiry_date);
    res.status(201).json({ id: insertId, vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// PUT /api/fitness/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { vehicle_number, certificate_number, issue_date, expiry_date, inspection_center } = req.body;
  const recId = parseInt(id);
  
  if (!vehicle_number || !certificate_number || !issue_date || !expiry_date || !inspection_center) {
    return res.status(400).json({ error: 'Validation Error', message: 'All fields are required.' });
  }
  
  const { status } = calculateStatusAndDays(expiry_date);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockFitness();
      const idx = data.findIndex(f => f.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      if (data.some(f => f.certificate_number.toLowerCase() === certificate_number.toLowerCase() && f.id !== recId)) {
        return res.status(400).json({ error: 'Duplicate Error', message: `Certificate number ${certificate_number} already exists.` });
      }
      
      data[idx] = {
        ...data[idx],
        vehicle_number,
        certificate_number,
        issue_date,
        expiry_date,
        inspection_center,
        status,
        updated_at: new Date()
      };
      
      db.setMockFitness(data);
      await syncAlert('Fitness', recId, vehicle_number, expiry_date);
      return res.json(data[idx]);
    }
    
    const [existing] = await db.query('SELECT id FROM fitness_certificates WHERE certificate_number = ? AND id != ?', [certificate_number, recId]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Duplicate Error', message: `Certificate number ${certificate_number} already exists.` });
    }
    
    const [result] = await db.query(
      'UPDATE fitness_certificates SET vehicle_number = ?, certificate_number = ?, issue_date = ?, expiry_date = ?, inspection_center = ?, status = ? WHERE id = ?',
      [vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status, recId]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not Found' });
    
    await syncAlert('Fitness', recId, vehicle_number, expiry_date);
    res.json({ id: recId, vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// PUT /api/fitness/renew/:id
router.put('/renew/:id', async (req, res) => {
  const { id } = req.params;
  const recId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      const data = db.getMockFitness();
      const idx = data.findIndex(f => f.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      const newExpiry = new Date(data[idx].expiry_date);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      const expiryStr = newExpiry.toISOString().split('T')[0];
      const { status } = calculateStatusAndDays(expiryStr);
      
      data[idx].expiry_date = expiryStr;
      data[idx].status = status;
      data[idx].updated_at = new Date();
      
      db.setMockFitness(data);
      await syncAlert('Fitness', recId, data[idx].vehicle_number, expiryStr);
      return res.json(data[idx]);
    }
    
    const [rows] = await db.query('SELECT expiry_date, vehicle_number FROM fitness_certificates WHERE id = ?', [recId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not Found' });
    
    const newExpiry = new Date(rows[0].expiry_date);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    const expiryStr = newExpiry.toISOString().split('T')[0];
    const { status } = calculateStatusAndDays(expiryStr);
    
    await db.query('UPDATE fitness_certificates SET expiry_date = ?, status = ? WHERE id = ?', [expiryStr, status, recId]);
    await syncAlert('Fitness', recId, rows[0].vehicle_number, expiryStr);
    res.json({ id: recId, expiry_date: expiryStr, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

// DELETE /api/fitness/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const recId = parseInt(id);
  
  try {
    if (db.isInMemory()) {
      let data = db.getMockFitness();
      const idx = data.findIndex(f => f.id === recId);
      if (idx === -1) return res.status(404).json({ error: 'Not Found' });
      
      data.splice(idx, 1);
      db.setMockFitness(data);
      
      let alerts = db.getMockAlerts();
      alerts = alerts.filter(a => !(a.document_type === 'Fitness' && a.fitness_id === recId));
      db.setMockAlerts(alerts);
      return res.json({ message: 'Fitness certificate deleted.' });
    }
    
    const [result] = await db.query('DELETE FROM fitness_certificates WHERE id = ?', [recId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not Found' });
    res.json({ message: 'Fitness certificate deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

module.exports = router;
