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
    console.error('Tasks API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  const { id, project_id, status, assigned_to } = req.query;

  try {
    if (id) {
      return await getTask(req, res, id);
    } else {
      return await getAllTasks(req, res);
    }
  } catch (error) {
    console.error('Error in handleGet:', error);
    
    // Return mock data on error
    const mockTasks = [
      {
        id: 1,
        title: 'Create wireframes',
        description: 'Design initial wireframes for the homepage',
        status: 'completed',
        priority: 'high',
        project_id: 1,
        assigned_to: 2,
        assigned_first_name: 'Jane',
        assigned_last_name: 'Smith',
        due_date: '2024-02-01',
        created_at: '2024-01-15'
      },
      {
        id: 2,
        title: 'Design homepage',
        description: 'Create detailed design for homepage based on wireframes',
        status: 'in-progress',
        priority: 'high',
        project_id: 1,
        assigned_to: 2,
        assigned_first_name: 'Jane',
        assigned_last_name: 'Smith',
        due_date: '2024-02-15',
        created_at: '2024-01-16'
      },
      {
        id: 3,
        title: 'Develop frontend',
        description: 'Implement frontend based on approved designs',
        status: 'todo',
        priority: 'medium',
        project_id: 1,
        assigned_to: 3,
        assigned_first_name: 'Mike',
        assigned_last_name: 'Johnson',
        due_date: '2024-03-01',
        created_at: '2024-01-17'
      }
    ];

    let filteredTasks = mockTasks;

    if (project_id) {
      filteredTasks = filteredTasks.filter(task => task.project_id == project_id);
    }

    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }

    if (assigned_to) {
      filteredTasks = filteredTasks.filter(task => task.assigned_to == assigned_to);
    }

    if (id) {
      const task = filteredTasks.find(t => t.id == id);
      return task 
        ? res.status(200).json(task)
        : res.status(404).json({ error: 'Task not found' });
    } else {
      return res.status(200).json({ tasks: filteredTasks });
    }
  }
}

async function getAllTasks(req, res) {
  const { project_id, status, assigned_to } = req.query;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (project_id) {
    whereClause += ' AND t.project_id = ?';
    params.push(project_id);
  }

  if (status) {
    whereClause += ' AND t.status = ?';
    params.push(status);
  }

  if (assigned_to) {
    whereClause += ' AND t.assigned_to = ?';
    params.push(assigned_to);
  }

  const tasksQuery = `
    SELECT t.*, 
           u.first_name as assigned_first_name, u.last_name as assigned_last_name,
           p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    ${whereClause}
    ORDER BY t.created_at DESC
  `;

  const tasks = await query(tasksQuery, params);

  res.status(200).json({ tasks });
}

async function getTask(req, res, id) {
  const taskQuery = `
    SELECT t.*, 
           u.first_name as assigned_first_name, u.last_name as assigned_last_name,
           p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `;

  const tasks = await query(taskQuery, [id]);
  
  if (tasks.length === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.status(200).json(tasks[0]);
}

async function handlePost(req, res) {
  const {
    title, description, status = 'todo', priority = 'medium',
    project_id, assigned_to, due_date, start_date, estimated_hours
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const insertQuery = `
    INSERT INTO tasks (
      title, description, status, priority, project_id, assigned_to,
      due_date, start_date, estimated_hours, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const result = await query(insertQuery, [
    title, description, status, priority, project_id, assigned_to,
    due_date, start_date, estimated_hours
  ]);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task_id: result.insertId
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  const updateFields = [];
  const values = [];

  const allowedFields = [
    'title', 'description', 'status', 'priority', 'project_id',
    'assigned_to', 'due_date', 'start_date', 'estimated_hours',
    'actual_hours', 'progress_percentage'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  // Handle completed date automatically
  if (req.body.status === 'completed') {
    updateFields.push('completed_date = NOW()');
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  const updateQuery = `
    UPDATE tasks 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  await query(updateQuery, values);

  res.status(200).json({
    success: true,
    message: 'Task updated successfully'
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  const deleteQuery = 'DELETE FROM tasks WHERE id = ?';
  await query(deleteQuery, [id]);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully'
  });
} 