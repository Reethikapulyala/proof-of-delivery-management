const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/compliance-dashboard - Analytics and dashboard summaries
router.get('/dashboard', async (req, res) => {
  try {
    let permits = [];
    let insurance = [];
    let fitness = [];
    let pollution = [];
    let alerts = [];

    if (db.isInMemory()) {
      permits = db.getMockPermits();
      insurance = db.getMockInsurance();
      fitness = db.getMockFitness();
      pollution = db.getMockPollution();
      alerts = db.getMockAlerts();
    } else {
      const [p] = await db.query('SELECT * FROM permits');
      const [i] = await db.query('SELECT * FROM insurance_records');
      const [f] = await db.query('SELECT * FROM fitness_certificates');
      const [pol] = await db.query('SELECT * FROM pollution_certificates');
      const [a] = await db.query('SELECT * FROM compliance_alerts');
      permits = p || [];
      insurance = i || [];
      fitness = f || [];
      pollution = pol || [];
      alerts = a || [];
    }

    // Combine all vehicles
    const vehiclesSet = new Set();
    [permits, insurance, fitness, pollution].forEach(list => {
      list.forEach(item => {
        if (item.vehicle_number) vehiclesSet.add(item.vehicle_number);
      });
    });
    const totalVehicles = vehiclesSet.size || 4; // default seed size if empty

    // Count states
    let totalDocs = permits.length + insurance.length + fitness.length + pollution.length;
    let expiredCount = 0;
    let expiringCount = 0;
    let validCount = 0;

    [permits, insurance, fitness, pollution].forEach(list => {
      list.forEach(item => {
        if (item.status === 'Expired') expiredCount++;
        else if (item.status === 'Expiring Soon') expiringCount++;
        else validCount++;
      });
    });

    const compliancePercentage = totalDocs > 0 ? Math.round((validCount / totalDocs) * 100) : 100;

    // Chart: Document Expiry Trends
    const trends = {
      labels: ['Permits', 'Insurance', 'Fitness', 'Pollution'],
      datasets: [
        {
          label: 'Valid',
          data: [
            permits.filter(x => x.status === 'Valid').length,
            insurance.filter(x => x.status === 'Valid').length,
            fitness.filter(x => x.status === 'Valid').length,
            pollution.filter(x => x.status === 'Valid').length
          ],
          backgroundColor: '#10b981'
        },
        {
          label: 'Expiring Soon',
          data: [
            permits.filter(x => x.status === 'Expiring Soon').length,
            insurance.filter(x => x.status === 'Expiring Soon').length,
            fitness.filter(x => x.status === 'Expiring Soon').length,
            pollution.filter(x => x.status === 'Expiring Soon').length
          ],
          backgroundColor: '#f59e0b'
        },
        {
          label: 'Expired',
          data: [
            permits.filter(x => x.status === 'Expired').length,
            insurance.filter(x => x.status === 'Expired').length,
            fitness.filter(x => x.status === 'Expired').length,
            pollution.filter(x => x.status === 'Expired').length
          ],
          backgroundColor: '#ef4444'
        }
      ]
    };

    // Chart: Compliance status distribution
    const distribution = {
      labels: ['Valid', 'Expiring Soon', 'Expired'],
      data: [validCount, expiringCount, expiredCount]
    };

    res.json({
      kpis: {
        totalVehicles,
        totalDocuments: totalDocs,
        activeDocuments: validCount,
        expiringDocuments: expiringCount,
        expiredDocuments: expiredCount,
        compliancePercentage
      },
      charts: {
        trends,
        distribution
      },
      alerts: alerts.slice(0, 5) // Send latest 5 alerts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch compliance dashboard', message: err.message });
  }
});

// GET /api/compliance-dashboard/alerts - All alerts
router.get('/alerts', async (req, res) => {
  const { priority = '' } = req.query;
  try {
    let alerts = [];
    if (db.isInMemory()) {
      alerts = db.getMockAlerts();
    } else {
      const [rows] = await db.query('SELECT * FROM compliance_alerts ORDER BY days_remaining ASC');
      alerts = rows || [];
    }

    if (priority.trim() !== '') {
      alerts = alerts.filter(a => a.priority.toLowerCase() === priority.toLowerCase());
    }

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts', message: err.message });
  }
});

// GET /api/compliance-dashboard/reports
router.get('/reports', async (req, res) => {
  try {
    if (db.isInMemory()) {
      const reports = db.getMockReports();
      return res.json(reports);
    }
    const [rows] = await db.query('SELECT * FROM compliance_reports ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports', message: err.message });
  }
});

// POST /api/compliance-dashboard/reports
router.post('/reports', async (req, res) => {
  const { report_type, generated_by, filters_applied, record_count } = req.body;
  if (!report_type || !generated_by) {
    return res.status(400).json({ error: 'Validation Error', message: 'Report type and generator name are required.' });
  }

  try {
    if (db.isInMemory()) {
      const reports = db.getMockReports();
      const newReport = {
        id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
        report_type,
        generated_by,
        filters_applied: filters_applied ? JSON.stringify(filters_applied) : '{}',
        record_count: record_count || 0,
        created_at: new Date()
      };
      reports.unshift(newReport);
      db.setMockReports(reports);
      return res.status(201).json(newReport);
    }

    const [result] = await db.query(
      'INSERT INTO compliance_reports (report_type, generated_by, filters_applied, record_count) VALUES (?, ?, ?, ?)',
      [report_type, generated_by, filters_applied ? JSON.stringify(filters_applied) : '{}', record_count || 0]
    );

    res.status(201).json({
      id: result.insertId,
      report_type,
      generated_by,
      filters_applied,
      record_count
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save report log', message: err.message });
  }
});

module.exports = router;
