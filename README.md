# 🏋️ OMMF — One More Mutha Fker

> 筋トレの限界突破（ラスト1レップ）を支える、完全無料のジム内リアルタイム補助マッチングアプリ

## 🚀 Quick Start

### Prerequisites

- Node.js v20+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### 1. Start Infrastructure

```bash
# PostgreSQL + Redis を起動
docker compose up -d
```

### 2. Start Server

```bash
cd server
npm install
npx prisma db push    # DB スキーマ適用
npm run dev            # 開発サーバー起動 (port 3000)
```

### 3. Start Client

```bash
cd client
npm install
npx expo start         # Expo 開発サーバー起動
```

iOS Simulator: `i` キーを押す  
Android Emulator: `a` キーを押す  
Web: `w` キーを押す

## 📱 Screens

| Screen | Description |
|--------|-------------|
| **Disclaimer** | 免責同意画面。初回起動時に表示 |
| **Home (SOS)** | レーダー表示、種目・重量入力、HELP ME ボタン |
| **Matching** | SOS発信中/マッチング成立/補助完了の状態遷移 |
| **Profile** | レベル、EXP、総補助回数、称号表示 |

## 🏗️ Architecture

```
OMMF/
├── client/          # Expo React Native (iOS/Android/Web)
├── server/          # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── socket/  # Socket.io Event Handlers
│   │   └── services/ # Business Logic
│   └── prisma/      # Database Schema
├── shared/          # Shared Type Definitions
└── docker-compose.yml
```

### Tech Stack

- **Frontend**: React Native (Expo SDK 52) + Expo Router
- **State**: Zustand
- **Realtime**: Socket.io
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (GEO spatial queries + SETNX race condition handling)

### Key Design Decisions

1. **SETNX排他制御**: 複数ヘルパーの同時タップ（レースコンディション）を Redis の SETNX でロック
2. **Redis GEO**: 半径50m以内のユーザー検索を GEORADIUS でインメモリ高速処理
3. **型共有**: `shared/types.ts` でフロント・バック間の Socket.io イベント型を共有

## 📄 License

MIT
