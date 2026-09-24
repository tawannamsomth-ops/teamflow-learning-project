'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001/realtime';

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('tf_token');
  if (!token) return null;
  if (!socket) {
    socket = io(WS_URL, { auth: { token }, autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
