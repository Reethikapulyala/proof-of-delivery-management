-- Database Schema for HK Shipping Delivery & Compliance Tracking System
CREATE DATABASE IF NOT EXISTS hk_shipping_pod;
USE hk_shipping_pod;

-- Drop tables in correct order of dependency
DROP TABLE IF EXISTS compliance_alerts;
DROP TABLE IF EXISTS compliance_reports;
DROP TABLE IF EXISTS permits;
DROP TABLE IF EXISTS insurance_records;
DROP TABLE IF EXISTS fitness_certificates;
DROP TABLE IF EXISTS pollution_certificates;
DROP TABLE IF EXISTS delivery_history;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS users;

-- ====================================================================
-- 1. Users, Roles, and Access Control (RBAC) Tables
-- ====================================================================

-- Table: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('Super Admin', 'Transport Admin', 'Fleet Manager', 'Dispatcher', 'Driver', 'Accounts Staff', 'Compliance Manager') NOT NULL,
  status ENUM('Active', 'Disabled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: roles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: permissions
CREATE TABLE permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_permissions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_roles (Many-to-Many Relationship)
CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user_roles_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: role_permissions (Many-to-Many Relationship)
CREATE TABLE role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  INDEX idx_role_permissions_perm (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 2. Audit Trail, Notifications, and System Settings Tables
-- ====================================================================

-- Table: notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'danger') DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: activity_logs (System Audit Trail)
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  module VARCHAR(100) NOT NULL,
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_logs_user (user_id),
  INDEX idx_activity_logs_module (module),
  INDEX idx_activity_logs_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reports (Saved/Compiled Reports)
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  generated_by INT NULL,
  filters_applied TEXT NULL,
  record_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_type (report_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: settings (Company Configurations Alias)
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL DEFAULT 'HK Shipping Private Limited',
  company_logo LONGTEXT NULL,
  gstin VARCHAR(15) NULL,
  gst_registered_address TEXT NULL,
  smtp_server VARCHAR(255) NULL,
  smtp_port INT NULL,
  smtp_sender VARCHAR(255) NULL,
  smtp_username VARCHAR(255) NULL,
  smtp_password VARCHAR(255) NULL,
  whatsapp_api_endpoint VARCHAR(255) NULL,
  whatsapp_auth_token VARCHAR(255) NULL,
  whatsapp_sender_number VARCHAR(20) NULL,
  notif_sound BOOLEAN NOT NULL DEFAULT TRUE,
  notif_email BOOLEAN NOT NULL DEFAULT FALSE,
  auto_refresh BOOLEAN NOT NULL DEFAULT TRUE,
  default_landing_view VARCHAR(50) NOT NULL DEFAULT 'dashboard',
  records_per_page INT NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keep fallback alias to support existing system_settings routes code
CREATE TABLE system_settings LIKE settings;

-- ====================================================================
-- 3. Core Logistics & Compliance Tables (HK Shipping Pod System)
-- ====================================================================

-- Table: deliveries
CREATE TABLE deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consignment_no VARCHAR(100) NOT NULL UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  delivery_location VARCHAR(255) NOT NULL,
  driver_name VARCHAR(100) NULL,
  vehicle_number VARCHAR(50) NULL,
  shipment_date DATETIME NULL,
  delivery_date DATETIME NULL,
  status ENUM('Pending', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed') DEFAULT 'Pending',
  remarks TEXT NULL,
  
  -- Proof of Delivery (POD) fields
  receiver_name VARCHAR(100) NULL,
  signature_image LONGTEXT NULL,
  delivery_photo VARCHAR(255) NULL,
  pod_status ENUM('Uploaded', 'Pending') DEFAULT 'Pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_deliveries_vehicle (vehicle_number),
  INDEX idx_deliveries_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: delivery_history
CREATE TABLE delivery_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT NOT NULL,
  status ENUM('Pending', 'In Transit', 'Out For Delivery', 'Delivered', 'Failed') NOT NULL,
  remarks TEXT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_history_delivery FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
  INDEX idx_delivery_history_delivery (delivery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: permits
CREATE TABLE permits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) NOT NULL,
  permit_type ENUM('National Permit', 'State Permit', 'Goods Permit', 'Special Permit') NOT NULL,
  permit_number VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('Valid', 'Expiring Soon', 'Expired') DEFAULT 'Valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_permits_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: insurance_records
CREATE TABLE insurance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) NOT NULL,
  insurance_provider VARCHAR(150) NOT NULL,
  policy_number VARCHAR(100) NOT NULL UNIQUE,
  coverage_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  premium_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('Valid', 'Expiring Soon', 'Expired') DEFAULT 'Valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_insurance_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: fitness_certificates
CREATE TABLE fitness_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) NOT NULL,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  inspection_center VARCHAR(150) NOT NULL,
  status ENUM('Valid', 'Expiring Soon', 'Expired') DEFAULT 'Valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fitness_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: pollution_certificates
CREATE TABLE pollution_certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_number VARCHAR(50) NOT NULL,
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  issuing_authority VARCHAR(150) NOT NULL,
  status ENUM('Valid', 'Expiring Soon', 'Expired') DEFAULT 'Valid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pollution_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: compliance_alerts
CREATE TABLE compliance_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_type ENUM('Permit', 'Insurance', 'Fitness', 'Pollution') NOT NULL,
  permit_id INT NULL,
  insurance_id INT NULL,
  fitness_id INT NULL,
  pollution_id INT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  alert_date DATE NOT NULL,
  days_remaining INT NOT NULL,
  priority ENUM('High', 'Medium', 'Low') NOT NULL,
  email_status ENUM('Sent', 'Failed', 'Pending') DEFAULT 'Pending',
  whatsapp_status ENUM('Sent', 'Failed', 'Pending') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_alerts_permit FOREIGN KEY (permit_id) REFERENCES permits(id) ON DELETE CASCADE,
  CONSTRAINT fk_alerts_insurance FOREIGN KEY (insurance_id) REFERENCES insurance_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_alerts_fitness FOREIGN KEY (fitness_id) REFERENCES fitness_certificates(id) ON DELETE CASCADE,
  CONSTRAINT fk_alerts_pollution FOREIGN KEY (pollution_id) REFERENCES pollution_certificates(id) ON DELETE CASCADE,

  INDEX idx_alerts_vehicle (vehicle_number),
  INDEX idx_alerts_document (document_type, permit_id, insurance_id, fitness_id, pollution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: compliance_reports
CREATE TABLE compliance_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(100) NOT NULL,
  generated_by VARCHAR(100) NOT NULL,
  filters_applied TEXT NULL,
  record_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
