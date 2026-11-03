// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #639: in-process metrics backing GET /v2/metrics.

jest.mock('../../../src/services/health.service', () => ({ checkRuntimeServer: jest.fn() }));
jest.mock('../../../src/config/runtimeConfig', () => ({ getRuntimeMappingCount: jest.fn(() => 2) }));

const { EventEmitter } = require('events');
const mongoose = require('mongoose');
const { checkRuntimeServer } = require('../../../src/services/health.service');
const metrics = require('../../../src/services/metrics.service');

function fakeClient(pools, options = { maxPoolSize: 100 }) {
  const client = new EventEmitter();
  client.options = options;
  client.topology = { s: { servers: new Map(pools.map((pool, i) => [`host${i}`, { pool }])) } };
  return client;
}

beforeEach(() => {
  metrics.resetForTests();
  checkRuntimeServer.mockClear();
  checkRuntimeServer.mockResolvedValue({ status: 'ok', message: 'Reachable in 3ms' });
  mongoose.connection.readyState = 1;
});

afterEach(() => {
  jest.useRealTimers();
  mongoose.connection.readyState = 0;
});

describe('HTTP request stats', () => {
  test('aggregates count, sum, max, avg and buckets per method/route/status class', async () => {
    metrics.recordRequest({ method: 'GET', route: '/v2/model/:id', status: 200, durationMs: 3 });
    metrics.recordRequest({ method: 'GET', route: '/v2/model/:id', status: 204, durationMs: 40 });
    metrics.recordRequest({ method: 'GET', route: '/v2/model/:id', status: 404, durationMs: 20000 });

    const { http } = await metrics.getSnapshot();
    expect(http.totalRequests).toBe(3);
    const ok = http.routes.find((r) => r.status === '2xx');
    expect(ok).toMatchObject({ method: 'GET', route: '/v2/model/:id', count: 2 });
    expect(ok.latencyMs).toMatchObject({ sum: 43, max: 40, avg: 21.5 });
    expect(ok.latencyMs.buckets['5']).toBe(1);
    expect(ok.latencyMs.buckets['50']).toBe(1);
    // Beyond the largest bucket: only counted in +Inf (count)
    const notFound = http.routes.find((r) => r.status === '4xx');
    expect(Object.values(notFound.latencyMs.buckets).every((n) => n === 0)).toBe(true);
  });
});

describe('MongoDB pool stats', () => {
  test('sums pool gauges across servers and counts checkout failures', async () => {
    const client = fakeClient([
      { totalConnectionCount: 3, currentCheckedOutCount: 1, availableConnectionCount: 2, waitQueueSize: 0 },
      { totalConnectionCount: 2, currentCheckedOutCount: 2, availableConnectionCount: 0, waitQueueSize: 4 },
    ]);
    metrics.attachMongoPoolMonitor(client);
    metrics.attachMongoPoolMonitor(client); // idempotent: listener added once
    client.emit('connectionCheckOutFailed', {});

    const { mongodb } = await metrics.getSnapshot();
    expect(mongodb).toEqual({
      readyState: 'connected',
      pool: { maxPoolSize: 100, open: 5, inUse: 3, available: 2, waitQueue: 4, checkoutFailures: 1 },
    });
  });

  test('reports null gauges when no client is attached', async () => {
    const { mongodb } = await metrics.getSnapshot();
    expect(mongodb.pool).toMatchObject({ maxPoolSize: null, open: null, inUse: null, checkoutFailures: 0 });
  });
});

describe('runtime server status', () => {
  test('is cached for 30s and de-duplicates concurrent probes', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-02T00:00:00Z') });
    const [a, b] = await Promise.all([metrics.getRuntimeServerStatus(), metrics.getRuntimeServerStatus()]);
    expect(a).toBe(b);
    expect(a).toMatchObject({ status: 'ok', configuredMappings: 2 });
    await metrics.getRuntimeServerStatus();
    expect(checkRuntimeServer).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-11-02T00:00:31Z'));
    await metrics.getRuntimeServerStatus();
    expect(checkRuntimeServer).toHaveBeenCalledTimes(2);
  });

  test('a crashing probe is reported as error, not thrown', async () => {
    checkRuntimeServer.mockRejectedValue(new Error('boom'));
    await expect(metrics.getRuntimeServerStatus()).resolves.toMatchObject({ status: 'error', message: 'boom' });
  });
});

describe('toPrometheus', () => {
  test('renders counters, cumulative histogram buckets and escaped labels', async () => {
    metrics.recordRequest({ method: 'GET', route: '/v2/a"b\\c', status: 200, durationMs: 7 });
    metrics.recordRequest({ method: 'GET', route: '/v2/a"b\\c', status: 200, durationMs: 30 });
    metrics.attachMongoPoolMonitor(
      fakeClient([{ totalConnectionCount: 1, currentCheckedOutCount: 0, availableConnectionCount: 1, waitQueueSize: 0 }]),
    );

    const text = metrics.toPrometheus(await metrics.getSnapshot());
    const route = 'route="/v2/a\\"b\\\\c"';
    expect(text).toContain('# TYPE autowrx_http_requests_total counter');
    expect(text).toContain(`autowrx_http_requests_total{method="GET",${route},status="2xx"} 2`);
    expect(text).toContain('# TYPE autowrx_http_request_duration_seconds histogram');
    expect(text).toContain(`autowrx_http_request_duration_seconds_bucket{method="GET",${route},status="2xx",le="0.005"} 0`);
    expect(text).toContain(`autowrx_http_request_duration_seconds_bucket{method="GET",${route},status="2xx",le="0.01"} 1`);
    expect(text).toContain(`autowrx_http_request_duration_seconds_bucket{method="GET",${route},status="2xx",le="0.05"} 2`);
    expect(text).toContain(`autowrx_http_request_duration_seconds_bucket{method="GET",${route},status="2xx",le="+Inf"} 2`);
    expect(text).toContain(`autowrx_http_request_duration_seconds_sum{method="GET",${route},status="2xx"} 0.037`);
    expect(text).toContain('autowrx_mongodb_connected 1');
    expect(text).toContain('autowrx_mongodb_pool_connections{state="open"} 1');
    expect(text).toContain('autowrx_mongodb_pool_max_connections 100');
    expect(text).toContain('autowrx_mongodb_pool_checkout_failures_total 0');
    expect(text).toContain('autowrx_runtime_server_up 1');
    expect(text).toMatch(/autowrx_process_uptime_seconds \d+\n$/);
  });
});
