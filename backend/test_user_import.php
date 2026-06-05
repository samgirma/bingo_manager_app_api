<?php
$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    error_log("=== USER FILE IMPORT DEBUG ===");
    $userId = intval($_POST['user_id'] ?? 0);
    $username = trim($_POST['username'] ?? '');

    if (!isset($_FILES['userfile'])) {
        $message = "No file uploaded.";
        error_log("Upload missing userfile field.");
    } else {
        error_log("Upload error: " . $_FILES['userfile']['error']);
        error_log("Original filename: " . $_FILES['userfile']['name']);
        error_log("Tmp name: " . $_FILES['userfile']['tmp_name']);
        error_log("Upload size: " . $_FILES['userfile']['size'] . " bytes");

        $fileName = $_FILES['userfile']['name'];
        $filePath = $_FILES['userfile']['tmp_name'];

        if ($_FILES['userfile']['error'] !== UPLOAD_ERR_OK) {
            $message = "Upload error code: " . $_FILES['userfile']['error'];
            error_log("User file upload error: " . $_FILES['userfile']['error']);
        } elseif (!is_uploaded_file($filePath)) {
            $message = "Uploaded file is not valid.";
        } else {
            $encryptedData = file_get_contents($filePath);
            if ($encryptedData === false) {
                $message = "Unable to read uploaded file.";
            } else {
                error_log("Encrypted payload size: " . strlen($encryptedData) . " bytes");

                // PHP expects: base64_decode(file) -> IV(16) + ciphertext
                $raw = base64_decode($encryptedData);
                $iv = substr($raw, 0, 16);
                $cipherText = substr($raw, 16);

                error_log("IV size: " . strlen($iv) . " bytes");
                error_log("Cipher text size: " . strlen($cipherText) . " bytes");

                $encryptionKey = 'This_secrate_key_for_encription_2026_for_user_generation';
                error_log("Encryption key length: " . strlen($encryptionKey));
                error_log("Encryption key (first 32): " . substr($encryptionKey, 0, 32));

                $jsonData = openssl_decrypt($cipherText, 'AES-256-CBC', substr($encryptionKey, 0, 32), OPENSSL_RAW_DATA, $iv);

                if ($jsonData === false) {
                    $message = "Failed to decrypt. OpenSSL: " . openssl_error_string();
                    error_log("Decryption FAILED");
                } else {
                    error_log("Decrypted JSON: " . $jsonData);
                    $userData = json_decode($jsonData, true);

                    if (!$userData) {
                        $message = "Invalid JSON in file.";
                        error_log("JSON decode failed");
                    } else {
                        error_log("Parsed keys: " . implode(", ", array_keys($userData)));
                        error_log("Username: " . ($userData['username'] ?? 'N/A'));
                        error_log("Name: " . ($userData['name'] ?? 'N/A'));
                        error_log("Balance: " . ($userData['balance'] ?? 'N/A'));
                        error_log("MAC: " . ($userData['mac_address'] ?? 'N/A'));

                        $message = "SUCCESS! User file decrypted.<br><br>"
                            . "<strong>Username:</strong> " . htmlspecialchars($userData['username'] ?? '') . "<br>"
                            . "<strong>Name:</strong> " . htmlspecialchars($userData['name'] ?? '') . "<br>"
                            . "<strong>Balance:</strong> " . ($userData['balance'] ?? 0) . " ETB<br>"
                            . "<strong>MAC:</strong> " . htmlspecialchars($userData['mac_address'] ?? '') . "<br>"
                            . "<strong>Password:</strong> " . htmlspecialchars($userData['password'] ?? '');
                    }
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
    <title>Import User File</title>
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
        <h2>Import User File</h2>
        <?php if ($message): ?>
            <div class="message"><?= $message ?></div>
        <?php endif; ?>
        <form action="" method="post" enctype="multipart/form-data">
            <input type="text" name="user_id" placeholder="User ID" required>
            <input type="text" name="username" placeholder="Username" required>
            <input type="file" name="userfile" accept=".enc" required>
            <button type="submit">Import User</button>
        </form>
        <a href="test_balance_import.php"><button class="back-btn">Test Balance Import</button></a>
    </div>
</body>
</html>
