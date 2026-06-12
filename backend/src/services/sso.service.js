// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { SiteConfig } = require('../models');
const { encrypt, decrypt } = require('../utils/encryption');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const logger = require('../config/logger');

const SSO_PROVIDERS_KEY = 'SSO_PROVIDERS';

/**
 * Get all SSO providers from config
 * @param {boolean} includeSecrets - Whether to decrypt client secrets
 * @returns {Promise<Array>} Array of SSO provider objects
 */
const getSSOProviders = async (includeSecrets = false) => {
  try {
    // Query database directly to avoid circular dependency with siteConfigService
    const config = await SiteConfig.findOne({ 
      key: SSO_PROVIDERS_KEY, 
      scope: 'site' 
    });
    
    logger.debug('SSO config retrieved: %s', config ? `Found with ${config.value?.length || 0} providers` : 'Not found');
    
    if (!config || !config.value) {
      logger.debug('No SSO providers config found in database');
      return [];
    }
    
    const providers = Array.isArray(config.value) ? config.value : [];
    logger.debug('Total SSO providers: %d, enabled: %d', providers.length, providers.filter(p => p.enabled).length);
    
    if (includeSecrets) {
      return decryptProviderSecrets(providers);
    }
    
    // Remove secrets for public consumption
    return providers.map(provider => {
      const { clientSecret, ...publicProvider } = provider;
      return publicProvider;
    });
  } catch (error) {
    logger.error('Error fetching SSO providers: %s', error.message);
    return [];
  }
};

/**
 * Get only enabled SSO providers without secrets (for public endpoint)
 * @returns {Promise<Array>} Array of enabled SSO provider objects without secrets
 */
const getEnabledSSOProviders = async () => {
  const providers = await getSSOProviders(false);
  return providers.filter(provider => provider.enabled === true);
};

/**
 * Get specific SSO provider by ID
 * @param {string} id - Provider ID
 * @param {boolean} includeSecrets - Whether to decrypt client secrets
 * @returns {Promise<Object|null>} SSO provider object or null
 */
const getSSOProviderById = async (id, includeSecrets = false) => {
  const providers = await getSSOProviders(includeSecrets);
  const provider = providers.find(p => p.id === id);
  
  if (!provider) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SSO provider not found');
  }
  
  if (!provider.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'SSO provider is disabled');
  }
  
  return provider;
};

/**
 * Encrypt clientSecret fields in all providers
 * @param {Array} providers - Array of provider objects
 * @returns {Array} Providers with encrypted secrets
 */
const encryptProviderSecrets = (providers) => {
  if (!Array.isArray(providers)) {
    return providers;
  }
  
  return providers.map(provider => {
    if (provider.clientSecret && !provider.clientSecret.includes(':')) {
      // Only encrypt if not already encrypted (no colon separator)
      return {
        ...provider,
        clientSecret: encrypt(provider.clientSecret),
      };
    }
    return provider;
  });
};

/**
 * Decrypt clientSecret fields in all providers
 * @param {Array} providers - Array of provider objects with encrypted secrets
 * @returns {Array} Providers with decrypted secrets
 */
const decryptProviderSecrets = (providers) => {
  if (!Array.isArray(providers)) {
    return providers;
  }
  
  return providers.map(provider => {
    if (provider.clientSecret && provider.clientSecret.includes(':')) {
      // Only decrypt if encrypted (has colon separator)
      try {
        return {
          ...provider,
          clientSecret: decrypt(provider.clientSecret),
        };
      } catch (error) {
        logger.error('Failed to decrypt secret for provider %s: %s', provider.id, error.message);
        return provider;
      }
    }
    return provider;
  });
};

module.exports = {
  getSSOProviders,
  getEnabledSSOProviders,
  getSSOProviderById,
  encryptProviderSecrets,
  decryptProviderSecrets,
};
