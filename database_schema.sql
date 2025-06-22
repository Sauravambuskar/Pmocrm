-- CRM & Project Management Database Schema
-- Create Database
CREATE DATABASE IF NOT EXISTS crm_project_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_project_manager;

-- Users table for authentication and user management
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'manager', 'user') DEFAULT 'user',
    avatar VARCHAR(255),
    phone VARCHAR(20),
    department VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Companies table for client/prospect companies
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    industry VARCHAR(50),
    website VARCHAR(100),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    logo VARCHAR(255),
    annual_revenue DECIMAL(15,2),
    employee_count INT,
    status ENUM('active', 'inactive', 'prospect') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Contacts table for individual contacts
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    job_title VARCHAR(100),
    department VARCHAR(50),
    avatar VARCHAR(255),
    linkedin_url VARCHAR(255),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    birthday DATE,
    category ENUM('client', 'prospect', 'partner', 'vendor') DEFAULT 'prospect',
    lead_source VARCHAR(50),
    lead_status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'new',
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    tags JSON,
    custom_fields JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    assigned_to INT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_category (category),
    INDEX idx_status (lead_status)
);

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    client_id INT,
    status ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled') DEFAULT 'planning',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    progress_percentage INT DEFAULT 0,
    project_manager_id INT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    tags JSON,
    custom_fields JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (client_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_dates (start_date, end_date)
);

-- Project team members
CREATE TABLE project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    hourly_rate DECIMAL(10,2),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_user (project_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    parent_task_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in-progress', 'review', 'completed', 'cancelled') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT,
    due_date DATETIME,
    start_date DATETIME,
    completed_date DATETIME,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,
    progress_percentage INT DEFAULT 0,
    tags JSON,
    attachments JSON,
    checklist JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned (assigned_to),
    INDEX idx_due_date (due_date)
);

-- Time tracking
CREATE TABLE time_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    project_id INT,
    user_id INT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INT,
    hourly_rate DECIMAL(10,2),
    is_billable BOOLEAN DEFAULT TRUE,
    invoice_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, start_time),
    INDEX idx_project_date (project_id, start_time)
);

-- Calendar events
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type ENUM('meeting', 'call', 'task', 'deadline', 'reminder', 'personal') DEFAULT 'meeting',
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    meeting_url VARCHAR(255),
    project_id INT,
    task_id INT,
    contact_id INT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    reminder_minutes INT DEFAULT 15,
    recurring_rule VARCHAR(255),
    status ENUM('tentative', 'confirmed', 'cancelled') DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_datetime (start_datetime, end_datetime),
    INDEX idx_type (event_type)
);

-- Event attendees
CREATE TABLE event_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT,
    contact_id INT,
    email VARCHAR(100),
    status ENUM('pending', 'accepted', 'declined', 'tentative') DEFAULT 'pending',
    is_organizer BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Deals/Opportunities
CREATE TABLE deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_id INT,
    contact_id INT,
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stage ENUM('prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost') DEFAULT 'prospecting',
    probability INT DEFAULT 50,
    expected_close_date DATE,
    actual_close_date DATE,
    lead_source VARCHAR(50),
    deal_type VARCHAR(50),
    description TEXT,
    tags JSON,
    custom_fields JSON,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stage (stage),
    INDEX idx_amount (amount),
    INDEX idx_close_date (expected_close_date)
);

-- Activity log for tracking interactions
CREATE TABLE activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type ENUM('call', 'email', 'meeting', 'note', 'task', 'file', 'system') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    contact_id INT,
    company_id INT,
    deal_id INT,
    project_id INT,
    task_id INT,
    user_id INT NOT NULL,
    activity_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT,
    outcome VARCHAR(100),
    next_action VARCHAR(255),
    next_action_date DATETIME,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_type_date (activity_type, activity_date),
    INDEX idx_user_date (user_id, activity_date)
);

-- Documents and files
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    document_type ENUM('contract', 'proposal', 'invoice', 'report', 'image', 'other') DEFAULT 'other',
    company_id INT,
    contact_id INT,
    project_id INT,
    task_id INT,
    deal_id INT,
    is_public BOOLEAN DEFAULT FALSE,
    tags JSON,
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Email templates
CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_type ENUM('welcome', 'follow-up', 'proposal', 'invoice', 'reminder', 'custom') DEFAULT 'custom',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- System settings
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notification_type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    entity_type VARCHAR(50),
    entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('admin', 'admin@crm.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_system) VALUES
('company_name', 'CRM Pro', 'string', 'Company name displayed in the application', FALSE),
('company_email', 'info@company.com', 'string', 'Company contact email', FALSE),
('company_phone', '+1 (555) 123-4567', 'string', 'Company contact phone', FALSE),
('timezone', 'America/New_York', 'string', 'Default timezone', FALSE),
('currency', 'USD', 'string', 'Default currency', FALSE),
('date_format', 'Y-m-d', 'string', 'Default date format', FALSE),
('time_format', 'H:i', 'string', 'Default time format', FALSE),
('items_per_page', '25', 'number', 'Default items per page in lists', FALSE),
('backup_enabled', 'true', 'boolean', 'Enable automatic database backups', TRUE),
('email_notifications', 'true', 'boolean', 'Enable email notifications', FALSE);

-- Insert sample data for demonstration
INSERT INTO companies (name, industry, website, email, phone, status, created_by) VALUES
('Tech Innovations Inc', 'Technology', 'https://techinnovations.com', 'info@techinnovations.com', '+1 (555) 234-5678', 'active', 1),
('Marketing Solutions LLC', 'Marketing', 'https://marketingsolutions.com', 'contact@marketingsolutions.com', '+1 (555) 345-6789', 'prospect', 1),
('Design Studio Pro', 'Design', 'https://designstudiopro.com', 'hello@designstudiopro.com', '+1 (555) 456-7890', 'active', 1);

INSERT INTO contacts (company_id, first_name, last_name, email, phone, job_title, category, created_by, assigned_to) VALUES
(1, 'John', 'Smith', 'john.smith@techinnovations.com', '+1 (555) 111-2222', 'CEO', 'client', 1, 1),
(1, 'Sarah', 'Johnson', 'sarah.johnson@techinnovations.com', '+1 (555) 111-3333', 'CTO', 'client', 1, 1),
(2, 'Mike', 'Wilson', 'mike.wilson@marketingsolutions.com', '+1 (555) 222-4444', 'Marketing Director', 'prospect', 1, 1),
(3, 'Emily', 'Davis', 'emily.davis@designstudiopro.com', '+1 (555) 333-5555', 'Creative Director', 'client', 1, 1);

INSERT INTO projects (name, description, client_id, status, priority, start_date, end_date, budget, project_manager_id, created_by) VALUES
('Website Redesign', 'Complete overhaul of company website with modern design and improved UX', 1, 'active', 'high', '2024-01-01', '2024-03-31', 25000.00, 1, 1),
('Mobile App Development', 'Native iOS and Android app development for client portal', 1, 'planning', 'medium', '2024-02-01', '2024-06-30', 75000.00, 1, 1),
('Marketing Campaign', 'Q1 digital marketing campaign across multiple channels', 2, 'active', 'medium', '2024-01-15', '2024-04-15', 15000.00, 1, 1);

INSERT INTO tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, created_by) VALUES
(1, 'Create wireframes', 'Design initial wireframes for all main pages', 'completed', 'high', 1, '2024-01-15 17:00:00', 16.0, 1),
(1, 'Design homepage mockup', 'Create high-fidelity mockup for homepage design', 'in-progress', 'high', 1, '2024-01-25 17:00:00', 12.0, 1),
(1, 'Develop frontend components', 'Build reusable React components for the interface', 'todo', 'medium', 1, '2024-02-05 17:00:00', 32.0, 1),
(2, 'Set up development environment', 'Configure development environment for mobile app', 'in-progress', 'high', 1, '2024-02-10 17:00:00', 8.0, 1),
(3, 'Research target audience', 'Conduct market research and define target personas', 'completed', 'medium', 1, '2024-01-20 17:00:00', 20.0, 1);

INSERT INTO events (title, description, event_type, start_datetime, end_datetime, project_id, created_by) VALUES
('Project Kickoff Meeting', 'Initial meeting to discuss project requirements and timeline', 'meeting', '2024-01-25 10:00:00', '2024-01-25 11:30:00', 1, 1),
('Client Presentation', 'Present initial designs and get client feedback', 'meeting', '2024-01-30 14:00:00', '2024-01-30 15:30:00', 1, 1),
('Sprint Planning', 'Plan tasks for the upcoming development sprint', 'meeting', '2024-02-05 09:00:00', '2024-02-05 10:00:00', 2, 1);

INSERT INTO deals (name, company_id, contact_id, amount, stage, probability, expected_close_date, assigned_to, created_by) VALUES
('Website Redesign Project', 1, 1, 25000.00, 'closed-won', 100, '2024-01-01', 1, 1),
('Mobile App Development', 1, 2, 75000.00, 'proposal', 75, '2024-02-15', 1, 1),
('Annual Marketing Package', 2, 3, 45000.00, 'negotiation', 60, '2024-02-01', 1, 1);

-- Create indexes for better performance
CREATE INDEX idx_contacts_full_name ON contacts(first_name, last_name);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_events_start_time ON events(start_datetime);
CREATE INDEX idx_activities_date ON activities(activity_date);
CREATE INDEX idx_time_entries_period ON time_entries(start_time, end_time);

-- Create views for common queries
CREATE VIEW project_summary AS
SELECT 
    p.*,
    c.name as client_name,
    u.first_name as manager_first_name,
    u.last_name as manager_last_name,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END) as total_hours,
    SUM(te.duration_minutes)/60 as tracked_hours
FROM projects p
LEFT JOIN companies c ON p.client_id = c.id
LEFT JOIN users u ON p.project_manager_id = u.id
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN time_entries te ON p.id = te.project_id
GROUP BY p.id;

CREATE VIEW contact_summary AS
SELECT 
    c.*,
    co.name as company_name,
    co.industry,
    COUNT(DISTINCT a.id) as activity_count,
    MAX(a.activity_date) as last_activity,
    COUNT(DISTINCT d.id) as deal_count,
    SUM(CASE WHEN d.stage = 'closed-won' THEN d.amount ELSE 0 END) as won_amount
FROM contacts c
LEFT JOIN companies co ON c.company_id = co.id
LEFT JOIN activities a ON c.id = a.contact_id
LEFT JOIN deals d ON c.id = d.contact_id
GROUP BY c.id; 