import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config';
import { setupSocketHandlers } from './socket';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared/types';

const app = express();
const server = http.createServer(app);

// CORS 設定
app.use(cors());
app.use(express.json());

// Socket.io セットアップ
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Socket ハンドラ登録
setupSocketHandlers(io);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'OMMF Server',
    timestamp: new Date().toISOString(),
  });
});

// サーバー起動
server.listen(config.port, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║                                           ║');
  console.log('  ║    🏋️  OMMF SERVER IS READY 🏋️            ║');
  console.log('  ║    One More Mutha Fker                    ║');
  console.log(`  ║    Port: ${config.port}                            ║`);
  console.log('  ║                                           ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
  console.log(`  📡 WebSocket: ws://localhost:${config.port}`);
  console.log(`  🩺 Health:    http://localhost:${config.port}/health`);
  console.log('');
});

export { io };
