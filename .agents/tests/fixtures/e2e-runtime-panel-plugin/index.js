// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

(function () {
  var MARKER = 'E2E_RUNTIME_PANEL_LOADED_OK';

  function Page(props) {
    var React = window.React;
    var api = (props && props.api) || {};
    var data = (props && props.data) || {};
    var stateView = React.useState('');
    var lastWriteView = React.useState('');

    // Forward widget write requests into the panel, as a real runtime plugin would.
    React.useEffect(
      function () {
        if (!api.onWidgetSignalWrite) return undefined;
        return api.onWidgetSignalWrite(function (values) {
          lastWriteView[1](JSON.stringify(values));
        });
      },
      [api.onWidgetSignalWrite],
    );

    return React.createElement(
      'div',
      { 'data-testid': 'e2e-runtime-plugin-root', style: { width: '320px', padding: '8px' } },
      React.createElement('h1', null, MARKER),
      React.createElement('p', { 'data-testid': 'e2e-runtime-can-run' }, 'canRun: ' + String(!!data.canRun)),
      React.createElement('p', { 'data-testid': 'e2e-runtime-remount' }, 'remountWidgets: ' + typeof api.remountWidgets),
      React.createElement(
        'button',
        {
          'data-testid': 'e2e-runtime-set-state-btn',
          onClick: function () {
            api.setRuntimeState({ apisValue: { 'Vehicle.Speed': 42 }, isAppRunning: true });
            var state = api.getRuntimeState();
            stateView[1](JSON.stringify({ apisValue: state.apisValue, isAppRunning: state.isAppRunning }));
          },
        },
        'Set State',
      ),
      React.createElement('p', { 'data-testid': 'e2e-runtime-state' }, stateView[0]),
      React.createElement('p', { 'data-testid': 'e2e-runtime-last-write' }, lastWriteView[0]),
    );
  }

  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = {
    components: { Page: Page },
  };
})();
