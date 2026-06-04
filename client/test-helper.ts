import { io } from 'socket.io-client';

const SERVER_URL = 'http://127.0.0.1:3000';
console.log('🔌 Connecting mock helper to:', SERVER_URL);

const socket = io(SERVER_URL, {
  transports: ['websocket'],
});

const deviceId = 'mock_helper_device_999';

// iOSシミュレーターのデフォルト位置情報（Apple本社: Infinite Loop）
// シミュレーターとマッチングさせるため、同じ座標を設定します
const LAT = 37.33182;
const LNG = -122.03118;

socket.on('connect', () => {
  console.log('✅ Mock Helper Connected! Socket ID:', socket.id);
  
  // ユーザー登録
  socket.emit('user:register', { deviceId });
});

socket.on('user:registered', (profile) => {
  console.log(`👤 Registered as: ${profile.displayName} (Lv.${profile.level})`);
  
  // 無限ループを防ぐため、名前がすでに変更されている場合は更新しない
  if (profile.displayName !== 'Mock Helper Bro 💪') {
    socket.emit('user:update_name', { displayName: 'Mock Helper Bro 💪' });
  }
  
  // シミュレーターと同じ位置情報を送信（30m以内に配置）
  console.log(`📍 Updating location to Apple HQ (${LAT}, ${LNG})...`);
  socket.emit('location:update', { lat: LAT, lng: LNG });
});

socket.on('nearby:count', ({ count }) => {
  console.log(`👥 Nearby active users count: ${count}`);
  console.log('⏳ Waiting for SOS alerts from the app...');
});

// SOS（マッチングリクエスト）受信時の処理
socket.on('match:sos', (matchInfo) => {
  console.log('\n🚨 ====== NEW SOS ALERT RECEIVED ====== 🚨');
  console.log(`👤 Requester : ${matchInfo.requesterName}`);
  console.log(`🏋️ Exercise  : ${matchInfo.exercise}`);
  console.log(`⚖️ Weight    : ${matchInfo.weight} KG`);
  console.log(`🏢 Gym Name  : ${matchInfo.gymName || 'N/A'}`);
  console.log('=========================================');
  
  // 2秒後に自動でSOSを受け入れる（マッチング成立）
  console.log('🤖 Auto-accepting SOS in 2 seconds...');
  setTimeout(() => {
    console.log('🤝 Accepting match...');
    socket.emit('match:accept', { matchId: matchInfo.matchId });
  }, 2000);
});

// マッチング成立時
socket.on('match:accepted', (data) => {
  console.log(`🎉 Match established! Connected to Requester.`);
  
  // チャットメッセージの自動送信シミュレーション
  setTimeout(() => {
    console.log('💬 Sending chat message...');
    socket.emit('match:message', { matchId: data.matchId, message: '向かってます 🏃‍♂️' });
  }, 4000);

  setTimeout(() => {
    console.log('💬 Sending chat message...');
    socket.emit('match:message', { matchId: data.matchId, message: '到着しました 👋' });
  }, 8000);
});

// チャット受信
socket.on('match:chat', (chat) => {
  console.log(`💬 [Chat] ${chat.senderName}: ${chat.message}`);
});

// 完了時
socket.on('match:completed', () => {
  console.log('\n🏆 Match successfully completed! Helper earned EXP! 🏆\n');
  process.exit(0);
});

// キャンセル時
socket.on('match:cancelled', () => {
  console.log('❌ Match was cancelled by requester.');
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});
