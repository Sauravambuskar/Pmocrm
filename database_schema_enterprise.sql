-- Enterprise CRM Database Schema
-- Optimized for production use with advanced features

-- Enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Drop existing tables if they exist (in correct order to avoid FK conflicts)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS time_entries;
DROP TABLE IF EXISTS project_dependencies;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS task_comments;
DROP TABLE IF EXISTS project_templates;
DROP TABLE IF EXISTS custom_field_values;
DROP TABLE IF EXISTS custom_fields;
DROP TABLE IF EXISTS email_campaigns;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS contact_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS lead_sources;
DROP TABLE IF EXISTS lead_statuses;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS lead_activities;
DROP TABLE IF EXISTS lead_scoring_rules;
DROP TABLE IF EXISTS lead_campaigns;
DROP TABLE IF EXISTS lead_campaign_members;
DROP TABLE IF EXISTS lead_conversions;

-- Settings table for system configuration
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments for organizational structure
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id INT,
    parent_department_id INT,
    budget DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_dept (parent_department_id),
    INDEX idx_manager (manager_id)
);

-- Enhanced Users table with enterprise features
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(500),
    job_title VARCHAR(100),
    department_id INT,
    manager_id INT,
    employee_id VARCHAR(50) UNIQUE,
    hire_date DATE,
    salary DECIMAL(12,2),
    hourly_rate DECIMAL(8,2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    status ENUM('active', 'inactive', 'suspended', 'terminated') DEFAULT 'active',
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    preferences JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_department (department_id),
    INDEX idx_manager (manager_id)
);

-- User sessions for security tracking
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id),
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
);

-- Roles and permissions system
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_role (user_id, role_id),
    INDEX idx_user_roles (user_id),
    INDEX idx_role_users (role_id)
);

-- Enhanced Companies table
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    industry VARCHAR(100),
    company_size ENUM('1-10', '11-50', '51-200', '201-1000', '1000+'),
    annual_revenue DECIMAL(15,2),
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(500),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Contact information
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    
    -- Business information
    founded_date DATE,
    parent_company_id INT,
    account_manager_id INT,
    
    -- Status and tracking
    status ENUM('prospect', 'active', 'inactive', 'competitor') DEFAULT 'prospect',
    lead_source VARCHAR(100),
    lead_score INT DEFAULT 0,
    
    -- Financial
    credit_limit DECIMAL(12,2),
    payment_terms VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (parent_company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_industry (industry),
    INDEX idx_account_manager (account_manager_id)
);

-- Enhanced Contacts table
CREATE TABLE contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    company_id INT,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    title VARCHAR(10),
    job_title VARCHAR(100),
    department VARCHAR(100),
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    fax VARCHAR(20),
    linkedin_url VARCHAR(255),
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Professional information
    reports_to_id INT,
    assistant_name VARCHAR(100),
    assistant_phone VARCHAR(20),
    
    -- CRM specific
    category ENUM('prospect', 'lead', 'customer', 'partner', 'vendor') DEFAULT 'prospect',
    lead_status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost') DEFAULT 'new',
    lead_source VARCHAR(100),
    lead_score INT DEFAULT 0,
    
    -- Preferences
    email_opt_out BOOLEAN DEFAULT FALSE,
    sms_opt_out BOOLEAN DEFAULT FALSE,
    preferred_contact_method ENUM('email', 'phone', 'sms', 'mail') DEFAULT 'email',
    
    -- Social media
    twitter_handle VARCHAR(100),
    facebook_url VARCHAR(255),
    
    -- Personal details
    birthday DATE,
    anniversary DATE,
    spouse_name VARCHAR(100),
    
    -- Notes and tracking
    notes TEXT,
    tags JSON,
    custom_fields JSON,
    
    -- Ownership and tracking
    owner_id INT,
    created_by INT,
    last_contacted TIMESTAMP NULL,
    next_follow_up TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (reports_to_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_name (first_name, last_name),
    INDEX idx_email (email),
    INDEX idx_company (company_id),
    INDEX idx_owner (owner_id),
    INDEX idx_lead_status (lead_status),
    INDEX idx_category (category)
);

-- Tags system for flexible categorization
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#3B82F6',
    description TEXT,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category)
);

CREATE TABLE contact_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    contact_id INT NOT NULL,
    tag_id INT NOT NULL,
    tagged_by INT,
    tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (tagged_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_contact_tag (contact_id, tag_id)
);

-- Enhanced Projects table
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    objectives TEXT,
    deliverables TEXT,
    requirements TEXT,
    
    -- Classification
    category VARCHAR(100),
    type ENUM('internal', 'client', 'maintenance', 'research') DEFAULT 'client',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived') DEFAULT 'planning',
    
    -- Dates and timeline
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Financial
    budget DECIMAL(15,2),
    actual_cost DECIMAL(15,2) DEFAULT 0,
    hourly_rate DECIMAL(8,2),
    currency VARCHAR(3) DEFAULT 'USD',
    billing_type ENUM('fixed', 'hourly', 'milestone') DEFAULT 'fixed',
    
    -- Progress tracking
    progress_percentage INT DEFAULT 0,
    health_status ENUM('green', 'yellow', 'red') DEFAULT 'green',
    
    -- Relationships
    client_id INT,
    company_id INT,
    project_manager_id INT,
    department_id INT,
    parent_project_id INT,
    
    -- Project management
    methodology ENUM('agile', 'waterfall', 'hybrid', 'kanban', 'scrum') DEFAULT 'agile',
    risk_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    visibility ENUM('public', 'private', 'team') DEFAULT 'team',
    
    -- Settings
    time_tracking_enabled BOOLEAN DEFAULT TRUE,
    budget_tracking_enabled BOOLEAN DEFAULT TRUE,
    client_access_enabled BOOLEAN DEFAULT FALSE,
    
    -- Custom fields
    custom_fields JSON,
    tags JSON,
    
    -- Timestamps and tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (project_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_manager (project_manager_id),
    INDEX idx_client (client_id),
    INDEX idx_company (company_id),
    INDEX idx_dates (start_date, end_date)
);

-- Enhanced Tasks table
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    project_id INT NOT NULL,
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_number VARCHAR(50),
    
    -- Classification
    type ENUM('task', 'bug', 'feature', 'milestone', 'epic') DEFAULT 'task',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('todo', 'in-progress', 'review', 'testing', 'completed', 'cancelled') DEFAULT 'todo',
    
    -- Assignment and ownership
    assigned_to INT,
    created_by INT,
    reporter_id INT,
    
    -- Timeline
    start_date DATE,
    due_date DATE,
    completed_date TIMESTAMP NULL,
    
    -- Effort tracking
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2) DEFAULT 0,
    remaining_hours DECIMAL(6,2),
    progress_percentage INT DEFAULT 0,
    
    -- Relationships
    parent_task_id INT,
    milestone_id INT,
    
    -- Additional information
    labels JSON,
    tags JSON,
    custom_fields JSON,
    
    -- File attachments
    attachments JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_assigned (assigned_to),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date)
);

-- Project team members with roles
CREATE TABLE project_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('manager', 'lead', 'developer', 'designer', 'tester', 'analyst', 'client') DEFAULT 'developer',
    hourly_rate DECIMAL(8,2),
    allocation_percentage INT DEFAULT 100,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    added_by INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_project_member (project_id, user_id),
    INDEX idx_project_members (project_id),
    INDEX idx_user_projects (user_id)
);

-- Enhanced Activities/Timeline table
CREATE TABLE activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Activity details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Relationships
    user_id INT,
    project_id INT,
    task_id INT,
    contact_id INT,
    company_id INT,
    
    -- Activity data
    old_values JSON,
    new_values JSON,
    metadata JSON,
    
    -- Categorization
    category ENUM('system', 'user', 'automated', 'integration') DEFAULT 'user',
    importance ENUM('low', 'medium', 'high') DEFAULT 'medium',
    
    -- Timestamps
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_user_activities (user_id),
    INDEX idx_project_activities (project_id),
    INDEX idx_contact_activities (contact_id),
    INDEX idx_activity_date (activity_date),
    INDEX idx_type (type)
);

-- Deals/Opportunities for sales pipeline
CREATE TABLE deals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    deal_number VARCHAR(50) UNIQUE,
    
    -- Financial
    value DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    probability INT DEFAULT 50,
    
    -- Relationships
    contact_id INT,
    company_id INT,
    owner_id INT NOT NULL,
    
    -- Pipeline
    stage ENUM('prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost') DEFAULT 'prospecting',
    source VARCHAR(100),
    
    -- Timeline
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Additional information
    competitor VARCHAR(255),
    next_step TEXT,
    tags JSON,
    custom_fields JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_owner (owner_id),
    INDEX idx_stage (stage),
    INDEX idx_company (company_id),
    INDEX idx_close_date (expected_close_date)
);

-- Quotes/Proposals
CREATE TABLE quotes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relationships
    deal_id INT,
    contact_id INT,
    company_id INT,
    project_id INT,
    
    -- Quote details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Financial
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status and timeline
    status ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired') DEFAULT 'draft',
    valid_until DATE,
    sent_date DATE,
    accepted_date DATE,
    
    -- Terms
    payment_terms VARCHAR(255),
    notes TEXT,
    terms_conditions TEXT,
    
    -- Line items (stored as JSON for flexibility)
    line_items JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_company (company_id),
    INDEX idx_deal (deal_id)
);

-- Invoices
CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Relationships
    quote_id INT,
    project_id INT,
    contact_id INT,
    company_id INT,
    
    -- Invoice details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Financial
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Status and dates
    status ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Payment details
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    
    -- Terms
    payment_terms VARCHAR(255),
    notes TEXT,
    
    -- Line items
    line_items JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_company (company_id),
    INDEX idx_project (project_id),
    INDEX idx_due_date (due_date)
);

-- Time tracking
CREATE TABLE time_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Relationships
    user_id INT NOT NULL,
    project_id INT,
    task_id INT,
    
    -- Time details
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    description TEXT,
    
    -- Billing
    billable BOOLEAN DEFAULT TRUE,
    hourly_rate DECIMAL(8,2),
    amount DECIMAL(10,2),
    invoiced BOOLEAN DEFAULT FALSE,
    invoice_id INT,
    
    -- Status
    status ENUM('running', 'stopped', 'approved', 'rejected') DEFAULT 'stopped',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    
    -- Timestamps
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_time (user_id),
    INDEX idx_project_time (project_id),
    INDEX idx_date (date),
    INDEX idx_billable (billable)
);

-- Document management
CREATE TABLE documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- File information
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),
    
    -- Relationships
    project_id INT,
    task_id INT,
    contact_id INT,
    company_id INT,
    deal_id INT,
    
    -- Classification
    category VARCHAR(100),
    tags JSON,
    description TEXT,
    
    -- Access control
    visibility ENUM('public', 'private', 'team', 'client') DEFAULT 'team',
    uploaded_by INT NOT NULL,
    
    -- Version control
    version INT DEFAULT 1,
    parent_document_id INT,
    is_current_version BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX idx_project_docs (project_id),
    INDEX idx_uploader (uploaded_by),
    INDEX idx_category (category)
);

-- Notifications system
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- Recipient
    user_id INT NOT NULL,
    
    -- Notification content
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    
    -- Relationships
    related_id INT,
    related_type VARCHAR(100),
    
    -- Delivery
    channels JSON, -- email, sms, push, in-app
    
    -- Status
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
    read_at TIMESTAMP NULL,
    
    -- Data
    data JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_notifications (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_scheduled (scheduled_for)
);

-- Audit logging for compliance
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
    
    -- User and session
    user_id INT,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id INT,
    
    -- Data changes
    old_values JSON,
    new_values JSON,
    
    -- Context
    url VARCHAR(500),
    method VARCHAR(10),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_audit (user_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- Custom fields system
CREATE TABLE custom_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    field_type ENUM('text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'select', 'multi-select', 'email', 'url', 'phone') NOT NULL,
    entity_type ENUM('contact', 'company', 'project', 'task', 'deal') NOT NULL,
    options JSON, -- for select fields
    is_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    validation_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity_type (entity_type)
);

CREATE TABLE custom_field_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    custom_field_id INT NOT NULL,
    entity_type ENUM('contact', 'company', 'project', 'task', 'deal') NOT NULL,
    entity_id INT NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_field_id) REFERENCES custom_fields(id) ON DELETE CASCADE,
    UNIQUE KEY unique_field_entity (custom_field_id, entity_type, entity_id),
    INDEX idx_entity (entity_type, entity_id)
);

-- Email templates and campaigns
CREATE TABLE email_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT,
    body_text TEXT,
    template_type ENUM('general', 'welcome', 'follow-up', 'proposal', 'invoice', 'reminder') DEFAULT 'general',
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE email_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    template_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    recipient_list JSON,
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    stats JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Task dependencies
CREATE TABLE task_dependencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    depends_on_task_id INT NOT NULL,
    dependency_type ENUM('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish') DEFAULT 'finish-to-start',
    lag_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
);

-- Project dependencies
CREATE TABLE project_dependencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    depends_on_project_id INT NOT NULL,
    dependency_type ENUM('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish') DEFAULT 'finish-to-start',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_dependency (project_id, depends_on_project_id)
);

-- Task comments
CREATE TABLE task_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    parent_comment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES task_comments(id) ON DELETE CASCADE,
    INDEX idx_task_comments (task_id),
    INDEX idx_user_comments (user_id)
);

-- Project templates
CREATE TABLE project_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_data JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Leads Management Tables
CREATE TABLE lead_sources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost_per_lead DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE lead_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(100),
    website VARCHAR(255),
    linkedin_url VARCHAR(255),
    
    -- Lead Classification
    lead_source_id INT,
    lead_status_id INT DEFAULT 1,
    lead_score INT DEFAULT 0,
    temperature ENUM('cold', 'warm', 'hot') DEFAULT 'cold',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Contact Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Business Information
    annual_revenue DECIMAL(15,2),
    company_size ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
    industry VARCHAR(100),
    budget_range VARCHAR(50),
    decision_maker BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    assigned_to INT,
    last_contact_date TIMESTAMP NULL,
    next_follow_up TIMESTAMP NULL,
    conversion_date TIMESTAMP NULL,
    converted_to_contact_id INT NULL,
    
    -- Metadata
    notes TEXT,
    tags JSON,
    custom_fields JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_source_id) REFERENCES lead_sources(id),
    FOREIGN KEY (lead_status_id) REFERENCES lead_statuses(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (converted_to_contact_id) REFERENCES contacts(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_leads_email (email),
    INDEX idx_leads_company (company),
    INDEX idx_leads_status (lead_status_id),
    INDEX idx_leads_source (lead_source_id),
    INDEX idx_leads_assigned (assigned_to),
    INDEX idx_leads_score (lead_score),
    INDEX idx_leads_created (created_at)
);

CREATE TABLE lead_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    activity_type ENUM('call', 'email', 'meeting', 'note', 'task', 'demo', 'proposal', 'other') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INT DEFAULT 0,
    outcome ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    next_action VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_lead_activities_lead (lead_id),
    INDEX idx_lead_activities_date (activity_date),
    INDEX idx_lead_activities_type (activity_type)
);

CREATE TABLE lead_scoring_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    condition_field VARCHAR(50) NOT NULL,
    condition_operator ENUM('equals', 'contains', 'greater_than', 'less_than', 'in_range') NOT NULL,
    condition_value VARCHAR(255) NOT NULL,
    score_points INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE lead_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type ENUM('email', 'social', 'advertising', 'event', 'referral', 'other') NOT NULL,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(10,2) DEFAULT 0.00,
    target_audience TEXT,
    goals TEXT,
    status ENUM('planning', 'active', 'paused', 'completed') DEFAULT 'planning',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE lead_campaign_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    lead_id INT NOT NULL,
    joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'responded', 'unsubscribed', 'bounced') DEFAULT 'active',
    
    FOREIGN KEY (campaign_id) REFERENCES lead_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_campaign_lead (campaign_id, lead_id)
);

CREATE TABLE lead_conversions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT NOT NULL,
    contact_id INT NOT NULL,
    deal_id INT NULL,
    conversion_type ENUM('qualified', 'opportunity', 'customer') NOT NULL,
    conversion_value DECIMAL(15,2) DEFAULT 0.00,
    conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    converted_by INT,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id),
    FOREIGN KEY (converted_by) REFERENCES users(id),
    
    INDEX idx_conversions_lead (lead_id),
    INDEX idx_conversions_date (conversion_date)
);

-- Insert default system data
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('company_name', 'Your Company', 'string', 'Company name', TRUE),
('company_logo', '', 'string', 'Company logo URL', TRUE),
('default_currency', 'USD', 'string', 'Default currency', TRUE),
('default_timezone', 'UTC', 'string', 'Default timezone', TRUE),
('date_format', 'Y-m-d', 'string', 'Default date format', TRUE),
('time_format', 'H:i', 'string', 'Default time format', TRUE),
('items_per_page', '25', 'number', 'Default items per page', TRUE),
('session_timeout', '3600', 'number', 'Session timeout in seconds', FALSE),
('password_min_length', '8', 'number', 'Minimum password length', FALSE),
('max_login_attempts', '5', 'number', 'Maximum failed login attempts', FALSE),
('enable_two_factor', 'false', 'boolean', 'Enable two-factor authentication', FALSE),
('enable_email_notifications', 'true', 'boolean', 'Enable email notifications', FALSE);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access', '["*"]', TRUE),
('admin', 'Administrator', 'Administrative access', '["users.*", "companies.*", "projects.*", "settings.*"]', TRUE),
('manager', 'Manager', 'Management access', '["projects.*", "tasks.*", "contacts.*", "reports.view"]', TRUE),
('employee', 'Employee', 'Standard employee access', '["projects.view", "tasks.*", "contacts.view", "time_entries.*"]', TRUE),
('client', 'Client', 'Client access', '["projects.view", "tasks.view", "documents.view"]', TRUE);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Executive', 'Executive leadership team'),
('Sales', 'Sales and business development'),
('Marketing', 'Marketing and communications'),
('Development', 'Software development team'),
('Design', 'Design and user experience'),
('Operations', 'Operations and administration'),
('Finance', 'Finance and accounting'),
('Human Resources', 'Human resources and people operations');

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, job_title, status, email_verified) VALUES
('admin@company.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'System Administrator', 'active', TRUE);

-- Assign super admin role to the admin user
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1);

-- Insert default tags
INSERT INTO tags (name, color, category, created_by) VALUES
('Hot Lead', '#EF4444', 'lead', 1),
('VIP Client', '#F59E0B', 'client', 1),
('High Priority', '#DC2626', 'priority', 1),
('Follow Up', '#3B82F6', 'action', 1),
('Proposal Sent', '#10B981', 'status', 1),
('Cold Lead', '#6B7280', 'lead', 1);

-- Create indexes for performance
CREATE INDEX idx_users_email_status ON users(email, status);
CREATE INDEX idx_projects_status_priority ON projects(status, priority);
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_contacts_company_category ON contacts(company_id, category);
CREATE INDEX idx_activities_date_type ON activities(activity_date, type);

-- Insert default lead sources
INSERT INTO lead_sources (name, description) VALUES
('Website Form', 'Leads from website contact forms'),
('Social Media', 'Leads from social media platforms'),
('Email Marketing', 'Leads from email campaigns'),
('Cold Calling', 'Leads from cold calling efforts'),
('Referral', 'Leads from customer referrals'),
('Trade Show', 'Leads from trade shows and events'),
('Google Ads', 'Leads from Google advertising'),
('LinkedIn', 'Leads from LinkedIn outreach'),
('Partner Referral', 'Leads from business partners'),
('Direct Mail', 'Leads from direct mail campaigns');

-- Insert default lead statuses
INSERT INTO lead_statuses (name, description, color, sort_order) VALUES
('New', 'Newly created lead', '#6B7280', 1),
('Contacted', 'Initial contact made', '#3B82F6', 2),
('Qualified', 'Lead has been qualified', '#F59E0B', 3),
('Proposal Sent', 'Proposal has been sent', '#8B5CF6', 4),
('Negotiation', 'In negotiation phase', '#EF4444', 5),
('Converted', 'Successfully converted', '#10B981', 6),
('Lost', 'Lead was lost', '#6B7280', 7),
('Unqualified', 'Lead does not meet criteria', '#F87171', 8);

-- Insert sample lead scoring rules
INSERT INTO lead_scoring_rules (name, description, condition_field, condition_operator, condition_value, score_points) VALUES
('Company Size Large', 'Large companies get higher scores', 'company_size', 'equals', '1000+', 25),
('High Budget Range', 'High budget leads get more points', 'budget_range', 'contains', 'high', 20),
('Decision Maker', 'Decision makers get priority', 'decision_maker', 'equals', 'true', 30),
('High Revenue', 'Companies with high revenue', 'annual_revenue', 'greater_than', '1000000', 25),
('Email Engagement', 'Leads who engage with emails', 'activity_type', 'equals', 'email', 10),
('Demo Requested', 'Leads who request demos', 'activity_type', 'equals', 'demo', 35),
('Multiple Contacts', 'Leads with multiple touchpoints', 'contact_count', 'greater_than', '3', 15);

COMMIT; 