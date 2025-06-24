// Enterprise CRM Application
// Advanced features for enterprise-level usage

// Configuration
const API_BASE_URL = '/api';
const REFRESH_INTERVALS = {
    dashboard: 30000, // 30 seconds
    notifications: 10000, // 10 seconds
    activities: 15000 // 15 seconds
};

// Global state management
class StateManager {
    constructor() {
        this.state = {
            user: null,
            permissions: [],
            notifications: [],
            activities: [],
            settings: {},
            filters: {},
            realTimeUpdates: true
        };
        this.listeners = {};
    }

    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    setState(key, value) {
        this.state[key] = value;
        this.emit('stateChange', { key, value });
    }

    getState(key) {
        return this.state[key];
    }
}

const stateManager = new StateManager();

// Authentication Manager
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.refreshTimer = null;
    }

    async login(credentials) {
        try {
            const response = await apiRequest('/auth?action=login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response && response.success) {
                this.token = response.token;
                this.user = response.user;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                stateManager.setState('user', this.user);
                stateManager.setState('permissions', this.user.permissions || []);
                
                this.startTokenRefresh();
                return { success: true, user: this.user };
            }
            
            return { success: false, error: response?.error || 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async logout() {
        try {
            await apiRequest('/auth?action=logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.token}` }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.token = null;
        this.user = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        stateManager.setState('user', null);
        stateManager.setState('permissions', []);
        
        window.location.href = '/login.html';
    }

    async refreshToken() {
        if (!this.token) return false;

        try {
            const response = await apiRequest('/auth?action=refresh', {
                method: 'POST',
                headers: { Authorization: `Bearer ${this.token}` }
            });

            if (response && response.success) {
                this.token = response.token;
                localStorage.setItem('auth_token', this.token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
        }

        return false;
    }

    startTokenRefresh() {
        // Refresh token every 23 hours
        this.refreshTimer = setInterval(() => {
            this.refreshToken();
        }, 23 * 60 * 60 * 1000);
    }

    hasPermission(permission) {
        const permissions = stateManager.getState('permissions') || [];
        return permissions.includes('*') || permissions.includes(permission);
    }

    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    getAuthHeaders() {
        return this.token ? { Authorization: `Bearer ${this.token}` } : {};
    }
}

const authManager = new AuthManager();

// Enhanced API Request Handler
async function apiRequest(endpoint, options = {}) {
    try {
        const cleanEndpoint = endpoint.replace('.php', '');
        
        const headers = {
            'Content-Type': 'application/json',
            ...authManager.getAuthHeaders(),
            ...options.headers
        };

        const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            authManager.logout();
            return null;
        }

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

// Real-time Notification System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.socket = null; // For future WebSocket implementation
    }

    async fetchNotifications() {
        try {
            const response = await apiRequest('/notifications');
            if (response && response.notifications) {
                this.notifications = response.notifications;
                this.unreadCount = response.unread_count || 0;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }

    addNotification(notification) {
        this.notifications.unshift(notification);
        if (!notification.read_at) {
            this.unreadCount++;
        }
        this.updateUI();
        this.showToast(notification);
    }

    async markAsRead(notificationId) {
        try {
            await apiRequest(`/notifications/${notificationId}`, {
                method: 'PUT',
                body: JSON.stringify({ read: true })
            });
            
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.read_at) {
                notification.read_at = new Date().toISOString();
                this.unreadCount--;
                this.updateUI();
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    updateUI() {
        const badge = document.getElementById('notification-badge');
        const list = document.getElementById('notification-list');
        
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
        
        if (list) {
            list.innerHTML = this.notifications.map(n => this.renderNotification(n)).join('');
        }
    }

    renderNotification(notification) {
        const isUnread = !notification.read_at;
        const timeAgo = formatTimeAgo(notification.created_at);
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 onclick="notificationManager.markAsRead(${notification.id})">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <small class="text-gray-500">${timeAgo}</small>
                </div>
                ${isUnread ? '<div class="notification-dot"></div>' : ''}
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'task_assigned': 'fa-tasks',
            'project_updated': 'fa-project-diagram',
            'deadline_approaching': 'fa-clock',
            'message_received': 'fa-envelope',
            'system_alert': 'fa-exclamation-triangle',
            'default': 'fa-bell'
        };
        return icons[type] || icons.default;
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                <div>
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                </div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('toast-container').appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    startPolling() {
        setInterval(() => {
            this.fetchNotifications();
        }, REFRESH_INTERVALS.notifications);
    }
}

const notificationManager = new NotificationManager();

// Advanced Search and Filter System
class SearchManager {
    constructor() {
        this.searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
        this.filters = {};
        this.debounceTimer = null;
    }

    search(query, entity, filters = {}) {
        return new Promise((resolve) => {
            clearTimeout(this.debounceTimer);
            
            this.debounceTimer = setTimeout(async () => {
                try {
                    const params = new URLSearchParams({
                        search: query,
                        ...filters,
                        limit: 50
                    });
                    
                    const response = await apiRequest(`/${entity}?${params}`);
                    
                    if (response) {
                        this.addToHistory(query, entity);
                        resolve(response);
                    } else {
                        resolve({ results: [], total: 0 });
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    resolve({ results: [], total: 0 });
                }
            }, 300);
        });
    }

    addToHistory(query, entity) {
        if (!query || query.length < 2) return;
        
        const historyItem = { query, entity, timestamp: Date.now() };
        
        // Remove existing entry
        this.searchHistory = this.searchHistory.filter(item => 
            !(item.query === query && item.entity === entity)
        );
        
        // Add to beginning
        this.searchHistory.unshift(historyItem);
        
        // Keep only last 20 searches
        this.searchHistory = this.searchHistory.slice(0, 20);
        
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }

    getSearchSuggestions(query, entity) {
        return this.searchHistory
            .filter(item => 
                item.entity === entity && 
                item.query.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map(item => item.query);
    }

    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search_history');
    }
}

const searchManager = new SearchManager();

// Enhanced Dashboard with Real-time Updates
class EnhancedDashboard {
    constructor() {
        this.widgets = {};
        this.refreshIntervals = {};
        this.charts = {};
    }

    async init() {
        await this.loadDashboardData();
        this.setupRealTimeUpdates();
        this.initializeCharts();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            const response = await apiRequest('/dashboard');
            if (response && response.data) {
                this.updateDashboardStats(response.data.stats);
                this.updateRecentActivities(response.data.recent_activities);
                this.updateRevenueChart(response.data.revenue_data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.loadMockData();
        }
    }

    loadMockData() {
        const mockData = {
            stats: {
                total_contacts: 1247,
                total_leads: 89,
                active_projects: 23,
                pending_tasks: 89,
                total_revenue: 285000,
                contacts_growth: '+18%',
                leads_growth: '+24%',
                projects_growth: '+12%',
                tasks_due: '12 due today',
                revenue_growth: '+24%'
            },
            recent_activities: [
                {
                    id: 1,
                    type: 'project_created',
                    description: 'New project "Enterprise Dashboard" created',
                    user: 'John Doe',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'task_completed',
                    description: 'Task "Database optimization" completed',
                    user: 'Jane Smith',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ],
            revenue_data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [45000, 52000, 48000, 61000, 55000, 67000],
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4
                }]
            }
        };

        this.updateDashboardStats(mockData.stats);
        this.updateRecentActivities(mockData.recent_activities);
        this.updateRevenueChart(mockData.revenue_data);
    }

    updateDashboardStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (typeof value === 'number') {
                    this.animateNumber(element, value);
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
            
            element.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.description}</p>
                    <small class="text-gray-500">
                        ${activity.user} • ${formatTimeAgo(activity.timestamp)}
                    </small>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'project_created': 'fa-plus-circle text-green-500',
            'task_completed': 'fa-check-circle text-blue-500',
            'contact_added': 'fa-user-plus text-purple-500',
            'deal_closed': 'fa-handshake text-yellow-500',
            'default': 'fa-info-circle text-gray-500'
        };
        return icons[type] || icons.default;
    }

    initializeCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenue-chart');
        if (revenueCtx) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
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

        // Project Status Chart
        const projectCtx = document.getElementById('project-status-chart');
        if (projectCtx) {
            this.charts.projectStatus = new Chart(projectCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Active', 'Completed', 'On Hold', 'Cancelled'],
                    datasets: [{
                        data: [12, 8, 3, 1],
                        backgroundColor: [
                            '#10B981',
                            '#3B82F6',
                            '#F59E0B',
                            '#EF4444'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    updateRevenueChart(data) {
        if (this.charts.revenue) {
            this.charts.revenue.data = data;
            this.charts.revenue.update();
        }
    }

    setupRealTimeUpdates() {
        // Update dashboard every 30 seconds
        this.refreshIntervals.dashboard = setInterval(() => {
            this.loadDashboardData();
        }, REFRESH_INTERVALS.dashboard);
    }

    setupEventListeners() {
        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-quick-action]')) {
                this.handleQuickAction(e.target.dataset.quickAction);
            }
        });

        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
                showNotification('Dashboard refreshed', 'success');
            });
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'new-project':
                openProjectModal();
                break;
            case 'new-contact':
                openContactModal();
                break;
            case 'new-lead':
                window.location.href = 'leads-enterprise.html';
                break;
            case 'new-task':
                openTaskModal();
                break;
            default:
                console.log('Unknown quick action:', action);
        }
    }

    destroy() {
        Object.values(this.refreshIntervals).forEach(interval => {
            clearInterval(interval);
        });
        
        Object.values(this.charts).forEach(chart => {
            chart.destroy();
        });
    }
}

// Enhanced Project Management
class EnhancedProjectManager {
    constructor() {
        this.currentView = 'grid';
        this.filters = {};
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.projects = [];
    }

    async loadProjects() {
        try {
            const response = await apiRequest('/projects');
            if (response && response.projects) {
                this.projects = response.projects;
                this.renderProjects(this.projects);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.loadMockProjects();
        }
    }

    loadMockProjects() {
        this.projects = [
            {
                id: 1,
                name: 'Enterprise CRM System',
                description: 'Complete enterprise-level CRM solution with advanced features',
                status: 'active',
                priority: 'high',
                calculated_progress: 75,
                budget: 150000,
                start_date: '2024-01-15',
                end_date: '2024-06-15',
                client_name: 'TechCorp Inc',
                manager_first_name: 'John',
                manager_last_name: 'Doe',
                team: [
                    { first_name: 'Jane', last_name: 'Smith' },
                    { first_name: 'Mike', last_name: 'Johnson' }
                ]
            },
            {
                id: 2,
                name: 'Mobile App Development',
                description: 'Cross-platform mobile application',
                status: 'planning',
                priority: 'medium',
                calculated_progress: 25,
                budget: 75000,
                start_date: '2024-02-01',
                end_date: '2024-08-01',
                client_name: 'StartupXYZ',
                manager_first_name: 'Sarah',
                manager_last_name: 'Wilson',
                team: [
                    { first_name: 'Alex', last_name: 'Brown' },
                    { first_name: 'Emma', last_name: 'Davis' }
                ]
            }
        ];

        this.renderProjects(this.projects);
    }

    renderProjects(projects) {
        const container = document.getElementById('projects-container');
        if (!container) return;

        container.innerHTML = projects.map(project => `
            <div class="project-card ${this.getPriorityClass(project.priority)}" 
                 data-project-id="${project.id}">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <div class="project-status">
                        <span class="status-badge status-${project.status}">${project.status}</span>
                        <span class="priority-badge priority-${project.priority}">${project.priority}</span>
                    </div>
                </div>
                
                <p class="project-description">${project.description}</p>
                
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.calculated_progress}%"></div>
                    </div>
                    <span class="progress-text">${project.calculated_progress}%</span>
                </div>
                
                <div class="project-meta">
                    <div class="project-budget">
                        <i class="fas fa-dollar-sign"></i>
                        ${project.budget ? '$' + project.budget.toLocaleString() : 'N/A'}
                    </div>
                    <div class="project-client">
                        <i class="fas fa-building"></i>
                        ${project.client_name || 'Internal'}
                    </div>
                </div>
                
                <div class="project-team">
                    <div class="team-avatars">
                        ${this.renderTeamAvatars(project.team)}
                    </div>
                    <div class="project-manager">
                        <i class="fas fa-user-tie"></i>
                        ${project.manager_first_name} ${project.manager_last_name}
                    </div>
                </div>
                
                <div class="project-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewProjectDetails(${project.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="editProject(${project.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderTeamAvatars(team) {
        if (!team || team.length === 0) return '<span class="no-team">No team assigned</span>';
        
        return team.slice(0, 3).map(member => `
            <div class="avatar" title="${member.first_name} ${member.last_name}">
                <span>${member.first_name[0]}${member.last_name[0]}</span>
            </div>
        `).join('') + (team.length > 3 ? `<div class="avatar-more">+${team.length - 3}</div>` : '');
    }

    getPriorityClass(priority) {
        const classes = {
            'low': 'border-l-green-500',
            'medium': 'border-l-yellow-500',
            'high': 'border-l-orange-500',
            'critical': 'border-l-red-500'
        };
        return classes[priority] || classes.medium;
    }

    setView(view) {
        this.currentView = view;
        this.loadProjects();
        
        // Update view buttons
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    applyFilters(filters) {
        this.filters = { ...this.filters, ...filters };
        this.loadProjects();
    }

    clearFilters() {
        this.filters = {};
        this.loadProjects();
        
        // Reset filter UI
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = '';
        });
    }
}

// Utility Functions
function formatTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    const container = document.getElementById('notification-container') || document.body;
    container.appendChild(notification);

    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Global functions for project management
function viewProjectDetails(projectId) {
    // Enhanced project details modal
    const project = window.projectManager?.projects?.find(p => p.id === projectId);
    if (project) {
        openProjectDetailsModal(project);
    }
}

function editProject(projectId) {
    const project = window.projectManager?.projects?.find(p => p.id === projectId);
    if (project) {
        openEditProjectModal(project);
    }
}

function openProjectDetailsModal(project) {
    // Implementation for project details modal
    console.log('Opening project details for:', project.name);
}

function openEditProjectModal(project) {
    // Implementation for edit project modal
    console.log('Opening edit modal for:', project.name);
}

function openProjectModal() {
    console.log('Opening new project modal');
}

function openContactModal() {
    console.log('Opening new contact modal');
}

function openTaskModal() {
    console.log('Opening new task modal');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authManager.isAuthenticated() && !window.location.pathname.includes('login')) {
        window.location.href = '/login.html';
        return;
    }

    // Initialize managers
    if (authManager.isAuthenticated()) {
        authManager.startTokenRefresh();
        notificationManager.startPolling();
        
        // Initialize dashboard if on dashboard page
        if (document.getElementById('dashboard-container')) {
            const dashboard = new EnhancedDashboard();
            await dashboard.init();
            window.dashboard = dashboard;
        }

        // Initialize project manager if on projects page
        if (document.getElementById('projects-container')) {
            const projectManager = new EnhancedProjectManager();
            await projectManager.loadProjects();
            
            // Make it globally available
            window.projectManager = projectManager;
        }

        // Load initial notifications
        await notificationManager.fetchNotifications();
    }

    // Setup global event listeners
    setupGlobalEventListeners();
});

function setupGlobalEventListeners() {
    // Global search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.length > 2) {
                performGlobalSearch(e.target.value);
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            authManager.logout();
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

async function performGlobalSearch(query) {
    const results = await searchManager.search(query, 'global');
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const dropdown = document.getElementById('search-dropdown');
    if (!dropdown) return;

    if (!results || results.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = results.map(result => `
        <div class="search-result-item" onclick="navigateToResult('${result.type}', ${result.id})">
            <div class="result-icon">
                <i class="fas ${getResultIcon(result.type)}"></i>
            </div>
            <div class="result-content">
                <h4>${result.title}</h4>
                <p>${result.description}</p>
                <small class="result-type">${result.type}</small>
            </div>
        </div>
    `).join('');

    dropdown.style.display = 'block';
}

function getResultIcon(type) {
    const icons = {
        'project': 'fa-project-diagram',
        'contact': 'fa-user',
        'task': 'fa-tasks',
        'company': 'fa-building'
    };
    return icons[type] || 'fa-search';
}

function navigateToResult(type, id) {
    const routes = {
        'project': `/projects?id=${id}`,
        'contact': `/contacts?id=${id}`,
        'task': `/tasks?id=${id}`,
        'company': `/companies?id=${id}`
    };
    
    if (routes[type]) {
        window.location.href = routes[type];
    }
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Ctrl/Cmd + N for new project
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openProjectModal();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        closeAllModals();
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Export for global access
window.authManager = authManager;
window.notificationManager = notificationManager;
window.searchManager = searchManager;
window.stateManager = stateManager; 