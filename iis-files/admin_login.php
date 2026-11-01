<?php
/**
 * Intranet File Vault - Admin Portal Login
 */
require_once __DIR__ . '/config.php';

if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: admin_dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $admin['username'];
        $_SESSION['admin_role'] = $admin['role'];
        
        log_activity('ADMIN_LOGIN', $admin['username'], null, 'SUCCESS', 'Admin logged in as ' . $admin['role']);

        header('Location: admin_dashboard.php');
        exit;
    } else {
        $error = "Invalid administrator username or password.";
        log_activity('ADMIN_LOGIN_FAILED', $username, null, 'FAILED', 'Invalid admin credentials');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Portal Login - Intranet Vault</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-4">
    <div class="glass-panel max-w-md w-full p-6">
        <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center">🛡️</div>
            <div>
                <h2 class="font-bold text-lg text-slate-100">System Admin Portal</h2>
                <p class="text-xs text-slate-400">Windows Server IIS 10 Management Console</p>
            </div>
        </div>

        <?php if ($error): ?>
            <div class="p-3 mb-4 rounded bg-rose-500/20 text-rose-300 text-xs"><?= e($error) ?></div>
        <?php endif; ?>

        <form method="POST" class="space-y-4">
            <div>
                <label class="block text-xs text-slate-300 mb-1">Username</label>
                <input type="text" name="username" required placeholder="admin" class="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm">
            </div>
            <div>
                <label class="block text-xs text-slate-300 mb-1">Password</label>
                <input type="password" name="password" required placeholder="••••••••" class="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm">
            </div>
            <button type="submit" class="w-full py-2.5 rounded bg-purple-600 font-semibold text-xs hover:bg-purple-500 transition">Authenticate Admin</button>
        </form>
    </div>
</body>
</html>
