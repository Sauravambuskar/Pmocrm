<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class ProjectAPI {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        switch ($method) {
            case 'GET':
                if (isset($_GET['id'])) {
                    $this->getProject($_GET['id']);
                } else {
                    $this->getAllProjects();
                }
                break;
            case 'POST':
                $this->createProject();
                break;
            case 'PUT':
                if (isset($_GET['id'])) {
                    $this->updateProject($_GET['id']);
                } else {
                    $this->sendResponse(400, ['error' => 'Project ID required']);
                }
                break;
            case 'DELETE':
                if (isset($_GET['id'])) {
                    $this->deleteProject($_GET['id']);
                } else {
                    $this->sendResponse(400, ['error' => 'Project ID required']);
                }
                break;
            default:
                $this->sendResponse(405, ['error' => 'Method not allowed']);
        }
    }
    
    private function getAllProjects() {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
            $offset = ($page - 1) * $limit;
            
            $status = isset($_GET['status']) ? $_GET['status'] : '';
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            $query = "SELECT p.*, c.name as client_name, c.industry,
                             u.first_name as manager_first_name, u.last_name as manager_last_name,
                             COUNT(DISTINCT t.id) as total_tasks,
                             COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                             COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.actual_hours ELSE 0 END), 0) as total_hours
                      FROM projects p
                      LEFT JOIN companies c ON p.client_id = c.id
                      LEFT JOIN users u ON p.project_manager_id = u.id
                      LEFT JOIN tasks t ON p.id = t.project_id
                      WHERE 1=1";
            
            $params = [];
            
            if (!empty($status)) {
                $query .= " AND p.status = ?";
                $params[] = $status;
            }
            
            if (!empty($search)) {
                $query .= " AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
                $searchTerm = "%$search%";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm]);
            }
            
            $query .= " GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Calculate progress percentage based on completed tasks
            foreach ($projects as &$project) {
                if ($project['total_tasks'] > 0) {
                    $project['calculated_progress'] = round(($project['completed_tasks'] / $project['total_tasks']) * 100);
                } else {
                    $project['calculated_progress'] = 0;
                }
                
                // Get team members
                $teamQuery = "SELECT pm.*, u.first_name, u.last_name, u.avatar 
                             FROM project_members pm 
                             JOIN users u ON pm.user_id = u.id 
                             WHERE pm.project_id = ?";
                $teamStmt = $this->conn->prepare($teamQuery);
                $teamStmt->execute([$project['id']]);
                $project['team'] = $teamStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            // Get total count
            $countQuery = "SELECT COUNT(DISTINCT p.id) as total FROM projects p LEFT JOIN companies c ON p.client_id = c.id WHERE 1=1";
            $countParams = [];
            
            if (!empty($status)) {
                $countQuery .= " AND p.status = ?";
                $countParams[] = $status;
            }
            
            if (!empty($search)) {
                $countQuery .= " AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
                $searchTerm = "%$search%";
                $countParams = array_merge($countParams, [$searchTerm, $searchTerm, $searchTerm]);
            }
            
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            $this->sendResponse(200, [
                'projects' => $projects,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => ceil($total / $limit),
                    'total_items' => $total,
                    'items_per_page' => $limit
                ]
            ]);
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function getProject($id) {
        try {
            $query = "SELECT p.*, c.name as client_name, c.industry, c.email as client_email,
                             u.first_name as manager_first_name, u.last_name as manager_last_name
                      FROM projects p
                      LEFT JOIN companies c ON p.client_id = c.id
                      LEFT JOIN users u ON p.project_manager_id = u.id
                      WHERE p.id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($project) {
                // Get tasks
                $taskQuery = "SELECT t.*, u.first_name as assigned_first_name, u.last_name as assigned_last_name
                             FROM tasks t
                             LEFT JOIN users u ON t.assigned_to = u.id
                             WHERE t.project_id = ?
                             ORDER BY t.created_at DESC";
                $taskStmt = $this->conn->prepare($taskQuery);
                $taskStmt->execute([$id]);
                $project['tasks'] = $taskStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get team members
                $teamQuery = "SELECT pm.*, u.first_name, u.last_name, u.email, u.avatar
                             FROM project_members pm
                             JOIN users u ON pm.user_id = u.id
                             WHERE pm.project_id = ?";
                $teamStmt = $this->conn->prepare($teamQuery);
                $teamStmt->execute([$id]);
                $project['team'] = $teamStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get recent activities
                $activityQuery = "SELECT * FROM activities WHERE project_id = ? ORDER BY activity_date DESC LIMIT 10";
                $activityStmt = $this->conn->prepare($activityQuery);
                $activityStmt->execute([$id]);
                $project['activities'] = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get time entries
                $timeQuery = "SELECT te.*, u.first_name, u.last_name, t.title as task_title
                             FROM time_entries te
                             JOIN users u ON te.user_id = u.id
                             LEFT JOIN tasks t ON te.task_id = t.id
                             WHERE te.project_id = ?
                             ORDER BY te.start_time DESC
                             LIMIT 20";
                $timeStmt = $this->conn->prepare($timeQuery);
                $timeStmt->execute([$id]);
                $project['time_entries'] = $timeStmt->fetchAll(PDO::FETCH_ASSOC);
                
                $this->sendResponse(200, $project);
            } else {
                $this->sendResponse(404, ['error' => 'Project not found']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function createProject() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['name'])) {
                $this->sendResponse(400, ['error' => 'Project name is required']);
                return;
            }
            
            $query = "INSERT INTO projects (name, description, client_id, status, priority, 
                                          start_date, end_date, budget, project_manager_id, 
                                          color, notes, created_by) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['client_id'] ?? null,
                $data['status'] ?? 'planning',
                $data['priority'] ?? 'medium',
                $data['start_date'] ?? null,
                $data['end_date'] ?? null,
                $data['budget'] ?? null,
                $data['project_manager_id'] ?? null,
                $data['color'] ?? '#3B82F6',
                $data['notes'] ?? null,
                $data['created_by'] ?? 1
            ]);
            
            if ($result) {
                $projectId = $this->conn->lastInsertId();
                
                // Add team members if provided
                if (isset($data['team_members']) && is_array($data['team_members'])) {
                    $this->addTeamMembers($projectId, $data['team_members']);
                }
                
                // Log activity
                $this->logActivity('system', 'Project created', null, null, null, $projectId, $data['created_by'] ?? 1);
                
                $this->sendResponse(201, ['id' => $projectId, 'message' => 'Project created successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to create project']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function updateProject($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $query = "UPDATE projects SET 
                      name = ?, description = ?, client_id = ?, status = ?, priority = ?, 
                      start_date = ?, end_date = ?, budget = ?, project_manager_id = ?, 
                      color = ?, notes = ?, progress_percentage = ?, updated_at = CURRENT_TIMESTAMP 
                      WHERE id = ?";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                $data['client_id'] ?? null,
                $data['status'] ?? 'planning',
                $data['priority'] ?? 'medium',
                $data['start_date'] ?? null,
                $data['end_date'] ?? null,
                $data['budget'] ?? null,
                $data['project_manager_id'] ?? null,
                $data['color'] ?? '#3B82F6',
                $data['notes'] ?? null,
                $data['progress_percentage'] ?? 0,
                $id
            ]);
            
            if ($result) {
                // Update team members if provided
                if (isset($data['team_members']) && is_array($data['team_members'])) {
                    // Remove existing team members
                    $deleteTeamQuery = "DELETE FROM project_members WHERE project_id = ?";
                    $deleteTeamStmt = $this->conn->prepare($deleteTeamQuery);
                    $deleteTeamStmt->execute([$id]);
                    
                    // Add new team members
                    $this->addTeamMembers($id, $data['team_members']);
                }
                
                // Log activity
                $this->logActivity('system', 'Project updated', null, null, null, $id, $data['updated_by'] ?? 1);
                
                $this->sendResponse(200, ['message' => 'Project updated successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to update project']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function deleteProject($id) {
        try {
            $query = "DELETE FROM projects WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([$id]);
            
            if ($result) {
                $this->sendResponse(200, ['message' => 'Project deleted successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to delete project']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function addTeamMembers($projectId, $teamMembers) {
        try {
            $query = "INSERT INTO project_members (project_id, user_id, role, hourly_rate) VALUES (?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            
            foreach ($teamMembers as $member) {
                $stmt->execute([
                    $projectId,
                    $member['user_id'],
                    $member['role'] ?? 'member',
                    $member['hourly_rate'] ?? null
                ]);
            }
        } catch (Exception $e) {
            error_log("Failed to add team members: " . $e->getMessage());
        }
    }
    
    private function logActivity($type, $subject, $contactId, $companyId, $dealId, $projectId, $userId) {
        try {
            $query = "INSERT INTO activities (activity_type, subject, contact_id, company_id, deal_id, project_id, user_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$type, $subject, $contactId, $companyId, $dealId, $projectId, $userId]);
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }
    
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}

// Initialize and handle the request
$api = new ProjectAPI();
$api->handleRequest();
?> 