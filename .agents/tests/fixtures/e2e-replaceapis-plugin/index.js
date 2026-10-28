// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

(function () {
  var MARKER = 'E2E_PLUGIN_LOADED_OK';
  var VSS = {
    Vehicle: {
      type: 'branch',
      description: 'E2E replaceAPIs fixture',
      children: {
        E2EPluginSignal: {
          type: 'sensor',
          datatype: 'float',
          description: 'Signal written by the replaceAPIs plugin test',
        },
      },
    },
  };

  function Page(props) {
    var React = window.React;
    var api = (props && props.api) || {};
    var data = (props && props.data) || {};
    var modelName = (data.model && data.model.name) || '';
    var statusState = React.useState('idle');
    var status = statusState[0];
    var setStatus = statusState[1];

    // Uploads a small VSS file, then replaces the model's Vehicle API with it.
    function replace() {
      setStatus('pending');
      Promise.resolve()
        .then(function () {
          var file = new File([JSON.stringify(VSS)], 'e2e-replaceapis.json', {
            type: 'application/json',
          });
          return api.uploadFile(file);
        })
        .then(function (uploaded) {
          return api.replaceAPIs(uploaded.url);
        })
        .then(function () {
          setStatus('done');
        })
        .catch(function (e) {
          setStatus('error:' + ((e && e.message) || String(e)));
        });
    }

    return React.createElement(
      'div',
      { 'data-testid': 'e2e-plugin-root', style: { padding: '16px' } },
      React.createElement('h1', { style: { fontSize: '20px', fontWeight: 700 } }, MARKER),
      React.createElement('p', { 'data-testid': 'e2e-plugin-context' }, 'Model: ' + modelName),
      React.createElement(
        'button',
        { 'data-testid': 'e2e-replace-btn', onClick: replace },
        'Replace Vehicle API',
      ),
      React.createElement('p', { 'data-testid': 'e2e-replace-status' }, status),
    );
  }

  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = {
    components: { Page: Page },
  };
})();
