# CRM & Project Management System

A modern, feature-rich Customer Relationship Management (CRM) and Project Management system built with HTML, CSS, JavaScript, Tailwind CSS, PHP, and MySQL.

## Features

### 🎯 Core CRM Features
- **Contact Management**: Add, edit, delete, and organize contacts
- **Company Management**: Manage client companies and prospects
- **Deal Pipeline**: Track sales opportunities through different stages
- **Activity Logging**: Record all interactions and communications
- **Lead Management**: Convert leads through the sales funnel

### 📊 Project Management
- **Project Dashboard**: Visual overview of all projects
- **Task Management**: Kanban-style task boards with drag & drop
- **Team Collaboration**: Assign tasks to team members
- **Time Tracking**: Log time spent on projects and tasks
- **Progress Tracking**: Real-time project progress monitoring

### 📅 Calendar & Scheduling
- **Event Management**: Schedule meetings, calls, and deadlines
- **Calendar View**: Monthly calendar with event visualization
- **Reminders**: Automated notifications for upcoming events
- **Integration**: Link events to contacts, projects, and deals

### 📈 Analytics & Reporting
- **Dashboard Analytics**: Real-time KPIs and metrics
- **Revenue Tracking**: Monitor sales performance
- **Project Reports**: Track project completion and profitability
- **Custom Charts**: Visual data representation

### ⚙️ Additional Features
- **User Authentication**: Secure login system
- **Role-based Access**: Admin, Manager, and User roles
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Beautiful interface with smooth animations
- **API Integration**: RESTful API endpoints for all features

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Backend**: PHP 7.4+, PDO for database connections
- **Database**: MySQL 8.0+
- **Charts**: Chart.js for data visualization
- **Icons**: Font Awesome 6
- **Architecture**: MVC pattern with RESTful APIs

## Installation & Setup

### Prerequisites
- XAMPP, WAMP, or any local server with PHP and MySQL
- PHP 7.4 or higher
- MySQL 8.0 or higher
- Modern web browser

### Step 1: Download and Extract
1. Download or clone this repository
2. Extract to your web server directory (e.g., `C:\xampp\htdocs\CRMFORPROJECT`)

### Step 2: Database Setup
1. Start your MySQL server
2. Open phpMyAdmin or MySQL command line
3. Import the database schema:
   ```sql
   mysql -u root -p < database_schema.sql
   ```
   Or copy and paste the contents of `database_schema.sql` into phpMyAdmin

### Step 3: Configuration
1. Update database credentials in `config/database.php`:
   ```php
   private $host = 'localhost';
   private $db_name = 'crm_project_manager';
   private $username = 'root';
   private $password = 'your_password';
   ```

### Step 4: Access the Application
1. Start your web server (Apache/Nginx)
2. Navigate to: `http://localhost/CRMFORPROJECT`
3. You'll be redirected to the login page

## Login Credentials

### Default Admin Account
- **Email**: admin@crm.local
- **Password**: password

## File Structure

```
CRMFORPROJECT/
├── index.html              # Main dashboard
├── login.html              # Login page
├── database_schema.sql     # Complete database structure
├── README.md              # This file
├── config/
│   └── database.php       # Database configuration
├── api/
│   ├── contacts.php       # Contact management API
│   ├── projects.php       # Project management API
│   └── dashboard.php      # Dashboard data API
└── js/
    └── app.js            # Main JavaScript application
```

## API Endpoints

### Contacts API (`/api/contacts.php`)
- `GET /api/contacts.php` - Get all contacts
- `GET /api/contacts.php?id=1` - Get specific contact
- `POST /api/contacts.php` - Create new contact
- `PUT /api/contacts.php?id=1` - Update contact
- `DELETE /api/contacts.php?id=1` - Delete contact

### Projects API (`/api/projects.php`)
- `GET /api/projects.php` - Get all projects
- `GET /api/projects.php?id=1` - Get specific project
- `POST /api/projects.php` - Create new project
- `PUT /api/projects.php?id=1` - Update project
- `DELETE /api/projects.php?id=1` - Delete project

### Dashboard API (`/api/dashboard.php`)
- `GET /api/dashboard.php` - Get dashboard statistics and data

## Database Schema

### Core Tables
- **users**: User accounts and authentication
- **companies**: Client and prospect companies
- **contacts**: Individual contact records
- **projects**: Project management data
- **tasks**: Task tracking and assignment
- **deals**: Sales opportunities and pipeline
- **activities**: Interaction logging
- **events**: Calendar and scheduling
- **time_entries**: Time tracking records

### Key Features of Schema
- Foreign key relationships for data integrity
- Indexes for optimal performance
- JSON fields for flexible custom data
- Views for complex queries
- Sample data included for testing

## Usage Guide

### Getting Started
1. **Login**: Use the demo credentials or create new users
2. **Dashboard**: View key metrics and recent activities
3. **Add Contacts**: Start by importing or adding your contacts
4. **Create Projects**: Set up projects for your clients
5. **Manage Tasks**: Break down projects into manageable tasks
6. **Track Time**: Log time spent on different activities

### Contact Management
1. Go to the Contacts section
2. Click "Add Contact" to create new contacts
3. Use search and filters to find specific contacts
4. View contact details including activity history
5. Edit or delete contacts as needed

### Project Management
1. Navigate to the Projects section
2. Click "New Project" to create a project
3. Set project details, timeline, and budget
4. Assign team members to the project
5. Track progress through task completion

### Task Management
1. Access the Tasks section for Kanban boards
2. Create tasks and assign to team members
3. Drag and drop tasks between columns
4. Set priorities and due dates
5. Track task completion progress

## Customization

### Styling
- Tailwind CSS classes can be modified in HTML files
- Custom CSS can be added to the `<style>` sections
- Color scheme is defined in Tailwind config

### Functionality
- JavaScript functions in `js/app.js` can be extended
- API endpoints can be modified in `api/` folder
- Database schema can be customized in `database_schema.sql`

### Configuration
- Update `config/database.php` for database settings
- Modify API base URL in `js/app.js` if needed

## Security Features

- **Input Validation**: All user inputs are validated
- **SQL Injection Protection**: Prepared statements used
- **Authentication**: Session-based user authentication
- **CORS Headers**: Proper cross-origin resource sharing
- **Error Handling**: Graceful error handling and logging

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Opera 57+

## Performance Optimization

- **Lazy Loading**: Data loaded on demand
- **Pagination**: Large datasets are paginated
- **Caching**: Browser caching for static assets
- **Minification**: Production-ready code structure
- **Database Indexes**: Optimized database queries

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL server is running
   - Verify credentials in `config/database.php`
   - Ensure database exists

2. **API Errors**
   - Check PHP error logs
   - Verify file permissions
   - Ensure mod_rewrite is enabled

3. **Login Issues**
   - Clear browser cache and cookies
   - Check if session handling is working
   - Verify user exists in database

### Debug Mode
Enable PHP error reporting by adding to top of PHP files:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Open an issue on the repository

## Version History

- **v1.0.0**: Initial release with core CRM and project management features
- Features include: Contact management, Project tracking, Task boards, Calendar, Dashboard analytics

## Future Enhancements

- Email integration
- Document management
- Advanced reporting
- Mobile app
- Third-party integrations
- Automated workflows
- Advanced user permissions

---

**Built with ❤️ using modern web technologies** 