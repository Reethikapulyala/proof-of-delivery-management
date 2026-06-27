import axios from 'axios';

// Unified API base URL targeting the Express backend
const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token from localStorage dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hk_shipping_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 1. Proof of Delivery (POD) & Deliveries API
// ==========================================

export async function fetchDeliveries(params = {}) {
  try {
    const response = await api.get('/deliveries', { params });
    // Keep backwards compatibility for POD list endpoint if called directly
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch deliveries.');
  }
}

export async function fetchDeliveriesLegacy() {
  try {
    const response = await api.get('/pod/list');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch legacy deliveries.');
  }
}

export async function fetchDeliveryById(id) {
  try {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch delivery details.');
  }
}

export async function createDelivery(deliveryData) {
  try {
    const response = await api.post('/pod/create', deliveryData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to submit POD.');
  }
}

export async function updateDeliveryStatus(id, status) {
  try {
    const response = await api.put(`/deliveries/status/${id}`, { status });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update delivery status.');
  }
}

export async function deleteDelivery(id) {
  try {
    const response = await api.delete(`/deliveries/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete delivery record.');
  }
}

// ==========================================
// 2. Permits API
// ==========================================

export async function fetchPermits(params = {}) {
  try {
    const response = await api.get('/permits', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch permits.');
  }
}

export async function createPermit(data) {
  try {
    const response = await api.post('/permits', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create permit.');
  }
}

export async function updatePermit(id, data) {
  try {
    const response = await api.put(`/permits/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update permit.');
  }
}

export async function renewPermit(id) {
  try {
    const response = await api.put(`/permits/renew/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to renew permit.');
  }
}

export async function deletePermit(id) {
  try {
    const response = await api.delete(`/permits/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete permit.');
  }
}

// ==========================================
// 3. Insurance API
// ==========================================

export async function fetchInsurance(params = {}) {
  try {
    const response = await api.get('/insurance', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch insurance records.');
  }
}

export async function createInsurance(data) {
  try {
    const response = await api.post('/insurance', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add insurance record.');
  }
}

export async function updateInsurance(id, data) {
  try {
    const response = await api.put(`/insurance/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update insurance record.');
  }
}

export async function renewInsurance(id) {
  try {
    const response = await api.put(`/insurance/renew/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to renew insurance.');
  }
}

export async function deleteInsurance(id) {
  try {
    const response = await api.delete(`/insurance/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete insurance record.');
  }
}

// ==========================================
// 4. Fitness Certificates API
// ==========================================

export async function fetchFitness(params = {}) {
  try {
    const response = await api.get('/fitness', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch fitness certificates.');
  }
}

export async function createFitness(data) {
  try {
    const response = await api.post('/fitness', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add fitness certificate.');
  }
}

export async function updateFitness(id, data) {
  try {
    const response = await api.put(`/fitness/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update fitness certificate.');
  }
}

export async function renewFitness(id) {
  try {
    const response = await api.put(`/fitness/renew/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to renew fitness certificate.');
  }
}

export async function deleteFitness(id) {
  try {
    const response = await api.delete(`/fitness/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete fitness certificate.');
  }
}

// ==========================================
// 5. Pollution Certificates API (PUC)
// ==========================================

export async function fetchPollution(params = {}) {
  try {
    const response = await api.get('/pollution', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch pollution certificates.');
  }
}

export async function createPollution(data) {
  try {
    const response = await api.post('/pollution', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add pollution certificate.');
  }
}

export async function updatePollution(id, data) {
  try {
    const response = await api.put(`/pollution/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update pollution certificate.');
  }
}

export async function renewPollution(id) {
  try {
    const response = await api.put(`/pollution/renew/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to renew pollution certificate.');
  }
}

export async function deletePollution(id) {
  try {
    const response = await api.delete(`/pollution/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete pollution certificate.');
  }
}

// ==========================================
// 6. Compliance Dashboard, Alerts, & Reports API
// ==========================================

export async function fetchComplianceDashboard() {
  try {
    const response = await api.get('/compliance/dashboard');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch compliance dashboard data.');
  }
}

export async function fetchComplianceAlerts(params = {}) {
  try {
    const response = await api.get('/compliance/alerts', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch compliance alerts.');
  }
}

export async function fetchActivityLogs(params = {}) {
  try {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch activity logs.');
  }
}

export async function fetchComplianceReports() {
  try {
    const response = await api.get('/compliance/reports');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch compliance reports log.');
  }
}

export async function createComplianceReport(data) {
  try {
    const response = await api.post('/compliance/reports', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to save compliance report record.');
  }
}

// ==========================================
// 7. System Settings API
// ==========================================

export async function fetchSettings() {
  try {
    const response = await api.get('/settings');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch system configurations.');
  }
}

export async function updateSettings(settingsData) {
  try {
    const response = await api.put('/settings', settingsData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to save system configurations.');
  }
}

export async function loginUser(email, password) {
  try {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Authentication failed. Please verify credentials.');
  }
}

export default api;
