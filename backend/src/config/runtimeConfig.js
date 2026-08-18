// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Runtime service mapping
 * Maps RUNTIME_NAME values to docker/Kubernetes service hostnames
 *
 * Format: "RUNTIME_NAME1:service-name1,RUNTIME_NAME2:service-name2,..."
 * Example: "PUBLIC-01-49aa7a20cb8aaf10:runtime-09,PUBLIC-02-985bfbf92e0a1698:runtime-10"
 *
 * Local host-run backend (Windows/WSL outside compose): include host:port
 * Example: "PUBLIC-01-49aa7a20cb8aaf10:127.0.0.1:8889"
 */

const toTargetUrl = (rest) => {
  if (!rest) return null;
  if (/^https?:\/\//i.test(rest)) return rest;
  if (rest.includes(':')) return `http://${rest}`;
  return `http://${rest}:8080`;
};

const parseRuntimeMappings = () => {
  const mappingStr = process.env.RUNTIME_SERVICE_MAPPINGS || '';
  const mapping = {};

  if (!mappingStr.trim()) {
    console.log('[RuntimeConfig] No RUNTIME_SERVICE_MAPPINGS provided');
    return mapping;
  }

  try {
    mappingStr.split(',').forEach((pair) => {
      const trimmed = pair.trim();
      if (!trimmed) return;
      const sep = trimmed.indexOf(':');
      if (sep <= 0) return;
      const runtimeName = trimmed.slice(0, sep).trim();
      const rest = trimmed.slice(sep + 1).trim();
      const targetUrl = toTargetUrl(rest);
      if (runtimeName && targetUrl) {
        mapping[runtimeName] = targetUrl;
      }
    });
    const count = Object.keys(mapping).length;
    console.log(`[RuntimeConfig] Loaded ${count} runtime mapping(s)`);
    Object.entries(mapping).forEach(([name, target]) => {
      console.log(`[RuntimeConfig]   ${name} → ${target}`);
    });
  } catch (err) {
    console.error('[RuntimeConfig] Error parsing RUNTIME_SERVICE_MAPPINGS:', err.message);
  }

  return mapping;
};

const runtimeMappings = parseRuntimeMappings();

/**
 * Get proxy target URL for a given RUNTIME_NAME
 * @param {string} runtimeName - The RUNTIME_NAME from the request
 * @returns {string|null} - e.g. http://runtime-09:8080 or http://127.0.0.1:8889
 */
function getRuntimeTarget(runtimeName) {
  return runtimeMappings[runtimeName] || null;
}

module.exports = {
  getRuntimeTarget,
};
