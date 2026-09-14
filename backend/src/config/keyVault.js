// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Key Vault secret names cannot contain underscores. Keep this mapping explicit
// so the application continues to use the existing environment variable names.
const secretMappings = {
  'mongodb-url': 'MONGODB_URL',
  'jwt-secret': 'JWT_SECRET',
  'github-client-secret': 'GITHUB_CLIENT_SECRET',
  'email-api-key': 'EMAIL_API_KEY',
  'aws-public-key': 'AWS_PUBLIC_KEY',
  'aws-secret-key': 'AWS_SECRET_KEY',
  'openai-api-key': 'OPENAI_API_KEY',
  'admin-password': 'ADMIN_PASSWORD',
  'firebase-private-key': 'FIREBASE_PRIVATE_KEY',
  'firebase-project-id': 'FIREBASE_PROJECT_ID',
  'firebase-client-email': 'FIREBASE_CLIENT_EMAIL',
};

const requiredSecretNames = new Set(['mongodb-url', 'jwt-secret']);

const getSecretsProvider = () => {
  const configuredProvider = process.env.SECRETS_PROVIDER?.toLowerCase();

  if (configuredProvider) {
    if (!['env', 'keyvault'].includes(configuredProvider)) {
      throw new Error("SECRETS_PROVIDER must be either 'env' or 'keyvault'");
    }
    return configuredProvider;
  }

  return process.env.NODE_ENV === 'production' ? 'keyvault' : 'env';
};

const restoreEnvironmentSecrets = (environmentSecrets) => {
  Object.entries(environmentSecrets).forEach(([environmentVariable, value]) => {
    if (value === undefined) {
      delete process.env[environmentVariable];
    } else {
      process.env[environmentVariable] = value;
    }
  });
};

const loadKeyVaultSecrets = async () => {
  const provider = getSecretsProvider();

  if (provider === 'env') {
    return;
  }

  const keyVaultName = process.env.AZURE_KEY_VAULT_NAME;
  const allowEnvironmentFallback = process.env.AZURE_KEY_VAULT_ALLOW_ENV_FALLBACK === 'true';
  const environmentSecrets = Object.fromEntries(
    Object.values(secretMappings).map((environmentVariable) => [environmentVariable, process.env[environmentVariable]])
  );

  try {
    if (!keyVaultName) {
      throw new Error('AZURE_KEY_VAULT_NAME is required when SECRETS_PROVIDER=keyvault');
    }

    // Prevent .env values from being used for individual secrets in Key Vault mode.
    Object.keys(environmentSecrets).forEach((environmentVariable) => {
      delete process.env[environmentVariable];
    });

    const vaultUrl = `https://${keyVaultName}.vault.azure.net`;
    const client = new SecretClient(vaultUrl, new DefaultAzureCredential());

    await Promise.all(Object.entries(secretMappings).map(async ([secretName, environmentVariable]) => {
      try {
        const secret = await client.getSecret(secretName);
        if (secret.value !== undefined && secret.value !== '') {
          process.env[environmentVariable] = secret.value;
        } else if (requiredSecretNames.has(secretName)) {
          throw new Error(`Required secret '${secretName}' is empty in Azure Key Vault`);
        } else {
          console.warn(`Optional secret '${secretName}' is empty in Azure Key Vault; skipping`);
        }
      } catch (error) {
        if (requiredSecretNames.has(secretName)) {
          const status = error.statusCode ? ` status=${error.statusCode}` : '';
          const code = error.code ? ` code=${error.code}` : '';
          const message = error.message ? ` ${error.message}` : '';
          throw new Error(
            `Unable to load required secret '${secretName}' from Azure Key Vault.${status}${code}${message}`
          );
        }

        console.warn(`Optional secret '${secretName}' could not be loaded from Azure Key Vault; skipping`);
      }
    }));
  } catch (error) {
    if (!allowEnvironmentFallback) {
      throw error;
    }

    restoreEnvironmentSecrets(environmentSecrets);
    console.warn(`Azure Key Vault unavailable; using environment configuration: ${error.message}`);
  }
};

module.exports = { loadKeyVaultSecrets };
