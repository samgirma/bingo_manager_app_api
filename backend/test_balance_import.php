<?php
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("=== BALANCE FILE IMPORT DEBUG ===");
    $userId = intval($_POST['user_id'] ?? 0);
    $username = trim($_POST['username'] ?? '');

    if (!isset($_FILES['balance_file'])) {
        $message = "No file uploaded.";
    } else {
        $fileName = $_FILES['balance_file']['name'];
        $filePath = $_FILES['balance_file']['tmp_name'];

        if ($_FILES['balance_file']['error'] !== UPLOAD_ERR_OK) {
            $message = "Upload error code: " . $_FILES['balance_file']['error'];
        } else {
            $encryptedData = file_get_contents($filePath);
            if ($encryptedData === false) {
                $message = "Unable to read file.";
            } else {
                error_log("Payload size: " . strlen($encryptedData) . " bytes");

                $encryptionKey = 'This_secrate_key_for_encription_2026';
                $iv = substr($encryptedData, 0, 16);
                $cipherText = substr($encryptedData, 16);

                error_log("IV size: " . strlen($iv) . " bytes");
                error_log("Cipher size: " . strlen($cipherText) . " bytes");

                $balance = openssl_decrypt($cipherText, 'AES-256-CBC', $encryptionKey, OPENSSL_RAW_DATA, $iv);

                if ($balance === false) {
                    $message = "Decryption failed: " . openssl_error_string();
                    error_log("Decryption FAILED");
                } else {
                    error_log("Decrypted value: " . $balance);
                    $balance = floatval($balance);

                    $message = "SUCCESS! Balance file decrypted.<br><br>"
                        . "<strong>File:</strong> " . htmlspecialchars($fileName) . "<br>"
                        . "<strong>Balance:</strong> " . $balance . " ETB<br>"
                        . "<strong>For user:</strong> " . htmlspecialchars($username) . " (ID: $userId)";
                }
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Import Balance File</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { background: linear-gradient(135deg, #0f2027, #203a43, #2c5364); color: #fff; font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .container { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); padding: 40px; border-radius: 20px; width: 100%; max-width: 460px; text-align: center; box-shadow: 0 10px 35px rgba(0,0,0,0.6); }
        h2 { font-size: 1.8rem; margin-bottom: 25px; color: #00e0ff; font-weight: 700; }
        input[type="text"], input[type="file"] { width: 100%; padding: 14px; margin-bottom: 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: #fff; font-size: 1rem; outline: none; }
        input:focus { border-color: #00e0ff; }
        button { background: linear-gradient(135deg, #00e0ff, #00a8ff); color: #fff; border: none; padding: 14px 25px; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; margin-top: 5px; }
        button:hover { background: linear-gradient(135deg, #009acd, #0077b6); }
        .back-btn { background: linear-gradient(135deg, #444, #222); margin-top: 10px; }
        .message { margin: 20px 0; font-weight: 600; font-size: 1rem; padding: 12px; border-radius: 10px; background: rgba(255,255,0,0.1); color: #ffeb3b; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Import Balance File</h2>
        <?php if ($message): ?>
            <div class="message"><?= $message ?></div>
        <?php endif; ?>
        <form action="" method="post" enctype="multipart/form-data">
            <input type="text" name="user_id" placeholder="User ID" required>
            <input type="text" name="username" placeholder="Username" required>
            <input type="file" name="balance_file" accept=".enc" required>
            <button type="submit">Import Balance</button>
        </form>
        <a href="test_user_import.php"><button class="back-btn">Test User Import</button></a>
    </div>
</body>
</html>
