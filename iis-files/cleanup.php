<?php
/**
 * Intranet File Vault - CLI 48-Hour Auto-Purge Cron Script
 * Run via Windows Task Scheduler or Windows Command Line:
 * C:\php\php.exe C:\inetpub\wwwroot\IntranetVault\cleanup.php
 */

// Force CLI mode only for security
if (php_sapi_name() !== 'cli' && !isset($_GET['admin_cron_key'])) {
    http_response_code(403);
    die("Access Denied: Cleanup script must be executed via CLI or authorized cron key.");
}

require_once __DIR__ . '/config.php';

echo "====================================================\n";
echo "INTRANET VAULT - 48-HOUR AUTOMATED PURGE JOB\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "====================================================\n";

// Query expired files older than 48 hours
$stmt = $pdo->prepare("SELECT id, original_name, storage_path FROM files WHERE expires_at <= NOW()");
$stmt->execute();
$expiredFiles = $stmt->fetchAll();

$purgedCount = 0;
$failedCount = 0;

foreach ($expiredFiles as $file) {
    echo "Purging: " . $file['original_name'] . " (" . $file['storage_path'] . ")... ";

    // Remove file from disk
    if (file_exists($file['storage_path'])) {
        if (@unlink($file['storage_path'])) {
            echo "[DISK PURGED] ";
        } else {
            echo "[DISK UNLINK FAILED] ";
            $failedCount++;
        }
    } else {
        echo "[FILE NOT FOUND ON DISK] ";
    }

    // Remove DB record
    $delStmt = $pdo->prepare("DELETE FROM files WHERE id = ?");
    $delStmt->execute([$file['id']]);
    echo "[DB DELETED]\n";

    log_activity('AUTO_PURGE', 'SYSTEM', $file['original_name'], 'SUCCESS', 'File older than 48 hours auto-deleted by cleanup cron');
    $purgedCount++;
}

echo "----------------------------------------------------\n";
echo "Purge Complete. Total files removed: $purgedCount, Failures: $failedCount\n";
echo "====================================================\n";
