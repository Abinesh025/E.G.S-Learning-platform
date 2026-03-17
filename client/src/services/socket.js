import { io } from 'socket.io-client'

let socket = null

export const getSocket = (token) => {
  if (!socket) {
    socket = io('/', {
      auth: { token },
      autoConnect: true,
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
