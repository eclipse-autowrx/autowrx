import axios from "axios";
import { config } from "../configs/config";
import { useUserStore } from "../store/userStore";
import { refreshTokens } from "./backend/authApi";

export const noAuthBackendAxios = axios.create({
    baseURL: config.api_url,
});

export const backendAxios = axios.create({
    baseURL: config.api_url,
    withCredentials: true,
});

export const cacheAxios = axios.create({
    baseURL: config.cacheBaseUrl,
});

// Automatically add access token to all requests
backendAxios.interceptors.request.use(
    async (apiConfig) => {
        if (!apiConfig.headers) return apiConfig;
        const accessToken = useUserStore.getState().tokens?.access.token;
        apiConfig.headers.Authorization = `Bearer ${accessToken}`;
        return apiConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Automatically refresh access token if it is expired
backendAxios.interceptors.response.use(
    (response) => {
        return response;
    },
    async function (error) {
        const originalRequest = error.config;

        // If the error is 403 and the request has not been retried yet, try to refresh the access token
        if (error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = useUserStore.getState().tokens?.refresh.token;
                if (!refreshToken) throw new Error("Refresh token not found");

                const response = await refreshTokens(refreshToken);
                const accessToken = response.data.tokens.refresh.token;
                axios.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
                return backendAxios(originalRequest);
            } catch (_) {
                console.log("Refresh token not found or invalid refresh token");
            }
        }
        return Promise.reject(error);
    }
);
