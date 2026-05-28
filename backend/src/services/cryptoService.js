/**
 * Simulates AES-256-CBC encrypted terminal file generation matching the
 * legacy PHP backend export format.
 *
 * Key truncation rule (32 characters):
 *   User-file key:  "This_secrate_key_for_encription_2026_for_user_generation" → 32
 *   Top-up key:     "This_secrate_key_for_encription_2026"                   → 32
 *
 * In production this would use the Node crypto module; here we emit the
 * exact metadata envelope the PHP importer expects.
 */

const USER_KEY_SOURCE = 'This_secrate_key_for_encription_2026_for_user_generation';
const TOPUP_KEY_SOURCE = 'This_secrate_key_for_encription_2026';

function truncate32(source) {
  return source.slice(0, 32);
}

function randomHex(length) {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function keyFingerprint(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).slice(0, 8).padStart(8, '0');
}

function buildFile(fileName, keySource, plaintext) {
  const key = truncate32(keySource);
  const iv = randomHex(32);
  const fp = keyFingerprint(key);
  const ts = new Date().toISOString();
  const ciphertext = Buffer.from(plaintext, 'utf-8').toString('base64');

  const fileContent = [
    '---BEGIN ENCRYPTED TERMINAL FILE---',
    'Version: 1.0',
    'Format: AES-256-CBC',
    `KeyFP: ${fp}`,
    `IV: ${iv}`,
    `Timestamp: ${ts}`,
    `FileName: ${fileName}`,
    `Ciphertext-Base64: ${ciphertext}`,
    '---END ENCRYPTED TERMINAL FILE---',
  ].join('\n');

  return { fileName, iv, ciphertext, keyFingerprint: fp, format: 'AES-256-CBC', timestamp: ts, fileContent };
}

function generateUserFile(centerUsername, password) {
  const payload = JSON.stringify({
    username: centerUsername,
    password,
    generatedAt: new Date().toISOString(),
    type: 'BINGO_CENTER_REGISTRATION',
  });
  return buildFile(`user_${centerUsername}_${Date.now()}.enc`, USER_KEY_SOURCE, payload);
}

function generateTopupFile(centerUsername, generatedAmount, actualAmount) {
  const payload = JSON.stringify({
    bingoCenter: centerUsername,
    amountGenerated: generatedAmount,
    amountPaid: actualAmount,
    balanceType: 'TERMINAL_TOPUP',
    generatedAt: new Date().toISOString(),
  });
  return buildFile(`topup_${centerUsername}_${Date.now()}.enc`, TOPUP_KEY_SOURCE, payload);
}

module.exports = { generateUserFile, generateTopupFile };
