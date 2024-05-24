import { User } from "@/types/user.type"
import { serverAxios } from "./base"

export const getSelfService = async () => {
  return (await serverAxios.get<User>("/users/self")).data
}
