const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hk_shipping_pod',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let useInMemoryFallback = false;

// Mock signature SVG data
const MOCK_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="100" viewBox="0 0 250 100"><path d="M20,50 Q40,20 60,60 T100,40 T140,70 T180,30 T220,60" fill="none" stroke="%230284c7" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="75" x2="225" y2="70" stroke="%230284c7" stroke-width="2" stroke-dasharray="5 5"/></svg>';

// Pre-populate in-memory deliveries table
let mockRecords = [
  {
    id: 1,
    consignment_no: 'HKS-802495',
    customer_name: 'Nova Pharma Inc',
    pickup_location: 'Warehouse 4, Port Terminal, Seattle, WA',
    delivery_location: '890 Medical Plaza Rd, Building B, Seattle, WA',
    driver_name: 'John Miller',
    vehicle_number: 'MH-12-GQ-5524',
    shipment_date: '2026-06-17 09:45:00',
    delivery_date: '2026-06-18 09:45:00',
    status: 'Delivered',
    remarks: 'Hand-delivered directly to pharmacy reception. Cool box temperature verified.',
    receiver_name: 'Dr. Karen Vance',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_1.png',
    pod_status: 'Uploaded',
    created_at: new Date('2026-06-17T09:45:00'),
    updated_at: new Date('2026-06-18T09:45:00')
  },
  {
    id: 2,
    consignment_no: 'HKS-392817',
    customer_name: 'Apex Industrial Supply',
    pickup_location: 'Factory Depot, Detroit, MI',
    delivery_location: '4110 Factory Blvd, Terminal 4, Detroit, MI',
    driver_name: 'Robert Chen',
    vehicle_number: 'DL-01-AL-9872',
    shipment_date: '2026-06-17 10:15:00',
    delivery_date: '2026-06-18 10:15:00',
    status: 'Delivered',
    remarks: 'Left at warehouse bay 3. Package inspected and approved by supervisor.',
    receiver_name: 'Marcus Thorne',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_2.png',
    pod_status: 'Uploaded',
    created_at: new Date('2026-06-17T10:15:00'),
    updated_at: new Date('2026-06-18T10:15:00')
  },
  {
    id: 3,
    consignment_no: 'HKS-601932',
    customer_name: 'HoloTech Systems',
    pickup_location: 'Logistics Center Terminal, Cambridge, MA',
    delivery_location: '12 Science Center Dr, Cambridge, MA',
    driver_name: 'David Miller',
    vehicle_number: 'KA-03-MP-4122',
    shipment_date: '2026-06-17 11:20:00',
    delivery_date: '2026-06-18 11:20:00',
    status: 'Delivered',
    remarks: 'Consignment delivered in good condition. Handover done.',
    receiver_name: 'Admin Desk Receptionist',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_3.png',
    pod_status: 'Uploaded',
    created_at: new Date('2026-06-17T11:20:00'),
    updated_at: new Date('2026-06-18T11:20:00')
  },
  {
    id: 4,
    consignment_no: 'HKS-491275',
    customer_name: 'Global Retail Co',
    pickup_location: 'Fulfillment Facility, San Francisco, CA',
    delivery_location: '555 Market St, Floor 2, San Francisco, CA',
    driver_name: 'Sarah Jenkins',
    vehicle_number: 'MH-02-FB-8811',
    shipment_date: '2026-06-16 14:30:00',
    delivery_date: '2026-06-17 14:30:00',
    status: 'Delivered',
    remarks: 'Left at main security counter as requested. Signature recorded from guard.',
    receiver_name: 'Lobby Dropoff Desk',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_4.png',
    pod_status: 'Uploaded',
    created_at: new Date('2026-06-16T14:30:00'),
    updated_at: new Date('2026-06-17T14:30:00')
  },
  {
    id: 5,
    consignment_no: 'HKS-109283',
    customer_name: 'TechParts Corporation',
    pickup_location: 'Electronics Depot, Austin, TX',
    delivery_location: 'Suite 404, Tech Park, Austin, TX',
    driver_name: 'Robert Chen',
    vehicle_number: 'DL-01-AL-9872',
    shipment_date: '2026-06-17 12:00:00',
    delivery_date: '2026-06-18 12:00:00',
    status: 'Out For Delivery',
    remarks: 'Out with driver, expected delivery before end of shift.',
    receiver_name: 'Pending Receiver',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_2.png',
    pod_status: 'Pending',
    created_at: new Date('2026-06-17T12:00:00'),
    updated_at: new Date('2026-06-18T12:00:00')
  },
  {
    id: 6,
    consignment_no: 'HKS-773829',
    customer_name: 'Prime Chemical Distributors',
    pickup_location: 'Chemical Hub Terminal, Houston, TX',
    delivery_location: '12 Industrial Plaza, Houston, TX',
    driver_name: 'John Miller',
    vehicle_number: 'MH-12-GQ-5524',
    shipment_date: '2026-06-17 08:30:00',
    delivery_date: '2026-06-18 08:30:00',
    status: 'Failed',
    remarks: 'Recipient refused delivery. Delivery address locked. Consignment returned.',
    receiver_name: 'Returned to Depot',
    signature_image: MOCK_SIGNATURE,
    delivery_photo: 'uploads/sample_photo_1.png',
    pod_status: 'Pending',
    created_at: new Date('2026-06-17T08:30:00'),
    updated_at: new Date('2026-06-18T08:30:00')
  }
];

// Pre-populate in-memory delivery history table
let mockHistory = [
  // Consignment 1
  { id: 1, delivery_id: 1, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-17 09:45:00' },
  { id: 2, delivery_id: 1, status: 'In Transit', remarks: 'Driver John Miller assigned. Dispatched from Seattle Hub Depot.', timestamp: '2026-06-17 21:45:00' },
  { id: 3, delivery_id: 1, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle MH-12-GQ-5524. Out for delivery.', timestamp: '2026-06-18 07:45:00' },
  { id: 4, delivery_id: 1, status: 'Delivered', remarks: 'Delivered successfully. Signed by Dr. Karen Vance.', timestamp: '2026-06-18 09:45:00' },

  // Consignment 2
  { id: 5, delivery_id: 2, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-17 10:15:00' },
  { id: 6, delivery_id: 2, status: 'In Transit', remarks: 'Driver Robert Chen assigned. Dispatched from Detroit Depot.', timestamp: '2026-06-17 22:15:00' },
  { id: 7, delivery_id: 2, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle DL-01-AL-9872. Out for delivery.', timestamp: '2026-06-18 08:15:00' },
  { id: 8, delivery_id: 2, status: 'Delivered', remarks: 'Left at warehouse bay 3. Approved by supervisor.', timestamp: '2026-06-18 10:15:00' },

  // Consignment 3
  { id: 9, delivery_id: 3, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-17 11:20:00' },
  { id: 10, delivery_id: 3, status: 'In Transit', remarks: 'Driver David Miller assigned. Dispatched from Cambridge Depot.', timestamp: '2026-06-17 23:20:00' },
  { id: 11, delivery_id: 3, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle KA-03-MP-4122. Out for delivery.', timestamp: '2026-06-18 09:20:00' },
  { id: 12, delivery_id: 3, status: 'Delivered', remarks: 'Delivered to Admin Desk Receptionist.', timestamp: '2026-06-18 11:20:00' },

  // Consignment 4
  { id: 13, delivery_id: 4, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-16 14:30:00' },
  { id: 14, delivery_id: 4, status: 'In Transit', remarks: 'Driver Sarah Jenkins assigned. Dispatched from SF Facility.', timestamp: '2026-06-17 02:30:00' },
  { id: 15, delivery_id: 4, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle MH-02-FB-8811. Out for delivery.', timestamp: '2026-06-17 12:30:00' },
  { id: 16, delivery_id: 4, status: 'Delivered', remarks: 'Left at main security counter. Signed by security guard.', timestamp: '2026-06-17 14:30:00' },

  // Consignment 5
  { id: 17, delivery_id: 5, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-17 12:00:00' },
  { id: 18, delivery_id: 5, status: 'In Transit', remarks: 'Driver Robert Chen assigned. Dispatched from Austin Depot.', timestamp: '2026-06-18 00:00:00' },
  { id: 19, delivery_id: 5, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle DL-01-AL-9872. Out for delivery.', timestamp: '2026-06-18 10:00:00' },

  // Consignment 6
  { id: 20, delivery_id: 6, status: 'Pending', remarks: 'Shipment record created and consignment registered.', timestamp: '2026-06-17 08:30:00' },
  { id: 21, delivery_id: 6, status: 'In Transit', remarks: 'Driver John Miller assigned. Dispatched from Houston Depot.', timestamp: '2026-06-17 20:30:00' },
  { id: 22, delivery_id: 6, status: 'Out For Delivery', remarks: 'Consignment loaded onto vehicle MH-12-GQ-5524. Out for delivery.', timestamp: '2026-06-18 06:30:00' },
  { id: 23, delivery_id: 6, status: 'Failed', remarks: 'Recipient refused delivery. Returned to depot.', timestamp: '2026-06-18 08:30:00' }
];

// Test database connection on startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'hk_shipping_pod'));
    connection.release();
  } catch (error) {
    console.log('⚠️ MySQL connection failed: Access denied or database not running.');
    console.log('🔄 Server is falling back to SELF-CONTAINED IN-MEMORY DATABASE mode.');
    useInMemoryFallback = true;
  }
}

testConnection();

// Custom query adapter supporting both MySQL and In-Memory fallback
async function query(sql, params = []) {
  if (!useInMemoryFallback) {
    try {
      return await pool.query(sql, params);
    } catch (err) {
      console.error('Database query execution failed. Switching to in-memory fallback.', err.message);
      useInMemoryFallback = true;
    }
  }

  // In-Memory Database Handler Simulation
  console.log(`[InMemoryDB] Executing query: ${sql.trim().replace(/\s+/g, ' ').substring(0, 100)}...`);
  const cleanSql = sql.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. SELECT * FROM deliveries ORDER BY delivery_date DESC / delivery_time DESC
  if (cleanSql.includes('select * from deliveries order by') || cleanSql.includes('select * from deliveries')) {
    // Whitelist check
    const isAsc = cleanSql.includes(' asc');
    let sortCol = 'delivery_date';
    if (cleanSql.includes('delivery_time')) sortCol = 'delivery_date'; // map to new column
    if (cleanSql.includes('customer_name')) sortCol = 'customer_name';
    if (cleanSql.includes('consignment_no')) sortCol = 'consignment_no';
    if (cleanSql.includes('status')) sortCol = 'status';

    const sorted = [...mockRecords].sort((a, b) => {
      let valA = a[sortCol] || '';
      let valB = b[sortCol] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });
    return [sorted];
  }

  // 2. SELECT id FROM deliveries WHERE consignment_no = ?
  if (cleanSql.includes('select id from deliveries where consignment_no =')) {
    const cno = params[0].trim().toLowerCase();
    const rows = mockRecords.filter(r => r.consignment_no.toLowerCase() === cno).map(r => ({ id: r.id }));
    return [rows];
  }

  // 3. SELECT * FROM deliveries WHERE id = ?
  if (cleanSql.includes('select * from deliveries where id =')) {
    const id = Number(params[0]);
    const rows = mockRecords.filter(r => r.id === id);
    return [rows];
  }

  // 4. INSERT INTO deliveries ...
  if (cleanSql.includes('insert into deliveries')) {
    const nextId = mockRecords.length > 0 ? Math.max(...mockRecords.map(r => r.id)) + 1 : 1;
    const newRecord = {
      id: nextId,
      consignment_no: params[0],
      customer_name: params[1],
      pickup_location: params[2],
      delivery_location: params[3],
      driver_name: params[4],
      vehicle_number: params[5],
      shipment_date: params[6],
      delivery_date: params[7],
      status: params[8] || 'Pending',
      remarks: params[9] || null,
      receiver_name: params[10] || null,
      signature_image: params[11] || null,
      delivery_photo: params[12] || null,
      pod_status: params[13] || 'Pending',
      created_at: new Date(),
      updated_at: new Date()
    };
    mockRecords.push(newRecord);

    // Initial history step auto-trigger
    const newHistId = mockHistory.length > 0 ? Math.max(...mockHistory.map(h => h.id)) + 1 : 1;
    mockHistory.push({
      id: newHistId,
      delivery_id: nextId,
      status: newRecord.status,
      remarks: 'Shipment created and registered in the system.',
      timestamp: newRecord.shipment_date || new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    return [{ insertId: nextId }];
  }

  // 5. UPDATE deliveries SET status = ?, pod_status = IF(...) WHERE id = ?
  if (cleanSql.includes('update deliveries set status =')) {
    const newStatus = params[0];
    const id = Number(params[1]);
    const idx = mockRecords.findIndex(r => r.id === id);
    if (idx !== -1) {
      mockRecords[idx] = {
        ...mockRecords[idx],
        status: newStatus,
        pod_status: newStatus === 'Delivered' ? 'Uploaded' : mockRecords[idx].pod_status,
        updated_at: new Date()
      };

      // Status history change auto-trigger
      const newHistId = mockHistory.length > 0 ? Math.max(...mockHistory.map(h => h.id)) + 1 : 1;
      mockHistory.push({
        id: newHistId,
        delivery_id: id,
        status: newStatus,
        remarks: `Transit status updated to ${newStatus}.`,
        timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 6. DELETE FROM deliveries WHERE id = ?
  if (cleanSql.includes('delete from deliveries where id =')) {
    const id = Number(params[0]);
    const idx = mockRecords.findIndex(r => r.id === id);
    if (idx !== -1) {
      mockRecords.splice(idx, 1);
      // Clean history cascade
      mockHistory = mockHistory.filter(h => h.delivery_id !== id);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 7. SELECT * FROM delivery_history WHERE delivery_id = ? ORDER BY timestamp ASC
  if (cleanSql.includes('select * from delivery_history')) {
    const deliveryId = Number(params[0]);
    const history = mockHistory.filter(h => h.delivery_id === deliveryId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return [history];
  }

  throw new Error(`Unsupported SQL query in Mock adapter: ${sql}`);
}

// In-Memory compliance database arrays
let mockPermits = [
  { id: 1, vehicle_number: 'MH-12-GQ-5524', permit_type: 'National Permit', permit_number: 'PERMIT-NP-5524A', issue_date: '2025-07-01', expiry_date: '2026-07-30', status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 2, vehicle_number: 'DL-01-AL-9872', permit_type: 'State Permit', permit_number: 'PERMIT-SP-9872B', issue_date: '2025-06-25', expiry_date: '2026-06-30', status: 'Expiring Soon', created_at: new Date(), updated_at: new Date() },
  { id: 3, vehicle_number: 'KA-03-MP-4122', permit_type: 'Goods Permit', permit_number: 'PERMIT-GP-4122C', issue_date: '2025-06-01', expiry_date: '2026-06-10', status: 'Expired', created_at: new Date(), updated_at: new Date() },
  { id: 4, vehicle_number: 'MH-02-FB-8811', permit_type: 'Special Permit', permit_number: 'PERMIT-XP-8811D', issue_date: '2026-01-10', expiry_date: '2027-01-10', status: 'Valid', created_at: new Date(), updated_at: new Date() }
];

let mockInsurance = [
  { id: 1, vehicle_number: 'MH-12-GQ-5524', insurance_provider: 'HDFC Ergo General Insurance', policy_number: 'INS-POL-5524A', coverage_amount: 1500000.00, start_date: '2025-08-01', expiry_date: '2026-08-01', premium_amount: 25000.00, status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 2, vehicle_number: 'DL-01-AL-9872', insurance_provider: 'ICICI Lombard GIC', policy_number: 'INS-POL-9872B', coverage_amount: 1200000.00, start_date: '2025-07-15', expiry_date: '2026-07-15', premium_amount: 22000.00, status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 3, vehicle_number: 'KA-03-MP-4122', insurance_provider: 'Tata AIG General Insurance', policy_number: 'INS-POL-4122C', coverage_amount: 1800000.00, start_date: '2025-06-10', expiry_date: '2026-06-15', premium_amount: 30000.00, status: 'Expired', created_at: new Date(), updated_at: new Date() },
  { id: 4, vehicle_number: 'MH-02-FB-8811', insurance_provider: 'New India Assurance', policy_number: 'INS-POL-8811D', coverage_amount: 2000000.00, start_date: '2026-02-01', expiry_date: '2027-02-01', premium_amount: 35000.00, status: 'Valid', created_at: new Date(), updated_at: new Date() }
];

let mockFitness = [
  { id: 1, vehicle_number: 'MH-12-GQ-5524', certificate_number: 'FIT-CERT-5524A', issue_date: '2025-06-20', expiry_date: '2026-06-24', inspection_center: 'Pimpri Central RTO Center', status: 'Expiring Soon', created_at: new Date(), updated_at: new Date() },
  { id: 2, vehicle_number: 'DL-01-AL-9872', certificate_number: 'FIT-CERT-9872B', issue_date: '2025-10-10', expiry_date: '2026-10-10', inspection_center: 'Delhi Central RTO Depot', status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 3, vehicle_number: 'KA-03-MP-4122', certificate_number: 'FIT-CERT-4122C', issue_date: '2025-08-15', expiry_date: '2026-08-15', inspection_center: 'Bengaluru East RTO', status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 4, vehicle_number: 'MH-02-FB-8811', certificate_number: 'FIT-CERT-8811D', issue_date: '2025-12-05', expiry_date: '2026-12-05', inspection_center: 'Mumbai South RTO Depot', status: 'Valid', created_at: new Date(), updated_at: new Date() }
];

let mockPollution = [
  { id: 1, vehicle_number: 'MH-12-GQ-5524', certificate_number: 'PUC-CERT-5524A', issue_date: '2026-01-10', expiry_date: '2026-07-10', issuing_authority: 'Green Emission Testing Hub', status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 2, vehicle_number: 'DL-01-AL-9872', certificate_number: 'PUC-CERT-9872B', issue_date: '2026-02-15', expiry_date: '2026-08-15', issuing_authority: 'Delhi Clean Air Station', status: 'Valid', created_at: new Date(), updated_at: new Date() },
  { id: 3, vehicle_number: 'KA-03-MP-4122', certificate_number: 'PUC-CERT-4122C', issue_date: '2025-12-08', expiry_date: '2026-06-08', issuing_authority: 'Eco-check Station Blr', status: 'Expired', created_at: new Date(), updated_at: new Date() },
  { id: 4, vehicle_number: 'MH-02-FB-8811', certificate_number: 'PUC-CERT-8811D', issue_date: '2026-05-01', expiry_date: '2026-11-01', issuing_authority: 'Metro Emission Test Point', status: 'Valid', created_at: new Date(), updated_at: new Date() }
];

let mockAlerts = [
  { id: 1, document_type: 'Permit', permit_id: 2, insurance_id: null, fitness_id: null, pollution_id: null, vehicle_number: 'DL-01-AL-9872', alert_date: '2026-06-18', days_remaining: 12, priority: 'Medium', email_status: 'Pending', whatsapp_status: 'Pending', created_at: new Date() },
  { id: 2, document_type: 'Permit', permit_id: 3, insurance_id: null, fitness_id: null, pollution_id: null, vehicle_number: 'KA-03-MP-4122', alert_date: '2026-06-10', days_remaining: -8, priority: 'High', email_status: 'Sent', whatsapp_status: 'Sent', created_at: new Date() },
  { id: 3, document_type: 'Insurance', permit_id: null, insurance_id: 3, fitness_id: null, pollution_id: null, vehicle_number: 'KA-03-MP-4122', alert_date: '2026-06-15', days_remaining: -3, priority: 'High', email_status: 'Sent', whatsapp_status: 'Sent', created_at: new Date() },
  { id: 4, document_type: 'Fitness', permit_id: null, insurance_id: null, fitness_id: 1, pollution_id: null, vehicle_number: 'MH-12-GQ-5524', alert_date: '2026-06-18', days_remaining: 6, priority: 'High', email_status: 'Pending', whatsapp_status: 'Pending', created_at: new Date() },
  { id: 5, document_type: 'Pollution', permit_id: null, insurance_id: null, fitness_id: null, pollution_id: 3, vehicle_number: 'KA-03-MP-4122', alert_date: '2026-06-08', days_remaining: -10, priority: 'High', email_status: 'Sent', whatsapp_status: 'Sent', created_at: new Date() }
];

let mockReports = [
  { id: 1, report_type: 'Permit Expiry Report', generated_by: 'Operations Manager', filters_applied: '{"vehicle_number": "", "date_range": "2026-06-01 to 2026-07-31"}', record_count: 3, created_at: new Date('2026-06-18T10:00:00') },
  { id: 2, report_type: 'Overall Compliance Summary', generated_by: 'System Scheduler', filters_applied: '{"status": "Expired"}', record_count: 3, created_at: new Date('2026-06-18T12:00:00') }
];

let mockSettings = {
  company_name: 'HK Shipping Private Limited',
  company_logo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%230284c7"/><path d="M30 35 L70 35 L70 65 L30 65 Z" fill="white"/><path d="M50 20 L80 35 L20 35 Z" fill="%230f172a"/></svg>',
  gstin: '27AAAAA1111A1Z1',
  gst_registered_address: '123 Logistics Park, Sector 4, Vashi, Navi Mumbai, MH, 400703',
  smtp_server: 'smtp.hkshipping.com',
  smtp_port: 587,
  smtp_sender: 'notifications@hkshipping.com',
  smtp_username: 'smtp_user_prod',
  smtp_password: 'super_secret_smtp_password',
  whatsapp_api_endpoint: 'https://api.whatsapp.com/v1/messages',
  whatsapp_auth_token: 'wh_token_hk_2026',
  whatsapp_sender_number: '+919876543210',
  notif_sound: true,
  notif_email: false,
  auto_refresh: true,
  default_landing_view: 'dashboard',
  records_per_page: 10
};

let mockUsers = [
  { id: 1, name: 'Sarah Connor', email: 'admin@hkshipping.com', password: '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', role: 'Super Admin', status: 'Active' },
  { id: 2, name: 'Alex Mercer', email: 'transport@hkshipping.com', password: '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', role: 'Transport Admin', status: 'Active' },
  { id: 3, name: 'Marcus Wright', email: 'fleet@hkshipping.com', password: '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', role: 'Fleet Manager', status: 'Active' },
  { id: 4, name: 'Kyle Reese', email: 'compliance@hkshipping.com', password: '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', role: 'Compliance Manager', status: 'Active' },
  { id: 5, name: 'John Connor', email: 'accounts@hkshipping.com', password: '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', role: 'Accounts Staff', status: 'Active' }
];

module.exports = {
  pool,
  query,
  isInMemory: () => useInMemoryFallback,
  getMockRecords: () => mockRecords,
  setMockRecords: (records) => { mockRecords = records; },
  getMockHistory: () => mockHistory,
  setMockHistory: (history) => { mockHistory = history; },
  
  // Getters & Setters for Compliance Tables
  getMockPermits: () => mockPermits,
  setMockPermits: (val) => { mockPermits = val; },
  getMockInsurance: () => mockInsurance,
  setMockInsurance: (val) => { mockInsurance = val; },
  getMockFitness: () => mockFitness,
  setMockFitness: (val) => { mockFitness = val; },
  getMockPollution: () => mockPollution,
  setMockPollution: (val) => { mockPollution = val; },
  getMockAlerts: () => mockAlerts,
  setMockAlerts: (val) => { mockAlerts = val; },
  getMockReports: () => mockReports,
  setMockReports: (val) => { mockReports = val; },
  getMockSettings: () => mockSettings,
  setMockSettings: (val) => { mockSettings = val; },
  getMockUsers: () => mockUsers,
  setMockUsers: (val) => { mockUsers = val; }
};
