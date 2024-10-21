import config from '@/configs/config'
import { io } from 'socket.io-client'
const URL = config?.runtime?.url || 'https://kit.digitalauto.tech'
// const URL = "http://localhost:3090";

export const socketio = io(URL)
