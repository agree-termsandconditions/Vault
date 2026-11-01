<?php
require_once __DIR__ . '/config.php';

if (empty($_SESSION['emp_user']) && empty($_SESSION['admin_logged_in'])) {
    $_SESSION['flash_error'] = "You must be signed in to upload files.";
    header('Location: auth.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadType = $_POST['upload_type'] ?? 'password'; 
    $pin = trim($_POST['pin'] ?? '');
    $isPasswordless = ($uploadType === 'passwordless');

    if (!$isPasswordless && strlen($pin) !== 6) {
        $_SESSION['flash_error'] = "Encryption PIN must be exactly 6 characters.";
        header('Location: index.php');
        exit;
    }

    if (empty($_FILES['files']['name'][0])) {
        $_SESSION['flash_error'] = "No files were selected for upload.";
        header('Location: index.php');
        exit;
    }

    $uploadedCount = 0;
    $files = $_FILES['files'];
    $batchId = 'BATCH-' . bin2hex(random_bytes(8));
    $uploader = $_SESSION['emp_user'] ?? 'System Admin';

    foreach ($files['name'] as $idx => $origName) {
        if ($files['error'][$idx] !== UPLOAD_ERR_OK) continue;

        $tmpPath = $files['tmp_name'][$idx];
        $fileSize = $files['size'][$idx];
        $mimeType = mime_content_type($tmpPath) ?: 'application/octet-stream';
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

        $rawBytes = file_get_contents($tmpPath);
        $encPin = $isPasswordless ? 'PWDLESS_PUBLIC' : $pin;
        $encResult = encrypt_file_data($rawBytes, $encPin);

        $fileUuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );

        $targetName = bin2hex(random_bytes(16)) . '.enc';
        // Always save clean normalized path
        $targetPath = fix_win_path(STORAGE_PATH) . '/' . $targetName;
        $targetPath = preg_replace('#/+#', '/', $targetPath); // Remove double slashes

        if (file_put_contents($targetPath, $encResult['encrypted_data'])) {
            $expiresAt = date('Y-m-d H:i:s', strtotime('+48 hours'));
            
            $stmt = $pdo->prepare("INSERT INTO files (batch_id, file_uuid, original_name, file_extension, storage_path, file_size, mime_type, encryption_salt, encryption_iv, expires_at, uploaded_by_emp_id, is_passwordless) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $batchId, $fileUuid, $origName, $ext, $targetPath, $fileSize, $mimeType,
                $encResult['salt_hex'], $encResult['iv_hex'],
                $expiresAt, $uploader, $isPasswordless ? 1 : 0
            ]);
            $uploadedCount++;
        }
    }

    $_SESSION['flash_success'] = "Successfully uploaded $uploadedCount file(s).";
    header('Location: index.php');
    exit;
}