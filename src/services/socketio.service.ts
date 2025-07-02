// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import config from '@/configs/config'
import { io } from 'socket.io-client'
const URL = config?.runtime?.url || 'https://kit.digitalauto.tech'
// const URL = "http://localhost:3090";

export const socketio = io(URL)
