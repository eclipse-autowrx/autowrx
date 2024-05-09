export const config = {
    api_url:
        (import.meta.env.BACKEND_API_HOSTNAME || "http://localhost:8080/") +
        (import.meta.env.BACKEND_API_VERSION || "v1/"),
    cacheBaseUrl: import.meta.env.VITE_CACHE_BASE_URL || "https://cache.digitalauto.tech",
    logBaseUrl: import.meta.env.VITE_LOG_BASE_URL || "https://logs.digitalauto.tech",
};
