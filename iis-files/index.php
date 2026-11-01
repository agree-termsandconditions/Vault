<?php
require_once __DIR__ . '/config.php';

$loggedInEmp = $_SESSION['emp_user'] ?? null;
$isAdmin = !empty($_SESSION['admin_logged_in']);

$isSuperUser = false;
$passwordlessApproved = false;
$isAuthenticated = ($loggedInEmp || $isAdmin);

if ($isAdmin) {
    $isSuperUser = true;
    $passwordlessApproved = true;
    $displayName = 'System Admin';
} elseif ($loggedInEmp) {
    $displayName = $loggedInEmp;
    $empStmt = $pdo->prepare("SELECT user_type, passwordless_allowed FROM employees WHERE emp_id = ?");
    $empStmt->execute([$loggedInEmp]);
    $empData = $empStmt->fetch();
    $isSuperUser = ($empData['user_type'] ?? '') === 'superuser';
    $passwordlessApproved = (bool)($empData['passwordless_allowed'] ?? false);
}

// Fetch allowed extensions
$extStmt = $pdo->query("SELECT LOWER(extension) FROM allowed_extensions WHERE is_allowed = 1");
$allowedExts = $extStmt->fetchAll(PDO::FETCH_COLUMN);

// Auto-Sync API Endpoint
if (isset($_GET['api']) && $_GET['api'] === 'sync') {
    header('Content-Type: application/json');
    $stmt = $pdo->query("SELECT f.*, e.full_name as uploader_name FROM files f LEFT JOIN employees e ON f.uploaded_by_emp_id = e.emp_id WHERE f.is_deleted_by_user = 0 ORDER BY f.created_at DESC");
    $rawFiles = $stmt->fetchAll();
    
    $activeFiles = [];
    foreach ($rawFiles as $f) {
        if (file_exists($f['storage_path']) || file_exists('D:/EncryptedUploads/' . basename($f['storage_path']))) {
            $activeFiles[] = [
                'id' => $f['id'],
                'original_name' => $f['original_name'],
                'file_size' => format_bytes($f['file_size']),
                'uploader' => $f['uploader_name'] ?? $f['uploaded_by_emp_id'] ?? 'Anonymous',
                'is_passwordless' => (bool)$f['is_passwordless'],
                'mime_type' => $f['mime_type'],
                'created_at' => date('M j, H:i', strtotime($f['created_at']))
            ];
        }
    }
    echo json_encode(['success' => true, 'files' => $activeFiles]);
    exit;
}

$flash_success = $_SESSION['flash_success'] ?? null;
$flash_error = $_SESSION['flash_error'] ?? null;
unset($_SESSION['flash_success'], $_SESSION['flash_error']);
?>
<!DOCTYPE html>
<html class="dark" lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Vault Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;720;750;800&amp;display=swap" rel="stylesheet">
<style>
    body {
        background-color: #0e1512 !important;
        color: #f3f7f4 !important;
        font-family: 'Inter', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(109, 122, 115, 0.3); border-radius: 20px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(93, 220, 178, 0.5); }
    
    @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(2deg); }
        100% { transform: translateY(0px) rotate(0deg); }
    }
    .mascot-float {
        animation: float 4s ease-in-out infinite;
        transform-origin: bottom center;
    }
    .pin-input {
        width: 44px; height: 44px;
        background: rgba(14, 21, 18, 0.6);
        border: 1px solid rgba(188, 202, 194, 0.2);
        border-radius: 8px; color: #fff; font-size: 24px;
        text-align: center; outline: none; transition: all 0.2s;
    }
    .pin-input:focus {
        border-color: #5ddcb2;
        box-shadow: 0 0 10px rgba(93, 220, 178, 0.2);
    }
</style>
</head>
<body class="bg-[#0e1512] text-slate-100 antialiased h-screen overflow-hidden flex flex-col">

<!-- Restrict Back Button to Auth -->
<script>
    if (window.history && window.history.pushState) {
        window.history.pushState('forward', null, './');
        window.onpopstate = function () {
            window.history.pushState('forward', null, './');
        };
    }
</script>

<!-- TopNavBar -->
<header class="w-full z-50 bg-[#17211d]/90 backdrop-blur-xl border-b border-[#5ddcb2]/20 shadow-lg flex justify-between items-center px-8 py-4 flex-none">
<div class="flex items-center gap-8">
<span class="text-2xl font-black tracking-tighter text-[#5ddcb2]">Vault</span>

</div>
<div class="flex items-center gap-4">
<?php if ($isAuthenticated): ?>
    <div class="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
        User: <strong class="text-[#5ddcb2]"><?= htmlspecialchars($displayName) ?></strong>
    </div>
    <?php if ($isAdmin): ?>
        <a href="admin_dashboard.php" class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-sm">Admin Console &rarr;</a>
    <?php endif; ?>
    <a href="auth.php?action=logout" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-sm">Logout</a>
<?php else: ?>
    <button type="button" onclick="openLoginModal()" class="px-4 py-2 rounded-xl bg-[#5ddcb2] hover:bg-[#7bf9cd] text-[#002116] text-xs font-bold transition shadow-sm">Sign In</button>
<?php endif; ?>
</div>
</header>

<!-- Flash Messages -->
<?php if ($flash_success): ?>
    <div class="bg-emerald-900/60 border border-emerald-500 text-emerald-200 px-4 py-2 text-center text-xs font-semibold"><?= htmlspecialchars($flash_success) ?></div>
<?php endif; ?>
<?php if ($flash_error): ?>
    <div class="bg-rose-900/60 border border-rose-500 text-rose-200 px-4 py-2 text-center text-xs font-semibold"><?= htmlspecialchars($flash_error) ?></div>
<?php endif; ?>

<!-- Main Content Canvas -->
<div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0e1512] relative p-6">
<main class="flex-1 max-w-[1430px] w-full mx-auto h-full min-h-0 flex flex-col relative">
<div class="flex flex-col lg:flex-row gap-6 flex-1 h-full min-h-0">

<!-- Upload Panel (Sidebar) -->
<div class="w-full lg:w-[340px] h-full bg-[#17211d]/90 backdrop-blur-xl rounded-[22px] p-6 border border-[#5ddcb2]/20 shadow-2xl flex flex-col gap-6 flex-none overflow-y-auto custom-scrollbar">
<div class="flex items-center justify-between flex-none">
<h3 class="text-xl font-bold text-white tracking-tight">Secure Upload</h3>
<svg class="w-5 h-5 text-[#bccac2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
</div>

<?php if (!$isAuthenticated): ?>
<div class="flex-1 border border-[#5ddcb2]/30 rounded-[16px] bg-[#5ddcb2]/5 p-6 flex flex-col items-center justify-center text-center gap-4">
    <p class="text-sm text-slate-200">Authentication Required: Please sign in to upload encrypted files.</p>
    <button type="button" onclick="openLoginModal()" class="w-full py-2.5 bg-[#5ddcb2] text-[#002116] rounded-xl text-xs font-bold transition">Sign In Now</button>
</div>
<?php else: ?>
<form action="upload.php" method="POST" enctype="multipart/form-data" class="flex flex-col gap-6 flex-1 min-h-0">
<input type="hidden" name="csrf_token" value="<?= htmlspecialchars(csrf_token()) ?>">
<input type="file" name="files[]" id="fileInput" multiple class="hidden">

<!-- Drag & Drop Zone -->
<div id="dropZone" class="flex-1 border-[1.5px] border-dashed border-[#5ddcb2]/40 rounded-[16px] bg-[#5ddcb2]/5 p-6 flex flex-col items-center justify-center text-center gap-4 transition-colors hover:bg-[#5ddcb2]/10 cursor-pointer group min-h-[180px]">
<div class="w-14 h-14 rounded-full bg-[#13a982]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-[#5ddcb2]/30 flex-none">
<svg class="w-7 h-7 text-[#5ddcb2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
</div>
<div>
<p class="text-sm text-slate-200 mb-1 leading-snug">Drag &amp; Drop files here, or <span class="text-[#5ddcb2] underline underline-offset-4 font-bold">click to browse</span></p>
<p class="text-[10px] text-[#6d7a73] mt-2 leading-relaxed">Allowed: <?= implode(', ', array_map('strtoupper', $allowedExts)) ?></p>
</div>
</div>

<!-- Superuser Mode options -->
<div class="bg-[#0e1512] rounded-xl p-5 border border-[#bccac2]/15 shadow-inner flex flex-col gap-4 flex-none">
<div class="flex items-center gap-2 text-[#ff604a] font-bold text-xs uppercase tracking-wider">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
<span>Superuser Upload Mode</span>
</div>
<label class="flex items-center gap-3 cursor-pointer group text-xs">
<input type="radio" name="upload_type" value="password" checked onclick="togglePinBox(true)" class="text-[#5ddcb2]">
<span class="flex items-center gap-2 text-white font-semibold">
<svg class="w-4 h-4 text-[#ff604a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> 6-Char PIN Protection
</span>
</label>
<?php if ($isSuperUser || $passwordlessApproved): ?>
<label class="flex items-center gap-3 cursor-pointer group text-xs">
<input type="radio" name="upload_type" value="passwordless" onclick="togglePinBox(false)" class="text-[#5ddcb2]">
<span class="flex items-center gap-2 text-[#5ddcb2] font-semibold">
<svg class="w-4 h-4 text-[#ff604a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> Passwordless Public Access
</span>
</label>
<?php endif; ?>
</div>

<!-- PIN Input -->
<div id="pinInputWrapper" class="space-y-3 flex-none">
<label class="text-xs font-bold text-[#bccac2] flex items-center gap-2 uppercase tracking-wider">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> 6-Character Protection PIN
</label>
<div class="flex items-center justify-between gap-2 w-full pt-1">
<input class="pin-input" maxlength="6" name="pin" type="password" placeholder="••••••">
</div>
</div>

<button type="submit" class="w-full bg-[#ff604a] hover:bg-[#e34a36] text-white py-3.5 px-4 rounded-[12px] shadow-lg font-bold text-xs transition-all border border-[#ff604a]/40 tracking-wide">
    Save & Process Upload
</button>
</form>
<?php endif; ?>
</div>

<!-- Repository Grid -->
<div class="flex-1 bg-[#17211d]/90 backdrop-blur-xl rounded-[22px] p-6 border border-[#5ddcb2]/20 shadow-2xl flex flex-col gap-4 h-full min-h-0 relative min-w-0">
<!-- Repository Header & Search -->
<div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 flex-none border-b border-[#bccac2]/10 pb-4">
<div class="flex flex-wrap items-center gap-3">
<h3 class="text-xl font-bold text-white tracking-tight mr-2">Repository</h3>

<!-- Grid / List View Buttons with bulletproof SVGs -->
<div class="flex items-center gap-2 bg-[#0e1512]/80 rounded-lg p-1.5 border border-[#bccac2]/15 flex-none">
<button type="button" onclick="toggleView('tiles')" id="btnTiles" class="w-8 h-8 rounded-md bg-[#5ddcb2]/20 text-[#5ddcb2] flex items-center justify-center border border-[#5ddcb2]/30 transition" title="Grid View">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
</button>
<button type="button" onclick="toggleView('list')" id="btnList" class="w-8 h-8 rounded-md text-[#6d7a73] hover:text-white flex items-center justify-center transition" title="List View">
<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
</button>
</div>

<!-- Filter Dropdown -->
<div class="flex items-center gap-2 bg-[#0e1512]/80 border border-[#bccac2]/15 rounded-lg px-3 py-1.5">
<span class="text-[#6d7a73] text-xs font-bold">Show</span>
<select id="repositoryFilter" onchange="filterVault()" class="bg-transparent border-0 text-white text-xs font-bold outline-none p-0 cursor-pointer">
    <option value="all" class="bg-[#0e1512]">All files</option>
    <option value="private" class="bg-[#0e1512]">Protected / PIN</option>
    <option value="shared" class="bg-[#0e1512]">Passwordless / Shared</option>
</select>
</div>
</div>

<!-- Search Input Box (Cleaned up with SVG icon) -->
<div class="relative w-full xl:w-72 flex items-center">
<svg class="absolute left-3 w-4 h-4 text-[#6d7a73] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg>
<input id="repositorySearch" oninput="filterVault()" class="w-full pl-9 pr-3 py-2 bg-[#0e1512]/80 border border-[#bccac2]/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-[#5ddcb2]/30 focus:border-[#5ddcb2] outline-none transition-all shadow-inner placeholder:text-[#6d7a73]" placeholder="Search encrypted files..." type="search">
</div>
</div>

<!-- File Grid & List View (Scrollable Area) -->
<div class="flex-1 overflow-y-auto pr-3 custom-scrollbar min-h-0 pb-16">
<div id="tileView" class="grid grid-cols-1 md:grid-cols-4 gap-5">
<!-- Dynamically loaded files via sync API will render here -->
</div>
<div id="listView" class="hidden overflow-x-auto">
<table class="w-full text-left">
    <thead>
        <tr class="text-[10px] font-bold uppercase text-[#6d7a73] border-b border-[#2d3b34] tracking-wider">
            <th class="pb-3 pl-3">Type</th>
            <th class="pb-3">Filename</th>
            <th class="pb-3">Uploader</th>
            <th class="pb-3">Size</th>
            <th class="pb-3 text-right pr-3">Action</th>
        </tr>
    </thead>
    <tbody id="listTableBody" class="divide-y divide-[#2d3b34] text-xs"></tbody>
</table>
</div>
</div>

</div>
</div>
</main>

<!-- LARGER FOX-IDLE.PNG MASCOT WIDGET -->
<img alt="Fox Mascot" id="foxMascot" class="fixed bottom-6 right-6 w-32 h-32 object-contain mascot-float cursor-pointer z-50 hover:scale-110 transition-transform drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]" src="fox-idle.png" style="transform: scaleX(-1);">
</div>

<!-- SIGN-IN MODAL -->
<div id="loginModal" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="modal-content max-w-sm w-full p-8 rounded-3xl border border-slate-800 shadow-2xl relative space-y-5 bg-[#17211d]">
        <button type="button" onclick="closeLoginModal()" class="absolute top-5 right-5 opacity-50 hover:opacity-100 font-bold text-xl text-white">&times;</button>
        <div class="text-center space-y-2">
            <div class="w-12 h-12 bg-[#5ddcb2] text-[#002116] font-black text-xl rounded-2xl flex items-center justify-center mx-auto shadow-lg">A</div>
            <h3 class="font-black text-lg text-white">Sign In to Vault</h3>
        </div>
        <div id="loginErrorMsg" class="hidden bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold p-3 rounded-2xl text-center"></div>
        <form id="inlineLoginForm" onsubmit="handleInlineLogin(event)" class="space-y-4">
            <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-[#bccac2]">Employee ID / Username</label>
                <input type="text" id="loginEmpId" required placeholder="e.g. EMP-2001" class="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-slate-800 bg-[#0e1512] text-white focus:outline-none focus:ring-2 focus:ring-[#5ddcb2]">
            </div>
            <div class="space-y-1.5">
                <label class="block text-[11px] font-semibold text-[#bccac2]">Password / PIN</label>
                <input type="password" id="loginPassword" required placeholder="••••••••" class="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-slate-800 bg-[#0e1512] text-white focus:outline-none focus:ring-2 focus:ring-[#5ddcb2]">
            </div>
            <button type="submit" class="w-full py-3 bg-[#5ddcb2] hover:bg-[#7bf9cd] text-[#002116] font-bold text-xs rounded-2xl transition shadow-lg">
                Sign In Securely
            </button>
        </form>
    </div>
</div>

<script>
    document.addEventListener('mousemove', (e) => {
        const mascot = document.getElementById('foxMascot');
        if(!mascot) return;
        const rect = mascot.getBoundingClientRect();
        const mascotX = rect.left + rect.width / 2;
        const deltaX = e.clientX - mascotX;
        if(deltaX < 0) {
            mascot.style.transform = 'scaleX(-1)';
        } else {
            mascot.style.transform = 'scaleX(1)';
        }
    });

    function togglePinBox(show) {
        const pinBox = document.getElementById('pinInputWrapper');
        if (pinBox) {
            pinBox.style.display = show ? 'block' : 'none';
        }
    }

    function toggleView(mode) {
        document.getElementById('tileView').classList.toggle('hidden', mode !== 'tiles');
        document.getElementById('listView').classList.toggle('hidden', mode !== 'list');
        document.getElementById('btnTiles').className = mode === 'tiles' ? 'w-8 h-8 rounded-md bg-[#5ddcb2]/20 text-[#5ddcb2] flex items-center justify-center shadow-sm border border-[#5ddcb2]/30' : 'w-8 h-8 rounded-md text-[#6d7a73] hover:text-white transition-colors flex items-center justify-center hover:bg-white/5';
        document.getElementById('btnList').className = mode === 'list' ? 'w-8 h-8 rounded-md bg-[#5ddcb2]/20 text-[#5ddcb2] flex items-center justify-center shadow-sm border border-[#5ddcb2]/30' : 'w-8 h-8 rounded-md text-[#6d7a73] hover:text-white transition-colors flex items-center justify-center hover:bg-white/5';
    }

    function openLoginModal() {
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginModal').classList.add('flex');
    }

    function closeLoginModal() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('flex');
    }

    async function handleInlineLogin(e) {
        e.preventDefault();
        const empId = document.getElementById('loginEmpId').value;
        const password = document.getElementById('loginPassword').value;
        const errorBox = document.getElementById('loginErrorMsg');
        errorBox.classList.add('hidden');

        const formData = new FormData();
        formData.append('auth_action', 'login');
        formData.append('emp_id', empId);
        formData.append('password', password);

        try {
            const res = await fetch('auth.php', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) { 
                window.location.reload(); 
            } else { 
                errorBox.textContent = data.error || 'Invalid credentials.'; 
                errorBox.classList.remove('hidden'); 
            }
        } catch (err) { 
            errorBox.textContent = 'Connection error during sign in.'; 
            errorBox.classList.add('hidden'); 
        }
    }

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
    }

    let vaultFiles = [];
    async function syncVault() {
        try {
            const res = await fetch('index.php?api=sync');
            const data = await res.json();
            if (data.success) {
                vaultFiles = data.files;
                filterVault();
            }
        } catch(e) {}
    }

    function filterVault() {
        const search = (document.getElementById('repositorySearch')?.value || '').trim().toLowerCase();
        const access = document.getElementById('repositoryFilter')?.value || 'all';
        const files = vaultFiles.filter(file => {
            const matchesSearch = !search || `${file.original_name} ${file.uploader}`.toLowerCase().includes(search);
            const matchesAccess = access === 'all' || (access === 'shared' ? file.is_passwordless : !file.is_passwordless);
            return matchesSearch && matchesAccess;
        });
        renderVault(files);
    }

    function renderVault(files) {
        const tileContainer = document.getElementById('tileView');
        const listTable = document.getElementById('listTableBody');
        if (!tileContainer) return;
        
        if (files.length === 0) {
            tileContainer.innerHTML = `<div class="col-span-full text-center py-12 italic text-xs text-[#6d7a73]">No active files stored in vault.</div>`;
            if (listTable) listTable.innerHTML = `<tr><td colspan="5" class="text-center py-12 italic text-[#6d7a73]">No active files stored in vault.</td></tr>`;
            return;
        }

        let tileHtml = '';
        let listHtml = '';
        files.forEach(f => {
            const ext = (f.original_name.split('.').pop() || 'file').toUpperCase();
            // Bulletproof SVG icons for lock vs bolt
            const iconSvg = f.is_passwordless 
                ? `<svg class="w-4 h-4 text-[#ff604a] flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`
                : `<svg class="w-4 h-4 text-[#ff604a] flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`;

            tileHtml += `
            <div class="bg-[#0e1512]/80 rounded-[18px] p-5 border border-[#bccac2]/15 hover:border-[#5ddcb2]/40 hover:bg-[#5ddcb2]/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer glare-effect flex flex-col gap-4 group relative shadow-lg h-[140px]">
                <div class="flex items-start justify-between flex-none">
                    <div class="w-11 h-11 rounded-xl bg-[#17211d] border border-[#bccac2]/20 flex items-center justify-center text-[#5ddcb2] group-hover:shadow-[0_0_15px_rgba(93,220,178,0.2)] transition-shadow">
                        <span class="font-extrabold text-[11px]">${ext}</span>
                    </div>
                </div>
                <div class="flex-1 flex flex-col justify-end min-w-0">
                    <h4 class="text-sm font-bold text-white truncate flex items-center gap-2 w-full">
                        ${iconSvg} 
                        <a href="access.php?file_id=${f.id}&action=view" target="_blank" class="truncate hover:underline">${f.original_name}</a>
                    </h4>
                    <p class="text-[9px] font-bold text-[#6d7a73] mt-1.5 tracking-wide">${f.file_size} • ${f.uploader}</p>
                </div>
            </div>`;

            listHtml += `
            <tr class="hover:bg-[#0e1512]/50 transition">
                <td class="py-3.5 pl-3 font-mono font-bold text-[#5ddcb2]">${ext}</td>
                <td class="py-3.5 font-semibold flex items-center gap-2 text-white">
                    ${iconSvg}
                    <a href="access.php?file_id=${f.id}&action=view" target="_blank" class="hover:underline truncate">${f.original_name}</a>
                </td>
                <td class="py-3.5 text-[#6d7a73] text-xs">${f.uploader}</td>
                <td class="py-3.5 text-[#6d7a73] text-xs font-mono">${f.file_size}</td>
                <td class="py-3.5 pr-3 text-right">
                    <a href="access.php?file_id=${f.id}&action=view" target="_blank" class="px-3 py-1.5 rounded-lg bg-[#5ddcb2] text-[#002116] text-xs font-bold transition">Access</a>
                </td>
            </tr>`;
        });
        tileContainer.innerHTML = tileHtml;
        if (listTable) listTable.innerHTML = listHtml;
    }

    syncVault();
    setInterval(syncVault, 5000);
</script>
</body>
</html>