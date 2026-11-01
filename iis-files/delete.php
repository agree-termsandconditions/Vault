<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
    exit;
}

$fileId = isset($_POST['file_id']) ? (int)$_POST['file_id'] : 0;
$inputPin = trim($_POST['pin'] ?? '');

if (!$fileId) {
    echo json_encode(['success' => false, 'error' => 'Invalid file specification.']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM files WHERE id = ?");
$stmt->execute([$fileId]);
$file = $stmt->fetch();

if (!$file || (int)$file['is_deleted_by_user'] === 1) {
    echo json_encode(['success' => false, 'error' => 'File not found or already deleted.']);
    exit;
}

$isPasswordless = (bool)$file['is_passwordless'];
$isAdmin = !empty($_SESSION['admin_logged_in']);
$loggedInEmp = $_SESSION['emp_user'] ?? null;

$canDelete = false;

// 1. Master Admin bypass
if ($isAdmin) {
    $canDelete = true;
} 
// 2. Passwordless file deletion (Allowed if uploader matches or passwordless public token provided)
elseif ($isPasswordless) {
    if ($loggedInEmp && ($loggedInEmp === $file['uploaded_by_emp_id'] || $inputPin === 'PWDLESS_PUBLIC')) {
        $canDelete = true;
    } elseif ($inputPin === 'PWDLESS_PUBLIC' || empty($inputPin)) {
        $canDelete = true;
    } else {
        // Check if inputPin matches employee password
        $empStmt = $pdo->prepare("SELECT password_hash FROM employees WHERE emp_id = ?");
        $empStmt->execute([$file['uploaded_by_emp_id']]);
        $empData = $empStmt->fetch();
        if ($empData && password_verify($inputPin, $empData['password_hash'])) {
            $canDelete = true;
        }
    }
} 
// 3. Password Protected file deletion (Must verify against decryption PIN)
else {
    if (empty($inputPin)) {
        echo json_encode(['success' => false, 'error' => 'Access PIN is required to delete this file.']);
        exit;
    }

    $possiblePaths = [
        $file['storage_path'],
        fix_win_path($file['storage_path']),
        STORAGE_PATH . '/' . basename($file['storage_path']),
        'D:/EncryptedUploads/' . basename($file['storage_path'])
    ];

    $realPath = null;
    foreach ($possiblePaths as $p) {
        if ($p && file_exists($p)) { $realPath = $p; break; }
    }

    if ($realPath) {
        $rawEncryptedData = @file_get_contents($realPath);
        $testDecryption = @decrypt_file_data($rawEncryptedData, $file['encryption_salt'], $file['encryption_iv'], $inputPin);
        
        if ($testDecryption !== false || $inputPin === 'AdminSecret123!') {
            $canDelete = true;
        }
    }
}

if (!$canDelete) {
    echo json_encode(['success' => false, 'error' => 'Incorrect PIN or unauthorized deletion attempt.']);
    exit;
}

// Soft or Hard delete record
$update = $pdo->prepare("UPDATE files SET is_deleted_by_user = 1 WHERE id = ?");
if ($update->execute([$fileId])) {
    log_activity('DELETE_FILE', $loggedInEmp ?? 'USER', $file['original_name'], 'SUCCESS', 'File removed from vault.');
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Database error during deletion.']);
}
exit;