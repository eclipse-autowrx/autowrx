// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'

type SocketState = {
  socket: Map<string, Socket>
}

type SocketActions = {
  getSocketIO: (url: string, accessToken?: string) => Socket | null
}

const useSocketStore = create<SocketState & SocketActions>()((set, get) => ({
  socket: new Map(),
  getSocketIO(url, accessToken) {
    if (get().socket.has(url)) {
      return get().socket.get(url) as Socket
    }
    try {
      const socket = io(url, {
        query: {
          access_token: accessToken,
        },
        transports: ['websocket'],
      })
      set((state) => {
        const newSocket = new Map(state.socket)
        newSocket.set(url, socket)
        return { socket: newSocket }
      })
      return socket
    } catch (error) {
      console.error('Error connecting socket:', error)
      return null
    }
  },
}))

export default useSocketStore
