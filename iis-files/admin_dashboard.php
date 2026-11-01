<?php
require_once __DIR__ . '/config.php';

if (empty($_SESSION['admin_logged_in'])) { header('Location: auth.php'); exit; }
$adminUser = $_SESSION['admin_user'] ?? 'Admin';

// 1. FILE EXTENSION MANAGEMENT (ADD, TOGGLE, DELETE)
if (isset($_POST['add_extension'])) {
    $ext = strtolower(trim($_POST['extension'] ?? ''));
    $ext = ltrim($ext, '.'); // Remove leading dot
    if (!empty($ext)) {
        $stmt = $pdo->prepare("INSERT INTO allowed_extensions (extension, is_allowed, mime_type) VALUES (?, 1, 'application/octet-stream') ON DUPLICATE KEY UPDATE is_allowed = 1");
        $stmt->execute([$ext]);
        $_SESSION['flash_success'] = "Added extension .$ext to allowed list.";
    }
    header('Location: admin_dashboard.php'); exit;
}

if (isset($_POST['toggle_extension_id'])) {
    $extId = (int)$_POST['toggle_extension_id'];
    $pdo->prepare("UPDATE allowed_extensions SET is_allowed = NOT is_allowed WHERE id = ?")->execute([$extId]);
    $_SESSION['flash_success'] = "Updated extension permission.";
    header('Location: admin_dashboard.php'); exit;
}

if (isset($_POST['delete_extension_id'])) {
    $extId = (int)$_POST['delete_extension_id'];
    $pdo->prepare("DELETE FROM allowed_extensions WHERE id = ?")->execute([$extId]);
    $_SESSION['flash_success'] = "Deleted extension rule.";
    header('Location: admin_dashboard.php'); exit;
}

// 2. MANUAL TOGGLE SUPERUSER & PASSWORDLESS PERMISSIONS
if (isset($_POST['toggle_superuser_id'])) {
    $empId = $_POST['toggle_superuser_id'];
    $pdo->prepare("UPDATE employees SET user_type = IF(user_type = 'superuser', 'regular', 'superuser') WHERE emp_id = ?")->execute([$empId]);
    $_SESSION['flash_success'] = "Toggled Super User role for $empId.";
    header('Location: admin_dashboard.php'); exit;
}

if (isset($_POST['toggle_passwordless_id'])) {
    $empId = $_POST['toggle_passwordless_id'];
    $pdo->prepare("UPDATE employees SET passwordless_allowed = NOT passwordless_allowed WHERE emp_id = ?")->execute([$empId]);
    $_SESSION['flash_success'] = "Toggled Passwordless permission for $empId.";
    header('Location: admin_dashboard.php'); exit;
}

// 3. DELETE USER
if (isset($_POST['delete_emp_id'])) {
    $empIdToDelete = $_POST['delete_emp_id'];
    $pdo->prepare("DELETE FROM employees WHERE emp_id = ?")->execute([$empIdToDelete]);
    $_SESSION['flash_success'] = "Deleted user $empIdToDelete successfully.";
    header('Location: admin_dashboard.php'); exit;
}

// 4. FILE MANAGEMENT
if (isset($_POST['hard_purge_file_id'])) {
    $fid = (int)$_POST['hard_purge_file_id'];
    $stmt = $pdo->prepare("SELECT storage_path FROM files WHERE id = ?");
    $stmt->execute([$fid]);
    $f = $stmt->fetch();
    if ($f && file_exists($f['storage_path'])) @unlink($f['storage_path']);
    $pdo->prepare("DELETE FROM files WHERE id = ?")->execute([$fid]);
    $_SESSION['flash_success'] = "File permanently purged from disk.";
    header('Location: admin_dashboard.php'); exit;
}

if (isset($_POST['purge_all_expired'])) {
    $stmt = $pdo->query("SELECT id, storage_path FROM files WHERE is_deleted_by_user = 1 OR expires_at <= NOW()");
    $filesToPurge = $stmt->fetchAll();
    foreach ($filesToPurge as $f) {
        if (file_exists($f['storage_path'])) @unlink($f['storage_path']);
        $pdo->prepare("DELETE FROM files WHERE id = ?")->execute([$f['id']]);
    }
    $_SESSION['flash_success'] = "Purged all soft-deleted / expired files.";
    header('Location: admin_dashboard.php'); exit;
}

// 5. DEPARTMENT MANAGEMENT
if (isset($_POST['add_department'])) {
    $deptName = trim($_POST['dept_name'] ?? '');
    if ($deptName) $pdo->prepare("INSERT IGNORE INTO departments (dept_name) VALUES (?)")->execute([$deptName]);
    header('Location: admin_dashboard.php'); exit;
}

if (isset($_POST['delete_department_id'])) {
    $deptId = (int)$_POST['delete_department_id'];
    $pdo->prepare("UPDATE employees SET department_id = 1 WHERE department_id = ?")->execute([$deptId]);
    $pdo->prepare("DELETE FROM departments WHERE id = ?")->execute([$deptId]);
    header('Location: admin_dashboard.php'); exit;
}

// 6. ADD USER
if (isset($_POST['create_user_expanded'])) {
    $empId = trim($_POST['emp_id'] ?? '');
    $fullName = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $mobile = trim($_POST['mobile'] ?? '');
    $designation = ($_POST['designation'] ?? '1') == '2' ? 'Admin Staff' : 'Regular Staff';
    $deptId = (int)($_POST['department_id'] ?? 1);
    $userType = $_POST['user_type'] ?? 'regular';
    $hash = password_hash('123456', PASSWORD_DEFAULT);

    $nameParts = explode(' ', $fullName);
    $firstName = $nameParts[0] ?? $fullName;

    $stmt = $pdo->prepare("INSERT INTO employees (emp_id, full_name, first_name, email, mobile, designation, department_id, user_type, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
    $stmt->execute([$empId, $fullName, $firstName, $email, $mobile, $designation, $deptId, $userType, $hash]);
    
    $_SESSION['flash_success'] = "Created user $empId ($fullName) with default password 123456.";
    header('Location: admin_dashboard.php'); exit;
}

// 7. RESET PASSWORD
if (isset($_POST['reset_user_password'])) {
    $empId = $_POST['reset_emp_id'];
    $hash = password_hash('123456', PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE employees SET password_hash = ?, must_change_password = 1 WHERE emp_id = ?")->execute([$hash, $empId]);
    $_SESSION['flash_success'] = "Reset password for $empId to 123456.";
    header('Location: admin_dashboard.php'); exit;
}

// DISK CALCULATIONS
$cFree = @disk_free_space("C:"); $cTotal = @disk_total_space("C:");
$dFree = @disk_free_space("D:"); $dTotal = @disk_total_space("D:");
$cPct = ($cTotal > 0) ? round((($cTotal - $cFree) / $cTotal) * 100) : 0;
$dPct = ($dTotal > 0) ? round((($dTotal - $dFree) / $dTotal) * 100) : 0;

$allFiles = $pdo->query("SELECT f.*, e.full_name as uploader_name FROM files f LEFT JOIN employees e ON f.uploaded_by_emp_id = e.emp_id ORDER BY f.created_at DESC")->fetchAll();
$allEmps = $pdo->query("SELECT e.*, d.dept_name FROM employees e LEFT JOIN departments d ON e.department_id = d.id ORDER BY e.created_at DESC")->fetchAll();
$allDepts = $pdo->query("SELECT * FROM departments ORDER BY dept_name ASC")->fetchAll();
$allExts = $pdo->query("SELECT * FROM allowed_extensions ORDER BY extension ASC")->fetchAll();

$logLimit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$allLogs = $pdo->query("SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $logLimit")->fetchAll();

$flash_success = $_SESSION['flash_success'] ?? null;
$flash_error = $_SESSION['flash_error'] ?? null;
unset($_SESSION['flash_success'], $_SESSION['flash_error']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Governance Console</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-100 text-slate-900 p-6 space-y-6">

    <header class="glass-panel flex justify-between items-center bg-white rounded-xl shadow-xs">
        <div>
            <h1 class="font-bold text-lg">System Admin Governance Console</h1>
            <p class="text-xs text-teal-600">Enterprise Administration Engine</p>
        </div>
        <div class="flex gap-3">
            <a href="index.php" class="px-4 py-2 rounded bg-teal-600 text-white text-xs font-semibold">&larr; Back to Main Vault</a>
            <a href="auth.php?action=logout" class="px-4 py-2 rounded bg-rose-600 text-white text-xs font-semibold">Logout</a>
        </div>
    </header>

    <?php if ($flash_success): ?><div class="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded"><?= e($flash_success) ?></div><?php endif; ?>
    <?php if ($flash_error): ?><div class="p-3 bg-rose-100 text-rose-800 text-xs font-semibold rounded"><?= e($flash_error) ?></div><?php endif; ?>

    <!-- DISK CAPACITY USAGE CHARTS -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="glass-panel bg-white p-5 rounded-xl border flex items-center gap-6">
            <div class="relative w-24 h-24 flex items-center justify-center">
                <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-teal-100" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="text-teal-600" stroke-linecap="round" stroke-dasharray="<?= $cPct ?>, 100" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="absolute text-sm font-bold"><?= $cPct ?>%</span>
            </div>
            <div>
                <strong class="text-sm font-bold block">System Drive (C:)</strong>
                <p class="text-xs text-teal-600 mt-1">Used: <strong><?= format_bytes($cTotal - $cFree) ?></strong></p>
                <p class="text-xs text-teal-500">Total: <?= format_bytes($cTotal) ?></p>
            </div>
        </div>

        <div class="glass-panel bg-white p-5 rounded-xl border flex items-center gap-6">
            <div class="relative w-24 h-24 flex items-center justify-center">
                <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-teal-100" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="text-emerald-600" stroke-linecap="round" stroke-dasharray="<?= $dPct ?>, 100" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span class="absolute text-sm font-bold"><?= $dPct ?>%</span>
            </div>
            <div>
                <strong class="text-sm font-bold block">Vault Storage Drive (D:)</strong>
                <p class="text-xs text-emerald-700 mt-1">Used: <strong><?= format_bytes($dTotal - $dFree) ?></strong></p>
                <p class="text-xs text-teal-500">Total: <?= format_bytes($dTotal) ?></p>
            </div>
        </div>
    </div>

    <!-- MASTER FILE REPOSITORY -->
    <section class="glass-panel bg-white p-5 rounded-xl space-y-3">
        <div class="flex justify-between items-center border-b pb-3">
            <div>
                <h2 class="font-bold text-base">Master Encrypted File Storage</h2>
                <p class="text-xs text-teal-600">Decrypt using Master Secret <code class="font-mono bg-teal-50 px-1 border">AdminSecret123!</code></p>
            </div>
            <form method="POST" onsubmit="return confirm('Purge all soft-deleted / expired files?');">
                <button type="submit" name="purge_all_expired" class="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-semibold">
                    🔥 Purge All Soft-Deleted / Expired Files
                </button>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="text-teal-700 uppercase border-b text-[11px]">
                        <th class="pb-2">Status</th>
                        <th class="pb-2">Filename</th>
                        <th class="pb-2">Uploader</th>
                        <th class="pb-2">Size</th>
                        <th class="pb-2">Uploaded At</th>
                        <th class="pb-2">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y font-mono">
                    <?php foreach ($allFiles as $f): ?>
                        <tr>
                            <td class="py-2">
                                <?php if ($f['is_deleted_by_user']): ?>
                                    <span class="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">Soft-Deleted</span>
                                <?php else: ?>
                                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active Public</span>
                                <?php endif; ?>
                            </td>
                            <td class="py-2 font-bold"><?= e($f['original_name']) ?></td>
                            <td class="py-2 text-teal-600"><?= e($f['uploader_name'] ?? $f['uploaded_by_emp_id']) ?></td>
                            <td class="py-2 text-teal-600"><?= format_bytes($f['file_size']) ?></td>
                            <td class="py-2 text-teal-500 text-[10px]"><?= e($f['created_at']) ?></td>
                            <td class="py-2 flex gap-2">
                                <a href="access.php?file_id=<?= $f['id'] ?>&pin=AdminSecret123!&action=view" target="_blank" class="px-2 py-1 rounded bg-teal-50 text-teal-800 border text-[11px]">Master View</a>
                                <form method="POST" onsubmit="return confirm('Permanently purge this file?');">
                                    <input type="hidden" name="hard_purge_file_id" value="<?= $f['id'] ?>">
                                    <button type="submit" class="px-2 py-1 rounded bg-rose-600 text-white text-[11px]">Hard Purge</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

    <!-- EMPLOYEE DIRECTORY -->
    <section class="glass-panel bg-white p-5 rounded-xl space-y-3">
        <h2 class="font-bold text-base">Onboarded Employees Directory (<?= count($allEmps) ?> Users)</h2>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
                <thead>
                    <tr class="text-teal-700 uppercase border-b text-[11px]">
                        <th class="pb-2">Emp ID</th>
                        <th class="pb-2">Full Name</th>
                        <th class="pb-2">Email</th>
                        <th class="pb-2">Mobile</th>
                        <th class="pb-2">Department</th>
                        <th class="pb-2">User Type</th>
                        <th class="pb-2">Passwordless</th>
                        <th class="pb-2">Action</th>
                    </tr>
                </thead>
                <tbody class="divide-y font-mono">
                    <?php foreach ($allEmps as $emp): ?>
                        <tr>
                            <td class="py-2 font-bold"><?= e($emp['emp_id']) ?></td>
                            <td class="py-2"><?= e($emp['full_name']) ?></td>
                            <td class="py-2 text-teal-600"><?= e($emp['email'] ?: '-') ?></td>
                            <td class="py-2 text-teal-600"><?= e($emp['mobile'] ?: '-') ?></td>
                            <td class="py-2 text-teal-600"><?= e($emp['dept_name'] ?? 'General') ?></td>
                            <td class="py-2">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="toggle_superuser_id" value="<?= e($emp['emp_id']) ?>">
                                    <button type="submit" class="px-2 py-0.5 rounded text-[10px] font-bold <?= $emp['user_type'] === 'superuser' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700' ?>">
                                        <?= strtoupper(e($emp['user_type'])) ?>
                                    </button>
                                </form>
                            </td>
                            <td class="py-2">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="toggle_passwordless_id" value="<?= e($emp['emp_id']) ?>">
                                    <button type="submit" class="px-2 py-0.5 rounded text-[10px] font-bold <?= $emp['passwordless_allowed'] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800' ?>">
                                        <?= $emp['passwordless_allowed'] ? '⚡ ALLOWED' : 'DISABLED' ?>
                                    </button>
                                </form>
                            </td>
                            <td class="py-2 flex gap-1">
                                <form method="POST" class="inline">
                                    <input type="hidden" name="reset_emp_id" value="<?= e($emp['emp_id']) ?>">
                                    <button type="submit" name="reset_user_password" class="px-2 py-1 bg-amber-600 text-white rounded text-[10px]">Reset Pass</button>
                                </form>
                                <form method="POST" class="inline" onsubmit="return confirm('Delete user <?= e($emp['emp_id']) ?>?');">
                                    <input type="hidden" name="delete_emp_id" value="<?= e($emp['emp_id']) ?>">
                                    <button type="submit" class="px-2 py-1 bg-rose-600 text-white rounded text-[10px]">Delete User</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

    <!-- CREATE USER, DEPARTMENTS & ALLOWED FILE EXTENSIONS MANAGEMENT -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- CREATE USER -->
        <section class="lg:col-span-6 glass-panel space-y-4">
            <h2 class="font-bold text-base">Add New Employee</h2>
            <form method="POST" class="space-y-3">
                <input type="hidden" name="create_user_expanded" value="1">
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="block text-[11px] font-semibold mb-0.5">Emp ID *</label><input type="text" name="emp_id" required placeholder="EMP-2001"></div>
                    <div><label class="block text-[11px] font-semibold mb-0.5">Full Name *</label><input type="text" name="full_name" required placeholder="John Smith"></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div><label class="block text-[11px] font-semibold mb-0.5">Email ID</label><input type="email" name="email" placeholder="john@company.local"></div>
                    <div><label class="block text-[11px] font-semibold mb-0.5">Mobile Number</label><input type="text" name="mobile" placeholder="+91 9876543210"></div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="block text-[11px] font-semibold mb-0.5">Department</label>
                        <select name="department_id"><?php foreach ($allDepts as $d): ?><option value="<?= $d['id'] ?>"><?= e($d['dept_name']) ?></option><?php endforeach; ?></select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold mb-0.5">Designation</label>
                        <select name="designation"><option value="1">Regular Staff</option><option value="2">Admin Staff</option></select>
                    </div>
                    <div>
                        <label class="block text-[11px] font-semibold mb-0.5">User Type</label>
                        <select name="user_type"><option value="regular">Regular</option><option value="superuser">Super User</option></select>
                    </div>
                </div>
                <button type="submit" class="w-full py-2 bg-teal-600 text-white text-xs font-semibold rounded">+ Create Employee</button>
            </form>
        </section>

        <!-- ALLOWED FILE EXTENSIONS MANAGEMENT -->
        <section class="lg:col-span-3 glass-panel space-y-3">
            <h2 class="font-bold text-base">Allowed File Extensions</h2>
            <form method="POST" class="flex gap-2">
                <input type="text" name="extension" required placeholder="e.g. mp4, pdf, zip" class="flex-1 text-xs font-mono">
                <button type="submit" name="add_extension" class="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded">+ Add</button>
            </form>
            <div class="space-y-1.5 pt-1 max-h-56 overflow-y-auto font-mono">
                <?php foreach ($allExts as $ext): ?>
                    <div class="flex items-center justify-between p-2 rounded border text-xs">
                        <span class="font-bold text-teal-950">.<?= e($ext['extension']) ?></span>
                        <div class="flex items-center gap-1">
                            <form method="POST" class="inline">
                                <input type="hidden" name="toggle_extension_id" value="<?= $ext['id'] ?>">
                                <button type="submit" class="px-2 py-0.5 rounded text-[10px] font-bold <?= $ext['is_allowed'] ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800' ?>">
                                    <?= $ext['is_allowed'] ? 'ALLOWED' : 'BLOCKED' ?>
                                </button>
                            </form>
                            <form method="POST" class="inline" onsubmit="return confirm('Delete extension rule .<?= e($ext['extension']) ?>?');">
                                <input type="hidden" name="delete_extension_id" value="<?= $ext['id'] ?>">
                                <button type="submit" class="px-1.5 py-0.5 bg-slate-200 hover:bg-rose-600 hover:text-white rounded text-[10px] text-slate-700">✕</button>
                            </form>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- DEPARTMENTS MANAGEMENT -->
        <section class="lg:col-span-3 glass-panel space-y-3">
            <h2 class="font-bold text-base">Manage Departments</h2>
            <form method="POST" class="flex gap-2">
                <input type="text" name="dept_name" required placeholder="New Dept Name" class="flex-1 text-xs">
                <button type="submit" name="add_department" class="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded">+ Add</button>
            </form>
            <div class="space-y-2 pt-2 max-h-56 overflow-y-auto">
                <?php foreach ($allDepts as $d): ?>
                    <div class="flex items-center gap-2 p-2 rounded border">
                        <span class="flex-1 text-xs font-semibold"><?= e($d['dept_name']) ?></span>
                        <?php if ((int)$d['id'] !== 1): ?>
                            <form method="POST" onsubmit="return confirm('Delete department <?= e($d['dept_name']) ?>?');">
                                <input type="hidden" name="delete_department_id" value="<?= $d['id'] ?>">
                                <button type="submit" class="px-2 py-1 bg-rose-600 text-white text-[10px] font-semibold rounded">Delete</button>
                            </form>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

    </div>

    <!-- AUDIT LOGS -->
    <section class="glass-panel space-y-3">
        <div class="flex justify-between items-center border-b pb-3">
            <h2 class="font-bold text-base">Security Audit Logs</h2>
            <div class="flex items-center gap-2 text-xs">
                <span>Display Rows:</span>
                <a href="?limit=10" class="px-2.5 py-1 rounded <?= $logLimit === 10 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800' ?> font-semibold">10</a>
                <a href="?limit=30" class="px-2.5 py-1 rounded <?= $logLimit === 30 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800' ?> font-semibold">30</a>
                <a href="?limit=50" class="px-2.5 py-1 rounded <?= $logLimit === 50 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800' ?> font-semibold">50</a>
                <a href="?limit=100" class="px-2.5 py-1 rounded <?= $logLimit === 100 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-800' ?> font-semibold">100</a>
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
                <thead>
                    <tr class="text-teal-700 uppercase border-b text-[11px]">
                        <th class="pb-2">Timestamp</th>
                        <th class="pb-2">User / Emp</th>
                        <th class="pb-2">Action</th>
                        <th class="pb-2">Target File</th>
                        <th class="pb-2">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    <?php foreach ($allLogs as $log): ?>
                        <tr>
                            <td class="py-2 text-teal-600"><?= e($log['created_at']) ?></td>
                            <td class="py-2 font-bold"><?= e($log['emp_id'] ?? 'ANONYMOUS') ?></td>
                            <td class="py-2 font-bold"><?= e($log['action']) ?></td>
                            <td class="py-2 text-teal-700"><?= e($log['file_name'] ?? '-') ?></td>
                            <td class="py-2">
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold <?= $log['status'] === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800' ?>">
                                    <?= e($log['status']) ?>
                                </span>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>

</body>
</html>