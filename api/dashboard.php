<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

require_once '../config/database.php';

class DashboardAPI {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getDashboardData() {
        try {
            $data = [
                'stats' => $this->getStats(),
                'recent_activities' => $this->getRecentActivities(),
                'upcoming_tasks' => $this->getUpcomingTasks(),
                'project_progress' => $this->getProjectProgress(),
                'revenue_data' => $this->getRevenueData(),
                'task_distribution' => $this->getTaskDistribution()
            ];
            
            $this->sendResponse(200, $data);
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function getStats() {
        $stats = [];
        
        // Total Contacts
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM contacts");
        $stats['total_contacts'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Active Projects
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM projects WHERE status IN ('planning', 'active')");
        $stats['active_projects'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Pending Tasks
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM tasks WHERE status IN ('todo', 'in-progress')");
        $stats['pending_tasks'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Revenue (from closed-won deals)
        $stmt = $this->conn->query("SELECT COALESCE(SUM(amount), 0) as revenue FROM deals WHERE stage = 'closed-won'");
        $stats['total_revenue'] = $stmt->fetch(PDO::FETCH_ASSOC)['revenue'];
        
        // Growth calculations (mock data for demo)
        $stats['contacts_growth'] = 12;
        $stats['projects_growth'] = 8;
        $stats['tasks_due_today'] = rand(5, 25);
        $stats['revenue_growth'] = 18;
        
        return $stats;
    }
    
    private function getRecentActivities() {
        $query = "SELECT a.*, c.first_name, c.last_name, co.name as company_name, u.first_name as user_first_name, u.last_name as user_last_name
                  FROM activities a
                  LEFT JOIN contacts c ON a.contact_id = c.id
                  LEFT JOIN companies co ON a.company_id = co.id
                  LEFT JOIN users u ON a.user_id = u.id
                  ORDER BY a.activity_date DESC
                  LIMIT 10";
        
        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getUpcomingTasks() {
        $query = "SELECT t.*, p.name as project_name, u.first_name, u.last_name
                  FROM tasks t
                  LEFT JOIN projects p ON t.project_id = p.id
                  LEFT JOIN users u ON t.assigned_to = u.id
                  WHERE t.status IN ('todo', 'in-progress') 
                  AND t.due_date >= CURDATE()
                  ORDER BY t.due_date ASC
                  LIMIT 8";
        
        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getProjectProgress() {
        $query = "SELECT p.name, p.status, p.progress_percentage, p.budget, p.start_date, p.end_date,
                         c.name as client_name,
                         COUNT(t.id) as total_tasks,
                         COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
                  FROM projects p
                  LEFT JOIN companies c ON p.client_id = c.id
                  LEFT JOIN tasks t ON p.id = t.project_id
                  WHERE p.status IN ('planning', 'active')
                  GROUP BY p.id
                  ORDER BY p.created_at DESC
                  LIMIT 5";
        
        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    private function getRevenueData() {
        // Generate mock revenue data for the last 6 months
        $months = [];
        $revenue = [];
        
        for ($i = 5; $i >= 0; $i--) {
            $month = date('M', strtotime("-$i months"));
            $months[] = $month;
            $revenue[] = rand(15000, 45000);
        }
        
        return [
            'labels' => $months,
            'data' => $revenue
        ];
    }
    
    private function getTaskDistribution() {
        $query = "SELECT 
                    COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
                    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
                    COUNT(CASE WHEN status = 'review' THEN 1 END) as review,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
                  FROM tasks";
        
        $stmt = $this->conn->query($query);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return [
            'labels' => ['To Do', 'In Progress', 'Review', 'Completed'],
            'data' => [
                (int)$result['todo'],
                (int)$result['in_progress'],
                (int)$result['review'],
                (int)$result['completed']
            ]
        ];
    }
    
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}

// Handle the request
$api = new DashboardAPI();
$api->getDashboardData();
?> 