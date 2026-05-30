const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const USER_KEY_SOURCE = 'This_secrate_key_for_encription_2026_for_user_generation';
const TOPUP_KEY_SOURCE = 'This_secrate_key_for_encription_2026';

const ARCHIVE_DIR = path.join(__dirname, '..', '..', 'archives');
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

function truncate32(source) {
  return source.slice(0, 32);
}

function randomHex(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function keyFingerprint(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).slice(0, 8).padStart(8, '0');
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateTransactionRef() {
  return `TXN-${Date.now()}-${randomHex(8).toUpperCase()}`;
}

function archiveFile(fileName, filePayload, transactionRef) {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(ARCHIVE_DIR, `${transactionRef}_${fileName}`);
    fs.writeFileSync(archivePath, filePayload);
    logger.info(`Archived: ${archivePath}`);
    return archivePath;
  } catch (err) {
    logger.error('Archive write failed:', err);
    return null;
  }
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

  const checksum = sha256(fileContent);
  const transactionRef = generateTransactionRef();

  archiveFile(fileName, fileContent, transactionRef);

  return {
    fileName,
    filePayload: ciphertext,
    checksum,
    transactionRef,
    iv,
    keyFingerprint: fp,
    format: 'AES-256-CBC',
    timestamp: ts,
    fileContent,
  };
}

function generateUserFile(centerUsername, password, fullName, balance, macAddress) {
  const payload = JSON.stringify({
    username: centerUsername,
    password,
    name: fullName,
    balance: parseFloat(balance),
    created_at: new Date().toISOString(),
    balance_imported: 1,
    mac_address: macAddress.toUpperCase(),
  });
  return buildFile(`user_${centerUsername}_${Date.now()}.enc`, USER_KEY_SOURCE, payload);
}

function generateTopupFile(centerUsername, generatedAmount, actualAmount) {
  const key = truncate32(TOPUP_KEY_SOURCE);
  const iv = randomHex(32);
  const plaintext = String(actualAmount);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const rawFile = Buffer.concat([Buffer.from(iv, 'hex'), encrypted]);

  const fp = keyFingerprint(key);
  const ts = new Date().toISOString();
  const filePayload = rawFile.toString('base64');
  const checksum = sha256(rawFile);
  const transactionRef = generateTransactionRef();
  const fileName = `topup_${centerUsername}_${Date.now()}.enc`;

  archiveFile(fileName, rawFile, transactionRef);

  return {
    fileName,
    filePayload,
    checksum,
    transactionRef,
    iv,
    keyFingerprint: fp,
    format: 'AES-256-CBC',
    timestamp: ts,
  };
}

module.exports = { generateUserFile, generateTopupFile };
