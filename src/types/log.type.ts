export type ActivityLog = {
  _id: string
  id: string
  name: string
  type: string
  create_by: string
  created_time: string
  origin: string
  ref_type?: string
  ref_id?: string
  parent_id?: string
  project_id?: string
  image?: string
  description?: string
}

export type CreateActivityLog = Omit<
  ActivityLog,
  '_id' | 'id' | 'created_time' | 'origin'
>
