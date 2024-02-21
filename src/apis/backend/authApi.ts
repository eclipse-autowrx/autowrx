import { noAuthBackendAxios } from "../axios";

const route = "auth";

export type User = {
    id: string;
    name: string;
    email: string;
    is_email_verified: boolean;
    tenant_id: string;
    is_system_admin: boolean;
};

export type Tokens = {
    access: {
        token: string;
        expires: Date;
    };
    refresh: {
        token: string;
        expires: Date;
    };
};

export const refreshTokens = async (refreshToken: string) =>
    noAuthBackendAxios.post<{ tokens: Tokens; user: User }>(`${route}/refresh-tokens`, {
        refreshToken,
    });
