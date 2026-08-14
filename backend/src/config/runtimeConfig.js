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
 */

const parseRuntimeMappings = () => {
  const mappingStr = process.env.RUNTIME_SERVICE_MAPPINGS || '';
  const mapping = {};

  if (!mappingStr.trim()) {
    console.log('[RuntimeConfig] No RUNTIME_SERVICE_MAPPINGS provided');
    return mapping;
  }

  try {
    mappingStr.split(',').forEach((pair) => {
      const [runtimeName, serviceName] = pair
        .trim()
        .split(':')
        .map((s) => s.trim());
      if (runtimeName && serviceName) {
        mapping[runtimeName] = serviceName;
      }
    });
    const count = Object.keys(mapping).length;
    console.log(`[RuntimeConfig] Loaded ${count} runtime mapping(s)`);
    Object.entries(mapping).forEach(([name, service]) => {
      console.log(`[RuntimeConfig]   ${name} → ${service}`);
    });
  } catch (err) {
    console.error('[RuntimeConfig] Error parsing RUNTIME_SERVICE_MAPPINGS:', err.message);
  }

  return mapping;
};

const runtimeMappings = parseRuntimeMappings();

/**
 * Get docker/Kubernetes service name for a given RUNTIME_NAME
 * @param {string} runtimeName - The RUNTIME_NAME from the request
 * @returns {string|null} - The service hostname or null
 */
function getServiceNameForRuntime(runtimeName) {
  return runtimeMappings[runtimeName] || null;
}

module.exports = {
  getServiceNameForRuntime,
};
