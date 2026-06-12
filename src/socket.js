import { io } from 'socket.io-client';

const URL = '/';
export const socket = io(URL, {
  autoConnect: false // We will connect manually when needed
});
