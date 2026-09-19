import { io } from 'socket.io-client';
import { API_URL } from './api';

// API_URL se aakhri '/api' hata kar sirf root URL bana lete hain
const SOCKET_URL = API_URL.replace(/\/api\/?$/, ''); 
export const isSocketEnabled = import.meta.env.DEV;

export const socket = io(SOCKET_URL, {
  autoConnect: isSocketEnabled,
  auth: { token: localStorage.getItem('token') || '' },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  socket.auth = { token: localStorage.getItem('token') || '' };
});