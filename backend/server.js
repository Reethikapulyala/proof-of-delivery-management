const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Parse incoming request bodies with a larger limit to handle base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const path = require('path');

// Serve uploaded photo files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register routes
const podRoutes = require('./routes/podRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const permitRoutes = require('./routes/permitRoutes');
const insuranceRoutes = require('./routes/insuranceRoutes');
const fitnessRoutes = require('./routes/fitnessRoutes');
const pollutionRoutes = require('./routes/pollutionRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/pod', podRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/pollution', pollutionRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'HK Shipping POD Management API' });
});

// Default root route
app.get('/', (req, res) => {
  res.send('HK Shipping POD API Server is running.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
