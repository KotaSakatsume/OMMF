import { Server, Socket } from 'socket.io';
import { locationService } from '../services/locationService';
import { matchingService } from '../services/matchingService';
import { userService } from '../services/userService';
import { config } from '../config';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../../shared/types';

// ユーザーID ↔ SocketID のマッピング
const userSocketMap = new Map<string, string>(); // userId -> socketId
const socketUserMap = new Map<string, string>(); // socketId -> userId
const userLocations = new Map<string, { lat: number; lng: number }>(); // userId -> location

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ========================================
    // ユーザー登録（匿名ログイン）
    // ========================================
    socket.on('user:register', async (data) => {
      try {
        const profile = await userService.findOrCreateByDeviceId(data.deviceId);
        
        // マッピング更新
        userSocketMap.set(profile.id, socket.id);
        socketUserMap.set(socket.id, profile.id);

        socket.emit('user:registered', profile);
        console.log(`[Socket] User registered: ${profile.id} (${profile.displayName})`);
      } catch (error) {
        console.error('[Socket] user:register error:', error);
        socket.emit('error', { message: 'Failed to register user' });
      }
    });

    // ========================================
    // ユーザー名更新
    // ========================================
    socket.on('user:update_name', async (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;
      try {
        const profile = await userService.updateDisplayName(userId, data.displayName);
        socket.emit('user:registered', profile);
      } catch (error) {
        console.error('[Socket] user:update_name error:', error);
      }
    });

    // ========================================
    // 位置情報更新
    // ========================================
    socket.on('location:update', async (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      try {
        await locationService.updateLocation(userId, data.lat, data.lng);
        userLocations.set(userId, { lat: data.lat, lng: data.lng });

        // 周辺ユーザー数を返す
        const count = await locationService.getNearbyCount(userId, data.lat, data.lng);
        socket.emit('nearby:count', { count });
      } catch (error) {
        console.error('[Socket] location:update error:', error);
      }
    });

    // ========================================
    // SOS発信（マッチングリクエスト）
    // ========================================
    socket.on('match:request', async (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      const location = userLocations.get(userId);
      if (!location) {
        socket.emit('error', { message: 'Location not available. Enable GPS.' });
        return;
      }

      try {
        const profile = await userService.getProfile(userId);
        const matchInfo = await matchingService.createMatch(
          userId,
          profile.displayName,
          data.exercise,
          data.weight
        );

        // 半径50m以内の全アクティブユーザーにSOS送信
        const nearbyUsers = await locationService.findNearbyUsers(
          location.lat,
          location.lng,
          config.matchRadiusMeters
        );

        let notifiedCount = 0;
        for (const nearbyUserId of nearbyUsers) {
          if (nearbyUserId === userId) continue; // 自分には送らない
          
          const targetSocketId = userSocketMap.get(nearbyUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('match:sos', matchInfo);
            notifiedCount++;
          }
        }

        console.log(`[Socket] SOS sent to ${notifiedCount} users nearby`);
      } catch (error) {
        console.error('[Socket] match:request error:', error);
        socket.emit('error', { message: 'Failed to create match request' });
      }
    });

    // ========================================
    // マッチング受諾（「俺が行く」）
    // ========================================
    socket.on('match:accept', async (data) => {
      const helperId = socketUserMap.get(socket.id);
      if (!helperId) return;

      try {
        const helperProfile = await userService.getProfile(helperId);
        const result = await matchingService.acceptMatch(
          data.matchId,
          helperId,
          helperProfile.displayName
        );

        if (result.success && result.matchInfo) {
          // ヘルパーに成功通知
          socket.emit('match:accepted', {
            matchId: data.matchId,
            helperId,
            helperName: helperProfile.displayName,
          });

          // 依頼者に「〇〇 IS COMING」通知
          const requesterSocketId = userSocketMap.get(result.matchInfo.requesterId);
          if (requesterSocketId) {
            io.to(requesterSocketId).emit('match:accepted', {
              matchId: data.matchId,
              helperId,
              helperName: helperProfile.displayName,
            });
          }
        } else {
          // 既に他のヘルパーが受諾済み
          socket.emit('match:already_taken', { matchId: data.matchId });
        }
      } catch (error) {
        console.error('[Socket] match:accept error:', error);
        socket.emit('error', { message: 'Failed to accept match' });
      }
    });

    // ========================================
    // マッチング完了（「ナイス補助」）
    // ========================================
    socket.on('match:complete', async (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      try {
        const result = await matchingService.completeMatch(data.matchId);

        if (result.success && result.helperId) {
          // ヘルパーにEXP付与
          const expResult = await userService.awardExp(result.helperId);

          // ヘルパーに完了＆EXP通知
          const helperSocketId = userSocketMap.get(result.helperId);
          if (helperSocketId) {
            io.to(helperSocketId).emit('match:completed', {
              matchId: data.matchId,
              ...expResult,
            });
          }

          // 依頼者にも完了通知
          socket.emit('match:completed', {
            matchId: data.matchId,
            exp: 0,
            newTotalExp: 0,
            level: 0,
            title: '',
            totalSpots: 0,
          });
        }
      } catch (error) {
        console.error('[Socket] match:complete error:', error);
        socket.emit('error', { message: 'Failed to complete match' });
      }
    });

    // ========================================
    // マッチングキャンセル
    // ========================================
    socket.on('match:cancel', async (data) => {
      const userId = socketUserMap.get(socket.id);
      if (!userId) return;

      try {
        const cancelled = await matchingService.cancelMatch(data.matchId, userId);
        if (cancelled) {
          socket.emit('match:cancelled', { matchId: data.matchId });
        }
      } catch (error) {
        console.error('[Socket] match:cancel error:', error);
      }
    });

    // ========================================
    // 切断処理
    // ========================================
    socket.on('disconnect', async () => {
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        await locationService.removeUser(userId);
        userSocketMap.delete(userId);
        userLocations.delete(userId);
      }
      socketUserMap.delete(socket.id);
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}
