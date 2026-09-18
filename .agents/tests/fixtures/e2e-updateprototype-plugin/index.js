(function () {
  var MARKER = 'E2E_PLUGIN_LOADED_OK';

  function Page(props) {
    var React = window.React;
    var useState = React.useState;
    var data = (props && props.data) || {};
    var api = (props && props.api) || {};
    var modelName = (data.model && data.model.name) || '';
    var prototypeName = (data.prototype && data.prototype.name) || '';
    var contextLine = prototypeName
      ? 'Prototype: ' + prototypeName
      : modelName
        ? 'Model: ' + modelName
        : 'No context';

    var statusState = useState('idle');
    var status = statusState[0];
    var setStatus = statusState[1];

    function callUpdate(options) {
      setStatus('pending');
      var updates = { description: 'updated-' + Date.now() };
      Promise.resolve()
        .then(function () {
          return api.updatePrototype(updates, options);
        })
        .then(function () {
          setStatus('done');
        })
        .catch(function () {
          setStatus('error');
        });
    }

    return React.createElement(
      'div',
      { 'data-testid': 'e2e-plugin-root', style: { padding: '16px' } },
      React.createElement('h1', { style: { fontSize: '20px', fontWeight: 700 } }, MARKER),
      React.createElement('p', { 'data-testid': 'e2e-plugin-context' }, contextLine),
      React.createElement(
        'button',
        {
          'data-testid': 'e2e-update-silent-btn',
          onClick: function () {
            callUpdate(undefined);
          },
        },
        'Update Silent',
      ),
      React.createElement(
        'button',
        {
          'data-testid': 'e2e-update-verbose-btn',
          onClick: function () {
            callUpdate({ silent: false });
          },
        },
        'Update Verbose',
      ),
      React.createElement('p', { 'data-testid': 'e2e-update-status' }, status),
    );
  }

  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = {
    components: { Page: Page },
  };
})();
