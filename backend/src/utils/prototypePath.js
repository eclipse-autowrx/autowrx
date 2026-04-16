const path = require('path');

const sanitizePrototypeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'unnamed-prototype';
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return sanitized || 'unnamed-prototype';
};

const getPrototypeModelId = (prototype) => String(prototype?.model_id?._id || prototype?.model_id || '');

const getPrototypeFolderRelativePath = (prototype) =>
  path.join(getPrototypeModelId(prototype), sanitizePrototypeFolderName(prototype?.name));

module.exports = {
  sanitizePrototypeFolderName,
  getPrototypeModelId,
  getPrototypeFolderRelativePath,
};
