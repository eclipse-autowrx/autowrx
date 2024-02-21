export const config = {
    api_url:
        (import.meta.env.BACKEND_API_HOSTNAME || "http://localhost:8080/") +
        (import.meta.env.BACKEND_API_VERSION || "v1/"),
};
