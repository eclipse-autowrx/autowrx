// GitHub type definitions
export interface GitHubIssue {
  id: number
  title: string
  body: string
  state: string
  created_at: string
  updated_at: string
}

export interface GithubUser {
  id: string
  login: string
  avatar_url: string
  html_url: string
}
