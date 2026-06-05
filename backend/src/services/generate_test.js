const fs = require('fs');
const path = require('path');
const { generateUserFile, generateTopupFile } = require('./cryptoService');

const OUT_DIR = path.join(__dirname, 'test_outputs');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function writeBase64File(fileName, base64Payload) {
  const outPath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(outPath, base64Payload, 'utf8');
  return outPath;
}

function writeRawBytesFile(fileName, binaryPayload) {
  const outPath = path.join(OUT_DIR, fileName);
  fs.writeFileSync(outPath, binaryPayload, 'binary');
  return outPath;
}

function main() {
  console.log('Generating test user file...');
  const user = generateUserFile('testcenter', 'Password123!', 'Test User', 150.5, '00:11:22:33:44:55');
  const userPath = writeBase64File(user.fileName, user.filePayload);
  console.log('User file written:', userPath);

  console.log('Generating test topup file...');
  const topup = generateTopupFile('testcenter', 150.5, 150.5);
  const topupRaw = Buffer.from(topup.filePayload, 'base64');
  const topupPath = writeRawBytesFile(topup.fileName, topupRaw);
  console.log('Topup file written:', topupPath);

  console.log('\nFiles created. Upload the user file to the PHP import page:');
  console.log('- Import user: /production-uniqeu-bingo/import_users.php');
  console.log('- Import balance: /production-uniqeu-bingo/import_balance.php');
  console.log('\nNote:');
  console.log('  User file: base64-encoded (IV + ciphertext)');
  console.log('  Topup file: raw bytes (IV + ciphertext)');
}

main();

