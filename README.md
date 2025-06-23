# CRM & Project Management System

A modern, responsive CRM and Project Management system built with HTML, CSS, JavaScript, and Node.js. Optimized for Vercel deployment.

## ✨ Features

- **Dashboard**: Real-time statistics and analytics
- **Contact Management**: Comprehensive customer relationship management
- **Project Management**: Advanced project tracking with Kanban boards
- **Task Management**: Drag-and-drop task organization
- **Team Collaboration**: Team member management and assignments
- **Responsive Design**: Works on desktop, tablet, and mobile devices

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

## 📊 Database Schema

The application uses a relational database with the following main tables:
- `users` - User authentication and profiles
- `companies` - Client companies
- `contacts` - Individual contacts
- `projects` - Project information
- `tasks` - Task management
- `project_members` - Team assignments
- `activities` - Activity logging

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