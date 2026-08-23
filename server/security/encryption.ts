import crypto from 'crypto';

/**
 * TradeOS Institutional-Grade AES-256-GCM Encryption Engine
 * Secures User Broker API Keys, API Secrets, TOTP Secrets, Passphrases with authenticated encryption.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits auth tag
const SALT_LENGTH = 16;

// Derive or get 32-byte master encryption key
function getMasterKey(salt?: Buffer): Buffer {
  const masterSecret = process.env.MASTER_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || 'tradeos-ai-institutional-master-key-32-byte-vault-2026';
  if (salt) {
    return crypto.pbkdf2Sync(masterSecret, salt, 100000, 32, 'sha256');
  }
  return crypto.createHash('sha256').update(masterSecret).digest();
}

export interface EncryptedPayload {
  iv: string; // Base64
  authTag: string; // Base64
  ciphertext: string; // Base64
  salt?: string; // Base64
  version: string;
}

/**
 * Encrypt sensitive plain text (e.g. Broker API Secret, App Secret, TOTP seed)
 */
export function encryptSecret(plainText: string): EncryptedPayload {
  if (!plainText) {
    throw new Error('Cannot encrypt empty payload');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = getMasterKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(plainText, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext,
    salt: salt.toString('base64'),
    version: 'v1.aes256gcm',
  };
}

/**
 * Decrypt previously encrypted payload with authenticated integrity check
 */
export function decryptSecret(payload: EncryptedPayload | string): string {
  try {
    let parsed: EncryptedPayload;
    if (typeof payload === 'string') {
      parsed = JSON.parse(payload);
    } else {
      parsed = payload;
    }

    if (!parsed.ciphertext || !parsed.iv || !parsed.authTag) {
      throw new Error('Malformed encrypted payload structure');
    }

    const salt = parsed.salt ? Buffer.from(parsed.salt, 'base64') : undefined;
    const key = getMasterKey(salt);
    const iv = Buffer.from(parsed.iv, 'base64');
    const authTag = Buffer.from(parsed.authTag, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(parsed.ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('[TradeOS Security Engine] Decryption or Authentication failed:', error.message);
    throw new Error('Decryption failed: Token is invalid or has been tampered with.');
  }
}

/**
 * Mask API keys for safe UI display (e.g. "dh_live_9a...8f2b")
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Generates cryptographic HMAC SHA-256 signature for API Webhooks & Broker requests
 */
export function generateHmacSha256(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
