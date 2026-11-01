<?php
require_once __DIR__ . '/config.php';

// Logout Handler
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    unset($_SESSION['emp_user'], $_SESSION['admin_logged_in'], $_SESSION['admin_user']);
    session_destroy();
    header('Location: index.php');
    exit;
}

// Handle AJAX Login Request from Index Modal
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $empId = trim($_POST['emp_id'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($empId) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Please enter Employee ID and Password.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM employees WHERE emp_id = ?");
    $stmt->execute([$empId]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['emp_user'] = $user['emp_id'];
        log_activity('LOGIN', $user['emp_id'], '-', 'SUCCESS', 'Employee logged in successfully.');
        echo json_encode(['success' => true]);
        exit;
    } else {
        if ($empId === 'admin' && $password === 'AdminSecret123!') {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_user'] = 'Master Admin';
            log_activity('ADMIN_LOGIN', 'ADMIN', '-', 'SUCCESS', 'Master admin logged in.');
            echo json_encode(['success' => true]);
            exit;
        }

        log_activity('LOGIN', $empId, '-', 'FAILURE', 'Invalid credentials provided.');
        echo json_encode(['success' => false, 'error' => 'Invalid Employee ID or Password.']);
        exit;
    }
}
?>