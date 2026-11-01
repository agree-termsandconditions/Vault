<?php
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE & ~E_DEPRECATED);
ini_set('display_errors', 0);

require_once __DIR__ . '/config.php';

$fileId = isset($_GET['file_id']) ? (int)$_GET['file_id'] : 0;
$inputPin = trim($_GET['pin'] ?? '');
$action = $_GET['action'] ?? 'view';

function respond_json($success, $error = '') {
    header('Content-Type: application/json');
    echo json_encode(['success' => $success, 'error' => $error]);
    exit;
}

if (!$fileId) {
    if ($action === 'verify') respond_json(false, 'Invalid file request.');
    die("Invalid file request.");
}

$stmt = $pdo->prepare("SELECT * FROM files WHERE id = ?");
$stmt->execute([$fileId]);
$file = $stmt->fetch();

if (!$file || (int)$file['is_deleted_by_user'] === 1) {
    if ($action === 'verify') respond_json(false, 'File not found or removed.');
    die("File not found or has been removed.");
}

$isPasswordless = (bool)$file['is_passwordless'];
$isMasterAdmin = (!empty($_SESSION['admin_logged_in']) && $inputPin === 'AdminSecret123!');

if (!$isPasswordless && !$isMasterAdmin) {
    if (empty($inputPin)) {
        if ($action === 'verify') respond_json(false, 'PIN is required to unlock this file.');
        die("PIN required to access this encrypted file.");
    }
}

$possiblePaths = [
    $file['storage_path'],
    fix_win_path($file['storage_path']),
    STORAGE_PATH . '/' . basename($file['storage_path']),
    'D:/EncryptedUploads/' . basename($file['storage_path'])
];

$realPath = null;
foreach ($possiblePaths as $p) {
    if ($p && file_exists($p)) {
        $realPath = $p;
        break;
    }
}

if (!$realPath) {
    if ($action === 'verify') respond_json(false, 'File content missing from storage disk.');
    die("Error: File content missing from storage disk.");
}

$rawEncryptedData = @file_get_contents($realPath);
if ($rawEncryptedData === false) {
    if ($action === 'verify') respond_json(false, 'Unable to read file from disk.');
    die("Error reading file from disk.");
}

$decryptionPin = $isPasswordless ? 'PWDLESS_PUBLIC' : $inputPin;

$decryptedBytes = false;
try {
    $decryptedBytes = decrypt_file_data(
        $rawEncryptedData,
        $file['encryption_salt'],
        $file['encryption_iv'],
        $decryptionPin
    );
} catch (Throwable $e) { $decryptedBytes = false; }

if ($decryptedBytes === false && $isMasterAdmin) {
    try {
        $decryptedBytes = decrypt_file_data($rawEncryptedData, $file['encryption_salt'], $file['encryption_iv'], 'AdminSecret123!');
    } catch (Throwable $e) { $decryptedBytes = false; }
}

if ($decryptedBytes === false) {
    if ($action === 'verify') respond_json(false, 'Incorrect PIN entered.');
    die("Incorrect PIN. Decryption failed.");
}

if ($action === 'verify') {
    respond_json(true);
}

$actor = $_SESSION['emp_user'] ?? $_SESSION['admin_user'] ?? 'GUEST_PUBLIC';
log_activity('ACCESS_FILE', $actor, $file['original_name'], 'SUCCESS', "Action: $action");

$filename = $file['original_name'];
$mime = $file['mime_type'] ?: 'application/octet-stream';
$fileSize = strlen($decryptedBytes);

while (ob_get_level()) { ob_end_clean(); }

// HTTP Range Requests for Time Frame Seeking
header('Accept-Ranges: bytes');
header('Content-Type: ' . $mime);

if (isset($_SERVER['HTTP_RANGE'])) {
    list($param, $range) = explode('=', $_SERVER['HTTP_RANGE'], 2);
    if (strtolower($param) === 'bytes') {
        list($start, $end) = explode('-', $range, 2);
        $start = ($start === '') ? 0 : (int)$start;
        $end = ($end === '') ? ($fileSize - 1) : (int)$end;

        if ($start > $end || $start >= $fileSize) {
            header('HTTP/1.1 416 Requested Range Not Satisfiable');
            header("Content-Range: bytes */$fileSize");
            exit;
        }

        $length = $end - $start + 1;
        header('HTTP/1.1 206 Partial Content');
        header("Content-Range: bytes $start-$end/$fileSize");
        header("Content-Length: $length");
        echo substr($decryptedBytes, $start, $length);
        exit;
    }
}

header("Content-Length: $fileSize");
header('Cache-Control: private, max-age=0, must-revalidate');

if ($action === 'download') {
    header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
} else {
    header('Content-Disposition: inline; filename="' . basename($filename) . '"');
}

echo $decryptedBytes;
exit;