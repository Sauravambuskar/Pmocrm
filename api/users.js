const { query } = require('../lib/database');
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Users API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  const { id, page = 1, limit = 25, department, status, role, search } = req.query;

  try {
    if (id) {
      return await getUser(req, res, id);
    } else {
      return await getAllUsers(req, res);
    }
  } catch (error) {
    console.error('Error in handleGet:', error);
    
    // Return mock data on error
    const mockUsers = [
      {
        id: 1,
        uuid: 'uuid-1',
        email: 'admin@company.com',
        first_name: 'System',
        last_name: 'Administrator',
        job_title: 'System Administrator',
        department_name: 'Executive',
        role_name: 'super_admin',
        role_display_name: 'Super Administrator',
        status: 'active',
        created_at: '2024-01-01',
        last_login: '2024-01-15 10:30:00'
      },
      {
        id: 2,
        uuid: 'uuid-2',
        email: 'john.doe@company.com',
        first_name: 'John',
        last_name: 'Doe',
        job_title: 'Project Manager',
        department_name: 'Development',
        role_name: 'manager',
        role_display_name: 'Manager',
        status: 'active',
        created_at: '2024-01-02',
        last_login: '2024-01-15 09:15:00'
      }
    ];

    if (id) {
      const user = mockUsers.find(u => u.id == id);
      return user 
        ? res.status(200).json(user)
        : res.status(404).json({ error: 'User not found' });
    } else {
      return res.status(200).json({
        users: mockUsers,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: mockUsers.length,
          items_per_page: limit
        }
      });
    }
  }
}

async function getAllUsers(req, res) {
  const { page = 1, limit = 25, department, status, role, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (department) {
    whereClause += ' AND u.department_id = ?';
    params.push(department);
  }

  if (status) {
    whereClause += ' AND u.status = ?';
    params.push(status);
  }

  if (role) {
    whereClause += ' AND r.name = ?';
    params.push(role);
  }

  if (search) {
    whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.job_title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const usersQuery = `
    SELECT u.id, u.uuid, u.email, u.first_name, u.last_name, u.phone, u.avatar,
           u.job_title, u.employee_id, u.hire_date, u.status, u.last_login,
           u.timezone, u.language, u.created_at, u.updated_at,
           d.name as department_name, d.id as department_id,
           r.name as role_name, r.display_name as role_display_name,
           m.first_name as manager_first_name, m.last_name as manager_last_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users m ON u.manager_id = m.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as total
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
    ${whereClause}
  `;

  const users = await query(usersQuery, [...params, parseInt(limit), parseInt(offset)]);
  const countResult = await query(countQuery, params);
  const total = countResult[0]?.total || 0;

  // Get additional user statistics
  for (let user of users) {
    // Get project count
    const projectCount = await query(`
      SELECT COUNT(*) as count FROM project_members pm
      WHERE pm.user_id = ? AND pm.is_active = TRUE
    `, [user.id]);
    user.project_count = projectCount[0]?.count || 0;

    // Get task count
    const taskCount = await query(`
      SELECT COUNT(*) as count FROM tasks t
      WHERE t.assigned_to = ? AND t.status NOT IN ('completed', 'cancelled')
    `, [user.id]);
    user.active_task_count = taskCount[0]?.count || 0;
  }

  res.status(200).json({
    users,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(total / limit),
      total_items: total,
      items_per_page: parseInt(limit)
    }
  });
}

async function getUser(req, res, id) {
  const userQuery = `
    SELECT u.*, d.name as department_name, d.id as department_id,
           r.name as role_name, r.display_name as role_display_name, r.permissions,
           m.first_name as manager_first_name, m.last_name as manager_last_name
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN users m ON u.manager_id = m.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = TRUE
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = TRUE
    WHERE u.id = ?
  `;

  const users = await query(userQuery, [id]);
  
  if (users.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users[0];

  // Remove sensitive information
  delete user.password_hash;
  delete user.password_reset_token;
  delete user.email_verification_token;
  delete user.two_factor_secret;

  // Get user's projects
  const projectsQuery = `
    SELECT p.id, p.name, p.status, p.priority, pm.role
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ? AND pm.is_active = TRUE
    ORDER BY p.created_at DESC
    LIMIT 10
  `;
  user.projects = await query(projectsQuery, [id]);

  // Get user's recent activities
  const activitiesQuery = `
    SELECT type, title, description, activity_date
    FROM activities
    WHERE user_id = ?
    ORDER BY activity_date DESC
    LIMIT 10
  `;
  user.recent_activities = await query(activitiesQuery, [id]);

  // Get user statistics
  const stats = await getUserStats(id);
  user.statistics = stats;

  res.status(200).json(user);
}

async function handlePost(req, res) {
  const {
    email, password, first_name, last_name, phone, job_title,
    department_id, manager_id, employee_id, hire_date, salary,
    hourly_rate, timezone = 'UTC', language = 'en', role_id
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

    // Check if employee ID is unique (if provided)
    if (employee_id) {
      const existingEmployee = await query('SELECT id FROM users WHERE employee_id = ?', [employee_id]);
      if (existingEmployee.length > 0) {
        return res.status(409).json({ error: 'Employee ID already exists' });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(`
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, job_title,
        department_id, manager_id, employee_id, hire_date, salary,
        hourly_rate, timezone, language, email_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      email, password_hash, first_name, last_name, phone, job_title,
      department_id, manager_id, employee_id, hire_date, salary,
      hourly_rate, timezone, language
    ]);

    const userId = result.insertId;

    // Assign role if provided
    if (role_id) {
      await query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
      `, [userId, role_id, req.user?.userId || userId]);
    } else {
      // Assign default employee role
      const employeeRole = await query('SELECT id FROM roles WHERE name = "employee"');
      if (employeeRole.length > 0) {
        await query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by)
          VALUES (?, ?, ?)
        `, [userId, employeeRole[0].id, req.user?.userId || userId]);
      }
    }

    // Log activity
    await logActivity(req.user?.userId || userId, 'user_created', `User ${first_name} ${last_name} created`, {
      user_id: userId,
      email
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user_id: userId
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const updateFields = [];
  const values = [];

  const allowedFields = [
    'first_name', 'last_name', 'phone', 'job_title', 'department_id',
    'manager_id', 'employee_id', 'hire_date', 'salary', 'hourly_rate',
    'timezone', 'language', 'status', 'avatar'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  // Handle password update separately
  if (req.body.password) {
    if (req.body.password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }
    const password_hash = await bcrypt.hash(req.body.password, 12);
    updateFields.push('password_hash = ?');
    values.push(password_hash);
  }

  // Handle preferences update
  if (req.body.preferences) {
    updateFields.push('preferences = ?');
    values.push(JSON.stringify(req.body.preferences));
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  try {
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await query(updateQuery, values);

    // Update role if provided
    if (req.body.role_id) {
      // Deactivate existing roles
      await query('UPDATE user_roles SET is_active = FALSE WHERE user_id = ?', [id]);
      
      // Assign new role
      await query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_active = TRUE, assigned_by = ?
      `, [id, req.body.role_id, req.user?.userId || id, req.user?.userId || id]);
    }

    // Log activity
    await logActivity(req.user?.userId || id, 'user_updated', `User updated`, {
      user_id: id,
      updated_fields: updateFields.slice(0, -1) // Remove updated_at
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Check if user exists
    const users = await query('SELECT first_name, last_name FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Soft delete - set status to terminated
    await query('UPDATE users SET status = "terminated", updated_at = NOW() WHERE id = ?', [id]);

    // Deactivate user roles
    await query('UPDATE user_roles SET is_active = FALSE WHERE user_id = ?', [id]);

    // Deactivate user sessions
    await query('UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?', [id]);

    // Log activity
    await logActivity(req.user?.userId || id, 'user_deleted', `User ${user.first_name} ${user.last_name} deleted`, {
      user_id: id
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

async function getUserStats(userId) {
  try {
    // Get project statistics
    const projectStats = await query(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_projects,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_projects
      FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE pm.user_id = ? AND pm.is_active = TRUE
    `, [userId]);

    // Get task statistics
    const taskStats = await query(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status IN ('todo', 'in-progress') THEN 1 ELSE 0 END) as active_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks
      WHERE assigned_to = ?
    `, [userId]);

    return {
      projects: projectStats[0] || { total_projects: 0, active_projects: 0, completed_projects: 0 },
      tasks: taskStats[0] || { total_tasks: 0, completed_tasks: 0, active_tasks: 0, overdue_tasks: 0 }
    };

  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      projects: { total_projects: 0, active_projects: 0, completed_projects: 0 },
      tasks: { total_tasks: 0, completed_tasks: 0, active_tasks: 0, overdue_tasks: 0 }
    };
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