import { CreateActivityLog } from '@/types/log.type'
import { logAxios } from './base'

export const addLog = async (message: CreateActivityLog) => {
  return (await logAxios.post('/', message)).data
}
