// Import directly to avoid circular dependency through ../services index.
const siteConfigService = require('../services/siteConfig.service');

// Configuration keys stored in the DB via /v2/site-config
const KEYS = {
  vscodeEnable: 'VSCODE_ENABLE',
  coderUrl: 'CODER_URL',
  coderAdminApiKey: 'CODER_ADMIN_API_KEY',
  prototypesPath: 'PROTOTYPES_PATH',
  redisUrl: 'REDIS_URL',
  workspaceTtlSeconds: 'CODER_WORKSPACE_TTL_SECONDS',
};

// Hard-coded defaults (NO .env reading for Coder integration)
const DEFAULTS = {
  enabled: false,
  coderUrl: 'http://localhost:7080',
  adminApiKey: '',
  prototypesPath: '/opt/autowrx/prototypes',
  redisUrl: 'redis://localhost:6379',
  workspaceTtlSeconds: 3600,
};

let cached = { ...DEFAULTS };

const normalizeConfig = (values) => {
  const enabledRaw = values[KEYS.vscodeEnable] ?? DEFAULTS.enabled;
  const enabled =
    typeof enabledRaw === 'string'
      ? ['true', '1', 'yes', 'on'].includes(enabledRaw.trim().toLowerCase())
      : Boolean(enabledRaw);
  const coderUrl = values[KEYS.coderUrl] ?? DEFAULTS.coderUrl;
  const adminApiKey = values[KEYS.coderAdminApiKey] ?? DEFAULTS.adminApiKey;
  const prototypesPath = values[KEYS.prototypesPath] ?? DEFAULTS.prototypesPath;
  const redisUrl = values[KEYS.redisUrl] ?? DEFAULTS.redisUrl;
  const workspaceTtlSecondsRaw = values[KEYS.workspaceTtlSeconds];
  const workspaceTtlSeconds = Number(workspaceTtlSecondsRaw);
  const safeWorkspaceTtlSeconds = Number.isFinite(workspaceTtlSeconds)
    ? Math.max(60, Math.floor(workspaceTtlSeconds))
    : DEFAULTS.workspaceTtlSeconds;

  return {
    enabled: Boolean(enabled),
    coderUrl: String(coderUrl),
    adminApiKey: String(adminApiKey),
    prototypesPath: String(prototypesPath),
    redisUrl: String(redisUrl || ''),
    workspaceTtlSeconds: safeWorkspaceTtlSeconds,
  };
};

const refreshCache = async () => {
  const keys = Object.values(KEYS);
  const values = await siteConfigService.getSiteConfigValues(keys);
  cached = normalizeConfig(values);
  return cached;
};

const getCoderConfigSync = () => {
  // Sync getter returns the latest snapshot loaded by getCoderConfig().
  return cached;
};

const getCoderConfig = async (opts = {}) => {
  // No dedicated TTL cache here; always read current values from Site Config.
  return refreshCache();
};

module.exports = {
  KEYS,
  getCoderConfig,
  getCoderConfigSync,
};
