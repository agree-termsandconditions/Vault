<?php
// Start session globally for all pages
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// DATABASE CONFIGURATION
define('DB_HOST', 'localhost');
define('DB_NAME', 'intranet_vault');
define('DB_USER', 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // If local MySQL is not reachable, fall back to SQLite for preview/local development
    $sqliteFile = __DIR__ . '/intranet_vault.sqlite';
    $needInit = !file_exists($sqliteFile);
    $pdo = new PDO("sqlite:" . $sqliteFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    if ($needInit) {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS departments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              dept_code TEXT NOT NULL UNIQUE,
              dept_name TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS employees (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              emp_id TEXT NOT NULL UNIQUE,
              full_name TEXT NOT NULL,
              first_name TEXT NOT NULL,
              gender TEXT DEFAULT 'Male',
              designation TEXT DEFAULT 'Staff Member',
              department_id INTEGER NULL,
              email TEXT NULL,
              remarks TEXT NULL,
              is_active INTEGER NOT NULL DEFAULT 1,
              password_hash TEXT NOT NULL,
              must_change_password INTEGER NOT NULL DEFAULT 1,
              passwordless_allowed INTEGER NOT NULL DEFAULT 0,
              user_type TEXT DEFAULT 'regular',
              reset_token TEXT NULL,
              reset_token_expires DATETIME NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS files (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_uuid TEXT NOT NULL UNIQUE,
              batch_id TEXT NOT NULL,
              uploaded_by_emp_id TEXT NULL,
              original_name TEXT NOT NULL,
              mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
              file_extension TEXT NOT NULL,
              file_size INTEGER NOT NULL,
              storage_path TEXT NOT NULL,
              encryption_salt TEXT NOT NULL,
              encryption_iv TEXT NOT NULL,
              uploaded_by_ip TEXT NULL,
              download_count INTEGER NOT NULL DEFAULT 0,
              is_passwordless INTEGER NOT NULL DEFAULT 0,
              is_deleted_by_user INTEGER NOT NULL DEFAULT 0,
              expires_at DATETIME NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS admins (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              full_name TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'sub_admin',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS allowed_extensions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              extension TEXT NOT NULL UNIQUE,
              mime_type TEXT NOT NULL,
              category TEXT NOT NULL DEFAULT 'Document',
              is_allowed INTEGER NOT NULL DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS activity_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              action TEXT NOT NULL,
              emp_id TEXT NULL,
              file_name TEXT NULL,
              ip_address TEXT DEFAULT '127.0.0.1',
              status TEXT NOT NULL DEFAULT 'SUCCESS',
              details TEXT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS passwordless_requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              emp_id TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'PENDING',
              admin_notes TEXT NULL,
              requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              reviewed_at DATETIME NULL
            );
        ");

        $adminHash = password_hash('AdminSecret123!', PASSWORD_BCRYPT);
        $empHash = password_hash('123456', PASSWORD_BCRYPT);

        $pdo->exec("
            INSERT OR IGNORE INTO admins (username, password_hash, full_name, role) VALUES
            ('admin', '{$adminHash}', 'System Administrator', 'super_admin');

            INSERT OR IGNORE INTO departments (dept_code, dept_name) VALUES
            ('IT', 'Information Technology'),
            ('HR', 'Human Resources'),
            ('FIN', 'Finance & Accounting'),
            ('ENG', 'Engineering'),
            ('OPS', 'Operations & Logistics');

            INSERT OR IGNORE INTO employees (emp_id, full_name, first_name, gender, designation, department_id, email, password_hash, must_change_password, passwordless_allowed, user_type) VALUES
            ('EMP-1001', 'Akish Kumar', 'Akish', 'Male', 'Senior Network Engineer', 1, 'akish@company.local', '{$empHash}', 0, 1, 'master_admin'),
            ('EMP-1002', 'Jane Smith', 'Jane', 'Female', 'HR Specialist', 2, 'jane.smith@company.local', '{$empHash}', 1, 0, 'regular'),
            ('EMP-1003', 'Robert Chen', 'Robert', 'Male', 'DevOps Specialist', 4, 'robert.chen@company.local', '{$empHash}', 1, 0, 'regular');

            INSERT OR IGNORE INTO allowed_extensions (extension, mime_type, category, is_allowed) VALUES
            ('pdf', 'application/pdf', 'Document', 1),
            ('zip', 'application/zip', 'Archive', 1),
            ('jpg', 'image/jpeg', 'Image', 1),
            ('png', 'image/png', 'Image', 1),
            ('doc', 'application/msword', 'Document', 1),
            ('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Document', 1),
            ('xls', 'application/vnd.ms-excel', 'Spreadsheet', 1),
            ('xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Spreadsheet', 1),
            ('txt', 'text/plain', 'Text', 1),
            ('csv', 'text/csv', 'Spreadsheet', 1);
        ");
    }
}

// STORAGE PATH CONFIGURATION
$defaultStorage = is_dir('D:/EncryptedUploads/') ? 'D:/EncryptedUploads/' : __DIR__ . '/EncryptedUploads/';
define('STORAGE_PATH', $defaultStorage);
if (!file_exists(STORAGE_PATH)) {
    @mkdir(STORAGE_PATH, 0777, true);
}

// SECURITY HEADERS & ANTI-CACHE
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Security-Policy: default-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: blob:;");

// HELPER FUNCTIONS
if (!function_exists('e')) {
    function e($string) {
        return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('csrf_token')) {
    function csrf_token() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
}

if (!function_exists('format_bytes')) {
    function format_bytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}

if (!function_exists('fix_win_path')) {
    function fix_win_path($path) {
        $normalized = str_replace('\\', '/', $path);
        return $normalized;
    }
}

if (!function_exists('encrypt_file_data')) {
    function encrypt_file_data($data, $pin) {
        $salt = random_bytes(16);
        $iv = random_bytes(16);
        $key = hash_pbkdf2("sha256", $pin, $salt, 10000, 32, true);
        $encrypted = openssl_encrypt($data, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        return [
            'encrypted_data' => $encrypted,
            'salt_hex' => bin2hex($salt),
            'iv_hex' => bin2hex($iv)
        ];
    }
}

if (!function_exists('decrypt_file_data')) {
    function decrypt_file_data($encryptedData, $saltHex, $ivHex, $pin) {
        $salt = hex2bin($saltHex);
        $iv = hex2bin($ivHex);
        if (!$salt || !$iv) return false;
        $key = hash_pbkdf2("sha256", $pin, $salt, 10000, 32, true);
        return openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
    }
}

if (!function_exists('log_activity')) {
    function log_activity($action, $empId, $fileName, $status, $details = '') {
        global $pdo;
        try {
            $stmt = $pdo->prepare("INSERT INTO activity_logs (action, emp_id, file_name, status, details) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$action, $empId, $fileName, $status, $details]);
        } catch (Throwable $e) {}
    }
}

// GLOBAL ANTI-INSPECTION & SECURITY INJECTION
if (!function_exists('render_global_security_script')) {
    function render_global_security_script() {
        ?>
        <script>
            // 1. Disable Right-Click Context Menu
            document.addEventListener('contextmenu', event => event.preventDefault());

            // 2. Disable Keyboard Shortcuts for Inspect, View Source, and DevTools
            document.addEventListener('keydown', function(event) {
                // Prevent F12
                if (event.keyCode === 123) {
                    event.preventDefault();
                    return false;
                }
                // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
                if (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74 || event.keyCode === 65)) {
                    event.preventDefault();
                    return false;
                }
                // Prevent Ctrl+U (View Source) and Ctrl+S (Save)
                if (event.ctrlKey && (event.keyCode === 85 || event.keyCode === 83)) {
                    event.preventDefault();
                    return false;
                }
            });

            // 3. Optional: Detect DevTools Open and clear screen
            (function() {
                let threshold = 160;
                let checkInterval = setInterval(function() {
                    if (window.outerWidth - window.innerWidth > threshold || window.outerHeight - window.innerHeight > threshold) {
                        document.body.innerHTML = "<h2 style='text-align:center; margin-top:20vh; font-family:sans-serif; color:#fff;'>Developer Tools Detected. Access Restricted.</h2>";
                        clearInterval(checkInterval);
                    }
                }, 1000);
            })();
        </script>
        <?php
    }
}

// GLOBAL ERROR & EXCEPTION HANDLER
function custom_global_exception_handler($exception) {
    error_log($exception->getMessage());
    if (ob_get_level()) { ob_end_clean(); }
    http_response_code(500);
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Application Error - Intranet Vault</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="style.css">
    </head>
    <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="glass-panel max-w-md w-full p-8 bg-slate-800 rounded-2xl border border-slate-700 text-center space-y-5 shadow-2xl">
            <div class="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto text-3xl">⚠️</div>
            <div class="space-y-2">
                <h2 class="text-xl font-bold text-white">Something Went Wrong</h2>
                <p class="text-xs text-slate-400">An unexpected error occurred while processing your request. The system has logged this incident.</p>
            </div>
            <div class="pt-2">
                <a href="index.php" class="inline-block w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl transition shadow-lg">&larr; Return to Home Vault</a>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

function custom_global_error_handler($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) { return false; }
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

set_exception_handler('custom_global_exception_handler');
set_error_handler('custom_global_error_handler');