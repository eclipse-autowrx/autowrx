import { User } from './user.type'

export type Discussion = {
  content: string
  created_at: Date
  created_by: User
  id: string
  ref: string
  ref_type: string
  parent: string
  children?: Discussion[]
}
