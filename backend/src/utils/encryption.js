// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../config/logger');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(config.jwt.secret).digest();
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt a text string
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in format: iv:encryptedData
 */
const encrypt = (text) => {
  if (!text) return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by colon
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error: %s', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt an encrypted text string
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error: %s', error.message);
    throw new Error('Failed to decrypt data');
  }
};

module.exports = {
  encrypt,
  decrypt,
};
