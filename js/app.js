// Configuration
const API_BASE_URL = './api';

// Global variables
let currentSection = 'dashboard';
let contacts = [];
let projects = [];
let tasks = [];
let events = [];
let dashboardData = {};
let currentCalendarDate = new Date();
let charts = {};
let currentProjectView = 'grid';
let currentProjectPage = 1;
let projectsPerPage = 12;
let projectSortField = 'name';
let projectSortDirection = 'asc';
let selectedProjects = [];
let projectFilters = {
    search: '',
    status: '',
    priority: '',
    manager: '',
    dateFrom: '',
    dateTo: ''
};
let currentProjectId = null;
let currentProjectTab = 'kanban';
let projectTasks = [];

// Authentication check
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return JSON.parse(user);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (user) {
        updateUserInfo(user);
        initializeApp();
    }
});

function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
}

function initializeApp() {
    setupEventListeners();
    showSection('dashboard');
}

function setupEventListeners() {
    // Form handlers
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
    
    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }
    
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
    }
    
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
}

// API Helper functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error connecting to server, using demo data', 'warning');
        return null;
    }
}

// Navigation
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    const sectionElement = document.getElementById(section + '-section');
    if (sectionElement) {
        sectionElement.classList.remove('hidden');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-primary', 'text-white');
        item.classList.add('text-gray-700');
    });
    
    const activeNavItem = document.querySelector(`[onclick*="${section}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('bg-primary', 'text-white');
        activeNavItem.classList.remove('text-gray-700');
    }
    
    currentSection = section;
    
    const titles = {
        dashboard: 'Dashboard',
        contacts: 'Contact Management',
        projects: 'Project Management',
        tasks: 'Task Management',
        calendar: 'Calendar & Events',
        reports: 'Reports & Analytics',
        settings: 'Settings'
    };
    
    const subtitles = {
        dashboard: "Welcome back! Here's what's happening today.",
        contacts: 'Manage your contacts and relationships',
        projects: 'Track and manage your projects',
        tasks: 'Organize and prioritize your tasks',  
        calendar: 'Schedule and manage events',
        reports: 'Analyze your business performance',
        settings: 'Configure your account preferences'
    };
    
    document.getElementById('page-title').textContent = titles[section];
    document.getElementById('page-subtitle').textContent = subtitles[section];
    
    loadSectionData(section);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

// Section data loading
async function loadSectionData(section) {
    try {
        switch(section) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'contacts':
                await loadContacts();
                renderContacts();
                break;
            case 'projects':
                await loadProjects();
                renderProjects();
                break;
            case 'tasks':
                await loadTasks();
                renderTasks();
                break;
            case 'calendar':
                renderCalendar();
                break;
            case 'reports':
                initializeCharts();
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
    }
}

// Dashboard functions
async function loadDashboardData() {
    const response = await apiRequest('/dashboard.php');
    
    if (response && response.success) {
        dashboardData = response.data;
    } else {
        // Mock data fallback
        dashboardData = {
            stats: {
                total_contacts: 245,
                active_projects: 18,
                pending_tasks: 56,
                total_revenue: 89750
            },
            revenue_chart: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                data: [12000, 19000, 15000, 25000, 22000, 30000]
            },
            activities: [
                { type: 'contact', message: 'New contact added: John Smith', time: '2 minutes ago' },
                { type: 'project', message: 'Project "Website Redesign" completed', time: '1 hour ago' },
                { type: 'task', message: 'Task deadline approaching: Client meeting', time: '3 hours ago' }
            ]
        };
    }
    
    renderDashboard();
}

function renderDashboard() {
    const stats = dashboardData.stats;
    
    // Update stat cards with animation
    animateNumber(document.getElementById('total-contacts'), stats.total_contacts);
    animateNumber(document.getElementById('active-projects'), stats.active_projects);
    animateNumber(document.getElementById('pending-tasks'), stats.pending_tasks);
    animateNumber(document.getElementById('total-revenue'), stats.total_revenue, '$');
    
    // Update growth indicators
    document.getElementById('contacts-growth').textContent = '+12% from last month';
    document.getElementById('projects-growth').textContent = '+5 new this week';
    document.getElementById('tasks-due').textContent = '23 due today';
    document.getElementById('revenue-growth').textContent = '+18% from last month';
    
    // Render activities
    renderRecentActivities();
    
    // Initialize charts
    setTimeout(() => {
        initializeRevenueChart();
    }, 100);
}

function animateNumber(element, target, prefix = '') {
    if (!element) return;
    
    const start = 0;
    const duration = 1000;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = prefix + Math.floor(current).toLocaleString();
    }, 16);
}

function renderRecentActivities() {
    const container = document.getElementById('recent-activities');
    if (!container) return;
    
    const activities = dashboardData.activities || [];
    
    container.innerHTML = activities.map(activity => `
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 ${getActivityColor(activity.type)} rounded-full flex items-center justify-center">
                <i class="fas ${getActivityIcon(activity.type)} text-white text-xs"></i>
            </div>
            <div>
                <p class="text-sm font-medium text-gray-800">${activity.message}</p>
                <p class="text-xs text-gray-500">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

function getActivityColor(type) {
    const colors = {
        contact: 'bg-blue-500',
        project: 'bg-green-500',
        task: 'bg-yellow-500',
        deal: 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
}

function getActivityIcon(type) {
    const icons = {
        contact: 'fa-user-plus',
        project: 'fa-check',
        task: 'fa-exclamation',
        deal: 'fa-dollar-sign'
    };
    return icons[type] || 'fa-info';
}

function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    const chartData = dashboardData.revenue_chart || {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [12000, 19000, 15000, 25000, 22000, 30000]
    };
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Revenue',
                data: chartData.data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Contact functions
async function loadContacts() {
    const response = await apiRequest('/contacts.php');
    
    if (response && response.success) {
        contacts = response.data;
    } else {
        // Mock data fallback
        contacts = [
            { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '555-0101', company: 'ABC Corp', job_title: 'CEO', category: 'client', created_at: '2024-01-15' },
            { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', phone: '555-0102', company: 'XYZ Inc', job_title: 'Manager', category: 'prospect', created_at: '2024-01-16' },
            { id: 3, first_name: 'Mike', last_name: 'Johnson', email: 'mike@example.com', phone: '555-0103', company: 'Tech Solutions', job_title: 'Developer', category: 'partner', created_at: '2024-01-17' }
        ];
    }
}

function renderContacts() {
    const container = document.getElementById('contacts-table');
    if (!container) return;
    
    const filteredContacts = getFilteredContacts();
    
    container.innerHTML = `
        <table class="w-full">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${filteredContacts.map(contact => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-900">${contact.first_name} ${contact.last_name}</div>
                            ${contact.job_title ? `<div class="text-sm text-gray-500">${contact.job_title}</div>` : ''}
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">${contact.email || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${contact.company || 'N/A'}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(contact.category)}">
                                ${contact.category}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <button onclick="editContact(${contact.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteContact(${contact.id})" class="text-red-600 hover:text-red-900">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getFilteredContacts() {
    let filtered = [...contacts];
    
    // Search filter
    const searchTerm = document.getElementById('contact-search')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(contact => 
            `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchTerm) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
            (contact.company && contact.company.toLowerCase().includes(searchTerm))
        );
    }
    
    // Category filter
    const categoryFilter = document.getElementById('contact-category-filter')?.value;
    if (categoryFilter) {
        filtered = filtered.filter(contact => contact.category === categoryFilter);
    }
    
    return filtered;
}

function searchContacts() {
    renderContacts();
}

function filterContacts() {
    renderContacts();
}

function getCategoryColor(category) {
    const colors = {
        client: 'bg-green-100 text-green-800',
        prospect: 'bg-blue-100 text-blue-800',
        partner: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
}

// Project functions
async function loadProjects() {
    const response = await apiRequest('/projects.php');
    
    if (response && response.success) {
        projects = response.data;
    } else {
        // Enhanced mock data fallback with SOP-level fields
        projects = [
            { 
                id: 1, 
                name: 'Website Redesign', 
                code: 'PRJ-2024-001',
                description: 'Complete redesign of company website with modern UI/UX', 
                status: 'active', 
                priority: 'high', 
                type: 'client',
                progress: 75, 
                budget: 25000,
                estimated_hours: 320,
                start_date: '2024-01-01', 
                end_date: '2024-03-01',
                manager: 'john-doe',
                client_id: 1,
                department: 'development',
                risk_level: 'medium',
                methodology: 'agile',
                quality_score: 8,
                objectives: 'Improve user experience and conversion rates',
                deliverables: 'New website, mobile responsive design, CMS integration',
                requirements: 'Modern design, fast loading, SEO optimized',
                tags: 'web, design, responsive',
                visibility: 'client',
                created_at: '2024-01-01',
                team_members: ['john-doe', 'jane-smith'],
                tasks_count: 12,
                completed_tasks: 9
            },
            { 
                id: 2, 
                name: 'Mobile App Development', 
                code: 'PRJ-2024-002',
                description: 'Native mobile app for iOS and Android platforms', 
                status: 'planning', 
                priority: 'medium', 
                type: 'internal',
                progress: 25, 
                budget: 50000,
                estimated_hours: 800,
                start_date: '2024-02-01', 
                end_date: '2024-06-01',
                manager: 'jane-smith',
                client_id: 2,
                department: 'development',
                risk_level: 'high',
                methodology: 'scrum',
                quality_score: 9,
                objectives: 'Launch mobile presence for better customer engagement',
                deliverables: 'iOS app, Android app, backend API, admin panel',
                requirements: 'Cross-platform compatibility, offline functionality',
                tags: 'mobile, ios, android, api',
                visibility: 'team',
                created_at: '2024-01-15',
                team_members: ['jane-smith', 'mike-johnson'],
                tasks_count: 18,
                completed_tasks: 4
            },
            { 
                id: 3, 
                name: 'Database Migration', 
                code: 'PRJ-2024-003',
                description: 'Migrate legacy database to modern cloud infrastructure', 
                status: 'completed', 
                priority: 'critical', 
                type: 'maintenance',
                progress: 100, 
                budget: 15000,
                estimated_hours: 160,
                start_date: '2023-12-01', 
                end_date: '2024-01-15',
                manager: 'mike-johnson',
                client_id: null,
                department: 'operations',
                risk_level: 'critical',
                methodology: 'waterfall',
                quality_score: 10,
                objectives: 'Improve performance and scalability',
                deliverables: 'Migrated database, backup systems, documentation',
                requirements: 'Zero downtime, data integrity, performance improvement',
                tags: 'database, migration, cloud',
                visibility: 'private',
                created_at: '2023-11-15',
                team_members: ['mike-johnson'],
                tasks_count: 8,
                completed_tasks: 8
            },
            { 
                id: 4, 
                name: 'Marketing Campaign Q1', 
                code: 'PRJ-2024-004',
                description: 'Comprehensive digital marketing campaign for Q1 2024', 
                status: 'on-hold', 
                priority: 'medium', 
                type: 'internal',
                progress: 40, 
                budget: 12000,
                estimated_hours: 120,
                start_date: '2024-01-01', 
                end_date: '2024-03-31',
                manager: 'jane-smith',
                client_id: null,
                department: 'marketing',
                risk_level: 'low',
                methodology: 'kanban',
                quality_score: 7,
                objectives: 'Increase brand awareness and lead generation',
                deliverables: 'Campaign materials, social media content, analytics reports',
                requirements: 'Multi-channel approach, measurable ROI',
                tags: 'marketing, digital, campaign',
                visibility: 'public',
                created_at: '2023-12-15',
                team_members: ['jane-smith', 'john-doe'],
                tasks_count: 10,
                completed_tasks: 4
            },
            { 
                id: 5, 
                name: 'AI Research Initiative', 
                code: 'PRJ-2024-005',
                description: 'Research and development of AI solutions for business processes', 
                status: 'cancelled', 
                priority: 'low', 
                type: 'research',
                progress: 15, 
                budget: 35000,
                estimated_hours: 400,
                start_date: '2024-01-15', 
                end_date: '2024-08-15',
                manager: 'mike-johnson',
                client_id: null,
                department: 'development',
                risk_level: 'high',
                methodology: 'hybrid',
                quality_score: 6,
                objectives: 'Explore AI applications for automation',
                deliverables: 'Research report, prototype, implementation plan',
                requirements: 'Cutting-edge technology, scalable solutions',
                tags: 'ai, research, automation',
                visibility: 'private',
                created_at: '2024-01-01',
                team_members: ['mike-johnson'],
                tasks_count: 6,
                completed_tasks: 1
            }
        ];
    }
    
    updateProjectStats();
}

function renderProjects() {
    const container = document.getElementById('projects-grid');
    if (!container) return;
    
    const filteredProjects = getFilteredProjects();
    
    container.innerHTML = filteredProjects.map(project => `
        <div class="bg-white rounded-xl p-6 shadow-lg card-hover smooth-transition border-l-4 ${getBorderColor(project.priority)}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                <h4 class="font-semibold text-lg text-gray-800">${project.name}</h4>
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${project.code}</span>
                    </div>
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}">
                        ${project.status.replace('-', ' ').toUpperCase()}
                </span>
            </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 text-xs rounded ${getPriorityColor(project.priority)}">${project.priority.toUpperCase()}</span>
                    <div class="relative">
                        <button onclick="toggleProjectMenu(${project.id})" class="p-1 hover:bg-gray-100 rounded">
                            <i class="fas fa-ellipsis-v text-gray-400"></i>
                        </button>
                        <div id="project-menu-${project.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                            <button onclick="viewProjectDetails(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-eye mr-2"></i>View Details
                            </button>
                            <button onclick="editProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-edit mr-2"></i>Edit Project
                            </button>
                            <button onclick="duplicateProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-copy mr-2"></i>Duplicate
                            </button>
                            <button onclick="archiveProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-archive mr-2"></i>Archive
                            </button>
                            <hr class="my-1">
                            <button onclick="deleteProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${project.description}</p>
            
            <div class="space-y-3">
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>${project.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Budget:</span>
                        <span class="font-medium">$${project.budget?.toLocaleString()}</span>
                </div>
                    <div>
                        <span class="text-gray-500">Hours:</span>
                        <span class="font-medium">${project.estimated_hours || 0}h</span>
            </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Manager:</span>
                        <span class="font-medium">${getManagerName(project.manager)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Due:</span>
                        <span class="font-medium">${formatDate(project.end_date)}</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <i class="fas fa-tasks text-gray-400 text-xs"></i>
                        <span class="text-xs text-gray-500">${project.completed_tasks}/${project.tasks_count} tasks</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i class="fas fa-users text-gray-400 text-xs"></i>
                        <span class="text-xs text-gray-500">${project.team_members?.length || 0} members</span>
                    </div>
                    <span class="text-xs px-2 py-1 rounded ${getRiskColor(project.risk_level)}">
                        ${project.risk_level} risk
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function getFilteredProjects() {
    let filtered = [...projects];
    
    const searchTerm = document.getElementById('project-search')?.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(project => 
            project.name.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm)
        );
    }
    
    const statusFilter = document.getElementById('project-status-filter')?.value;
    if (statusFilter) {
        filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    return filtered;
}

function searchProjects() {
    renderProjects();
}

function filterProjects() {
    renderProjects();
}

function getStatusColor(status) {
    const colors = {
        planning: 'bg-yellow-100 text-yellow-800',
        active: 'bg-green-100 text-green-800',
        'on-hold': 'bg-gray-100 text-gray-800',
        completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
    const colors = {
        low: 'bg-gray-100 text-gray-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
}

// Task functions
async function loadTasks() {
    const response = await apiRequest('/tasks.php');
    
    if (response && response.success) {
        tasks = response.data;
    } else {
        // Mock data fallback
        tasks = [
            { id: 1, title: 'Design Homepage', description: 'Create mockups for new homepage', status: 'todo', priority: 'high', due_date: '2024-02-15', project_id: 1 },
            { id: 2, title: 'Database Setup', description: 'Configure production database', status: 'in-progress', priority: 'medium', due_date: '2024-02-10', project_id: 2 },
            { id: 3, title: 'Client Meeting', description: 'Present initial designs to client', status: 'review', priority: 'high', due_date: '2024-02-12', project_id: 1 },
            { id: 4, title: 'Testing Phase', description: 'Complete all unit tests', status: 'completed', priority: 'low', due_date: '2024-02-08', project_id: 3 }
        ];
    }
}

function renderTasks() {
    const columns = ['todo', 'in-progress', 'review', 'completed'];
    
    columns.forEach(column => {
        const container = document.getElementById(`${column === 'in-progress' ? 'progress' : column}-tasks`);
        const countElement = document.getElementById(`${column === 'in-progress' ? 'progress' : column}-count`);
        
        if (!container) return;
        
        const columnTasks = tasks.filter(task => task.status === column);
        
        if (countElement) {
            countElement.textContent = columnTasks.length;
        }
        
        container.innerHTML = columnTasks.map(task => `
            <div class="task-card bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md transition-shadow" 
                 draggable="true" ondragstart="drag(event, ${task.id})">
                <div class="flex justify-between items-start mb-2">
                    <h5 class="font-medium text-gray-800">${task.title}</h5>
                    <span class="px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}">${task.priority}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${task.description}</p>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-500">${task.due_date ? formatDate(task.due_date) : 'No due date'}</span>
                    <div class="flex gap-1">
                        <button onclick="editTask(${task.id})" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteTask(${task.id})" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

// Drag and drop functions for tasks
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, taskId) {
    ev.dataTransfer.setData("text", taskId);
}

function drop(ev, newStatus) {
    ev.preventDefault();
    const taskId = parseInt(ev.dataTransfer.getData("text"));
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        task.status = newStatus;
        renderTasks();
        showNotification(`Task moved to ${newStatus.replace('-', ' ')}`, 'success');
    }
}

// Calendar functions
function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    let calendarHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold">${monthNames[month]} ${year}</h3>
            <div class="flex gap-2">
                <button onclick="previousMonth()" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button onclick="nextMonth()" class="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        <div class="grid grid-cols-7 gap-1 mb-2">
            <div class="p-2 text-center font-medium text-gray-500">Sun</div>
            <div class="p-2 text-center font-medium text-gray-500">Mon</div>
            <div class="p-2 text-center font-medium text-gray-500">Tue</div>
            <div class="p-2 text-center font-medium text-gray-500">Wed</div>
            <div class="p-2 text-center font-medium text-gray-500">Thu</div>
            <div class="p-2 text-center font-medium text-gray-500">Fri</div>
            <div class="p-2 text-center font-medium text-gray-500">Sat</div>
        </div>
        <div class="grid grid-cols-7 gap-1">
    `;
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarHTML += '<div class="calendar-day p-2 border border-gray-200"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        const todayClass = isToday ? 'bg-primary text-white' : 'hover:bg-gray-100';
        
        calendarHTML += `
            <div class="calendar-day p-2 border border-gray-200 ${todayClass} cursor-pointer">
                <div class="font-medium">${day}</div>
                <div class="text-xs space-y-1">
                    <!-- Events for this day would go here -->
                </div>
            </div>
        `;
    }
    
    calendarHTML += '</div>';
    container.innerHTML = calendarHTML;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

// Chart functions
function initializeCharts() {
    setTimeout(() => {
        initializeSalesChart();
        initializeProjectChart();
    }, 100);
}

function initializeSalesChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (charts.sales) {
        charts.sales.destroy();
    }
    
    charts.sales = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Sales',
                data: [12, 19, 15, 25, 22, 30],
                backgroundColor: 'rgba(79, 70, 229, 0.8)',
                borderColor: '#4f46e5',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function initializeProjectChart() {
    const ctx = document.getElementById('projectChart');
    if (!ctx) return;
    
    if (charts.project) {
        charts.project.destroy();
    }
    
    charts.project = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Planning', 'Active', 'On Hold', 'Completed'],
            datasets: [{
                data: [5, 12, 3, 8],
                backgroundColor: ['#fbbf24', '#10b981', '#6b7280', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Modal functions
function openContactModal(contactId = null) {
    const modal = document.getElementById('contact-modal');
    const form = document.getElementById('contact-form');
    const title = document.getElementById('contact-modal-title');
    
    if (contactId) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            title.textContent = 'Edit Contact';
            document.getElementById('contact-id').value = contact.id;
            document.getElementById('first-name').value = contact.first_name;
            document.getElementById('last-name').value = contact.last_name;
            document.getElementById('email').value = contact.email || '';
            document.getElementById('phone').value = contact.phone || '';
            document.getElementById('company').value = contact.company || '';
            document.getElementById('job-title').value = contact.job_title || '';
            document.getElementById('category').value = contact.category;
            document.getElementById('notes').value = contact.notes || '';
        }
    } else {
        title.textContent = 'Add New Contact';
        form.reset();
        document.getElementById('contact-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('project-modal-title');
    
    if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('project-id').value = project.id;
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description || '';
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-priority').value = project.priority;
            document.getElementById('project-start-date').value = project.start_date || '';
            document.getElementById('project-end-date').value = project.end_date || '';
            document.getElementById('project-budget').value = project.budget || '';
        }
    } else {
        title.textContent = 'Create New Project';
        form.reset();
        document.getElementById('project-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const title = document.getElementById('task-modal-title');
    
    if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-due-date').value = task.due_date || '';
        }
    } else {
        title.textContent = 'Add New Task';
        form.reset();
        document.getElementById('task-id').value = '';
    }
    
    modal.classList.remove('hidden');
}

function openEventModal() {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    form.reset();
    modal.classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Form handlers
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('contact-submit-text');
    const submitSpinner = document.getElementById('contact-submit-spinner');
    
    // Show loading state
    submitText.textContent = 'Saving...';
    submitSpinner.classList.remove('hidden');
    submitButton.disabled = true;
    
    try {
        const contactData = {
            id: formData.get('id') || null,
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            job_title: formData.get('job_title'),
            category: formData.get('category'),
            notes: formData.get('notes')
        };
        
        const isEdit = contactData.id;
        const endpoint = isEdit ? `/contacts.php?id=${contactData.id}` : '/contacts.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(contactData)
        });
        
        if (response?.success || !contactData.id) {
            // Update local data
            if (isEdit) {
                const index = contacts.findIndex(c => c.id == contactData.id);
                if (index !== -1) {
                    contacts[index] = { ...contacts[index], ...contactData };
                }
            } else {
                contactData.id = contacts.length + 1;
                contacts.push(contactData);
            }
            
            renderContacts();
            closeModal('contact-modal');
            showNotification(`Contact ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
        } else {
            throw new Error('Failed to save contact');
        }
    } catch (error) {
        console.error('Error saving contact:', error);
        showNotification('Error saving contact. Please try again.', 'error');
    } finally {
        // Reset button state
        submitText.textContent = 'Save';
        submitSpinner.classList.add('hidden');
        submitButton.disabled = false;
    }
}

async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('project-submit-text');
    const submitSpinner = document.getElementById('project-submit-spinner');
    
    submitText.textContent = 'Saving...';
    submitSpinner.classList.remove('hidden');
    submitButton.disabled = true;
    
    try {
        const projectData = {
            id: formData.get('id') || null,
            name: formData.get('name'),
            description: formData.get('description'),
            status: formData.get('status'),
            priority: formData.get('priority'),
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            budget: parseFloat(formData.get('budget')) || 0,
            progress: 0
        };
        
        const isEdit = projectData.id;
        
        // Update local data
        if (isEdit) {
            const index = projects.findIndex(p => p.id == projectData.id);
            if (index !== -1) {
                projects[index] = { ...projects[index], ...projectData };
            }
        } else {
            projectData.id = projects.length + 1;
            projects.push(projectData);
        }
        
        renderProjects();
        closeModal('project-modal');
        showNotification(`Project ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
    } catch (error) {
        console.error('Error saving project:', error);
        showNotification('Error saving project. Please try again.', 'error');
    } finally {
        submitText.textContent = 'Save';
        submitSpinner.classList.add('hidden');
        submitButton.disabled = false;
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = document.getElementById('task-submit-text');
    const submitSpinner = document.getElementById('task-submit-spinner');
    
    submitText.textContent = 'Saving...';
    submitSpinner.classList.remove('hidden');
    submitButton.disabled = true;
    
    try {
        const taskData = {
            id: formData.get('id') || null,
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
            priority: formData.get('priority'),
            due_date: formData.get('due_date'),
            project_id: 1
        };
        
        const isEdit = taskData.id;
        
        if (isEdit) {
            const index = tasks.findIndex(t => t.id == taskData.id);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...taskData };
            }
        } else {
            taskData.id = tasks.length + 1;
            tasks.push(taskData);
        }
        
        renderTasks();
        closeModal('task-modal');
        showNotification(`Task ${isEdit ? 'updated' : 'added'} successfully!`, 'success');
    } catch (error) {
        console.error('Error saving task:', error);
        showNotification('Error saving task. Please try again.', 'error');
    } finally {
        submitText.textContent = 'Save';
        submitSpinner.classList.add('hidden');
        submitButton.disabled = false;
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        start_datetime: formData.get('start_datetime'),
        end_datetime: formData.get('end_datetime'),
        event_type: formData.get('event_type'),
        location: formData.get('location')
    };
    
    eventData.id = events.length + 1;
    events.push(eventData);
    
    closeModal('event-modal');
    showNotification('Event created successfully!', 'success');
    renderCalendar();
}

// Edit functions
function editContact(id) {
    openContactModal(id);
}

function editProject(id) {
    openProjectModal(id);
}

function editTask(id) {
    openTaskModal(id);
}

// Delete functions
async function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
        const response = await apiRequest(`/contacts.php?id=${id}`, { method: 'DELETE' });
        
        // Remove from local data regardless of API response
        contacts = contacts.filter(c => c.id !== id);
        renderContacts();
        showNotification('Contact deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting contact:', error);
        showNotification('Error deleting contact.', 'error');
    }
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
        projects = projects.filter(p => p.id !== id);
        renderProjects();
        showNotification('Project deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Error deleting project.', 'error');
    }
}

async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        showNotification('Task deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task.', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white max-w-sm transform transition-all duration-300 translate-x-full opacity-0`;
    
    // Set color based on type
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    notification.classList.add(colors[type] || colors.info);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// SOP-Level Project Management Functions

function updateProjectStats() {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const utilizedBudget = projects.filter(p => p.status !== 'cancelled').reduce((sum, p) => sum + (p.budget || 0), 0);
    const budgetUtilization = totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0;
    
    // Calculate team efficiency (based on completed tasks vs total tasks)
    const totalTasks = projects.reduce((sum, p) => sum + (p.tasks_count || 0), 0);
    const completedTasks = projects.reduce((sum, p) => sum + (p.completed_tasks || 0), 0);
    const teamEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Update dashboard cards
    animateNumber(document.getElementById('total-projects-count'), totalProjects);
    animateNumber(document.getElementById('active-projects-count'), activeProjects);
    animateNumber(document.getElementById('budget-utilization'), budgetUtilization, '', '%');
    animateNumber(document.getElementById('team-efficiency'), teamEfficiency, '', '%');
}

function setProjectView(view) {
    currentProjectView = view;
    
    // Update view buttons
    document.querySelectorAll('[id$="-view-btn"]').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('text-gray-600');
    });
    document.getElementById(`${view}-view-btn`).classList.add('bg-primary', 'text-white');
    document.getElementById(`${view}-view-btn`).classList.remove('text-gray-600');
    
    // Hide all views
    document.querySelectorAll('[id$="-view"]').forEach(view => view.classList.add('hidden'));
    
    // Show selected view
    document.getElementById(`projects-${view}-view`).classList.remove('hidden');
    
    renderProjects();
}

function renderProjects() {
    const filteredProjects = getFilteredProjects();
    const paginatedProjects = getPaginatedProjects(filteredProjects);
    
    updateProjectCounts(filteredProjects);
    
    switch(currentProjectView) {
        case 'grid':
            renderProjectsGrid(paginatedProjects);
            break;
        case 'list':
            renderProjectsList(paginatedProjects);
            break;
        case 'kanban':
            renderProjectsKanban(filteredProjects);
            break;
        case 'timeline':
            renderProjectsTimeline(filteredProjects);
            break;
    }
    
    renderPagination(filteredProjects.length);
}

function renderProjectsGrid(projects) {
    const container = document.getElementById('projects-grid-view');
    if (!container) return;
    
    container.innerHTML = projects.map(project => `
        <div class="bg-white rounded-xl p-6 shadow-lg card-hover smooth-transition border-l-4 ${getBorderColor(project.priority)}">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-semibold text-lg text-gray-800">${project.name}</h4>
                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${project.code}</span>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}">
                        ${project.status.replace('-', ' ').toUpperCase()}
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 text-xs rounded ${getPriorityColor(project.priority)}">${project.priority.toUpperCase()}</span>
                    <div class="relative">
                        <button onclick="toggleProjectMenu(${project.id})" class="p-1 hover:bg-gray-100 rounded">
                            <i class="fas fa-ellipsis-v text-gray-400"></i>
                        </button>
                        <div id="project-menu-${project.id}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                            <button onclick="viewProjectDetails(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-eye mr-2"></i>View Details
                            </button>
                            <button onclick="editProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-edit mr-2"></i>Edit Project
                            </button>
                            <button onclick="duplicateProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-copy mr-2"></i>Duplicate
                            </button>
                            <button onclick="archiveProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                <i class="fas fa-archive mr-2"></i>Archive
                            </button>
                            <hr class="my-1">
                            <button onclick="deleteProject(${project.id})" class="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">${project.description}</p>
            
            <div class="space-y-3">
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>${project.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Budget:</span>
                        <span class="font-medium">$${project.budget?.toLocaleString()}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Hours:</span>
                        <span class="font-medium">${project.estimated_hours || 0}h</span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Manager:</span>
                        <span class="font-medium">${getManagerName(project.manager)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Due:</span>
                        <span class="font-medium">${formatDate(project.end_date)}</span>
                    </div>
                </div>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1">
                        <i class="fas fa-tasks text-gray-400 text-xs"></i>
                        <span class="text-xs text-gray-500">${project.completed_tasks}/${project.tasks_count} tasks</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i class="fas fa-users text-gray-400 text-xs"></i>
                        <span class="text-xs text-gray-500">${project.team_members?.length || 0} members</span>
                    </div>
                    <span class="text-xs px-2 py-1 rounded ${getRiskColor(project.risk_level)}">
                        ${project.risk_level} risk
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderProjectsList(projects) {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = projects.map(project => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <input type="checkbox" value="${project.id}" onchange="toggleProjectSelection(${project.id})">
            </td>
            <td class="px-6 py-4">
                <div class="font-medium text-gray-900">${project.name}</div>
                <div class="text-sm text-gray-500">${project.code}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}">
                    ${project.status.replace('-', ' ')}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded ${getPriorityColor(project.priority)}">
                    ${project.priority}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-primary h-2 rounded-full" style="width: ${project.progress}%"></div>
                    </div>
                    <span class="text-sm">${project.progress}%</span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">$${project.budget?.toLocaleString()}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${formatDate(project.end_date)}</td>
            <td class="px-6 py-4 text-sm">
                <button onclick="viewProjectDetails(${project.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="editProject(${project.id})" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderProjectsKanban(projects) {
    const statuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    
    statuses.forEach(status => {
        const container = document.getElementById(`${status === 'on-hold' ? 'on-hold' : status}-projects`);
        const countElement = document.getElementById(`${status === 'on-hold' ? 'on-hold' : status}-count`);
        
        if (!container) return;
        
        const statusProjects = projects.filter(project => project.status === status);
        
        if (countElement) {
            countElement.textContent = statusProjects.length;
        }
        
        container.innerHTML = statusProjects.map(project => renderProjectCard(project)).join('');
    });
}

function renderProjectsTimeline(projects) {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    // Simple timeline visualization
    container.innerHTML = `
        <div class="space-y-4">
            ${projects.map(project => `
                <div class="flex items-center p-4 bg-white rounded-lg border">
                    <div class="w-4 h-4 ${getStatusDot(project.status)} rounded-full mr-4"></div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-medium">${project.name}</h4>
                                <p class="text-sm text-gray-500">${project.description}</p>
                            </div>
                            <div class="text-right text-sm">
                                <div class="text-gray-600">${formatDate(project.start_date)} - ${formatDate(project.end_date)}</div>
                                <div class="text-primary font-medium">${project.progress}% Complete</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getFilteredProjects() {
    let filtered = [...projects];
    
    // Apply filters
    if (projectFilters.search) {
        const search = projectFilters.search.toLowerCase();
        filtered = filtered.filter(project => 
            project.name.toLowerCase().includes(search) ||
            project.description.toLowerCase().includes(search) ||
            project.code.toLowerCase().includes(search)
        );
    }
    
    if (projectFilters.status) {
        filtered = filtered.filter(project => project.status === projectFilters.status);
    }
    
    if (projectFilters.priority) {
        filtered = filtered.filter(project => project.priority === projectFilters.priority);
    }
    
    if (projectFilters.manager) {
        filtered = filtered.filter(project => project.manager === projectFilters.manager);
    }
    
    if (projectFilters.dateFrom) {
        filtered = filtered.filter(project => project.start_date >= projectFilters.dateFrom);
    }
    
    if (projectFilters.dateTo) {
        filtered = filtered.filter(project => project.end_date <= projectFilters.dateTo);
    }
    
    return filtered;
}

function getPaginatedProjects(projects) {
    if (projectsPerPage === 'all') return projects;
    
    const startIndex = (currentProjectPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    return projects.slice(startIndex, endIndex);
}

function updateProjectCounts(filteredProjects) {
    document.getElementById('projects-count-display').textContent = `${filteredProjects.length} projects`;
}

function renderPagination(totalProjects) {
    if (projectsPerPage === 'all') {
        document.getElementById('projects-pagination').style.display = 'none';
        return;
    }
    
    document.getElementById('projects-pagination').style.display = 'flex';
    
    const totalPages = Math.ceil(totalProjects / projectsPerPage);
    const startItem = (currentProjectPage - 1) * projectsPerPage + 1;
    const endItem = Math.min(currentProjectPage * projectsPerPage, totalProjects);
    
    document.getElementById('showing-from').textContent = startItem;
    document.getElementById('showing-to').textContent = endItem;
    document.getElementById('total-projects').textContent = totalProjects;
    
    // Update page buttons
    document.getElementById('prev-page-btn').disabled = currentProjectPage <= 1;
    document.getElementById('next-page-btn').disabled = currentProjectPage >= totalPages;
    
    // Generate page numbers
    const pageNumbers = document.getElementById('page-numbers');
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentProjectPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    let paginationHTML = '';
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="goToProjectPage(${i})" 
                    class="px-3 py-2 border rounded-lg ${i === currentProjectPage ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}">
                ${i}
            </button>
        `;
    }
    pageNumbers.innerHTML = paginationHTML;
}

// Project management utility functions
function getBorderColor(priority) {
    const colors = {
        critical: 'border-red-500',
        high: 'border-orange-500',
        medium: 'border-yellow-500',
        low: 'border-green-500'
    };
    return colors[priority] || 'border-gray-300';
}

function getRiskColor(risk) {
    const colors = {
        low: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        critical: 'bg-red-100 text-red-700'
    };
    return colors[risk] || 'bg-gray-100 text-gray-700';
}

function getStatusDot(status) {
    const colors = {
        planning: 'bg-gray-500',
        active: 'bg-blue-500',
        'on-hold': 'bg-yellow-500',
        completed: 'bg-green-500',
        cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
}

function getManagerName(managerId) {
    const managers = {
        'john-doe': 'John Doe',
        'jane-smith': 'Jane Smith',
        'mike-johnson': 'Mike Johnson'
    };
    return managers[managerId] || 'Unassigned';
}

// Event handlers for new features
function searchProjects() {
    projectFilters.search = document.getElementById('project-search').value;
    currentProjectPage = 1;
    renderProjects();
}

function filterProjects() {
    projectFilters.status = document.getElementById('project-status-filter').value;
    projectFilters.priority = document.getElementById('project-priority-filter').value;
    projectFilters.manager = document.getElementById('project-manager-filter').value;
    projectFilters.dateFrom = document.getElementById('project-date-from').value;
    projectFilters.dateTo = document.getElementById('project-date-to').value;
    currentProjectPage = 1;
    renderProjects();
}

function changeProjectsPerPage() {
    const value = document.getElementById('projects-per-page').value;
    projectsPerPage = value === 'all' ? 'all' : parseInt(value);
    currentProjectPage = 1;
    renderProjects();
}

function previousProjectPage() {
    if (currentProjectPage > 1) {
        currentProjectPage--;
        renderProjects();
    }
}

function nextProjectPage() {
    const totalProjects = getFilteredProjects().length;
    const totalPages = Math.ceil(totalProjects / projectsPerPage);
    if (currentProjectPage < totalPages) {
        currentProjectPage++;
        renderProjects();
    }
}

function goToProjectPage(page) {
    currentProjectPage = page;
    renderProjects();
}

function sortProjects(field) {
    if (projectSortField === field) {
        projectSortDirection = projectSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        projectSortField = field;
        projectSortDirection = 'asc';
    }
    
    projects.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (projectSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    renderProjects();
}

function toggleProjectSelection(projectId) {
    const index = selectedProjects.indexOf(projectId);
    if (index > -1) {
        selectedProjects.splice(index, 1);
    } else {
        selectedProjects.push(projectId);
    }
}

function toggleAllProjects() {
    const checkbox = document.getElementById('select-all-projects');
    const projectCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
    
    if (checkbox.checked) {
        selectedProjects = Array.from(projectCheckboxes).map(cb => parseInt(cb.value));
        projectCheckboxes.forEach(cb => cb.checked = true);
    } else {
        selectedProjects = [];
        projectCheckboxes.forEach(cb => cb.checked = false);
    }
}

// Modal functions for new features
function openProjectTemplateModal() {
    document.getElementById('project-template-modal').classList.remove('hidden');
}

function openBulkActionsModal() {
    if (selectedProjects.length === 0) {
        showNotification('Please select projects first', 'warning');
        return;
    }
    document.getElementById('bulk-actions-modal').classList.remove('hidden');
}

function useTemplate(templateId) {
    // Template logic would go here
    closeModal('project-template-modal');
    openProjectModal();
    showNotification(`Template "${templateId}" loaded`, 'success');
}

function viewProjectDetails(projectId) {
    currentProjectId = projectId;
    loadProjectDetails(projectId);
    document.getElementById('project-detail-modal').classList.remove('hidden');
}

async function loadProjectDetails(projectId) {
    try {
        // Load project data from API
        const response = await apiRequest(`/projects.php?id=${projectId}`);
        
        if (response) {
            const project = response;
            
            // Update project header
            document.getElementById('project-detail-title').textContent = project.name || 'Untitled Project';
            document.getElementById('project-detail-priority').textContent = project.priority || 'Medium';
            document.getElementById('project-detail-priority').className = `px-3 py-1 rounded-full text-sm font-medium ${getPriorityColorClasses(project.priority)}`;
            
            // Update status indicator
            const statusIndicator = document.getElementById('project-detail-status-indicator');
            statusIndicator.className = `w-4 h-4 rounded-full ${getStatusColorClasses(project.status)}`;
            
            // Update project overview
            document.getElementById('project-detail-status').textContent = project.status || 'Active';
            document.getElementById('project-detail-progress-text').textContent = `${project.calculated_progress || 0}%`;
            document.getElementById('project-detail-progress-bar').style.width = `${project.calculated_progress || 0}%`;
            document.getElementById('project-detail-start-date').textContent = project.start_date ? formatDate(project.start_date) : '-';
            document.getElementById('project-detail-end-date').textContent = project.end_date ? formatDate(project.end_date) : '-';
            document.getElementById('project-detail-budget').textContent = project.budget ? `$${parseFloat(project.budget).toLocaleString()}` : '$0';
            
            // Load team members
            renderProjectTeam(project.team || []);
            
            // Load project tasks
            projectTasks = project.tasks || [];
            renderProjectKanban();
            renderProjectTasksList();
            
            // Load activities
            renderProjectActivity(project.activities || []);
            
        } else {
            // Use mock data if API fails
            loadMockProjectDetails(projectId);
        }
    } catch (error) {
        console.error('Error loading project details:', error);
        loadMockProjectDetails(projectId);
    }
}

function loadMockProjectDetails(projectId) {
    // Mock project data
    const mockProject = {
        id: projectId,
        name: 'Website Redesign Project',
        status: 'active',
        priority: 'high',
        calculated_progress: 65,
        start_date: '2024-01-15',
        end_date: '2024-04-15',
        budget: 50000,
        team: [
            { id: 1, first_name: 'John', last_name: 'Doe', role: 'Project Manager', avatar: null },
            { id: 2, first_name: 'Jane', last_name: 'Smith', role: 'Designer', avatar: null },
            { id: 3, first_name: 'Mike', last_name: 'Johnson', role: 'Developer', avatar: null }
        ],
        tasks: [
            { id: 1, title: 'Create wireframes', status: 'completed', priority: 'high', assigned_first_name: 'Jane', assigned_last_name: 'Smith', due_date: '2024-02-01' },
            { id: 2, title: 'Design homepage', status: 'in-progress', priority: 'high', assigned_first_name: 'Jane', assigned_last_name: 'Smith', due_date: '2024-02-15' },
            { id: 3, title: 'Develop frontend', status: 'todo', priority: 'medium', assigned_first_name: 'Mike', assigned_last_name: 'Johnson', due_date: '2024-03-01' },
            { id: 4, title: 'Testing and QA', status: 'todo', priority: 'medium', assigned_first_name: 'John', assigned_last_name: 'Doe', due_date: '2024-03-15' }
        ],
        activities: [
            { type: 'task_completed', description: 'Jane completed "Create wireframes"', activity_date: '2024-01-20 10:30:00' },
            { type: 'task_created', description: 'New task "Design homepage" assigned to Jane', activity_date: '2024-01-18 14:15:00' },
            { type: 'project_updated', description: 'Project status updated to Active', activity_date: '2024-01-15 09:00:00' }
        ]
    };
    
    // Update UI with mock data
    document.getElementById('project-detail-title').textContent = mockProject.name;
    document.getElementById('project-detail-priority').textContent = mockProject.priority;
    document.getElementById('project-detail-priority').className = `px-3 py-1 rounded-full text-sm font-medium ${getPriorityColorClasses(mockProject.priority)}`;
    
    const statusIndicator = document.getElementById('project-detail-status-indicator');
    statusIndicator.className = `w-4 h-4 rounded-full ${getStatusColorClasses(mockProject.status)}`;
    
    document.getElementById('project-detail-status').textContent = mockProject.status;
    document.getElementById('project-detail-progress-text').textContent = `${mockProject.calculated_progress}%`;
    document.getElementById('project-detail-progress-bar').style.width = `${mockProject.calculated_progress}%`;
    document.getElementById('project-detail-start-date').textContent = formatDate(mockProject.start_date);
    document.getElementById('project-detail-end-date').textContent = formatDate(mockProject.end_date);
    document.getElementById('project-detail-budget').textContent = `$${mockProject.budget.toLocaleString()}`;
    
    renderProjectTeam(mockProject.team);
    projectTasks = mockProject.tasks;
    renderProjectKanban();
    renderProjectTasksList();
    renderProjectActivity(mockProject.activities);
}

function renderProjectTeam(team) {
    const teamContainer = document.getElementById('project-detail-team');
    if (!teamContainer) return;
    
    teamContainer.innerHTML = team.map(member => `
        <div class="flex items-center space-x-3 p-2 rounded-lg hover:bg-white">
            <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                ${member.avatar ? `<img src="${member.avatar}" alt="${member.first_name}" class="w-8 h-8 rounded-full">` : 
                  `<span class="text-sm font-medium text-gray-600">${member.first_name[0]}${member.last_name[0]}</span>`}
            </div>
            <div>
                <p class="text-sm font-medium text-gray-800">${member.first_name} ${member.last_name}</p>
                <p class="text-xs text-gray-500">${member.role || 'Team Member'}</p>
            </div>
        </div>
    `).join('');
}

function renderProjectActivity(activities) {
    const activityContainer = document.getElementById('project-detail-activity');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-3 p-2 rounded-lg hover:bg-white">
            <div class="w-6 h-6 rounded-full ${getActivityColorClasses(activity.type)} flex items-center justify-center mt-0.5">
                <i class="fas ${getActivityIcon(activity.type)} text-xs text-white"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-800">${activity.description}</p>
                <p class="text-xs text-gray-500">${formatDate(activity.activity_date)}</p>
            </div>
        </div>
    `).join('');
}

function renderProjectKanban() {
    const columns = {
        'todo': document.getElementById('project-todo-tasks'),
        'in-progress': document.getElementById('project-progress-tasks'),
        'review': document.getElementById('project-review-tasks'),
        'completed': document.getElementById('project-done-tasks')
    };
    
    const counts = {
        'todo': document.getElementById('project-todo-count'),
        'in-progress': document.getElementById('project-progress-count'),
        'review': document.getElementById('project-review-count'),
        'completed': document.getElementById('project-done-count')
    };
    
    // Clear columns
    Object.values(columns).forEach(column => {
        if (column) column.innerHTML = '';
    });
    
    // Group tasks by status
    const tasksByStatus = {
        'todo': [],
        'in-progress': [],
        'review': [],
        'completed': []
    };
    
    projectTasks.forEach(task => {
        const status = task.status || 'todo';
        if (tasksByStatus[status]) {
            tasksByStatus[status].push(task);
        }
    });
    
    // Render tasks in each column
    Object.keys(tasksByStatus).forEach(status => {
        const column = columns[status];
        const count = counts[status];
        
        if (column && count) {
            count.textContent = tasksByStatus[status].length;
            
            column.innerHTML = tasksByStatus[status].map(task => `
                <div class="bg-white p-4 rounded-lg shadow-sm border cursor-pointer hover:shadow-md smooth-transition task-card" 
                     draggable="true" 
                     ondragstart="dragProjectTask(event, ${task.id})"
                     onclick="openTaskModal(${task.id})">
                    <div class="flex items-start justify-between mb-2">
                        <h6 class="font-medium text-gray-800 text-sm line-clamp-2">${task.title}</h6>
                        <span class="px-2 py-1 rounded text-xs font-medium ${getPriorityColorClasses(task.priority)}">${task.priority}</span>
                    </div>
                    
                    ${task.description ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${task.description}</p>` : ''}
                    
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <div class="flex items-center space-x-2">
                            ${task.assigned_first_name ? `
                                <div class="flex items-center space-x-1">
                                    <div class="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span class="text-xs font-medium">${task.assigned_first_name[0]}${task.assigned_last_name[0]}</span>
                                    </div>
                                    <span>${task.assigned_first_name} ${task.assigned_last_name}</span>
                                </div>
                            ` : ''}
                        </div>
                        ${task.due_date ? `<span>${formatDate(task.due_date)}</span>` : ''}
                    </div>
                </div>
            `).join('');
        }
    });
}

function renderProjectTasksList() {
    const tableBody = document.getElementById('project-tasks-table');
    if (!tableBody) return;
    
    tableBody.innerHTML = projectTasks.map(task => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div>
                    <div class="text-sm font-medium text-gray-900">${task.title}</div>
                    ${task.description ? `<div class="text-sm text-gray-500 truncate max-w-xs">${task.description}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClasses(task.status)}">
                    ${task.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColorClasses(task.priority)}">
                    ${task.priority}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${task.assigned_first_name ? `${task.assigned_first_name} ${task.assigned_last_name}` : 'Unassigned'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${task.due_date ? formatDate(task.due_date) : '-'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editTask(${task.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="deleteTask(${task.id})" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

function switchProjectTab(tabName) {
    currentProjectTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.project-tab').forEach(tab => {
        tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.querySelector(`.project-tab[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active', 'border-blue-500', 'text-blue-600');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
    }
    
    // Show/hide tab content
    document.querySelectorAll('.project-tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`project-${tabName}-tab`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // Load tab-specific data
    switch (tabName) {
        case 'kanban':
            renderProjectKanban();
            break;
        case 'tasks':
            renderProjectTasksList();
            break;
        case 'timeline':
            // Load timeline data
            break;
        case 'files':
            // Load project files
            break;
        case 'analytics':
            // Load analytics data
            break;
    }
}

function dragProjectTask(ev, taskId) {
    ev.dataTransfer.setData("text", taskId);
    ev.currentTarget.style.opacity = "0.5";
}

function dropProjectTask(ev, newStatus) {
    ev.preventDefault();
    const taskId = parseInt(ev.dataTransfer.getData("text"));
    
    // Update task status
    const taskIndex = projectTasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        projectTasks[taskIndex].status = newStatus;
        
        // Update task via API
        updateTaskStatus(taskId, newStatus);
        
        // Re-render kanban
        renderProjectKanban();
        
        // Show notification
        showNotification(`Task moved to ${newStatus.replace('-', ' ')}`, 'success');
    }
    
    // Reset opacity
    document.querySelectorAll('.task-card').forEach(card => {
        card.style.opacity = "1";
    });
}

async function updateTaskStatus(taskId, newStatus) {
    try {
        await apiRequest('/tasks.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: taskId,
                status: newStatus
            })
        });
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}

function getPriorityColorClasses(priority) {
    const colors = {
        'critical': 'bg-red-100 text-red-800',
        'high': 'bg-orange-100 text-orange-800',
        'medium': 'bg-yellow-100 text-yellow-800',
        'low': 'bg-green-100 text-green-800'
    };
    return colors[priority] || colors['medium'];
}

function getStatusColorClasses(status) {
    const colors = {
        'planning': 'bg-gray-500',
        'active': 'bg-blue-500',
        'on-hold': 'bg-yellow-500',
        'completed': 'bg-green-500',
        'cancelled': 'bg-red-500',
        'todo': 'bg-gray-100 text-gray-800',
        'in-progress': 'bg-blue-100 text-blue-800',
        'review': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors['active'];
}

function getActivityColorClasses(type) {
    const colors = {
        'task_completed': 'bg-green-500',
        'task_created': 'bg-blue-500',
        'project_updated': 'bg-purple-500',
        'team_added': 'bg-indigo-500',
        'file_uploaded': 'bg-gray-500'
    };
    return colors[type] || colors['project_updated'];
}

function getActivityIcon(type) {
    const icons = {
        'task_completed': 'fa-check',
        'task_created': 'fa-plus',
        'project_updated': 'fa-edit',
        'team_added': 'fa-user-plus',
        'file_uploaded': 'fa-upload'
    };
    return icons[type] || 'fa-info';
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function dragProject(ev, projectId) {
    ev.dataTransfer.setData("text", projectId);
    ev.currentTarget.classList.add('dragging');
}

function dropProject(ev, newStatus) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    
    const projectId = parseInt(ev.dataTransfer.getData("text"));
    
    // Find and update project status
    const projectIndex = projects.findIndex(project => project.id === projectId);
    if (projectIndex !== -1) {
        const oldStatus = projects[projectIndex].status;
        projects[projectIndex].status = newStatus;
        
        // Update project via API
        updateProjectStatus(projectId, newStatus);
        
        // Re-render projects
        renderProjects();
        
        // Show notification
        showNotification(`Project moved from ${oldStatus} to ${newStatus}`, 'success');
    }
    
    // Reset dragging styles
    document.querySelectorAll('.dragging').forEach(element => {
        element.classList.remove('dragging');
    });
}

function dragEnter(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) {
    ev.preventDefault();
    if (!ev.currentTarget.contains(ev.relatedTarget)) {
        ev.currentTarget.classList.remove('drag-over');
    }
}

async function updateProjectStatus(projectId, newStatus) {
    try {
        await apiRequest('/projects.php', {
            method: 'PUT',
            body: JSON.stringify({
                id: projectId,
                status: newStatus
            })
        });
    } catch (error) {
        console.error('Error updating project status:', error);
    }
}

// Enhanced project rendering with priority indicators
function renderProjectCard(project) {
    const priorityClass = `priority-${project.priority || 'medium'}`;
    const statusColor = getStatusColor(project.status);
    const progressWidth = project.calculated_progress || 0;
    
    return `
        <div class="bg-white rounded-lg shadow-sm border hover:shadow-md smooth-transition task-card ${priorityClass}" 
             draggable="true" 
             ondragstart="dragProject(event, ${project.id})"
             onclick="viewProjectDetails(${project.id})">
            
            <!-- Project Header -->
            <div class="p-4 border-b border-gray-100">
                <div class="flex items-start justify-between mb-2">
                    <h6 class="font-semibold text-gray-800 text-sm line-clamp-2">${project.name}</h6>
                    <div class="flex items-center space-x-1">
                        <span class="w-2 h-2 rounded-full ${statusColor}"></span>
                        <div class="relative">
                            <button onclick="toggleProjectMenu(${project.id}); event.stopPropagation();" class="text-gray-400 hover:text-gray-600 p-1">
                                <i class="fas fa-ellipsis-v text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                ${project.description ? `<p class="text-xs text-gray-600 line-clamp-2 mb-2">${project.description}</p>` : ''}
                
                <!-- Progress Bar -->
                <div class="mb-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-500">Progress</span>
                        <span class="text-xs font-medium text-gray-700">${progressWidth}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div class="progress-bar bg-blue-500 h-1.5 rounded-full" style="width: ${progressWidth}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Project Details -->
            <div class="p-4">
                <!-- Team Members -->
                ${project.team && project.team.length > 0 ? `
                    <div class="flex items-center mb-3">
                        <span class="text-xs text-gray-500 mr-2">Team:</span>
                        <div class="flex -space-x-1">
                            ${project.team.slice(0, 3).map(member => `
                                <div class="w-6 h-6 rounded-full team-avatar border-2 border-white flex items-center justify-center text-xs">
                                    ${member.avatar ? `<img src="${member.avatar}" class="w-full h-full rounded-full object-cover">` : 
                                      `${member.first_name[0]}${member.last_name[0]}`}
                                </div>
                            `).join('')}
                            ${project.team.length > 3 ? `<div class="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-600">+${project.team.length - 3}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Project Stats -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <span class="text-gray-500">Budget:</span>
                        <p class="font-medium text-gray-800">${project.budget ? '$' + parseFloat(project.budget).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <span class="text-gray-500">Due:</span>
                        <p class="font-medium text-gray-800">${project.end_date ? formatDate(project.end_date) : 'N/A'}</p>
                    </div>
                </div>
                
                <!-- Priority Badge -->
                <div class="mt-3 flex items-center justify-between">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${getPriorityColorClasses(project.priority)}">${project.priority || 'Medium'}</span>
                    <div class="flex items-center space-x-2 text-xs text-gray-500">
                        ${project.total_tasks ? `<span><i class="fas fa-tasks mr-1"></i>${project.completed_tasks || 0}/${project.total_tasks}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
} 