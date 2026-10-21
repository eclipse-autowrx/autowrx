// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../static/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types per extension. Uploads are served same-origin under /d, so
// active content (.html, .svg, .js, ...) must never be accepted.
const MIME_BY_EXT = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg', 'image/pjpeg'],
  '.jpeg': ['image/jpeg', 'image/pjpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.bmp': ['image/bmp', 'image/x-ms-bmp'],
  '.pdf': ['application/pdf'],
  '.json': ['application/json', 'text/json'],
  '.txt': ['text/plain'],
  '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'],
  '.md': ['text/markdown', 'text/x-markdown', 'text/plain'],
  '.zip': ['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip'],
};

// Clients often send a generic type for these; the content is verified
// separately (utils/fileSignature) after the file is written.
const OCTET_STREAM_EXTS = new Set(['.json', '.md', '.csv', '.txt', '.zip']);

const getExt = (originalname) => path.extname(originalname || '').toLowerCase();

/**
 * Create a multer instance restricted to the given extensions.
 * @param {{ extensions: string[] }} options lower-case extensions incl. the dot
 */
const createUpload = ({ extensions }) => {
  const allowed = new Set(extensions);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Create date-based directory (YYYY-MM-DD)
      const today = new Date();
      const dateDir = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const fullPath = path.join(uploadDir, dateDir);

      // Ensure date directory exists
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and random string
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${getExt(file.originalname)}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = getExt(file.originalname);
    const mime = String(file.mimetype || '').toLowerCase();
    const mimeOk =
      (MIME_BY_EXT[ext] || []).includes(mime) || (mime === 'application/octet-stream' && OCTET_STREAM_EXTS.has(ext));
    if (!allowed.has(ext) || !mimeOk) {
      return cb(new ApiError(httpStatus.UNSUPPORTED_MEDIA_TYPE, 'File type not allowed'));
    }
    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
      fieldSize: 10 * 1024 * 1024, // 10MB field size limit
    },
  });
};

// General assets (images, data, documents). SVG is deliberately excluded.
const uploadAsset = createUpload({
  extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.json', '.pdf', '.txt', '.csv', '.md'],
});

// Internal plugin bundles.
const uploadPluginZip = createUpload({ extensions: ['.zip'] });

module.exports = uploadAsset;
module.exports.uploadAsset = uploadAsset;
module.exports.uploadPluginZip = uploadPluginZip;
module.exports.createUpload = createUpload;
