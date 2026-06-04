import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

// 開発環境用の動的なURL解決
const getDevServerUrl = () => {
  // シミュレーター/エミュレーターの場合 (localhostの代わりに127.0.0.1を使用してDNS解決問題を回避)
  if (!Device.isDevice) {
    console.log('[Socket] Running on Simulator, using 127.0.0.1 / 10.0.2.2');
    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://127.0.0.1:3000';
  }

  // 実機テストの場合、Expoの開発サーバーのIPを自動取得
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    console.log(`[Socket] Running on Physical Device, detected Expo host: ${ip}`);
    return `http://${ip}:3000`;
  }

  // 自動取得に失敗した場合のフォールバックIP
  console.log('[Socket] Fallback to hardcoded IP: 192.168.3.9');
  return 'http://192.168.3.9:3000';
};

const SERVER_URL = __DEV__ 
  ? getDevServerUrl()
  : 'https://ommf-api.example.com';

console.log('[Socket] Connecting to server:', SERVER_URL);

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['polling', 'websocket'], // pollingから開始してwebsocketにアップグレード (接続性向上)
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection warning (retrying):', error.message);
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
