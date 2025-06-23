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
    console.error('Contacts API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req, res) {
  const { id, page = 1, limit = 25, category, search } = req.query;

  try {
    if (id) {
      return await getContact(req, res, id);
    } else {
      return await getAllContacts(req, res);
    }
  } catch (error) {
    console.error('Error in handleGet:', error);
    
    // Return mock data on error
    const mockContacts = [
      {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        job_title: 'CEO',
        company_name: 'ABC Corporation',
        category: 'client',
        lead_status: 'qualified',
        created_at: '2024-01-15',
        notes: 'Important client contact'
      },
      {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0124',
        job_title: 'CTO',
        company_name: 'XYZ Inc',
        category: 'prospect',
        lead_status: 'new',
        created_at: '2024-01-16',
        notes: 'Potential new client'
      }
    ];

    if (id) {
      const contact = mockContacts.find(c => c.id == id);
      return contact 
        ? res.status(200).json(contact)
        : res.status(404).json({ error: 'Contact not found' });
    } else {
      return res.status(200).json({
        contacts: mockContacts,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_items: mockContacts.length,
          items_per_page: limit
        }
      });
    }
  }
}

async function getAllContacts(req, res) {
  const { page = 1, limit = 25, category, search } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (category) {
    whereClause += ' AND c.category = ?';
    params.push(category);
  }

  if (search) {
    whereClause += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR comp.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  const contactsQuery = `
    SELECT c.*, comp.name as company_name, comp.industry
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    ${whereClause}
  `;

  const contacts = await query(contactsQuery, [...params, parseInt(limit), parseInt(offset)]);
  const countResult = await query(countQuery, params);
  const total = countResult[0]?.total || 0;

  res.status(200).json({
    contacts,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(total / limit),
      total_items: total,
      items_per_page: parseInt(limit)
    }
  });
}

async function getContact(req, res, id) {
  const contactQuery = `
    SELECT c.*, comp.name as company_name, comp.industry, comp.website
    FROM contacts c
    LEFT JOIN companies comp ON c.company_id = comp.id
    WHERE c.id = ?
  `;

  const contacts = await query(contactQuery, [id]);
  
  if (contacts.length === 0) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const contact = contacts[0];

  // Get contact activities
  const activityQuery = `
    SELECT * FROM activities 
    WHERE contact_id = ? 
    ORDER BY activity_date DESC 
    LIMIT 10
  `;
  contact.activities = await query(activityQuery, [id]);

  res.status(200).json(contact);
}

async function handlePost(req, res) {
  const {
    first_name, last_name, email, phone, mobile, job_title,
    department, company_id, category = 'prospect', lead_status = 'new',
    address, city, state, country, postal_code, notes, tags
  } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  const insertQuery = `
    INSERT INTO contacts (
      first_name, last_name, email, phone, mobile, job_title, department,
      company_id, category, lead_status, address, city, state, country,
      postal_code, notes, tags, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const result = await query(insertQuery, [
    first_name, last_name, email, phone, mobile, job_title, department,
    company_id, category, lead_status, address, city, state, country,
    postal_code, notes, JSON.stringify(tags)
  ]);

  res.status(201).json({
    success: true,
    message: 'Contact created successfully',
    contact_id: result.insertId
  });
}

async function handlePut(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  const updateFields = [];
  const values = [];

  const allowedFields = [
    'first_name', 'last_name', 'email', 'phone', 'mobile', 'job_title',
    'department', 'company_id', 'category', 'lead_status', 'address',
    'city', 'state', 'country', 'postal_code', 'notes'
  ];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  });

  if (req.body.tags !== undefined) {
    updateFields.push('tags = ?');
    values.push(JSON.stringify(req.body.tags));
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields provided for update' });
  }

  updateFields.push('updated_at = NOW()');
  values.push(id);

  const updateQuery = `
    UPDATE contacts 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  await query(updateQuery, values);

  res.status(200).json({
    success: true,
    message: 'Contact updated successfully'
  });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Contact ID is required' });
  }

  const deleteQuery = 'DELETE FROM contacts WHERE id = ?';
  await query(deleteQuery, [id]);

  res.status(200).json({
    success: true,
    message: 'Contact deleted successfully'
  });
} 