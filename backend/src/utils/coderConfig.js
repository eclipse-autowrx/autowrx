// Import directly to avoid circular dependency through ../services index.
const siteConfigService = require('../services/siteConfig.service');

// Configuration keys stored in the DB via /v2/site-config
const KEYS = {
  vscodeEnable: 'VSCODE_ENABLE',
  coderUrl: 'CODER_URL',
  coderAdminApiKey: 'CODER_ADMIN_API_KEY',
  prototypesPath: 'PROTOTYPES_PATH',
};

// Hard-coded defaults (NO .env reading for Coder integration)
const DEFAULTS = {
  enabled: false,
  coderUrl: 'http://localhost:7080',
  adminApiKey: '',
  prototypesPath: '/var/lib/autowrx/prototypes',
};

const CACHE_DURATION_MS = 10 * 1000; // refresh at most every 10s

let cached = { ...DEFAULTS };
let cacheExpiresAt = 0;
let refreshPromise = null;

const normalizeConfig = (values) => {
  const enabledRaw = values[KEYS.vscodeEnable] ?? DEFAULTS.enabled;
  const enabled =
    typeof enabledRaw === 'string'
      ? ['true', '1', 'yes', 'on'].includes(enabledRaw.trim().toLowerCase())
      : Boolean(enabledRaw);
  const coderUrl = values[KEYS.coderUrl] ?? DEFAULTS.coderUrl;
  const adminApiKey = values[KEYS.coderAdminApiKey] ?? DEFAULTS.adminApiKey;
  const prototypesPath = values[KEYS.prototypesPath] ?? DEFAULTS.prototypesPath;

  return {
    enabled: Boolean(enabled),
    coderUrl: String(coderUrl),
    adminApiKey: String(adminApiKey),
    prototypesPath: String(prototypesPath),
  };
};

const refreshCache = async () => {
  const keys = Object.values(KEYS);
  const values = await siteConfigService.getSiteConfigValues(keys);
  cached = normalizeConfig(values);
  cacheExpiresAt = Date.now() + CACHE_DURATION_MS;
  refreshPromise = null;
  return cached;
};

const getCoderConfigSync = () => {
  // Kick off a refresh in the background when expired.
  if (Date.now() >= cacheExpiresAt) {
    if (!refreshPromise) {
      refreshPromise = refreshCache().catch(() => {
        // Keep cached defaults to allow the app to boot even if DB isn't ready.
        refreshPromise = null;
      });
    }
  }
  return cached;
};

const getCoderConfig = async (opts = {}) => {
  const { forceRefresh = false } = opts;
  if (forceRefresh || Date.now() >= cacheExpiresAt) {
    if (!refreshPromise || forceRefresh) {
      refreshPromise = refreshCache();
    }
    await refreshPromise;
  }
  return cached;
};

module.exports = {
  KEYS,
  getCoderConfig,
  getCoderConfigSync,
};
