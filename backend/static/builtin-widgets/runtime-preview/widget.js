// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const DEFAULT_MAPPINGS = [];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const PERIODIC_RETRY_MS = 5000;

let runtimeMappings = DEFAULT_MAPPINGS;
// When true the preview shows app-core's built-in default route instead of
// the UI the running application generates.
let showDefaultUi = false;
let currentRuntimeName = null;
let currentPreviewUrl = null;
let retryCount = 0;
let retryTimer = null;
let periodicTimer = null;
let appRunning = false;
let runtimeBusy = false;
let optionsLoaded = false;
// JWT access token from parent — iframe.src cannot set Authorization
let accessToken = null;

function onWidgetLoaded(options) {
  if (options && Array.isArray(options.runtimeMappings) && options.runtimeMappings.length > 0) {
    runtimeMappings = options.runtimeMappings;
  }
  if (options && typeof options.showDefaultUi === 'boolean') {
    showDefaultUi = options.showDefaultUi;
  }
  optionsLoaded = true;
  // widget-options can arrive after runtime-state, so re-apply it in case
  // runtimeMappings/showDefaultUi has changed.
  if (currentRuntimeName) {
    applyRuntimeState(currentRuntimeName, appRunning, runtimeBusy);
  }
}

function el(id) {
  return document.getElementById(id);
}

function buildPreviewUrl(previewPath) {
  // Absolute mapping paths load from their own origin as-is - needed when the
  // runtime UI isn't reverse-proxied under this origin (e.g. no prefix support).
  let url = /^https?:\/\//i.test(previewPath) ? previewPath : window.location.origin + previewPath;
  if (accessToken) {
    url += (previewPath.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + encodeURIComponent(accessToken);
  }
  return url;
}

function computePreviewPath(name) {
  const match = runtimeMappings.find(function (m) {
    return name.endsWith(m.suffix) || name === m.suffix;
  });

  // Zero-config fallback: the backend proxy (app.js) keys on the bare runtime
  // name, while the kit registers as RUNTIME_PREFIX + name. "Runtime-" is the
  // syncer's default prefix; a custom one must be mapped explicitly.
  // Guessing is safe: verifyAndLoadPreview() checks the response first.
  const basePath = match ? match.path : '/runtime-preview/' + name.replace(/runtime-/i, '');
  // app-core's ApplicationRuntime.mount() always registers a fixed default
  // route alongside the base path, so Default UI is reached by appending
  // /default.
  return showDefaultUi ? basePath.replace(/\/+$/, '') + '/default' : basePath;
}

function applyPreviewForRuntimeName(name, forceReload = false) {
  // if a runtime-state message reports no active runtime (e.g. disconnect)
  if (!name) {
    resetFrame();
    // null so a later reconnect is not skipped by the dedup check below
    currentPreviewUrl = null;
    el('placeholder-text').textContent = 'No runtime selected';
    showOnly('placeholder');
    return;
  }

  const newUrl = buildPreviewUrl(computePreviewPath(name));
  // if runtime has changed but is pointing to the same preview URL, set forceReload=true
  if (!forceReload && newUrl === currentPreviewUrl) return;
  currentPreviewUrl = newUrl;
  retryCount = 0;
  clearTimers();
  showLoading(0);
  verifyAndLoadPreview(currentPreviewUrl, false);
}

// A path that can never be a real runtime name - any server-side fallback
// (dev-server SPA history fallback, prod try_files, etc.) returns the same
// generic body for it as for a wrong/unmapped target. Fetched fresh every
// time (never cached) so a frontend redeploy can't leave a stale reference.
function fetchCanaryText() {
  const canaryUrl = buildPreviewUrl('/runtime-preview/__canary-' + Math.random().toString(36).slice(2));
  return fetch(canaryUrl, { cache: 'no-store' }).then(function (r) {
    return r.text();
  });
}

// Single entry point for every preview load attempt (initial + retries).
// Cross-origin absolute targets are always explicitly configured by a human
// (never guessed) and CORS blocks reading their body anyway - load them
// directly. Same-origin targets are compared against the canary response
// first so a bad guess or misconfigured mapping is caught and rejected
// before it ever reaches the visible iframe.
function verifyAndLoadPreview(url, isPeriodicRetry) {
  if (new URL(url, window.location.origin).origin !== window.location.origin) {
    // CORS blocks reading the body, but a no-cors fetch still rejects on a
    // real connection failure (e.g. app not listening yet right after
    // start) - catches that before it reaches the iframe as an
    // undetectable, unrecoverable browser error page (see loadPreview).
    fetch(url, { mode: 'no-cors', cache: 'no-store' })
      .then(function () {
        if (url !== currentPreviewUrl) return;
        loadPreview(url, !!isPeriodicRetry);
      })
      .catch(function () {
        if (url !== currentPreviewUrl) return;
        if (!isPeriodicRetry) handleLoadError();
      });
    return;
  }
  // Started alongside the target fetch, not after, so both run concurrently.
  const canaryPromise = fetchCanaryText();
  fetch(url, { cache: 'no-store', credentials: 'include' })
    .then(function (res) {
      // A newer switch may supersede this fetch - ignore stale results.
      if (url !== currentPreviewUrl) return;
      if (!res.ok) {
        // widget-options can still be in flight - a guessed path only fails
        // for real once the actual mapping had a chance to load and correct it.
        // TODO: if options never arrive, this hangs - add a bounded timeout if it happens.
        if (!optionsLoaded) {
          showLoading(0);
          return;
        }
        if (!isPeriodicRetry) handleLoadError();
        return;
      }
      return res.text().then(function (text) {
        return canaryPromise.then(function (canaryText) {
          if (url !== currentPreviewUrl) return;
          if (text === canaryText) {
            if (!optionsLoaded) {
              showLoading(0);
              return;
            }
            if (!isPeriodicRetry) showPreviewUnavailable(currentRuntimeName);
            return;
          }
          loadPreview(url, !!isPeriodicRetry);
        });
      });
    })
    .catch(function () {
      if (url !== currentPreviewUrl) return;
      if (!optionsLoaded) {
        showLoading(0);
        return;
      }
      if (!isPeriodicRetry) handleLoadError();
    });
}

// Single entry point for the host's combined runtime-state message - see
// the comment on the host side (DaDashboardGrid.tsx) for why this must be
// one atomic update instead of three independently-diffed fields.
function applyRuntimeState(name, isRunning, isBusy) {
  currentRuntimeName = name;
  appRunning = isRunning;
  runtimeBusy = isBusy;

  if (!name) {
    applyPreviewForRuntimeName(null);
    return;
  }

  if (appRunning) {
    const previewVisible = el('preview-frame').style.display !== 'none';
    applyPreviewForRuntimeName(name, !previewVisible);
  } else {
    showIdleState();
  }
}

// "Idle" here means "not showing my own live preview" - split further into
// someone-else-is-running (busy) vs genuinely nothing running (empty).
function showIdleState() {
  if (runtimeBusy) showBusy(currentRuntimeName);
  else showIdle(currentRuntimeName);
}

function clearTimers() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
}

function resetFrame() {
  // must NOT clear currentPreviewUrl that is required by showError's periodic retry
  clearTimers();
  retryCount = 0;
  const frame = el('preview-frame');
  // clear stale handlers so the about:blank load cannot retrigger them
  frame.onload = null;
  frame.onerror = null;
  frame.src = 'about:blank';
}

function showOnly(id) {
  ['placeholder', 'error-state', 'busy-state', 'loading-state', 'preview-frame'].forEach(function (name) {
    const d = el(name);
    d.style.display = name === id ? (name === 'preview-frame' ? 'block' : 'flex') : 'none';
  });
}

function showLoading(attempt) {
  el('loading-text').textContent =
    attempt > 0 ? 'Waiting for connection... (' + attempt + '/' + MAX_RETRIES + ')' : 'Connecting to runtime...';
  showOnly('loading-state');
}

// Shared by every panel with a runtime-name pill (error- and busy-state).
function renderRuntimeBadge(badgeId, labelId, runtimeName) {
  const badge = el(badgeId);
  if (runtimeName) {
    el(labelId).textContent = runtimeName;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// Mechanical renderer for idle/connection-failed/unavailable; not a state transition.
function renderMessagePanel(title, subtitle, runtimeName, options) {
  resetFrame();
  showOnly('error-state');
  document.querySelector('#error-state .error-title').textContent = title;
  document.querySelector('#error-state .error-subtitle').textContent = subtitle;
  renderRuntimeBadge('error-runtime-badge', 'error-runtime-label', runtimeName);
  if (options && options.retry) startPeriodicRetry();
}

// Connection to a *running* app failed - keep retrying, it may come back.
function showError(runtimeName) {
  renderMessagePanel(
    'No application running',
    'Start your application and it will appear here automatically.',
    runtimeName,
    { retry: true },
  );
}

// Our app is running, but the computed preview URL didn't check out (see
// verifyAndLoadPreview) - unlike showError this must not retry the exact
// same guessed/misconfigured target that just failed verification.
function showPreviewUnavailable(runtimeName) {
  renderMessagePanel('App is running', 'No verified live preview is available for this runtime.', runtimeName);
}

// Nothing is running anywhere on this runtime - there is nothing to
// reconnect to, so unlike showError this must not start a retry loop.
function showIdle(runtimeName) {
  renderMessagePanel('No application running', 'Start your application and it will appear here automatically.', runtimeName);
}

// No periodic retry needed: the host pushes a fresh runtime-state
// message whenever the underlying lock actually changes.
function showBusy(runtimeName) {
  resetFrame();
  showOnly('busy-state');
  renderRuntimeBadge('busy-runtime-badge', 'busy-runtime-label', runtimeName);
}

function startPeriodicRetry() {
  if (periodicTimer) return;
  periodicTimer = setInterval(function () {
    if (!currentPreviewUrl || !currentRuntimeName) return;
    verifyAndLoadPreview(currentPreviewUrl, true);
  }, PERIODIC_RETRY_MS);
}

/**
 * Try to read the iframe body text and detect a JSON error payload.
 */
function iframeHasErrorPayload(frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow.document;
    if (!doc) return false;
    const text = (doc.body && doc.body.innerText) || '';
    const trimmed = text.trim();
    if (!trimmed.startsWith('{')) return false;
    const json = JSON.parse(trimmed);
    return !!(json.code || json.message?.toLowerCase().includes('error'));
  } catch {
    return false;
  }
}

function handleLoadError() {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    showLoading(retryCount);
    retryTimer = setTimeout(function () {
      verifyAndLoadPreview(currentPreviewUrl, false);
    }, RETRY_DELAY_MS);
  } else {
    showError(currentRuntimeName);
  }
}

function loadPreview(url, isPeriodicRetry) {
  const frame = el('preview-frame');

  frame.onload = function () {
    if (iframeHasErrorPayload(frame)) {
      if (isPeriodicRetry) return; // stay on error state, try again next interval
      handleLoadError();
    } else {
      // Success
      retryCount = 0;
      clearTimers();
      showOnly('preview-frame');
    }
  };

  frame.onerror = function () {
    if (isPeriodicRetry) return;
    handleLoadError();
  };

  // Bust cache on retries
  const bustUrl = url + (url.indexOf('?') === -1 ? '?' : '&') + '_t=' + Date.now();
  frame.src = bustUrl;
}

window.addEventListener('message', function (e) {
  // Only accept dashboard parent (same origin). Sandboxed kit posts with origin "null".
  if (e.origin !== window.location.origin) return;
  if (!e.data) return;
  let payload;
  try {
    payload = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
  } catch {
    return;
  }
  if (payload && payload.cmd === 'runtime-state') {
    applyRuntimeState(payload.runtimeName || null, !!payload.isRunning, !!payload.isBusy);
  } else if (payload && payload.cmd === 'runtime-info') {
    // Token-only companion message (autowrx: the preview proxy is auth-protected).
    if (Object.prototype.hasOwnProperty.call(payload, 'accessToken')) {
      const nextToken = payload.accessToken || null;
      if (nextToken !== accessToken) {
        accessToken = nextToken;
        // Re-apply the current state so the URL is rebuilt with the new token
        if (currentRuntimeName) {
          applyRuntimeState(currentRuntimeName, appRunning, runtimeBusy);
        }
      }
    }
  } else if (payload && payload.action === 'run-app') {
    appRunning = true;
    applyPreviewForRuntimeName(currentRuntimeName, true);
  } else if (payload && payload.action === 'stop-app') {
    appRunning = false;
    showIdleState();
  }
});

// Widget iframes remount on every run (see DaDashboardGrid.tsx's remount
// counter) - default to loading, not "no app running", so a remount mid-
// run doesn't flash a stale message before the first runtime-state arrives.
showLoading(0);
