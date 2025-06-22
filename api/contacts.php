<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

class ContactAPI {
    private $conn;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', $path);
        
        switch ($method) {
            case 'GET':
                if (isset($_GET['id'])) {
                    $this->getContact($_GET['id']);
                } else {
                    $this->getAllContacts();
                }
                break;
            case 'POST':
                $this->createContact();
                break;
            case 'PUT':
                if (isset($_GET['id'])) {
                    $this->updateContact($_GET['id']);
                } else {
                    $this->sendResponse(400, ['error' => 'Contact ID required']);
                }
                break;
            case 'DELETE':
                if (isset($_GET['id'])) {
                    $this->deleteContact($_GET['id']);
                } else {
                    $this->sendResponse(400, ['error' => 'Contact ID required']);
                }
                break;
            default:
                $this->sendResponse(405, ['error' => 'Method not allowed']);
        }
    }
    
    private function getAllContacts() {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 25;
            $offset = ($page - 1) * $limit;
            
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $category = isset($_GET['category']) ? $_GET['category'] : '';
            
            $query = "SELECT c.*, co.name as company_name, co.industry,
                             u1.first_name as created_by_name, u1.last_name as created_by_lastname,
                             u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
                      FROM contacts c
                      LEFT JOIN companies co ON c.company_id = co.id
                      LEFT JOIN users u1 ON c.created_by = u1.id
                      LEFT JOIN users u2 ON c.assigned_to = u2.id
                      WHERE 1=1";
            
            $params = [];
            
            if (!empty($search)) {
                $query .= " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR co.name LIKE ?)";
                $searchTerm = "%$search%";
                $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
            }
            
            if (!empty($category)) {
                $query .= " AND c.category = ?";
                $params[] = $category;
            }
            
            $query .= " ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM contacts c LEFT JOIN companies co ON c.company_id = co.id WHERE 1=1";
            $countParams = [];
            
            if (!empty($search)) {
                $countQuery .= " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR co.name LIKE ?)";
                $searchTerm = "%$search%";
                $countParams = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            }
            
            if (!empty($category)) {
                $countQuery .= " AND c.category = ?";
                $countParams[] = $category;
            }
            
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->execute($countParams);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            $this->sendResponse(200, [
                'contacts' => $contacts,
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
    
    private function getContact($id) {
        try {
            $query = "SELECT c.*, co.name as company_name, co.industry,
                             u1.first_name as created_by_name, u1.last_name as created_by_lastname,
                             u2.first_name as assigned_to_name, u2.last_name as assigned_to_lastname
                      FROM contacts c
                      LEFT JOIN companies co ON c.company_id = co.id
                      LEFT JOIN users u1 ON c.created_by = u1.id
                      LEFT JOIN users u2 ON c.assigned_to = u2.id
                      WHERE c.id = ?";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact) {
                // Get recent activities
                $activityQuery = "SELECT * FROM activities WHERE contact_id = ? ORDER BY activity_date DESC LIMIT 10";
                $activityStmt = $this->conn->prepare($activityQuery);
                $activityStmt->execute([$id]);
                $contact['activities'] = $activityStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get deals
                $dealQuery = "SELECT * FROM deals WHERE contact_id = ? ORDER BY created_at DESC";
                $dealStmt = $this->conn->prepare($dealQuery);
                $dealStmt->execute([$id]);
                $contact['deals'] = $dealStmt->fetchAll(PDO::FETCH_ASSOC);
                
                $this->sendResponse(200, $contact);
            } else {
                $this->sendResponse(404, ['error' => 'Contact not found']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function createContact() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['first_name']) || !isset($data['last_name'])) {
                $this->sendResponse(400, ['error' => 'First name and last name are required']);
                return;
            }
            
            $query = "INSERT INTO contacts (company_id, first_name, last_name, email, phone, mobile, 
                                          job_title, department, address, city, state, country, 
                                          postal_code, category, lead_source, lead_status, notes, 
                                          created_by, assigned_to) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $data['company_id'] ?? null,
                $data['first_name'],
                $data['last_name'],
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['mobile'] ?? null,
                $data['job_title'] ?? null,
                $data['department'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['country'] ?? null,
                $data['postal_code'] ?? null,
                $data['category'] ?? 'prospect',
                $data['lead_source'] ?? null,
                $data['lead_status'] ?? 'new',
                $data['notes'] ?? null,
                $data['created_by'] ?? 1, // Default to admin user
                $data['assigned_to'] ?? null
            ]);
            
            if ($result) {
                $contactId = $this->conn->lastInsertId();
                
                // Log activity
                $this->logActivity('system', 'Contact created', $contactId, null, null, null, $data['created_by'] ?? 1);
                
                $this->sendResponse(201, ['id' => $contactId, 'message' => 'Contact created successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to create contact']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function updateContact($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $query = "UPDATE contacts SET 
                      company_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, 
                      mobile = ?, job_title = ?, department = ?, address = ?, city = ?, 
                      state = ?, country = ?, postal_code = ?, category = ?, lead_source = ?, 
                      lead_status = ?, notes = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP 
                      WHERE id = ?";
            
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([
                $data['company_id'] ?? null,
                $data['first_name'],
                $data['last_name'],
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['mobile'] ?? null,
                $data['job_title'] ?? null,
                $data['department'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['country'] ?? null,
                $data['postal_code'] ?? null,
                $data['category'] ?? 'prospect',
                $data['lead_source'] ?? null,
                $data['lead_status'] ?? 'new',
                $data['notes'] ?? null,
                $data['assigned_to'] ?? null,
                $id
            ]);
            
            if ($result) {
                // Log activity
                $this->logActivity('system', 'Contact updated', $id, null, null, null, $data['updated_by'] ?? 1);
                
                $this->sendResponse(200, ['message' => 'Contact updated successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to update contact']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function deleteContact($id) {
        try {
            $query = "DELETE FROM contacts WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([$id]);
            
            if ($result) {
                $this->sendResponse(200, ['message' => 'Contact deleted successfully']);
            } else {
                $this->sendResponse(500, ['error' => 'Failed to delete contact']);
            }
            
        } catch (Exception $e) {
            $this->sendResponse(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
    
    private function logActivity($type, $subject, $contactId, $companyId, $dealId, $projectId, $userId) {
        try {
            $query = "INSERT INTO activities (activity_type, subject, contact_id, company_id, deal_id, project_id, user_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$type, $subject, $contactId, $companyId, $dealId, $projectId, $userId]);
        } catch (Exception $e) {
            // Log error but don't fail the main operation
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
$api = new ContactAPI();
$api->handleRequest();
?> 