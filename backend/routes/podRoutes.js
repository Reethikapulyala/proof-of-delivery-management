const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Helper function to save base64 image data to local disk
function saveBase64Image(base64Data, folderName = 'uploads') {
  const uploadDir = path.join(__dirname, '..', folderName);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (typeof base64Data === 'string' && !base64Data.startsWith('data:')) {
    return base64Data;
  }

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image format. Must be a data URL.');
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  let extension = 'png';
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    extension = 'jpg';
  }

  const filename = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}.${extension}`;
  const filePath = path.join(uploadDir, filename);
  
  fs.writeFileSync(filePath, buffer);
  return `${folderName}/${filename}`;
}

// Map database record to response containing both DB columns and frontend compatibility aliases
function mapPodRecord(row) {
  if (!row) return null;
  const photoUrl = row.delivery_photo 
    ? (row.delivery_photo.startsWith('data:') ? row.delivery_photo : `http://localhost:5000/${row.delivery_photo}`) 
    : null;

  return {
    ...row,
    // Database fields
    id: row.id,
    consignment_no: row.consignment_no,
    customer_name: row.customer_name,
    receiver_name: row.receiver_name,
    signature_image: row.signature_image,
    delivery_photo: row.delivery_photo,
    delivery_time: row.delivery_date, // Map delivery_date to frontend delivery_time
    pickup_location: row.pickup_location,
    delivery_location: row.delivery_location,
    remarks: row.remarks,
    driver_name: row.driver_name,
    vehicle_number: row.vehicle_number,
    pod_status: row.pod_status,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,

    // Frontend compatibility aliases
    consignment_number: row.consignment_no,
    receiver_signature: row.signature_image,
    delivery_remarks: row.remarks,
    photo: photoUrl
  };
}

// POST /api/pod/create - Submit a new POD record
router.post('/create', async (req, res) => {
  const {
    consignment_no,
    consignment_number, // support legacy key
    customer_name,
    receiver_name,
    signature_image,
    receiver_signature, // support legacy key
    delivery_time,
    pickup_location,
    delivery_location,
    remarks,
    delivery_remarks, // support legacy key
    photo, // base64 string
    delivery_photo, // support direct key
    driver_name,
    vehicle_number,
    status,
    pod_status
  } = req.body;

  // Resolve keys
  const resolvedConsignmentNo = consignment_no || consignment_number;
  const resolvedCustomerName = customer_name;
  const resolvedReceiverName = receiver_name;
  const resolvedSignatureImage = signature_image || receiver_signature;
  const resolvedPhoto = photo || delivery_photo;
  const resolvedRemarks = remarks || delivery_remarks;
  const resolvedPickup = pickup_location || 'HK Shipping Hub Depot';
  const resolvedDeliveryLoc = delivery_location || 'Customer Destination Address';

  // Validation Checks
  if (!resolvedReceiverName || resolvedReceiverName.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Receiver name is required.' });
  }
  if (!resolvedConsignmentNo || resolvedConsignmentNo.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Consignment number is required.' });
  }
  if (!resolvedCustomerName || resolvedCustomerName.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Customer name is required.' });
  }
  if (!resolvedPhoto || resolvedPhoto.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Delivery photo is required.' });
  }
  if (!resolvedSignatureImage || resolvedSignatureImage.trim() === '') {
    return res.status(400).json({ error: 'Validation Error', message: 'Receiver signature is required.' });
  }
  if (!delivery_time) {
    return res.status(400).json({ error: 'Validation Error', message: 'Delivery time is required.' });
  }

  try {
    if (db.isInMemory()) {
      // Check if consignment number already exists
      const records = db.getMockRecords();
      const existing = records.find(r => r.consignment_no.toLowerCase() === resolvedConsignmentNo.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ 
          error: 'Conflict Error', 
          message: `Consignment number '${resolvedConsignmentNo}' already exists.` 
        });
      }

      // Save base64 photo to file on disk
      let photoPath;
      try {
        photoPath = saveBase64Image(resolvedPhoto, 'uploads');
      } catch (err) {
        return res.status(400).json({ error: 'Upload Error', message: 'Failed to process photo attachment.' });
      }

      // Add to in-memory db
      const nextId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
      const newRecord = {
        id: nextId,
        consignment_no: resolvedConsignmentNo.trim(),
        customer_name: resolvedCustomerName.trim(),
        pickup_location: resolvedPickup.trim(),
        delivery_location: resolvedDeliveryLoc.trim(),
        driver_name: driver_name || null,
        vehicle_number: vehicle_number || null,
        shipment_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        delivery_date: delivery_time,
        status: status || 'Delivered',
        remarks: resolvedRemarks || null,
        receiver_name: resolvedReceiverName.trim(),
        signature_image: resolvedSignatureImage,
        delivery_photo: photoPath,
        pod_status: pod_status || 'Uploaded',
        created_at: new Date(),
        updated_at: new Date()
      };
      records.push(newRecord);
      db.setMockRecords(records);

      // Auto tracking history step
      const history = db.getMockHistory();
      const newHistId = history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1;
      history.push({
        id: newHistId,
        delivery_id: nextId,
        status: newRecord.status,
        remarks: 'Shipment proof of delivery (POD) uploaded.',
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
      db.setMockHistory(history);

      return res.status(201).json(mapPodRecord(newRecord));
    } else {
      // Check if consignment number already exists
      const [existing] = await db.query('SELECT id FROM deliveries WHERE consignment_no = ?', [resolvedConsignmentNo.trim()]);
      if (existing.length > 0) {
        return res.status(409).json({ 
          error: 'Conflict Error', 
          message: `Consignment number '${resolvedConsignmentNo}' already exists.` 
        });
      }

      // Save base64 photo to file on disk
      let photoPath;
      try {
        photoPath = saveBase64Image(resolvedPhoto, 'uploads');
      } catch (err) {
        return res.status(400).json({ error: 'Upload Error', message: 'Failed to process photo attachment.' });
      }

      // Insert to MySQL Database
      const sql = `
        INSERT INTO deliveries 
          (consignment_no, customer_name, receiver_name, signature_image, delivery_date, pickup_location, delivery_location, remarks, delivery_photo, driver_name, vehicle_number, pod_status, status, shipment_date)
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;
      const params = [
        resolvedConsignmentNo.trim(),
        resolvedCustomerName.trim(),
        resolvedReceiverName.trim(),
        resolvedSignatureImage,
        delivery_time,
        resolvedPickup.trim(),
        resolvedDeliveryLoc.trim(),
        resolvedRemarks || null,
        photoPath,
        driver_name || null,
        vehicle_number || null,
        pod_status || 'Uploaded',
        status || 'Delivered'
      ];

      const [result] = await db.query(sql, params);
      
      // Auto insert initial/final tracking updates
      const histSql = 'INSERT INTO delivery_history (delivery_id, status, remarks) VALUES (?, ?, ?)';
      await db.query(histSql, [result.insertId, status || 'Delivered', 'Proof of delivery (POD) uploaded.']);

      // Fetch and return the newly created record
      const [newRow] = await db.query('SELECT * FROM deliveries WHERE id = ?', [result.insertId]);
      res.status(201).json(mapPodRecord(newRow[0]));
    }
  } catch (error) {
    console.error('Error creating POD record:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/pod/list - Retrieve all deliveries sorted by time
router.get('/list', async (req, res) => {
  try {
    if (db.isInMemory()) {
      const records = db.getMockRecords();
      const sorted = [...records].sort((a, b) => new Date(b.delivery_date) - new Date(a.delivery_date));
      return res.json(sorted.map(mapPodRecord));
    } else {
      const [rows] = await db.query('SELECT * FROM deliveries ORDER BY delivery_date DESC');
      const mappedRows = rows.map(mapPodRecord);
      res.json(mappedRows);
    }
  } catch (error) {
    console.error('Error fetching delivery list:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/pod/:id - Retrieve specific delivery by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db.isInMemory()) {
      const records = db.getMockRecords();
      const record = records.find(r => r.id === Number(id));
      if (!record) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      return res.json(mapPodRecord(record));
    } else {
      const [rows] = await db.query('SELECT * FROM deliveries WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      res.json(mapPodRecord(rows[0]));
    }
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// PUT /api/pod/:id/status - Update delivery status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Valid status is required.' });
  }

  try {
    if (db.isInMemory()) {
      const records = db.getMockRecords();
      const idx = records.findIndex(r => r.id === Number(id));
      if (idx === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      records[idx] = {
        ...records[idx],
        status,
        pod_status: status === 'Delivered' ? 'Uploaded' : records[idx].pod_status,
        updated_at: new Date()
      };
      db.setMockRecords(records);

      // Status history change auto-trigger
      const history = db.getMockHistory();
      const newHistId = history.length > 0 ? Math.max(...history.map(h => h.id)) + 1 : 1;
      history.push({
        id: newHistId,
        delivery_id: Number(id),
        status,
        remarks: `Transit status updated to ${status}.`,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
      db.setMockHistory(history);

      return res.json({ message: 'Status updated successfully.', id, status });
    } else {
      const sql = 'UPDATE deliveries SET status = ?, pod_status = IF(status = "Delivered", "Uploaded", pod_status) WHERE id = ?';
      const [result] = await db.query(sql, [status, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }

      // Add to tracking history table
      const histSql = 'INSERT INTO delivery_history (delivery_id, status, remarks) VALUES (?, ?, ?)';
      await db.query(histSql, [id, status, `Transit status updated to ${status}.`]);

      res.json({ message: 'Status updated successfully.', id, status });
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE /api/pod/:id - Delete a delivery record
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db.isInMemory()) {
      const records = db.getMockRecords();
      const idx = records.findIndex(r => r.id === Number(id));
      if (idx === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      records.splice(idx, 1);
      db.setMockRecords(records);
      
      let history = db.getMockHistory();
      history = history.filter(h => h.delivery_id !== Number(id));
      db.setMockHistory(history);

      return res.json({ message: 'Delivery record deleted successfully.', id });
    } else {
      const [result] = await db.query('DELETE FROM deliveries WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      res.json({ message: 'Delivery record deleted successfully.', id });
    }
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
