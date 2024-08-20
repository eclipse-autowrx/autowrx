import { io } from "socket.io-client";
const URL = "https://kit.digitalauto.tech";
// const URL = "http://localhost:3090";

export const socketio = io(URL);