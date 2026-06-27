const express = require('express');
const router = express.Router();
const db = require('../db');

// Map database record to response layout
function mapDeliveryRecord(row) {
  if (!row) return null;
  const photoUrl = row.delivery_photo 
    ? (row.delivery_photo.startsWith('data:') ? row.delivery_photo : `http://localhost:5000/${row.delivery_photo}`) 
    : null;

  return {
    ...row,
    // Base keys
    id: row.id,
    consignment_no: row.consignment_no,
    customer_name: row.customer_name,
    receiver_name: row.receiver_name,
    signature_image: row.signature_image,
    delivery_photo: row.delivery_photo,
    delivery_time: row.delivery_date, // Map new DB column to frontend key
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

// GET /api/deliveries - List all deliveries with search, filters, sorting, and pagination
router.get('/', async (req, res) => {
  const {
    search = '',
    status = '',
    date = '',
    page = '1',
    limit = '10',
    sortBy = 'delivery_time',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;

  try {
    if (db.isInMemory()) {
      // IN-MEMORY FALLBACK SEARCH & FILTER LOGIC
      let records = db.getMockRecords();

      // 1. Search filter
      if (search.trim() !== '') {
        const query = search.toLowerCase().trim();
        records = records.filter(r => 
          r.consignment_no.toLowerCase().includes(query) ||
          r.customer_name.toLowerCase().includes(query) ||
          (r.driver_name && r.driver_name.toLowerCase().includes(query)) ||
          (r.vehicle_number && r.vehicle_number.toLowerCase().includes(query)) ||
          r.receiver_name.toLowerCase().includes(query)
        );
      }

      // 2. Status filter
      if (status.trim() !== '' && status !== 'All') {
        records = records.filter(r => r.status.toLowerCase() === status.toLowerCase());
      }

      // 3. Date filter (YYYY-MM-DD)
      if (date.trim() !== '') {
        records = records.filter(r => {
          const rDate = r.delivery_date ? r.delivery_date.slice(0, 10) : '';
          return rDate === date;
        });
      }

      // 4. Sorting logic
      const allowedCols = ['consignment_no', 'customer_name', 'driver_name', 'vehicle_number', 'delivery_date', 'status', 'pod_status'];
      let sortCol = 'delivery_date';
      if (allowedCols.includes(sortBy)) {
        sortCol = sortBy;
      } else if (sortBy === 'delivery_time') {
        sortCol = 'delivery_date';
      }
      const isAsc = sortOrder.toLowerCase() === 'asc';

      records.sort((a, b) => {
        let valA = a[sortCol] || '';
        let valB = b[sortCol] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return isAsc ? -1 : 1;
        if (valA > valB) return isAsc ? 1 : -1;
        return 0;
      });

      // 5. Pagination
      const totalCount = records.length;
      const totalPages = Math.ceil(totalCount / limitNum) || 1;
      const paginatedRecords = records.slice(offset, offset + limitNum);

      return res.json({
        data: paginatedRecords.map(mapDeliveryRecord),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages
        }
      });
    } else {
      // MYSQL PRODUCTION IMPLEMENTATION
      let whereClause = 'WHERE 1=1';
      const countParams = [];
      const queryParams = [];

      // 1. Search Query mapping
      if (search.trim() !== '') {
        whereClause += ' AND (consignment_no LIKE ? OR customer_name LIKE ? OR driver_name LIKE ? OR vehicle_number LIKE ? OR receiver_name LIKE ?)';
        const searchWildcard = `%${search.trim()}%`;
        countParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
      }

      // 2. Status Filter mapping
      if (status.trim() !== '' && status !== 'All') {
        whereClause += ' AND status = ?';
        countParams.push(status);
        queryParams.push(status);
      }

      // 3. Date Filter mapping
      if (date.trim() !== '') {
        whereClause += ' AND DATE(delivery_date) = ?';
        countParams.push(date);
        queryParams.push(date);
      }

      // Run Count query for pagination meta
      const countSql = `SELECT COUNT(*) as total FROM deliveries ${whereClause}`;
      const [countRows] = await db.query(countSql, countParams);
      const totalCount = countRows[0]?.total || 0;
      const totalPages = Math.ceil(totalCount / limitNum) || 1;

      // Sorting columns whitelist
      const allowedCols = ['consignment_no', 'customer_name', 'driver_name', 'vehicle_number', 'delivery_date', 'status', 'pod_status'];
      let orderBy = 'delivery_date';
      if (allowedCols.includes(sortBy)) {
        orderBy = sortBy;
      } else if (sortBy === 'delivery_time') {
        orderBy = 'delivery_date';
      }
      const orderDir = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // Run Select query with Pagination limits
      const selectSql = `SELECT * FROM deliveries ${whereClause} ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
      queryParams.push(limitNum, offset);

      const [rows] = await db.query(selectSql, queryParams);

      return res.json({
        data: rows.map(mapDeliveryRecord),
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: totalPages
        }
      });
    }
  } catch (error) {
    console.error('Error fetching deliveries API:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/deliveries/:id - Retrieve specific delivery by ID (including tracking history)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (db.isInMemory()) {
      const records = db.getMockRecords();
      const record = records.find(r => r.id === Number(id));
      if (!record) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      const history = db.getMockHistory().filter(h => h.delivery_id === Number(id));
      const mapped = mapDeliveryRecord(record);
      mapped.history = history;
      return res.json(mapped);
    } else {
      const [rows] = await db.query('SELECT * FROM deliveries WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      const [historyRows] = await db.query('SELECT * FROM delivery_history WHERE delivery_id = ? ORDER BY timestamp ASC', [id]);
      const mapped = mapDeliveryRecord(rows[0]);
      mapped.history = historyRows;
      return res.json(mapped);
    }
  } catch (error) {
    console.error('Error fetching delivery details API:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// PUT /api/deliveries/status/:id - Update delivery status
router.put('/status/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Valid transit status is required.' });
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
      // 1. Update deliveries table
      const sql = 'UPDATE deliveries SET status = ?, pod_status = IF(status = "Delivered", "Uploaded", pod_status) WHERE id = ?';
      const [result] = await db.query(sql, [status, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      
      // 2. Insert tracking update to history table
      const histSql = 'INSERT INTO delivery_history (delivery_id, status, remarks) VALUES (?, ?, ?)';
      await db.query(histSql, [id, status, `Transit status updated to ${status}.`]);

      return res.json({ message: 'Status updated successfully.', id, status });
    }
  } catch (error) {
    console.error('Error updating delivery status API:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE /api/deliveries/:id - Delete a delivery record
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

      // Clean history cascade
      let history = db.getMockHistory();
      history = history.filter(h => h.delivery_id !== Number(id));
      db.setMockHistory(history);

      return res.json({ message: 'Delivery record deleted successfully.', id });
    } else {
      const [result] = await db.query('DELETE FROM deliveries WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Not Found', message: 'Delivery record not found.' });
      }
      return res.json({ message: 'Delivery record deleted successfully.', id });
    }
  } catch (error) {
    console.error('Error deleting delivery API:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
