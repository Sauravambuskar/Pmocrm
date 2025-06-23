const db = require('../lib/database');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;
  const { action } = query;

  try {
    switch (method) {
      case 'GET':
        switch (action) {
          case 'list':
            return await handleGetLeads(req, res);
          case 'details':
            return await handleGetLeadDetails(req, res);
          case 'activities':
            return await handleGetLeadActivities(req, res);
          case 'sources':
            return await handleGetLeadSources(req, res);
          case 'statuses':
            return await handleGetLeadStatuses(req, res);
          case 'analytics':
            return await handleGetLeadsAnalytics(req, res);
          case 'scoring-rules':
            return await handleGetScoringRules(req, res);
          case 'campaigns':
            return await handleGetCampaigns(req, res);
          default:
            return await handleGetLeads(req, res);
        }
      case 'POST':
        switch (action) {
          case 'create':
            return await handleCreateLead(req, res);
          case 'activity':
            return await handleCreateActivity(req, res);
          case 'convert':
            return await handleConvertLead(req, res);
          case 'score':
            return await handleScoreLead(req, res);
          case 'campaign':
            return await handleCreateCampaign(req, res);
          default:
            return await handleCreateLead(req, res);
        }
      case 'PUT':
        return await handleUpdateLead(req, res);
      case 'DELETE':
        return await handleDeleteLead(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Leads API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetLeads(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    status = '', 
    source = '', 
    assigned_to = '',
    temperature = '',
    priority = '',
    sort_by = 'created_at',
    sort_order = 'desc'
  } = req.query;

  try {
    // Build WHERE conditions
    let whereConditions = [];
    let params = [];

    if (search) {
      whereConditions.push(`(l.first_name LIKE ? OR l.last_name LIKE ? OR l.email LIKE ? OR l.company LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (status) {
      whereConditions.push('l.lead_status_id = ?');
      params.push(status);
    }

    if (source) {
      whereConditions.push('l.lead_source_id = ?');
      params.push(source);
    }

    if (assigned_to) {
      whereConditions.push('l.assigned_to = ?');
      params.push(assigned_to);
    }

    if (temperature) {
      whereConditions.push('l.temperature = ?');
      params.push(temperature);
    }

    if (priority) {
      whereConditions.push('l.priority = ?');
      params.push(priority);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leads l
      ${whereClause}
    `;
    
    const [countResult] = await db.query(countQuery, params);
    const total = countResult?.total || 0;

    // Get leads with pagination
    const offset = (page - 1) * limit;
    const leadsQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        lst.name as status_name,
        lst.color as status_color,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name,
        CONCAT(c.first_name, ' ', c.last_name) as creator_name,
        (SELECT COUNT(*) FROM lead_activities WHERE lead_id = l.id) as activity_count,
        DATEDIFF(NOW(), l.created_at) as days_old
      FROM leads l
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      LEFT JOIN lead_statuses lst ON l.lead_status_id = lst.id
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users c ON l.created_by = c.id
      ${whereClause}
      ORDER BY l.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const leads = await db.query(leadsQuery, params) || [];

    // Mock data fallback for demo
    if (leads.length === 0 && !search && !status && !source) {
      const mockLeads = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@techcorp.com',
          phone: '+1-555-0123',
          company: 'TechCorp Industries',
          job_title: 'IT Director',
          lead_score: 85,
          temperature: 'hot',
          priority: 'high',
          source_name: 'Website Form',
          status_name: 'Qualified',
          status_color: '#F59E0B',
          assigned_user_name: 'Sarah Johnson',
          activity_count: 5,
          days_old: 3,
          annual_revenue: 5000000,
          company_size: '201-500',
          next_follow_up: '2024-01-15T10:00:00Z',
          created_at: '2024-01-12T09:30:00Z'
        },
        {
          id: 2,
          first_name: 'Emily',
          last_name: 'Davis',
          email: 'emily.davis@innovate.com',
          phone: '+1-555-0124',
          company: 'Innovate Solutions',
          job_title: 'CEO',
          lead_score: 92,
          temperature: 'hot',
          priority: 'urgent',
          source_name: 'LinkedIn',
          status_name: 'Proposal Sent',
          status_color: '#8B5CF6',
          assigned_user_name: 'Mike Wilson',
          activity_count: 8,
          days_old: 7,
          annual_revenue: 12000000,
          company_size: '501-1000',
          next_follow_up: '2024-01-14T14:00:00Z',
          created_at: '2024-01-08T11:15:00Z'
        },
        {
          id: 3,
          first_name: 'Michael',
          last_name: 'Brown',
          email: 'michael.brown@startup.io',
          phone: '+1-555-0125',
          company: 'Startup Accelerator',
          job_title: 'CTO',
          lead_score: 67,
          temperature: 'warm',
          priority: 'medium',
          source_name: 'Trade Show',
          status_name: 'Contacted',
          status_color: '#3B82F6',
          assigned_user_name: 'Sarah Johnson',
          activity_count: 3,
          days_old: 12,
          annual_revenue: 2500000,
          company_size: '51-200',
          next_follow_up: '2024-01-16T09:00:00Z',
          created_at: '2024-01-03T16:45:00Z'
        }
      ];

      return res.status(200).json({
        success: true,
        leads: mockLeads,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: mockLeads.length,
          total_pages: 1
        }
      });
    }

    res.status(200).json({
      success: true,
      leads,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}

async function handleGetLeadDetails(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const leadQuery = `
      SELECT 
        l.*,
        ls.name as source_name,
        lst.name as status_name,
        lst.color as status_color,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_user_name,
        CONCAT(c.first_name, ' ', c.last_name) as creator_name
      FROM leads l
      LEFT JOIN lead_sources ls ON l.lead_source_id = ls.id
      LEFT JOIN lead_statuses lst ON l.lead_status_id = lst.id
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN users c ON l.created_by = c.id
      WHERE l.id = ?
    `;

    const [lead] = await db.query(leadQuery, [id]);

    if (!lead) {
      // Mock data for demo
      const mockLead = {
        id: parseInt(id),
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@techcorp.com',
        phone: '+1-555-0123',
        company: 'TechCorp Industries',
        job_title: 'IT Director',
        website: 'https://techcorp.com',
        linkedin_url: 'https://linkedin.com/in/johnsmith',
        address: '123 Business Ave, Suite 100',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postal_code: '94105',
        lead_score: 85,
        temperature: 'hot',
        priority: 'high',
        annual_revenue: 5000000,
        company_size: '201-500',
        industry: 'Technology',
        budget_range: '$50K-$100K',
        decision_maker: true,
        source_name: 'Website Form',
        status_name: 'Qualified',
        status_color: '#F59E0B',
        assigned_user_name: 'Sarah Johnson',
        notes: 'Very interested in our enterprise solution. Has budget approved and timeline of Q1 implementation.',
        tags: ['Enterprise', 'High Priority', 'Q1 Target'],
        next_follow_up: '2024-01-15T10:00:00Z',
        created_at: '2024-01-12T09:30:00Z'
      };

      return res.status(200).json({
        success: true,
        lead: mockLead
      });
    }

    res.status(200).json({
      success: true,
      lead
    });

  } catch (error) {
    console.error('Get lead details error:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
}

async function handleGetLeadActivities(req, res) {
  const { lead_id } = req.query;

  if (!lead_id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const activitiesQuery = `
      SELECT 
        la.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM lead_activities la
      LEFT JOIN users u ON la.created_by = u.id
      WHERE la.lead_id = ?
      ORDER BY la.activity_date DESC
    `;

    const activities = await db.query(activitiesQuery, [lead_id]) || [];

    // Mock data for demo
    if (activities.length === 0) {
      const mockActivities = [
        {
          id: 1,
          activity_type: 'call',
          subject: 'Initial Discovery Call',
          description: 'Discussed current challenges and requirements. Very positive response.',
          activity_date: '2024-01-12T14:30:00Z',
          duration_minutes: 45,
          outcome: 'positive',
          next_action: 'Send proposal by end of week',
          created_by_name: 'Sarah Johnson'
        },
        {
          id: 2,
          activity_type: 'email',
          subject: 'Follow-up Email with Resources',
          description: 'Sent case studies and product information as requested.',
          activity_date: '2024-01-13T09:15:00Z',
          duration_minutes: 0,
          outcome: 'neutral',
          next_action: 'Schedule demo for next week',
          created_by_name: 'Sarah Johnson'
        },
        {
          id: 3,
          activity_type: 'demo',
          subject: 'Product Demo Session',
          description: 'Comprehensive demo of enterprise features. Client very engaged.',
          activity_date: '2024-01-14T15:00:00Z',
          duration_minutes: 60,
          outcome: 'positive',
          next_action: 'Prepare custom proposal',
          created_by_name: 'Mike Wilson'
        }
      ];

      return res.status(200).json({
        success: true,
        activities: mockActivities
      });
    }

    res.status(200).json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get lead activities error:', error);
    res.status(500).json({ error: 'Failed to fetch lead activities' });
  }
}

async function handleGetLeadSources(req, res) {
  try {
    const sourcesQuery = `
      SELECT * FROM lead_sources 
      WHERE is_active = TRUE 
      ORDER BY name
    `;

    const sources = await db.query(sourcesQuery) || [];

    // Mock data for demo
    if (sources.length === 0) {
      const mockSources = [
        { id: 1, name: 'Website Form', description: 'Leads from website contact forms' },
        { id: 2, name: 'LinkedIn', description: 'Leads from LinkedIn outreach' },
        { id: 3, name: 'Trade Show', description: 'Leads from trade shows and events' },
        { id: 4, name: 'Referral', description: 'Leads from customer referrals' },
        { id: 5, name: 'Cold Calling', description: 'Leads from cold calling efforts' }
      ];

      return res.status(200).json({
        success: true,
        sources: mockSources
      });
    }

    res.status(200).json({
      success: true,
      sources
    });

  } catch (error) {
    console.error('Get lead sources error:', error);
    res.status(500).json({ error: 'Failed to fetch lead sources' });
  }
}

async function handleGetLeadStatuses(req, res) {
  try {
    const statusesQuery = `
      SELECT * FROM lead_statuses 
      WHERE is_active = TRUE 
      ORDER BY sort_order
    `;

    const statuses = await db.query(statusesQuery) || [];

    // Mock data for demo
    if (statuses.length === 0) {
      const mockStatuses = [
        { id: 1, name: 'New', color: '#6B7280', sort_order: 1 },
        { id: 2, name: 'Contacted', color: '#3B82F6', sort_order: 2 },
        { id: 3, name: 'Qualified', color: '#F59E0B', sort_order: 3 },
        { id: 4, name: 'Proposal Sent', color: '#8B5CF6', sort_order: 4 },
        { id: 5, name: 'Negotiation', color: '#EF4444', sort_order: 5 },
        { id: 6, name: 'Converted', color: '#10B981', sort_order: 6 },
        { id: 7, name: 'Lost', color: '#6B7280', sort_order: 7 }
      ];

      return res.status(200).json({
        success: true,
        statuses: mockStatuses
      });
    }

    res.status(200).json({
      success: true,
      statuses
    });

  } catch (error) {
    console.error('Get lead statuses error:', error);
    res.status(500).json({ error: 'Failed to fetch lead statuses' });
  }
}

async function handleGetLeadsAnalytics(req, res) {
  try {
    // Mock analytics data for demo
    const analytics = {
      overview: {
        total_leads: 1247,
        new_this_month: 89,
        converted_this_month: 23,
        conversion_rate: 25.8,
        average_score: 67,
        hot_leads: 34
      },
      by_source: [
        { name: 'Website Form', count: 456, percentage: 36.6 },
        { name: 'LinkedIn', count: 289, percentage: 23.2 },
        { name: 'Trade Show', count: 198, percentage: 15.9 },
        { name: 'Referral', count: 167, percentage: 13.4 },
        { name: 'Cold Calling', count: 137, percentage: 11.0 }
      ],
      by_status: [
        { name: 'New', count: 234, color: '#6B7280' },
        { name: 'Contacted', count: 345, color: '#3B82F6' },
        { name: 'Qualified', count: 198, color: '#F59E0B' },
        { name: 'Proposal Sent', count: 123, color: '#8B5CF6' },
        { name: 'Negotiation', count: 89, color: '#EF4444' },
        { name: 'Converted', count: 167, color: '#10B981' },
        { name: 'Lost', count: 91, color: '#6B7280' }
      ],
      conversion_funnel: [
        { stage: 'New Leads', count: 1247, percentage: 100 },
        { stage: 'Contacted', count: 934, percentage: 74.9 },
        { stage: 'Qualified', count: 623, percentage: 49.9 },
        { stage: 'Proposal', count: 312, percentage: 25.0 },
        { stage: 'Converted', count: 167, percentage: 13.4 }
      ],
      monthly_trend: [
        { month: 'Jul', leads: 98, converted: 18 },
        { month: 'Aug', leads: 112, converted: 21 },
        { month: 'Sep', leads: 89, converted: 19 },
        { month: 'Oct', leads: 134, converted: 28 },
        { month: 'Nov', leads: 156, converted: 32 },
        { month: 'Dec', leads: 142, converted: 29 }
      ]
    };

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Get leads analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch leads analytics' });
  }
}

async function handleCreateLead(req, res) {
  const {
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    website,
    linkedin_url,
    lead_source_id,
    temperature = 'cold',
    priority = 'medium',
    annual_revenue,
    company_size,
    industry,
    budget_range,
    decision_maker = false,
    assigned_to,
    notes,
    tags
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ 
      error: 'First name, last name, and email are required' 
    });
  }

  try {
    // Mock creation for demo
    const newLead = {
      id: Math.floor(Math.random() * 1000) + 100,
      first_name,
      last_name,
      email,
      phone,
      company,
      job_title,
      website,
      linkedin_url,
      lead_source_id,
      lead_score: 0,
      temperature,
      priority,
      annual_revenue,
      company_size,
      industry,
      budget_range,
      decision_maker,
      assigned_to,
      notes,
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: newLead
    });

  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
}

async function handleUpdateLead(req, res) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    // Mock update for demo
    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      lead: { id: parseInt(id), ...updateData }
    });

  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
}

async function handleCreateActivity(req, res) {
  const {
    lead_id,
    activity_type,
    subject,
    description,
    duration_minutes = 0,
    outcome = 'neutral',
    next_action
  } = req.body;

  if (!lead_id || !activity_type || !subject) {
    return res.status(400).json({ 
      error: 'Lead ID, activity type, and subject are required' 
    });
  }

  try {
    // Mock activity creation for demo
    const newActivity = {
      id: Math.floor(Math.random() * 1000) + 100,
      lead_id,
      activity_type,
      subject,
      description,
      activity_date: new Date().toISOString(),
      duration_minutes,
      outcome,
      next_action,
      created_by_name: 'Current User'
    };

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity: newActivity
    });

  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
}

async function handleConvertLead(req, res) {
  const {
    lead_id,
    conversion_type = 'qualified',
    conversion_value = 0,
    notes
  } = req.body;

  if (!lead_id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    // Mock conversion for demo
    const conversion = {
      id: Math.floor(Math.random() * 1000) + 100,
      lead_id,
      conversion_type,
      conversion_value,
      conversion_date: new Date().toISOString(),
      notes
    };

    res.status(200).json({
      success: true,
      message: 'Lead converted successfully',
      conversion
    });

  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
}

async function handleScoreLead(req, res) {
  const { lead_id } = req.body;

  if (!lead_id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    // Mock lead scoring for demo
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100

    res.status(200).json({
      success: true,
      message: 'Lead scored successfully',
      lead_id,
      score,
      scored_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Score lead error:', error);
    res.status(500).json({ error: 'Failed to score lead' });
  }
}

async function handleGetCampaigns(req, res) {
  try {
    // Mock campaigns data for demo
    const campaigns = [
      {
        id: 1,
        name: 'Q1 Enterprise Outreach',
        campaign_type: 'email',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        budget: 15000,
        leads_count: 234,
        responses: 67,
        conversions: 12
      },
      {
        id: 2,
        name: 'LinkedIn Professional Network',
        campaign_type: 'social',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2024-02-29',
        budget: 8000,
        leads_count: 156,
        responses: 43,
        conversions: 8
      }
    ];

    res.status(200).json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

async function handleCreateCampaign(req, res) {
  const {
    name,
    campaign_type,
    start_date,
    end_date,
    budget,
    target_audience,
    goals
  } = req.body;

  if (!name || !campaign_type) {
    return res.status(400).json({ 
      error: 'Campaign name and type are required' 
    });
  }

  try {
    // Mock campaign creation for demo
    const newCampaign = {
      id: Math.floor(Math.random() * 1000) + 100,
      name,
      campaign_type,
      start_date,
      end_date,
      budget,
      target_audience,
      goals,
      status: 'planning',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: newCampaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
}

async function handleDeleteLead(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    // Mock deletion for demo
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
} 