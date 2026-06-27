-- Seed Data for HK Shipping Delivery & Compliance Tracking System
USE hk_shipping_pod;

-- Clear tables in correct order of dependency
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE compliance_alerts;
TRUNCATE TABLE compliance_reports;
TRUNCATE TABLE permits;
TRUNCATE TABLE insurance_records;
TRUNCATE TABLE fitness_certificates;
TRUNCATE TABLE pollution_certificates;
TRUNCATE TABLE delivery_history;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE system_settings;
TRUNCATE TABLE settings;
TRUNCATE TABLE role_permissions;
TRUNCATE TABLE user_roles;
TRUNCATE TABLE permissions;
TRUNCATE TABLE roles;
TRUNCATE TABLE notifications;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE reports;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Base64 sample SVG signature to avoid broken links
SET @MOCK_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="250" height="100" viewBox="0 0 250 100"><path d="M20,50 Q40,20 60,60 T100,40 T140,70 T180,30 T220,60" fill="none" stroke="%230284c7" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="75" x2="225" y2="70" stroke="%230284c7" stroke-width="2" stroke-dasharray="5 5"/></svg>';

-- ====================================================================
-- 1. Seed Core Logistics & POD tables
-- ====================================================================

-- Insert Deliveries with POD columns
INSERT INTO deliveries 
  (id, consignment_no, customer_name, pickup_location, delivery_location, driver_name, vehicle_number, shipment_date, delivery_date, status, remarks, receiver_name, signature_image, delivery_photo, pod_status)
VALUES
  (
    1,
    'HKS-802495',
    'Nova Pharma Inc',
    'Warehouse 4, Port Terminal, Seattle, WA',
    '890 Medical Plaza Rd, Building B, Seattle, WA',
    'John Miller',
    'MH-12-GQ-5524',
    '2026-06-17 09:45:00',
    '2026-06-18 09:45:00',
    'Delivered',
    'Hand-delivered directly to pharmacy reception. Cool box temperature verified.',
    'Dr. Karen Vance',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_1.png',
    'Uploaded'
  ),
  (
    2,
    'HKS-392817',
    'Apex Industrial Supply',
    'Factory Depot, Detroit, MI',
    '4110 Factory Blvd, Terminal 4, Detroit, MI',
    'Robert Chen',
    'DL-01-AL-9872',
    '2026-06-17 10:15:00',
    '2026-06-18 10:15:00',
    'Delivered',
    'Left at warehouse bay 3. Package inspected and approved by supervisor.',
    'Marcus Thorne',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_2.png',
    'Uploaded'
  ),
  (
    3,
    'HKS-601932',
    'HoloTech Systems',
    'Logistics Center Terminal, Cambridge, MA',
    '12 Science Center Dr, Cambridge, MA',
    'David Miller',
    'KA-03-MP-4122',
    '2026-06-17 11:20:00',
    '2026-06-18 11:20:00',
    'Delivered',
    'Consignment delivered in good condition. Handover done.',
    'Admin Desk Receptionist',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_3.png',
    'Uploaded'
  ),
  (
    4,
    'HKS-491275',
    'Global Retail Co',
    'Fulfillment Facility, San Francisco, CA',
    '555 Market St, Floor 2, San Francisco, CA',
    'Sarah Jenkins',
    'MH-02-FB-8811',
    '2026-06-16 14:30:00',
    '2026-06-17 14:30:00',
    'Delivered',
    'Left at main security counter as requested. Signature recorded from guard.',
    'Lobby Dropoff Desk',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_4.png',
    'Uploaded'
  ),
  (
    5,
    'HKS-109283',
    'TechParts Corporation',
    'Electronics Depot, Austin, TX',
    'Suite 404, Tech Park, Austin, TX',
    'Robert Chen',
    'DL-01-AL-9872',
    '2026-06-17 12:00:00',
    '2026-06-18 12:00:00',
    'Delivered',
    'Delivered to warehouse operations lead.',
    'T. Wayne',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_1.png',
    'Uploaded'
  ),
  (
    6,
    'HKS-223409',
    'Summit Heavy Machinery',
    'Manufacturing Unit, Chicago, IL',
    '59 Industrial Ring Road, Chicago, IL',
    'David Miller',
    'KA-03-MP-4122',
    '2026-06-18 08:30:00',
    '2026-06-18 11:15:00',
    'Delivered',
    'Consignment offloaded at Bay A. POD recorded.',
    'A. Fletcher',
    @MOCK_SIGNATURE,
    'uploads/sample_photo_2.png',
    'Uploaded'
  );

-- Insert Delivery history details
INSERT INTO delivery_history (delivery_id, status, remarks) VALUES
  (1, 'Pending', 'Shipment booked at Seattle Hub.'),
  (1, 'In Transit', 'Dispatched vehicle MH-12-GQ-5524 from Seattle warehouse.'),
  (1, 'Out For Delivery', 'Consignment reached Portland depot, out for local drop.'),
  (1, 'Delivered', 'Hand-delivered to Dr. Karen Vance at pharmacy reception.'),
  (2, 'Pending', 'Shipment booked at Detroit Hub.'),
  (2, 'In Transit', 'Dispatched vehicle DL-01-AL-9872, driver Robert Chen.'),
  (2, 'Delivered', 'Left at warehouse bay 3. Approved by Marcus Thorne.'),
  (3, 'Pending', 'Shipment booked at Boston Hub.'),
  (3, 'Delivered', 'Delivered in good condition. Handover done.'),
  (4, 'Pending', 'Shipment booked at San Francisco Hub.'),
  (4, 'Delivered', 'Left at main security counter. Signature recorded.'),
  (5, 'Pending', 'Shipment booked at Austin Hub.'),
  (5, 'Delivered', 'Delivered to warehouse operations lead.'),
  (6, 'Pending', 'Shipment booked at Chicago Hub.'),
  (6, 'Delivered', 'Consignment offloaded at Bay A.');

-- ====================================================================
-- 2. Seed Compliance Tracking tables
-- ====================================================================

-- Insert Permits
INSERT INTO permits 
  (id, vehicle_number, permit_type, permit_number, issue_date, expiry_date, status)
VALUES
  (1, 'MH-12-GQ-5524', 'National Permit', 'NP-MH-12-88294B', '2025-06-15', '2026-06-25', 'Expiring Soon'),
  (2, 'DL-01-AL-9872', 'Goods Permit', 'GP-DL-01-20938A', '2025-07-01', '2026-06-30', 'Expiring Soon'),
  (3, 'KA-03-MP-4122', 'State Permit', 'SP-KA-03-99210C', '2025-06-10', '2026-06-10', 'Expired'),
  (4, 'MH-02-FB-8811', 'Goods Permit', 'GP-MH-02-77189D', '2026-01-15', '2027-01-15', 'Valid');

-- Insert Insurance Records
INSERT INTO insurance_records 
  (id, vehicle_number, insurance_provider, policy_number, coverage_amount, start_date, expiry_date, premium_amount, status)
VALUES
  (1, 'MH-12-GQ-5524', 'HDFC Ergo General Insurance', 'INS-POL-5524A', 1500000.00, '2025-08-01', '2026-08-01', 25000.00, 'Valid'),
  (2, 'DL-01-AL-9872', 'ICICI Lombard GIC', 'INS-POL-9872B', 1200000.00, '2025-07-15', '2026-07-15', 22000.00, 'Valid'),
  (3, 'KA-03-MP-4122', 'Tata AIG General Insurance', 'INS-POL-4122C', 1800000.00, '2025-06-10', '2026-06-15', 30000.00, 'Expired'),
  (4, 'MH-02-FB-8811', 'New India Assurance', 'INS-POL-8811D', 2000000.00, '2026-02-01', '2027-02-01', 35000.00, 'Valid');

-- Insert Fitness Certificates
INSERT INTO fitness_certificates 
  (id, vehicle_number, certificate_number, issue_date, expiry_date, inspection_center, status)
VALUES
  (1, 'MH-12-GQ-5524', 'FIT-CERT-5524A', '2025-06-20', '2026-06-24', 'Pimpri Central RTO Center', 'Expiring Soon'),
  (2, 'DL-01-AL-9872', 'FIT-CERT-9872B', '2025-10-10', '2026-10-10', 'Delhi Central RTO Depot', 'Valid'),
  (3, 'KA-03-MP-4122', 'FIT-CERT-4122C', '2025-08-15', '2026-08-15', 'Bengaluru East RTO', 'Valid'),
  (4, 'MH-02-FB-8811', 'FIT-CERT-8811D', '2025-12-05', '2026-12-05', 'Mumbai South RTO Depot', 'Valid');

-- Insert Pollution under control certificates
INSERT INTO pollution_certificates 
  (id, vehicle_number, certificate_number, issue_date, expiry_date, issuing_authority, status)
VALUES
  (1, 'MH-12-GQ-5524', 'PUC-CERT-5524A', '2026-01-10', '2026-07-10', 'Green Emission Testing Hub', 'Valid'),
  (2, 'DL-01-AL-9872', 'PUC-CERT-9872B', '2026-02-15', '2026-08-15', 'Delhi Clean Air Station', 'Valid'),
  (3, 'KA-03-MP-4122', 'PUC-CERT-4122C', '2025-12-08', '2026-06-08', 'Eco-check Station Blr', 'Expired'),
  (4, 'MH-02-FB-8811', 'PUC-CERT-8811D', '2026-05-01', '2026-11-01', 'Metro Emission Test Point', 'Valid');

-- Insert Compliance Alerts
INSERT INTO compliance_alerts 
  (id, document_type, permit_id, insurance_id, fitness_id, pollution_id, vehicle_number, alert_date, days_remaining, priority, email_status, whatsapp_status)
VALUES
  (1, 'Permit', 2, NULL, NULL, NULL, 'DL-01-AL-9872', '2026-06-18', 12, 'Medium', 'Pending', 'Pending'),
  (2, 'Permit', 3, NULL, NULL, NULL, 'KA-03-MP-4122', '2026-06-10', -8, 'High', 'Sent', 'Sent'),
  (3, 'Insurance', NULL, 3, NULL, NULL, 'KA-03-MP-4122', '2026-06-15', -3, 'High', 'Sent', 'Sent'),
  (4, 'Fitness', NULL, NULL, 1, NULL, 'MH-12-GQ-5524', '2026-06-18', 6, 'High', 'Pending', 'Pending'),
  (5, 'Pollution', NULL, NULL, NULL, 3, 'KA-03-MP-4122', '2026-06-08', -10, 'High', 'Sent', 'Sent');

-- Insert Compliance Reports logs
INSERT INTO compliance_reports 
  (id, report_type, generated_by, filters_applied, record_count)
VALUES
  (1, 'Permit Expiry Report', 'Operations Manager', '{"vehicle_number": "", "date_range": "2026-06-01 to 2026-07-31"}', 3),
  (2, 'Overall Compliance Summary', 'System Scheduler', '{"status": "Expired"}', 3);

-- ====================================================================
-- 3. Seed Users, Roles, Permissions, and Settings Tables
-- ====================================================================

-- Insert System Configurations Default Row
INSERT INTO settings 
  (id, company_name, company_logo, gstin, gst_registered_address, smtp_server, smtp_port, smtp_sender, smtp_username, smtp_password, whatsapp_api_endpoint, whatsapp_auth_token, whatsapp_sender_number, notif_sound, notif_email, auto_refresh, default_landing_view, records_per_page)
VALUES
  (1, 'HK Shipping Private Limited', 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%230284c7"/><path d="M30 35 L70 35 L70 65 L30 65 Z" fill="white"/><path d="M50 20 L80 35 L20 35 Z" fill="%230f172a"/></svg>', '27AAAAA1111A1Z1', '123 Logistics Park, Sector 4, Vashi, Navi Mumbai, MH, 400703', 'smtp.hkshipping.com', 587, 'notifications@hkshipping.com', 'smtp_user_prod', 'super_secret_smtp_password', 'https://api.whatsapp.com/v1/messages', 'wh_token_hk_2026', '+919876543210', 1, 0, 1, 'dashboard', 10);

-- Duplicate into alias table
INSERT INTO system_settings SELECT * FROM settings;

-- Insert Seed User Accounts (bcrypt hash for password "admin123" is '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS')
INSERT INTO users 
  (id, name, email, password, role, status)
VALUES
  (1, 'Sarah Connor', 'admin@hkshipping.com', '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', 'Super Admin', 'Active'),
  (2, 'Alex Mercer', 'transport@hkshipping.com', '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', 'Transport Admin', 'Active'),
  (3, 'Marcus Wright', 'fleet@hkshipping.com', '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', 'Fleet Manager', 'Active'),
  (4, 'Kyle Reese', 'compliance@hkshipping.com', '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', 'Compliance Manager', 'Active'),
  (5, 'John Connor', 'accounts@hkshipping.com', '$2b$10$hwHqHLeZXHA7gaYrcjD4r.fIl3aMBPqwWHU1eKhlFJLU3W4ysq/dS', 'Accounts Staff', 'Active');

-- Insert Seed Roles
INSERT INTO roles (id, name, description) VALUES
  (1, 'Super Admin', 'Full unrestricted corporate authorizations'),
  (2, 'Transport Admin', 'Authorized for shipping logs, PODs, and fleet registries'),
  (3, 'Fleet Manager', 'Authorized for fleet vehicles registry and driver directory'),
  (4, 'Compliance Manager', 'Authorized for document permits and warnings tracking'),
  (5, 'Accounts Staff', 'Authorized for invoicing and billing ledgers');

-- Insert Seed Permissions
INSERT INTO permissions (id, name, description) VALUES
  (1, 'manage_users', 'Access to user creation, password reset, and role configurations'),
  (2, 'manage_shipments', 'Access to create, read, update, and delete consignments'),
  (3, 'manage_fleet', 'Access to view and modify fleet vehicle registries'),
  (4, 'manage_drivers', 'Access to driver scheduling directory'),
  (5, 'manage_billing', 'Access to invoice creation and payment settlements'),
  (6, 'manage_compliance', 'Access to compliance permits, insurance, and fitness dashboards');

-- Link users with user_roles
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1), -- Sarah Connor is Super Admin
  (2, 2), -- Alex Mercer is Transport Admin
  (3, 3), -- Marcus Wright is Fleet Manager
  (4, 4), -- Kyle Reese is Compliance Manager
  (5, 5); -- John Connor is Accounts Staff

-- Link roles with permissions (role_permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), -- Super Admin gets all permissions
  (2, 2), (2, 3), -- Transport Admin gets shipments and fleet
  (3, 3), (3, 4), -- Fleet Manager gets fleet and drivers
  (4, 6), -- Compliance Manager gets compliance access
  (5, 5); -- Accounts Staff gets billing access

-- Insert Seed Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES
  (1, 1, 'System Bootstrapper Initialized', 'Connected to HK Shipping database services successfully.', 'info', 0),
  (2, 2, 'Pending POD Upload Alert', 'Consignment HKS-109283 is marked Delivered but requires photo drop-off proof.', 'warning', 0),
  (3, 4, 'Permit Renewal Expiry Warning', 'Vehicle MH-12-GQ-5524 permit expires in 6 days.', 'danger', 0);

-- Insert Seed Activity Logs
INSERT INTO activity_logs (id, user_id, module, action, ip_address) VALUES
  (1, 1, 'Identity Management', 'Super Admin Sarah Connor logged into system console.', '192.168.1.10'),
  (2, 2, 'Proof of Delivery', 'Transport Admin Alex Mercer approved signature upload for consignment HKS-802495.', '192.168.1.12'),
  (3, 5, 'Accounts & Billing', 'Accounts Staff John Connor generated invoice INV-2026-1024.', '192.168.1.22');

-- Insert Seed Reports
INSERT INTO reports (id, report_type, generated_by, filters_applied, record_count) VALUES
  (1, 'Consignments Audit Spreadsheet', 1, '{"status": "Delivered", "date_range": "2026-06-18"}', 6),
  (2, 'Compliance Expiry Summary Logs', 4, '{"status": "Expired"}', 3);
