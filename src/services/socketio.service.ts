import { io } from "socket.io-client";
const URL = "https://kit.digitalauto.tech";

export const socketio = io(URL);