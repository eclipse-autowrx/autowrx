import { AuthToken } from "@/types/token.type"
import { serverAxios } from "./base"

export const loginService = async (email: string, password: string) => {
  return (await serverAxios.post<AuthToken>("/auth/login", { email, password })).data
}

export const registerService = async (name: string, email: string, password: string) => {
  return (await serverAxios.post<AuthToken>("/auth/register", { name, email, password })).data
}

export const logoutService = async () => {
  return serverAxios.post("/auth/logout")
}

export const sendResetPasswordEmailService = async (email: string) => {
  return serverAxios.post("/auth/forgot-password", {
    email,
  })
}

export const resetPasswordService = async (password: string, token: string) => {
  return serverAxios.post(
    "/auth/reset-password",
    {
      password,
    },
    {
      params: {
        token,
      },
    }
  )
}
