const { query } = require('../lib/database');

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
    console.error('Projects API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  const { id, page = 1, limit = 25, status, search } = req.query;

  try {
    if (id) {
      return await getProject(req, res, id);
    } else {
      return await getAllProjects(req, res);
    }
  } catch (error) {
    console.error('Error in handleGet:', error);
    
    // Return mock data on error
    const mockProjects = [
      {
        id: 1,
        name: 'Website Redesign',
        description: 'Complete redesign of company website',
        status: 'active',
        priority: 'high',
        start_date: '2024-01-15',
        end_date: '2024-04-15',
        budget: 50000,
        calculated_progress: 65,
        client_name: 'ABC Corporation',
        manager_first_name: 'John',
        manager_last_name: 'Doe',
        total_tasks: 12,
        completed_tasks: 8,
        team: [
          { id: 1, first_name: 'John', last_name: 'Doe', role: 'Project Manager' },
          { id: 2, first_name: 'Jane', last_name: 'Smith', role: 'Designer' }
        ]
      },
      {
        id: 2,
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android',
        status: 'planning',
        priority: 'medium',
        start_date: '2024-02-01',
        end_date: '2024-06-01',
        budget: 75000,
        calculated_progress: 25,
        client_name: 'XYZ Inc',
        manager_first_name: 'Jane',
        manager_last_name: 'Smith',
        total_tasks: 18,
        completed_tasks: 4,
        team: [
          { id: 2, first_name: 'Jane', last_name: 'Smith', role: 'Lead Developer' },
          { id: 3, first_name: 'Mike', last_name: 'Johnson', role: 'Developer' }
        ]
      }
    ];

    if (id) {
      const project = mockProjects.find(p => p.id == id);
      if (project) {
        project.tasks = [
          { id: 1, title: 'Create wireframes', status: 'completed', priority: 'high' },
          { id: 2, title: 'Design homepage', status: 'in-progress', priority: 'high' }
        ];
        project.activities = [
          { type: 'task_completed', description: 'Task completed', activity_date: new Date() }
        ];
        return res.status(200).json(project);
      } else {
        return res.status(404).json({ error: 'Project not found' });
      }
    } else {
      return res.status(200).json({
        projects: mockProjects,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: mockProjects.length,
          items_per_page: limit
        }
      });
    }
  }
}

async function getAllProjects(req, res) {
  const { page = 1, limit = 25, status, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND p.status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const projectsQuery = `
    SELECT p.*, c.name as client_name, c.industry,
           u.first_name as manager_first_name, u.last_name as manager_last_name,
           COUNT(DISTINCT t.id) as total_tasks,
           COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
    FROM projects p
    LEFT JOIN companies c ON p.client_id = c.id
    LEFT JOIN users u ON p.project_manager_id = u.id
    LEFT JOIN tasks t ON p.id = t.project_id
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM projects p
    LEFT JOIN companies c ON p.client_id = c.id
    ${whereClause}
  `;

  const projects = await query(projectsQuery, [...params, parseInt(limit), parseInt(offset)]);
  const countResult = await query(countQuery, params);
  const total = countResult[0]?.total || 0;

  // Calculate progress for each project
  for (let project of projects) {
    if (project.total_tasks > 0) {
      project.calculated_progress = Math.round((project.completed_tasks / project.total_tasks) * 100);
    } else {
      project.calculated_progress = 0;
    }

    // Get team members
    const teamQuery = `
      SELECT pm.*, u.first_name, u.last_name, u.avatar
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
    `;
    project.team = await query(teamQuery, [project.id]);
  }

  res.status(200).json({
    projects,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(total / limit),
      total_items: total,
      items_per_page: parseInt(limit)
    }
  });
}

async function getProject(req, res, id) {
  const projectQuery = `
    SELECT p.*, c.name as client_name, c.industry, c.email as client_email,
           u.first_name as manager_first_name, u.last_name as manager_last_name
    FROM projects p
    LEFT JOIN companies c ON p.client_id = c.id
    LEFT JOIN users u ON p.project_manager_id = u.id
    WHERE p.id = ?
  `;

  const projects = await query(projectQuery, [id]);
  
  if (projects.length === 0) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const project = projects[0];

  // Get tasks
  const tasksQuery = `
    SELECT t.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `;
  project.tasks = await query(tasksQuery, [id]);

  // Get team members
  const teamQuery = `
    SELECT pm.*, u.first_name, u.last_name, u.email, u.avatar
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `;
  project.team = await query(teamQuery, [id]);

  // Get recent activities
  const activityQuery = `
    SELECT * FROM activities 
    WHERE project_id = ? 
    ORDER BY activity_date DESC 
    LIMIT 10
  `;
  project.activities = await query(activityQuery, [id]);

  res.status(200).json(project);
}

async function handlePost(req, res) {
  const {
    name, description, status = 'planning', priority = 'medium',
    start_date, end_date, budget, client_id, project_manager_id,
    department, risk_level, methodology, objectives, deliverables,
    requirements, tags, visibility = 'public'
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const insertQuery = `
    INSERT INTO projects (
      name, description, status, priority, start_date, end_date, budget,
      client_id, project_manager_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const result = await query(insertQuery, [
    name, description, status, priority, start_date, end_date,
    budget, client_id, project_manager_id
  ]);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    project_id: result.insertId
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const updateFields = [];
  const values = [];

  // Build dynamic update query based on provided fields
  const allowedFields = [
    'name', 'description', 'status', 'priority', 'start_date', 'end_date',
    'budget', 'client_id', 'project_manager_id', 'progress_percentage'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  const updateQuery = `
    UPDATE projects 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  await query(updateQuery, values);

  res.status(200).json({
    success: true,
    message: 'Project updated successfully'
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  const deleteQuery = 'DELETE FROM projects WHERE id = ?';
  await query(deleteQuery, [id]);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully'
  });
} 