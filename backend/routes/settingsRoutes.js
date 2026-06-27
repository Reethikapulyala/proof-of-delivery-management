const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/settings - Fetch system configurations
router.get('/', async (req, res) => {
  try {
    if (db.isInMemory()) {
      return res.json(db.getMockSettings());
    }
    
    const [rows] = await db.pool.query('SELECT * FROM system_settings ORDER BY id DESC LIMIT 1');
    if (rows.length === 0) {
      // Return defaults if none configured in DB
      return res.json({
        company_name: 'HK Shipping Private Limited',
        company_logo: '',
        gstin: '',
        gst_registered_address: '',
        smtp_server: '',
        smtp_port: 587,
        smtp_sender: '',
        smtp_username: '',
        smtp_password: '',
        whatsapp_api_endpoint: '',
        whatsapp_auth_token: '',
        whatsapp_sender_number: '',
        notif_sound: true,
        notif_email: false,
        auto_refresh: true,
        default_landing_view: 'dashboard',
        records_per_page: 10
      });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Failed to get system settings:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// PUT /api/settings - Update system configurations
router.put('/', async (req, res) => {
  const settings = req.body;
  try {
    if (db.isInMemory()) {
      db.setMockSettings(settings);
      return res.json({ message: 'Settings updated in-memory successfully', settings });
    }
    
    // Check if a settings row already exists
    const [rows] = await db.pool.query('SELECT id FROM system_settings LIMIT 1');
    if (rows.length === 0) {
      // Insert new
      await db.pool.query(
        `INSERT INTO system_settings (
          company_name, company_logo, gstin, gst_registered_address,
          smtp_server, smtp_port, smtp_sender, smtp_username, smtp_password,
          whatsapp_api_endpoint, whatsapp_auth_token, whatsapp_sender_number,
          notif_sound, notif_email, auto_refresh, default_landing_view, records_per_page
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.company_name, settings.company_logo, settings.gstin, settings.gst_registered_address,
          settings.smtp_server, settings.smtp_port, settings.smtp_sender, settings.smtp_username, settings.smtp_password,
          settings.whatsapp_api_endpoint, settings.whatsapp_auth_token, settings.whatsapp_sender_number,
          settings.notif_sound ? 1 : 0, settings.notif_email ? 1 : 0, settings.auto_refresh ? 1 : 0,
          settings.default_landing_view, settings.records_per_page
        ]
      );
    } else {
      // Update existing
      const settingsId = rows[0].id;
      await db.pool.query(
        `UPDATE system_settings SET
          company_name = ?, company_logo = ?, gstin = ?, gst_registered_address = ?,
          smtp_server = ?, smtp_port = ?, smtp_sender = ?, smtp_username = ?, smtp_password = ?,
          whatsapp_api_endpoint = ?, whatsapp_auth_token = ?, whatsapp_sender_number = ?,
          notif_sound = ?, notif_email = ?, auto_refresh = ?, default_landing_view = ?, records_per_page = ?
        WHERE id = ?`,
        [
          settings.company_name, settings.company_logo, settings.gstin, settings.gst_registered_address,
          settings.smtp_server, settings.smtp_port, settings.smtp_sender, settings.smtp_username, settings.smtp_password,
          settings.whatsapp_api_endpoint, settings.whatsapp_auth_token, settings.whatsapp_sender_number,
          settings.notif_sound ? 1 : 0, settings.notif_email ? 1 : 0, settings.auto_refresh ? 1 : 0,
          settings.default_landing_view, settings.records_per_page, settingsId
        ]
      );
    }
    
    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Failed to save system settings:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
