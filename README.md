# Enterprise CRM & Project Management System

A comprehensive, enterprise-level Customer Relationship Management (CRM) and Project Management system built with modern web technologies. Features advanced project management, real-time analytics, user authentication, role-based access control, and scalable architecture designed for production deployment.

## ✨ Enterprise Features

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, Manager, Employee, Client roles
- **Session Management**: Secure session tracking and timeout
- **Password Security**: Bcrypt hashing with lockout protection
- **Audit Logging**: Complete activity tracking for compliance

### 📊 Advanced Dashboard
- **Real-time Analytics**: Live statistics and KPIs
- **Interactive Charts**: Revenue, project progress, team performance
- **Customizable Widgets**: Personalized dashboard views
- **Activity Feed**: Real-time system activity updates
- **Quick Actions**: Fast access to common tasks

### 👥 Enterprise Contact Management
- **Advanced Search**: Semantic search with filters
- **Company Hierarchies**: Multi-level organization structures
- **Custom Fields**: Flexible data collection
- **Lead Scoring**: Automated lead qualification
- **Communication Tracking**: Email, call, and meeting logs
- **Data Import/Export**: Bulk operations and integrations

### 🚀 Professional Project Management
- **Multiple Project Views**: Grid, List, Kanban, Timeline, Gantt
- **Advanced Kanban**: Drag-and-drop with visual feedback
- **Project Templates**: Reusable project structures
- **Dependency Management**: Task and project dependencies
- **Resource Management**: Team allocation and workload tracking
- **Budget Tracking**: Financial monitoring and reporting
- **Client Portal Access**: Secure client project visibility

### ✅ Enterprise Task Management
- **Hierarchical Tasks**: Parent/child task relationships
- **Time Tracking**: Built-in time logging and reporting
- **Task Dependencies**: Complex workflow management
- **Automated Workflows**: Status-based triggers
- **Comments & Attachments**: Rich task collaboration
- **Recurring Tasks**: Automated task creation

### 🏢 Team & User Management
- **Department Structure**: Organizational hierarchy
- **User Profiles**: Comprehensive employee information
- **Permission System**: Granular access controls
- **Team Workload**: Capacity planning and allocation
- **Performance Metrics**: Individual and team analytics

### 💼 Business Intelligence
- **Financial Reporting**: Revenue, profit, and budget analysis
- **Project Analytics**: Performance metrics and insights
- **Team Productivity**: Efficiency and utilization reports
- **Custom Reports**: Flexible report generation
- **Data Export**: Multiple format support (PDF, Excel, CSV)

### 🔧 Enterprise Integrations
- **Email Notifications**: Automated system notifications
- **Calendar Integration**: Sync with external calendars
- **Document Management**: File storage and versioning
- **API Access**: RESTful API for external integrations
- **Webhook Support**: Real-time data synchronization

## 🚀 Quick Start (Vercel Deployment)

### Prerequisites

- Node.js 18+ installed locally
- A Vercel account
- A cloud database (PlanetScale, Railway, or Neon recommended)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd CRMFORPROJECT
npm install
```

### 2. Database Setup

#### Option A: PlanetScale (Recommended)
1. Create account at [PlanetScale](https://planetscale.com)
2. Create a new database
3. Get your connection string from the dashboard

#### Option B: Railway
1. Create account at [Railway](https://railway.app)
2. Create a MySQL database
3. Get your connection string

#### Option C: Neon (PostgreSQL)
1. Create account at [Neon](https://neon.tech)
2. Create a PostgreSQL database
3. Modify queries in API files for PostgreSQL compatibility

### 3. Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:
```env
DATABASE_URL=mysql://username:password@host:port/database
NODE_ENV=production
API_BASE_URL=https://your-app.vercel.app
```

### 4. Database Schema

Execute the SQL schema on your cloud database:
- Import `database_schema.sql` into your database
- Or run the schema manually through your database provider's console

### 5. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### 6. Configure Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:
- `DATABASE_URL`: Your database connection string
- `NODE_ENV`: production
- `API_BASE_URL`: Your Vercel app URL

## 📁 Project Structure

```
CRMFORPROJECT/
├── api/                    # Serverless API functions
│   ├── contacts.js        # Contact management API
│   ├── dashboard.js       # Dashboard statistics API
│   ├── projects.js        # Project management API
│   └── tasks.js           # Task management API
├── lib/                   # Shared utilities
│   └── database.js        # Database connection utility
├── js/                    # Frontend JavaScript
│   └── app.js            # Main application logic
├── index.html            # Main application page
├── login.html            # Login page
├── package.json          # Node.js dependencies
├── vercel.json           # Vercel configuration
└── database_schema.sql   # Database schema
```

## 🔧 API Endpoints

All API endpoints are serverless functions optimized for Vercel:

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Contacts
- `GET /api/contacts` - List all contacts
- `GET /api/contacts?id={id}` - Get specific contact
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts?id={id}` - Update contact
- `DELETE /api/contacts?id={id}` - Delete contact

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects?id={id}` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects?id={id}` - Update project
- `DELETE /api/projects?id={id}` - Delete project

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks?id={id}` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks?id={id}` - Update task
- `DELETE /api/tasks?id={id}` - Delete task

## 🎨 Features Overview

### Enhanced Project Management
- **Multiple Views**: Grid, List, Kanban, Timeline
- **Drag & Drop**: Move projects between status columns
- **Advanced Filtering**: Filter by status, priority, manager, dates
- **Team Management**: Assign team members to projects
- **Progress Tracking**: Visual progress indicators

### Improved Kanban Board
- **Task Cards**: Rich task information with priorities
- **Drag & Drop**: Smooth task status updates
- **Real-time Updates**: Immediate visual feedback
- **Team Avatars**: See who's assigned to each task

### Project Detail View
- **Tabbed Interface**: Kanban, Tasks, Timeline, Files, Analytics
- **Team Sidebar**: Project overview and team members
- **Activity Feed**: Recent project activities
- **File Management**: Project document handling

## 🛠️ Development

### Local Development
```bash
npm run dev
```

### Environment Variables
Required environment variables:
- `DATABASE_URL`: Database connection string
- `NODE_ENV`: development/production
- `API_BASE_URL`: API base URL

### Database Configuration
The app supports multiple database providers:
- MySQL (PlanetScale, Railway)
- PostgreSQL (Neon, Supabase)

## 🚢 Production Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Alternative Platforms
- **Netlify**: Use Netlify Functions
- **Railway**: Full-stack deployment
- **Heroku**: Traditional hosting

## 📊 Enterprise Database Schema

The application uses a comprehensive relational database with enterprise-level features:

### Core Tables
- **`users`** - User authentication, profiles, and security settings
- **`user_sessions`** - Session management and security tracking
- **`roles`** - Role-based access control system
- **`user_roles`** - User role assignments with expiration
- **`departments`** - Organizational structure and hierarchy

### Business Entities
- **`companies`** - Client companies with financial and legal info
- **`contacts`** - Individual contacts with CRM features
- **`deals`** - Sales pipeline and opportunity tracking
- **`quotes`** - Proposal and quotation management
- **`invoices`** - Financial transaction tracking

### Project Management
- **`projects`** - Comprehensive project information
- **`tasks`** - Advanced task management with dependencies
- **`project_members`** - Team assignments and roles
- **`task_dependencies`** - Complex workflow management
- **`task_comments`** - Collaboration and communication
- **`project_templates`** - Reusable project structures

### Business Intelligence
- **`activities`** - Complete audit trail and activity logging
- **`time_entries`** - Time tracking and billing
- **`documents`** - File management with versioning
- **`custom_fields`** - Flexible data collection
- **`notifications`** - System-wide notification management

### Advanced Features
- **`settings`** - System configuration management
- **`tags`** - Flexible categorization system
- **`email_templates`** - Automated communication
- **`audit_logs`** - Compliance and security auditing

### Database Features
- **UUID Support**: Globally unique identifiers
- **Soft Deletes**: Data retention and recovery
- **Audit Trails**: Complete change tracking
- **Performance Indexes**: Optimized query performance
- **Data Validation**: Comprehensive constraints
- **Automated Events**: Scheduled maintenance tasks

## 🔒 Security Features

- CORS configuration for API endpoints
- Input validation and sanitization
- SQL injection prevention
- Environment variable protection

## 🎯 Performance Optimizations

- Serverless functions for scalability
- Optimized database queries
- CDN delivery via Vercel
- Lazy loading for large datasets
- Efficient caching strategies

## 📱 Mobile Responsive

- Fully responsive design
- Touch-friendly interface
- Mobile-optimized navigation
- Adaptive layouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Create an issue on GitHub
3. Contact the development team

---

**Built with ❤️ for modern project management** 