import { io } from 'socket.io-client';
import { API_URL } from './api';

// API_URL se aakhri '/api' hata kar sirf root URL bana lete hain
const SOCKET_URL = API_URL.replace(/\/api\/?$/, ''); 

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'], // yeh add karna zaroori hai taake Vercel par connection stable rahe
});