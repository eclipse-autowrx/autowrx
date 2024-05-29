export type Token = {
  token: string
  expires: Date
}

export type AuthToken = {
  access: Token
  tokens: any
}
