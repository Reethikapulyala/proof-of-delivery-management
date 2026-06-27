const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, authenticateToken, requireRole } = require('./authMiddleware');

// POST /api/users/login - Authenticate User & Return JWT token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
  }

  try {
    let user;
    if (db.isInMemory()) {
      user = db.getMockUsers().find(u => u.email === email);
    } else {
      const [rows] = await db.pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        user = rows[0];
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Auth Failed', message: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'Disabled') {
      return res.status(403).json({ error: 'Access Blocked', message: 'This account has been disabled.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Auth Failed', message: 'Invalid email or password.' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// GET /api/users - Get List of Users (Restricted to Super Admin)
router.get('/', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  try {
    if (db.isInMemory()) {
      // Map to omit password hashes
      const users = db.getMockUsers().map(({ password, ...rest }) => rest);
      return res.json(users);
    }

    const [rows] = await db.pool.query('SELECT id, name, email, role, status, created_at, updated_at FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// POST /api/users - Create User (Restricted to Super Admin)
router.post('/', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { name, email, password, role, status } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Validation Error', message: 'Name, email, password, and role are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role;
    const userStatus = status || 'Active';

    if (db.isInMemory()) {
      const mockUsers = db.getMockUsers();
      if (mockUsers.some(u => u.email === email)) {
        return res.status(400).json({ error: 'Email Taken', message: 'A user with this email already exists.' });
      }

      const newUser = {
        id: mockUsers.length ? Math.max(...mockUsers.map(u => u.id)) + 1 : 1,
        name,
        email,
        password: hashedPassword,
        role: userRole,
        status: userStatus
      };

      db.setMockUsers([...mockUsers, newUser]);
      const { password: _, ...userWithoutPassword } = newUser;
      return res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
    }

    // Check existing in DB
    const [existing] = await db.pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email Taken', message: 'A user with this email already exists.' });
    }

    const [result] = await db.pool.query(
      'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, userRole, userStatus]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: { id: result.insertId, name, email, role: userRole, status: userStatus }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// PUT /api/users/:id - Edit / Disable / Reset Password (Restricted to Super Admin)
router.put('/:id', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    if (db.isInMemory()) {
      const mockUsers = db.getMockUsers();
      const userIdx = mockUsers.findIndex(u => u.id === parseInt(id));
      if (userIdx === -1) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      }

      const originalUser = mockUsers[userIdx];
      const updatedUser = {
        ...originalUser,
        name: name || originalUser.name,
        email: email || originalUser.email,
        role: role || originalUser.role,
        status: status || originalUser.status,
        password: hashedPassword || originalUser.password
      };

      // Check email uniqueness if email updated
      if (email && email !== originalUser.email && mockUsers.some(u => u.email === email)) {
        return res.status(400).json({ error: 'Email Taken', message: 'This email is already in use by another user.' });
      }

      mockUsers[userIdx] = updatedUser;
      db.setMockUsers(mockUsers);
      const { password: _, ...userWithoutPassword } = updatedUser;
      return res.json({ message: 'User updated successfully', user: userWithoutPassword });
    }

    // Check unique email in DB
    if (email) {
      const [emailCheck] = await db.pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ error: 'Email Taken', message: 'This email is already in use by another user.' });
      }
    }

    // Construct dynamic update fields
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (hashedPassword) { updates.push('password = ?'); params.push(hashedPassword); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'No fields to update provided.' });
    }

    params.push(id);
    const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await db.pool.query(queryStr, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User record not found.' });
    }

    res.json({ message: 'User updated successfully' });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DELETE /api/users/:id - Delete User (Restricted to Super Admin)
router.delete('/:id', authenticateToken, requireRole(['Super Admin']), async (req, res) => {
  const { id } = req.params;

  try {
    if (db.isInMemory()) {
      const mockUsers = db.getMockUsers();
      const filtered = mockUsers.filter(u => u.id !== parseInt(id));
      if (filtered.length === mockUsers.length) {
        return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
      }
      db.setMockUsers(filtered);
      return res.json({ message: 'User deleted successfully' });
    }

    const [result] = await db.pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User record not found.' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
