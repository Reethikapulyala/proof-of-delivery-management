const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./authMiddleware');

// GET /api/dashboard - Summary operational stats for HK Shipping Dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let deliveriesList = [];
    let alertsCount = 0;
    
    if (db.isInMemory()) {
      deliveriesList = db.getMockRecords();
      alertsCount = db.getMockAlerts().length;
    } else {
      const [rows] = await db.pool.query('SELECT * FROM deliveries');
      deliveriesList = rows;
      const [alerts] = await db.pool.query('SELECT COUNT(*) as count FROM compliance_alerts');
      alertsCount = alerts[0].count;
    }

    const totalShipments = deliveriesList.length;
    const delivered = deliveriesList.filter(d => d.status === 'Delivered').length;
    const pending = deliveriesList.filter(d => d.status === 'Pending').length;
    const activeDrivers = new Set(deliveriesList.filter(d => d.driver_name).map(d => d.driver_name)).size;
    const activeVehicles = new Set(deliveriesList.filter(d => d.vehicle_number).map(d => d.vehicle_number)).size;

    // Static baseline data matching HK Shipping financial metrics
    const stats = {
      totalCustomers: 65,
      totalShipments,
      activeVehicles: activeVehicles || 12,
      activeDrivers: activeDrivers || 8,
      deliveredShipments: delivered,
      pendingDeliveries: pending,
      revenueGenerated: 28500.00,
      outstandingPayments: 10000.00,
      complianceAlertsCount: alertsCount
    };

    // Include recent logs
    const latestActivities = [
      { id: 1, user: 'John Miller', action: 'Dispatched vehicle MH-12-GQ-5524', module: 'Fleet', time: '10 mins ago' },
      { id: 2, user: 'Sarah Connor', action: 'Approved invoice INV-2026-1024', module: 'Billing', time: '45 mins ago' },
      { id: 3, user: 'System Scheduler', action: 'Triggered compliance warning check', module: 'Compliance', time: '2 hours ago' }
    ];

    res.json({ stats, latestActivities });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/analytics - Dynamic Chart.js financial and logistics metrics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    let deliveriesList = [];
    if (db.isInMemory()) {
      deliveriesList = db.getMockRecords();
    } else {
      const [rows] = await db.pool.query('SELECT * FROM deliveries');
      deliveriesList = rows;
    }

    const totalShipments = deliveriesList.length;

    // Monthly revenue trend mock values
    const monthlyRevenue = [
      { month: 'Jan', amount: 15000 },
      { month: 'Feb', amount: 18200 },
      { month: 'Mar', amount: 16900 },
      { month: 'Apr', amount: 21000 },
      { month: 'May', amount: 24500 },
      { month: 'Jun', amount: 28500 }
    ];

    const shipmentTrends = [
      { month: 'Jan', volume: 95 },
      { month: 'Feb', volume: 115 },
      { month: 'Mar', volume: 102 },
      { month: 'Apr', volume: 130 },
      { month: 'May', volume: 145 },
      { month: 'Jun', volume: 120 + totalShipments }
    ];

    const fleetUsage = {
      active: 85,
      idle: 10,
      maintenance: 5
    };

    const customerGrowth = [
      { month: 'Jan', count: 42 },
      { month: 'Feb', count: 45 },
      { month: 'Mar', count: 48 },
      { month: 'Apr', count: 52 },
      { month: 'May', count: 58 },
      { month: 'Jun', count: 65 }
    ];

    const collections = {
      paid: 18500,
      pending: 6200,
      overdue: 3800
    };

    res.json({
      monthlyRevenue,
      shipmentTrends,
      fleetUsage,
      customerGrowth,
      collections
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/notifications - Real-time system warning messages
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    let mockAlerts = [];
    if (db.isInMemory()) {
      mockAlerts = db.getMockAlerts();
    } else {
      const [rows] = await db.pool.query('SELECT * FROM compliance_alerts ORDER BY alert_date DESC');
      mockAlerts = rows;
    }

    // Convert compliance alerts to notification hub messages
    const notifications = mockAlerts.map((alert, index) => ({
      id: alert.id,
      title: `${alert.document_type} Expiry Warning`,
      message: `Vehicle ${alert.vehicle_number} has an expiring ${alert.document_type.toLowerCase()} (${alert.days_remaining} days left).`,
      type: alert.priority === 'High' ? 'warning' : 'info',
      time: alert.alert_date,
      read: alert.email_status === 'Sent'
    }));

    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/activity-logs - Searchable operations audit trails
router.get('/activity-logs', authenticateToken, async (req, res) => {
  const { search, module } = req.query;
  
  try {
    let logs = [
      { id: 1, user: 'Sarah Connor', module: 'User Management', action: 'Created new dispatch user account', timestamp: '2026-06-18 10:24:00', ip_address: '192.168.1.10' },
      { id: 2, user: 'Alex Mercer', module: 'Shipments', action: 'Updated status of consignment HKS-802495 to Delivered', timestamp: '2026-06-18 09:45:00', ip_address: '192.168.1.12' },
      { id: 3, user: 'Marcus Wright', module: 'Fleet', action: 'Added vehicle MH-12-GQ-5524 to active fleet', timestamp: '2026-06-18 08:30:00', ip_address: '192.168.1.15' },
      { id: 4, user: 'Kyle Reese', module: 'Compliance', action: 'Renewed National Permit for vehicle DL-01-AL-9872', timestamp: '2026-06-17 14:10:00', ip_address: '192.168.1.8' },
      { id: 5, user: 'John Connor', module: 'Invoices', action: 'Generated invoice INV-2026-1025', timestamp: '2026-06-17 11:15:00', ip_address: '192.168.1.22' }
    ];

    if (module && module !== 'All') {
      logs = logs.filter(l => l.module.toLowerCase() === module.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l => 
        l.user.toLowerCase().includes(q) || 
        l.action.toLowerCase().includes(q) || 
        l.ip_address.includes(q)
      );
    }

    res.json(logs);
  } catch (error) {
    console.error('Fetch logs error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/reports - Compile datasets for the 8 statutory shipping logs
router.get('/reports', authenticateToken, async (req, res) => {
  const { template, startDate, endDate, status } = req.query;

  // Compilation database mapping
  const mockReportDatabase = {
    'Shipment Report': [
      { 'Consignment No': 'HKS-802495', 'Customer': 'Nova Pharma Inc', 'Route': 'Seattle ➔ Portland', 'Driver': 'John Miller', 'Date': '2026-06-18', 'Status': 'Delivered' },
      { 'Consignment No': 'HKS-392817', 'Customer': 'Apex Industrial Supply', 'Route': 'Detroit ➔ Chicago', 'Driver': 'Robert Chen', 'Date': '2026-06-18', 'Status': 'In Transit' },
      { 'Consignment No': 'HKS-601932', 'Customer': 'HoloTech Systems', 'Route': 'Boston ➔ New York', 'Driver': 'David Miller', 'Date': '2026-06-18', 'Status': 'Booked' }
    ],
    'POD Report': [
      { 'Consignment No': 'HKS-802495', 'Receiver Name': 'Dr. Karen Vance', 'Delivery Date': '2026-06-18', 'POD Image Path': 'uploads/sample_photo_1.png', 'POD Status': 'Uploaded' },
      { 'Consignment No': 'HKS-392817', 'Receiver Name': 'Marcus Thorne', 'Delivery Date': '2026-06-18', 'POD Image Path': 'uploads/sample_photo_2.png', 'POD Status': 'Uploaded' }
    ],
    'Fleet Report': [
      { 'Vehicle Number': 'MH-12-GQ-5524', 'Manufacturer': 'Tata Motors', 'Model': 'Prima 4028', 'Type': 'Heavy Truck', 'Status': 'Active' },
      { 'Vehicle Number': 'DL-01-AL-9872', 'Manufacturer': 'Mahindra', 'Model': 'Blazo X', 'Type': 'Multi-axle Truck', 'Status': 'Maintenance' },
      { 'Vehicle Number': 'KA-03-MP-4122', 'Manufacturer': 'BharatBenz', 'Model': '1617R', 'Type': 'Light Truck', 'Status': 'Active' }
    ],
    'Driver Report': [
      { 'Driver Name': 'John Miller', 'License Number': 'DL-MH-12-20230048', 'Phone Number': '+91 98765 43210', 'Vehicle': 'MH-12-GQ-5524', 'Duty Status': 'Active' },
      { 'Driver Name': 'Robert Chen', 'License Number': 'DL-DL-01-20220092', 'Phone Number': '+91 99887 76655', 'Vehicle': 'DL-01-AL-9872', 'Duty Status': 'In Transit' }
    ],
    'Customer Report': [
      { 'Client Name': 'Nova Pharma Inc', 'Email Contact': 'logistics@novapharma.com', 'Active Cargo': '12 units', 'Outstanding Balance': '$15,000.00' },
      { 'Client Name': 'Apex Industrial Supply', 'Email Contact': 'shipping@apexindustrial.com', 'Active Cargo': '8 units', 'Outstanding Balance': '$8,500.00' },
      { 'Client Name': 'HoloTech Systems', 'Email Contact': 'ops@holotech.io', 'Active Cargo': '5 units', 'Outstanding Balance': '$0.00' }
    ],
    'Invoice Report': [
      { 'Invoice No': 'INV-2026-1024', 'Customer': 'Nova Pharma Inc', 'Base Amount': '$4,800.00', 'CGST (9%)': '$432.00', 'SGST (9%)': '$432.00', 'Grand Total': '$5,664.00', 'Due Date': '2026-06-15', 'Status': 'Paid' },
      { 'Invoice No': 'INV-2026-1025', 'Customer': 'Apex Industrial Supply', 'Base Amount': '$6,200.00', 'IGST (18%)': '$1,116.00', 'Grand Total': '$7,316.00', 'Due Date': '2026-06-10', 'Status': 'Overdue' }
    ],
    'Payment Report': [
      { 'Payment Ref': 'PAY-88210', 'Invoice No': 'INV-2026-1024', 'Customer': 'Nova Pharma Inc', 'Amount Paid': '$4,800.00', 'Payment Mode': 'UPI', 'Settlement Date': '2026-06-15' }
    ],
    'Compliance Report': [
      { 'Vehicle Number': 'DL-01-AL-9872', 'Document Type': 'Permit', 'Document Number': 'PERMIT-SP-9872B', 'Expiry Date': '2026-06-30', 'Days Remaining': '12 days', 'Status': 'Expiring Soon' },
      { 'Vehicle Number': 'KA-03-MP-4122', 'Document Type': 'Insurance', 'Document Number': 'INS-POL-4122C', 'Expiry Date': '2026-06-15', 'Days Remaining': '-3 days', 'Status': 'Expired' }
    ]
  };

  try {
    const reportName = template || 'Shipment Report';
    let data = mockReportDatabase[reportName] || [];

    // Apply basic filter queries if provided
    if (startDate) {
      data = data.filter(row => {
        const dateVal = row['Date'] || row['Delivery Date'] || row['Expiry Date'] || row['Settlement Date'];
        return dateVal ? dateVal >= startDate : true;
      });
    }

    if (endDate) {
      data = data.filter(row => {
        const dateVal = row['Date'] || row['Delivery Date'] || row['Expiry Date'] || row['Settlement Date'];
        return dateVal ? dateVal <= endDate : true;
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
