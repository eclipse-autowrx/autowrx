// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

(function () {
  var MARKER = 'E2E_PLUGIN_LOADED_OK';

  function Page(props) {
    var React = window.React;
    var data = (props && props.data) || {};
    var api = (props && props.api) || {};
    var modelName = (data.model && data.model.name) || '';
    var prototypeName = (data.prototype && data.prototype.name) || '';
    var contextLine = prototypeName
      ? 'Prototype: ' + prototypeName
      : modelName
        ? 'Model: ' + modelName
        : 'No context';

    // The plugin isn't given its own slug via props, but when it's rendered
    // as the active tab the host URL carries it as `?plugid=<slug>`.
    var ownSlug = new URLSearchParams(window.location.search).get('plugid');

    return React.createElement(
      'div',
      { 'data-testid': 'e2e-plugin-root', style: { padding: '16px' } },
      React.createElement('h1', { style: { fontSize: '20px', fontWeight: 700 } }, MARKER),
      React.createElement('p', { 'data-testid': 'e2e-plugin-context' }, contextLine),
      React.createElement(
        'button',
        {
          'data-testid': 'e2e-notify-code-tab-btn',
          onClick: function () {
            api.notifyTab && api.notifyTab('code');
          },
        },
        'Notify Code Tab',
      ),
      React.createElement(
        'button',
        {
          'data-testid': 'e2e-notify-own-tab-btn',
          onClick: function () {
            api.notifyTab && api.notifyTab('plug', ownSlug);
          },
        },
        'Notify Own Tab',
      ),
    );
  }

  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = {
    components: { Page: Page },
  };
})();
