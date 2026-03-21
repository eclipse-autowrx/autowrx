// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const STATUS = { OK: 'ok', ERROR: 'error', SKIPPED: 'skipped' };

// Check MongoDB connection
async function checkMongoDB() {
  try {
    const state = mongoose.connection.readyState;
    // 1 = connected, 2 = connecting
    if (state === 1) {
      // Quick ping
      await mongoose.connection.db.admin().ping();
      return { status: STATUS.OK, message: 'Connected and responsive' };
    }
    const stateMap = { 0: 'disconnected', 2: 'connecting', 3: 'disconnecting' };
    return { status: STATUS.ERROR, message: `MongoDB state: ${stateMap[state] || 'unknown'}` };
  } catch (err) {
    return { status: STATUS.ERROR, message: err.message };
  }
}

// Check JWT sign/verify cycle
async function checkJWT() {
  try {
    const secret = config.jwt.secret;
    if (!secret) return { status: STATUS.SKIPPED, message: 'JWT_SECRET not configured' };
    const token = jwt.sign({ test: true }, secret, { expiresIn: '1m' });
    const decoded = jwt.verify(token, secret);
    if (decoded.test !== true) throw new Error('Decoded payload mismatch');
    return { status: STATUS.OK, message: 'Sign and verify cycle passed' };
  } catch (err) {
    return { status: STATUS.ERROR, message: err.message };
  }
}

// Check auth login endpoint
async function checkAuth() {
  try {
    const email = config.adminEmails?.[0];
    const password = config.adminPassword;
    if (!email || !password) return { status: STATUS.SKIPPED, message: 'ADMIN_EMAILS or ADMIN_PASSWORD not configured' };

    const port = process.env.PORT || 3200;
    const res = await axios.post(`http://localhost:${port}/v2/auth/login`, { email, password }, { timeout: 5000 });
    if (res.data?.tokens?.access?.token) {
      return { status: STATUS.OK, message: 'Login successful, token received' };
    }
    return { status: STATUS.ERROR, message: 'Login response missing token' };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    return { status: STATUS.ERROR, message: `Login failed: ${msg}` };
  }
}

// Check upload service — write a tiny test file to static/uploads and verify it's accessible
async function checkUpload() {
  try {
    const uploadDir = path.join(__dirname, '../../static/uploads');
    if (!fs.existsSync(uploadDir)) {
      return { status: STATUS.SKIPPED, message: 'Upload directory does not exist' };
    }
    const testFile = path.join(uploadDir, '_health_check_test.txt');
    fs.writeFileSync(testFile, 'health-check');
    const content = fs.readFileSync(testFile, 'utf8');
    fs.unlinkSync(testFile);
    if (content === 'health-check') {
      return { status: STATUS.OK, message: 'Upload directory writable and readable' };
    }
    return { status: STATUS.ERROR, message: 'File content mismatch after write' };
  } catch (err) {
    return { status: STATUS.ERROR, message: err.message };
  }
}

// Check runtime server reachability (from site config or env)
async function checkRuntimeServer() {
  try {
    // Try to get from site config in DB
    let runtimeUrl = process.env.RUNTIME_SERVER_URL || 'https://kit.digitalauto.tech';
    try {
      const SiteConfig = require('../models/siteConfig.model');
      const cfg = await SiteConfig.findOne({ key: 'RUNTIME_SERVER_URL', scope: 'site' });
      if (cfg?.value) runtimeUrl = cfg.value;
    } catch (_) {}

    if (!runtimeUrl) return { status: STATUS.SKIPPED, message: 'RUNTIME_SERVER_URL not configured' };

    const start = Date.now();
    await axios.get(runtimeUrl, { timeout: 5000, validateStatus: () => true });
    const ms = Date.now() - start;
    return { status: STATUS.OK, message: `Reachable in ${ms}ms (${runtimeUrl})` };
  } catch (err) {
    if (err.code === 'ECONNABORTED') return { status: STATUS.ERROR, message: 'Timeout after 5s' };
    return { status: STATUS.ERROR, message: err.message };
  }
}

// Check SSO (Microsoft Graph) reachability
async function checkSSO() {
  try {
    const start = Date.now();
    await axios.get('https://graph.microsoft.com/v1.0/', { timeout: 5000, validateStatus: () => true });
    const ms = Date.now() - start;
    return { status: STATUS.OK, message: `Microsoft Graph reachable in ${ms}ms` };
  } catch (err) {
    if (err.code === 'ECONNABORTED') return { status: STATUS.ERROR, message: 'Timeout after 5s' };
    return { status: STATUS.ERROR, message: err.message };
  }
}

// Run all checks and return consolidated report
async function runHealthCheck() {
  const [mongodb, jwtCheck, auth, upload, runtimeServer, sso] = await Promise.all([
    checkMongoDB(),
    checkJWT(),
    checkAuth(),
    checkUpload(),
    checkRuntimeServer(),
    checkSSO(),
  ]);

  const services = { mongodb, jwt: jwtCheck, auth, upload, runtimeServer, sso };

  const statuses = Object.values(services).map(s => s.status);
  let overallStatus = STATUS.OK;
  if (statuses.some(s => s === STATUS.ERROR)) overallStatus = STATUS.ERROR;
  else if (statuses.some(s => s === STATUS.SKIPPED)) overallStatus = 'degraded';

  return {
    status: overallStatus,
    checkedAt: new Date().toISOString(),
    services,
  };
}

module.exports = { runHealthCheck };
