import { GithubUser } from '@/types/github.type'
import axios from 'axios'

export const getGithubCurrentUser = async (accessToken: string) => {
  return (
    await axios.get<GithubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).data
}
