const jwt = require('jsonwebtoken');

// Secret Key for JWT Signing
const JWT_SECRET = process.env.JWT_SECRET || 'hk_shipping_jwt_secret_key_2026';

// Middleware to authenticate JWT token from Authorization Header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Supporting both "Bearer <token>" and "<token>" formats
  const token = authHeader && (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader);
  
  if (!token) {
    return res.status(401).json({ error: 'Access Denied', message: 'Authentication token is required.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid Token', message: 'Your session has expired or is invalid.' });
  }
}

// Middleware to check RBAC roles
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Access Denied', message: 'Authentication required.' });
    }
    
    // Super Admin has absolute access
    if (req.user.role === 'Super Admin') {
      return next();
    }
    
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }
    
    res.status(403).json({ 
      error: 'Access Denied', 
      message: `Statutory clearance failure. Role '${req.user.role}' is not authorized for this action.` 
    });
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET
};
