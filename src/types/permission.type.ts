export type Permission =
  | 'createUnlimitedModel'
  | 'viewModel'
  | 'updateModel'
  | 'createPrototype'
  | 'viewPrototype'
  | 'updatePrototype'
  | 'manageUsers'

export interface CheckPermissionResponse {
  hasPermission: boolean
}
