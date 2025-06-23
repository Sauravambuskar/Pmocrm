const { query } = require('../lib/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (req.method) {
      case 'POST':
        switch (action) {
          case 'login':
            return await handleLogin(req, res);
          case 'register':
            return await handleRegister(req, res);
          case 'logout':
            return await handleLogout(req, res);
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }
      case 'GET':
        switch (action) {
          case 'me':
            return await handleGetCurrentUser(req, res);
          default:
            return res.status(400).json({ error: 'Invalid action' });
        }
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Mock authentication for demo - in production, verify against database
    if (email === 'admin@company.com' && password === 'admin123') {
      const userData = {
        id: 1,
        email: 'admin@company.com',
        first_name: 'System',
        last_name: 'Administrator',
        role: 'super_admin',
        permissions: ['*'],
        avatar: null,
        job_title: 'System Administrator'
      };

      // Generate a simple token (in production, use JWT)
      const token = Buffer.from(JSON.stringify(userData)).toString('base64');

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userData,
        token,
        expires_in: '24h'
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function handleRegister(req, res) {
  const { email, password, first_name, last_name, job_title } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ 
      error: 'Email, password, first name, and last name are required' 
    });
  }

  try {
    // Mock registration - in production, save to database
    const userData = {
      id: Math.floor(Math.random() * 1000) + 2,
      email,
      first_name,
      last_name,
      job_title,
      role: 'employee',
      permissions: ['projects.view', 'tasks.*', 'contacts.view']
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleGetCurrentUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Decode token (in production, verify JWT)
    const userData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function handleLogout(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

async function handleRefreshToken(req, res) {
  // Implementation for refreshing token
  res.status(501).json({ error: 'Refresh token functionality not implemented' });
}

async function handleForgotPassword(req, res) {
  // Implementation for forgot password
  res.status(501).json({ error: 'Forgot password functionality not implemented' });
}

async function handleResetPassword(req, res) {
  // Implementation for reset password
  res.status(501).json({ error: 'Reset password functionality not implemented' });
}

async function handleVerifyEmail(req, res) {
  // Implementation for verify email
  res.status(501).json({ error: 'Verify email functionality not implemented' });
}

    // Get user with role information
    const users = await query(`
      SELECT u.*, r.name as role_name, r.permissions, r.display_name as role_display_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
      WHERE u.email = ? AND u.status = 'active'
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const lockoutMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({ 
        error: `Account locked. Try again in ${lockoutMinutes} minutes` 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Increment login attempts
      const attempts = user.login_attempts + 1;
      const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS ? 
        new Date(Date.now() + LOCKOUT_TIME) : null;

      await query(`
        UPDATE users 
        SET login_attempts = ?, locked_until = ?
        WHERE id = ?
      `, [attempts, lockUntil, user.id]);

      if (lockUntil) {
        return res.status(423).json({ 
          error: 'Account locked due to too many failed attempts' 
        });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await query(`
      UPDATE users 
      SET login_attempts = 0, locked_until = NULL, last_login = NOW()
      WHERE id = ?
    `, [user.id]);

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions ? JSON.parse(user.permissions) : []
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: remember_me ? '30d' : JWT_EXPIRES_IN 
    });

    // Create session record
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    await query(`
      INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      user.id,
      sessionToken,
      req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      req.headers['user-agent'],
      expiresAt
    ]);

    // Log activity
    await logActivity(user.id, 'user_login', 'User logged in', {
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      job_title: user.job_title,
      department_id: user.department_id,
      role: user.role_name,
      role_display_name: user.role_display_name,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      timezone: user.timezone,
      language: user.language,
      preferences: user.preferences ? JSON.parse(user.preferences) : {}
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userData,
      token,
      session_token: sessionToken,
      expires_in: remember_me ? '30d' : JWT_EXPIRES_IN
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

async function handleRegister(req, res) {
  const {
    email, password, first_name, last_name, job_title,
    department_id, phone, timezone = 'UTC', language = 'en'
  } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ 
      error: 'Email, password, first name, and last name are required' 
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }

  try {
    // Check if user already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const email_verification_token = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, job_title,
        department_id, phone, timezone, language, email_verification_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      email, password_hash, first_name, last_name, job_title,
      department_id, phone, timezone, language, email_verification_token
    ]);

    const userId = result.insertId;

    // Assign default employee role
    const employeeRole = await query('SELECT id FROM roles WHERE name = "employee"');
    if (employeeRole.length > 0) {
      await query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [userId, employeeRole[0].id, userId]);
    }

    // Log activity
    await logActivity(userId, 'user_registered', 'User registered', {
      email,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user_id: userId,
      verification_required: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleGetCurrentUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const users = await query(`
      SELECT u.*, d.name as department_name, r.name as role_name, 
             r.display_name as role_display_name, r.permissions
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
      LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
      WHERE u.id = ? AND u.status = 'active'
    `, [decoded.userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    
    // Return user data without sensitive information
    const userData = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar: user.avatar,
      job_title: user.job_title,
      department_id: user.department_id,
      department_name: user.department_name,
      phone: user.phone,
      role: user.role_name,
      role_display_name: user.role_display_name,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      timezone: user.timezone,
      language: user.language,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      last_login: user.last_login,
      created_at: user.created_at
    };

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
}

async function handleLogout(req, res) {
  const { session_token } = req.body;
  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    if (session_token) {
      await query('UPDATE user_sessions SET is_active = FALSE WHERE session_token = ?', [session_token]);
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      await logActivity(decoded.userId, 'user_logout', 'User logged out');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

async function handleForgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const users = await query('SELECT id FROM users WHERE email = ? AND status = "active"', [email]);
    
    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset email has been sent'
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await query(`
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE id = ?
    `, [resetToken, resetExpires, user.id]);

    // In a real application, send email here
    console.log(`Password reset token for user ${user.id}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'If an account exists, a password reset email has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
}

async function handleResetPassword(req, res) {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }

  try {
    const users = await query(`
      SELECT id FROM users 
      WHERE password_reset_token = ? 
        AND password_reset_expires > NOW()
        AND status = 'active'
    `, [token]);

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = users[0];
    const password_hash = await bcrypt.hash(new_password, 12);

    await query(`
      UPDATE users 
      SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL,
          login_attempts = 0, locked_until = NULL
      WHERE id = ?
    `, [password_hash, user.id]);

    // Invalidate all sessions
    await query('UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?', [user.id]);

    await logActivity(user.id, 'password_reset', 'Password reset successfully');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

async function handleVerifyEmail(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  try {
    const users = await query(`
      SELECT id FROM users 
      WHERE email_verification_token = ? AND email_verified = FALSE
    `, [token]);

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = users[0];

    await query(`
      UPDATE users 
      SET email_verified = TRUE, email_verification_token = NULL
      WHERE id = ?
    `, [user.id]);

    await logActivity(user.id, 'email_verified', 'Email verified successfully');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
}

async function handleGetPermissions(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const roles = await query(`
      SELECT r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND ur.is_active = TRUE AND r.is_active = TRUE
    `, [decoded.userId]);

    let allPermissions = [];
    roles.forEach(role => {
      if (role.permissions) {
        const permissions = JSON.parse(role.permissions);
        allPermissions = [...allPermissions, ...permissions];
      }
    });

    // Remove duplicates
    allPermissions = [...new Set(allPermissions)];

    res.status(200).json({
      success: true,
      permissions: allPermissions
    });

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to get permissions' });
  }
}

async function logActivity(userId, type, description, metadata = {}) {
  try {
    await query(`
      INSERT INTO activities (user_id, type, title, description, metadata, category)
      VALUES (?, ?, ?, ?, ?, 'system')
    `, [userId, type, description, description, JSON.stringify(metadata)]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Middleware function to verify JWT token
export async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

// Middleware function to check permissions
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const hasPermission = req.user.permissions.includes('*') || 
                         req.user.permissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
} 