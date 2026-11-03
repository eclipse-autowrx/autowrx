// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// In-process production metrics (issue #639). Counters live in this process
// only and reset on restart; pm2 runs a single instance (ecosystem.config.json).
// Prometheus text output is hand-rolled to avoid a new dependency.

const mongoose = require('mongoose');
const { checkRuntimeServer } = require('./health.service');
const { getRuntimeMappingCount } = require('../config/runtimeConfig');

const LATENCY_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
const RUNTIME_STATUS_TTL_MS = 30 * 1000;
const MONGO_READY_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

const startedAt = Date.now();
let httpStats = new Map();
let mongoCheckoutFailures = 0;
let mongoClient = null;
const monitoredClients = new WeakSet();
let runtimeCache = null; // { value, expiresAt }
let runtimeInFlight = null;

const statusClass = (status) => `${Math.floor(Number(status) / 100)}xx`;

/**
 * Record one finished HTTP request.
 * @param {{method: string, route: string, status: number, durationMs: number}} sample
 */
function recordRequest({ method, route, status, durationMs }) {
  const statusLabel = statusClass(status);
  const key = `${method}|${route}|${statusLabel}`;
  let entry = httpStats.get(key);
  if (!entry) {
    entry = {
      method,
      route,
      status: statusLabel,
      count: 0,
      sumMs: 0,
      maxMs: 0,
      buckets: new Array(LATENCY_BUCKETS_MS.length).fill(0),
    };
    httpStats.set(key, entry);
  }
  entry.count += 1;
  entry.sumMs += durationMs;
  if (durationMs > entry.maxMs) entry.maxMs = durationMs;
  const idx = LATENCY_BUCKETS_MS.findIndex((le) => durationMs <= le);
  if (idx !== -1) entry.buckets[idx] += 1;
}

/**
 * Remember the MongoClient whose pool is reported, and count checkout failures.
 * Gauges are read from the pool at snapshot time, so connections opened before
 * this call (e.g. the authenticated ping during connect) are still counted.
 * @param {import('mongodb').MongoClient} client
 */
function attachMongoPoolMonitor(client) {
  if (!client) return;
  mongoClient = client;
  if (monitoredClients.has(client)) return;
  monitoredClients.add(client);
  client.on('connectionCheckOutFailed', () => {
    mongoCheckoutFailures += 1;
  });
}

// Sum pool gauges across servers. The getters are public on the driver's
// ConnectionPool, but reaching the pools goes through topology internals, so
// fall back to nulls if the driver layout changes.
function readPoolGauges(client) {
  const servers = client?.topology?.s?.servers;
  if (!servers || typeof servers.values !== 'function') return null;
  const totals = { open: 0, inUse: 0, available: 0, waitQueue: 0 };
  let seen = false;
  for (const server of servers.values()) {
    const { pool } = server || {};
    if (pool && typeof pool.totalConnectionCount === 'number') {
      seen = true;
      totals.open += pool.totalConnectionCount;
      totals.inUse += pool.currentCheckedOutCount;
      totals.available += pool.availableConnectionCount;
      totals.waitQueue += pool.waitQueueSize;
    }
  }
  return seen ? totals : { open: 0, inUse: 0, available: 0, waitQueue: 0 };
}

function getMongoStats() {
  const { readyState } = mongoose.connection;
  const gauges = readPoolGauges(mongoClient);
  const maxPoolSize = mongoClient?.options?.maxPoolSize ?? null;
  return {
    readyState: MONGO_READY_STATES[readyState] || 'unknown',
    pool: {
      maxPoolSize,
      open: gauges ? gauges.open : null,
      inUse: gauges ? gauges.inUse : null,
      available: gauges ? gauges.available : null,
      waitQueue: gauges ? gauges.waitQueue : null,
      checkoutFailures: mongoCheckoutFailures,
    },
  };
}

/**
 * Runtime-server reachability, cached for 30s with in-flight de-duplication so
 * frequent scrapes don't each make an outbound probe (up to 5s).
 */
async function getRuntimeServerStatus() {
  const now = Date.now();
  if (runtimeCache && runtimeCache.expiresAt > now) return runtimeCache.value;
  if (!runtimeInFlight) {
    runtimeInFlight = (async () => {
      let result;
      try {
        result = await checkRuntimeServer();
      } catch (err) {
        result = { status: 'error', message: err.message };
      }
      const value = {
        status: result.status,
        message: result.message,
        checkedAt: new Date().toISOString(),
        configuredMappings: getRuntimeMappingCount(),
      };
      runtimeCache = { value, expiresAt: Date.now() + RUNTIME_STATUS_TTL_MS };
      return value;
    })().finally(() => {
      runtimeInFlight = null;
    });
  }
  return runtimeInFlight;
}

const round = (n) => Math.round(n * 1000) / 1000;

async function getSnapshot() {
  const routes = [...httpStats.values()].map((e) => ({
    method: e.method,
    route: e.route,
    status: e.status,
    count: e.count,
    latencyMs: {
      avg: e.count ? round(e.sumMs / e.count) : 0,
      max: round(e.maxMs),
      sum: round(e.sumMs),
      buckets: Object.fromEntries(LATENCY_BUCKETS_MS.map((le, i) => [String(le), e.buckets[i]])),
    },
  }));
  return {
    collectedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    http: {
      totalRequests: routes.reduce((sum, r) => sum + r.count, 0),
      routes,
    },
    mongodb: getMongoStats(),
    runtimeServer: await getRuntimeServerStatus(),
  };
}

const escapeLabel = (value) => String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
const labels = (obj) =>
  `{${Object.entries(obj)
    .map(([k, v]) => `${k}="${escapeLabel(v)}"`)
    .join(',')}}`;

/**
 * Render a snapshot as Prometheus text exposition format 0.0.4.
 * @param {object} snapshot result of getSnapshot()
 * @returns {string}
 */
function toPrometheus(snapshot) {
  const lines = [];
  const header = (name, type, help) => lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`);

  header('autowrx_http_requests_total', 'counter', 'HTTP requests under /v2 by method, route template and status class.');
  snapshot.http.routes.forEach((r) => {
    lines.push(`autowrx_http_requests_total${labels({ method: r.method, route: r.route, status: r.status })} ${r.count}`);
  });

  header('autowrx_http_request_duration_seconds', 'histogram', 'HTTP request latency under /v2 in seconds.');
  snapshot.http.routes.forEach((r) => {
    const base = { method: r.method, route: r.route, status: r.status };
    let cumulative = 0;
    LATENCY_BUCKETS_MS.forEach((le) => {
      cumulative += r.latencyMs.buckets[String(le)];
      lines.push(`autowrx_http_request_duration_seconds_bucket${labels({ ...base, le: le / 1000 })} ${cumulative}`);
    });
    lines.push(`autowrx_http_request_duration_seconds_bucket${labels({ ...base, le: '+Inf' })} ${r.count}`);
    lines.push(`autowrx_http_request_duration_seconds_sum${labels(base)} ${r.latencyMs.sum / 1000}`);
    lines.push(`autowrx_http_request_duration_seconds_count${labels(base)} ${r.count}`);
  });

  const { pool, readyState } = snapshot.mongodb;
  header(
    'autowrx_mongodb_connected',
    'gauge',
    'Whether Mongoose reports the MongoDB connection as connected (1) or not (0).',
  );
  lines.push(`autowrx_mongodb_connected ${readyState === 'connected' ? 1 : 0}`);
  if (pool.open !== null) {
    header('autowrx_mongodb_pool_connections', 'gauge', 'MongoDB driver pool connections by state.');
    lines.push(`autowrx_mongodb_pool_connections${labels({ state: 'open' })} ${pool.open}`);
    lines.push(`autowrx_mongodb_pool_connections${labels({ state: 'in_use' })} ${pool.inUse}`);
    lines.push(`autowrx_mongodb_pool_connections${labels({ state: 'available' })} ${pool.available}`);
    header('autowrx_mongodb_pool_wait_queue', 'gauge', 'Operations waiting for a MongoDB pool connection.');
    lines.push(`autowrx_mongodb_pool_wait_queue ${pool.waitQueue}`);
  }
  if (pool.maxPoolSize !== null) {
    header('autowrx_mongodb_pool_max_connections', 'gauge', 'Configured MongoDB maxPoolSize per server.');
    lines.push(`autowrx_mongodb_pool_max_connections ${pool.maxPoolSize}`);
  }
  header('autowrx_mongodb_pool_checkout_failures_total', 'counter', 'Failed MongoDB pool connection checkouts.');
  lines.push(`autowrx_mongodb_pool_checkout_failures_total ${pool.checkoutFailures}`);

  header('autowrx_runtime_server_up', 'gauge', 'Whether the runtime server answered its last (cached) probe.');
  lines.push(`autowrx_runtime_server_up ${snapshot.runtimeServer.status === 'ok' ? 1 : 0}`);

  header('autowrx_process_uptime_seconds', 'gauge', 'Seconds since the metrics module was loaded.');
  lines.push(`autowrx_process_uptime_seconds ${snapshot.uptimeSeconds}`);

  return `${lines.join('\n')}\n`;
}

// Test helper: clear all in-memory state.
function resetForTests() {
  httpStats = new Map();
  mongoCheckoutFailures = 0;
  mongoClient = null;
  runtimeCache = null;
  runtimeInFlight = null;
}

module.exports = {
  LATENCY_BUCKETS_MS,
  recordRequest,
  attachMongoPoolMonitor,
  getRuntimeServerStatus,
  getSnapshot,
  toPrometheus,
  resetForTests,
};
