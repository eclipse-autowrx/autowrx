(function () {
  var MARKER = 'E2E_PLUGIN_LOADED_OK';

  function Page(props) {
    var React = window.React;
    var data = (props && props.data) || {};
    var modelName = (data.model && data.model.name) || '';
    var prototypeName = (data.prototype && data.prototype.name) || '';
    var contextLine = prototypeName
      ? 'Prototype: ' + prototypeName
      : modelName
        ? 'Model: ' + modelName
        : 'No context';

    return React.createElement(
      'div',
      { 'data-testid': 'e2e-plugin-root', style: { padding: '16px' } },
      React.createElement('h1', { style: { fontSize: '20px', fontWeight: 700 } }, MARKER),
      React.createElement('p', { 'data-testid': 'e2e-plugin-context' }, contextLine),
    );
  }

  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = {
    components: { Page: Page },
  };
})();
