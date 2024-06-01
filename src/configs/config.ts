export default {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  studioUrl: 'https://studio.digital.auto',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget'
}
