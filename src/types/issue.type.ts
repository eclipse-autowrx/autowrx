export interface IssueCreate {
  extendedApi: string
  title: string
  githubAccessToken: string
  content?: string
  model: string
}

export interface Issue {
  id: string
  extendedApi: string
  createdAt: string
  link: string
  updatedAt: string
}
