import { io, Socket } from "socket.io-client";


const WS_URL =
  (process.env as any)?.REACT_APP_WS_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
  }
  return socket;
}
