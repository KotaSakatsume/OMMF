import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { MatchInfo, MatchStatus } from '../../../shared/types';

const redis = new Redis(config.redisUrl);
const prisma = new PrismaClient();

export class MatchingService {
  /**
   * マッチングリクエスト（SOS）を作成
   */
  async createMatch(
    requesterId: string,
    requesterName: string,
    exercise: string,
    weight: number
  ): Promise<MatchInfo> {
    const matchId = uuidv4();

    // Redis に進行中マッチング情報を保存
    const matchData: Record<string, string> = {
      matchId,
      requesterId,
      requesterName,
      exercise,
      weight: weight.toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await redis.hmset(`match:pending:${matchId}`, matchData);
    await redis.expire(`match:pending:${matchId}`, config.matchExpireSeconds);

    // PostgreSQL にもログ保存
    await prisma.matchLog.create({
      data: {
        id: matchId,
        requesterId,
        exercise,
        weight,
        status: 'pending',
      },
    });

    console.log(`[MatchingService] Match created: ${matchId} by ${requesterName} - ${exercise} ${weight}kg`);

    return {
      matchId,
      requesterId,
      requesterName,
      exercise,
      weight,
      status: 'pending',
      createdAt: matchData.createdAt,
    };
  }

  /**
   * マッチングを受諾（排他制御: SETNX）
   * 一番早かった1名のみがマッチング成立
   */
  async acceptMatch(
    matchId: string,
    helperId: string,
    helperName: string
  ): Promise<{ success: boolean; matchInfo?: MatchInfo }> {
    // SETNX による排他制御（ロック取得）
    const lockKey = `match:lock:${matchId}`;
    const lockAcquired = await redis.set(lockKey, helperId, 'EX', 30, 'NX');

    if (!lockAcquired) {
      // 別のヘルパーが先に受諾済み
      console.log(`[MatchingService] Match ${matchId} already taken. ${helperName} was too slow.`);
      return { success: false };
    }

    // マッチング情報を更新
    const matchData = await redis.hgetall(`match:pending:${matchId}`);
    if (!matchData || !matchData.requesterId) {
      console.log(`[MatchingService] Match ${matchId} not found or expired.`);
      return { success: false };
    }

    // ヘルパーが依頼者自身でないかチェック
    if (matchData.requesterId === helperId) {
      console.log(`[MatchingService] Requester cannot accept their own match.`);
      await redis.del(lockKey);
      return { success: false };
    }

    // Redis 更新
    await redis.hmset(`match:pending:${matchId}`, {
      status: 'matched',
      helperId,
      helperName,
    });

    // PostgreSQL 更新
    await prisma.matchLog.update({
      where: { id: matchId },
      data: {
        helperId,
        status: 'matched',
      },
    });

    console.log(`[MatchingService] Match ${matchId} accepted by ${helperName}!`);

    return {
      success: true,
      matchInfo: {
        matchId,
        requesterId: matchData.requesterId,
        requesterName: matchData.requesterName,
        exercise: matchData.exercise,
        weight: parseFloat(matchData.weight),
        status: 'matched',
        helperId,
        helperName,
        createdAt: matchData.createdAt,
      },
    };
  }

  /**
   * マッチング完了（ナイス補助）
   */
  async completeMatch(matchId: string): Promise<{
    success: boolean;
    helperId?: string;
  }> {
    const matchData = await redis.hgetall(`match:pending:${matchId}`);
    if (!matchData || matchData.status !== 'matched') {
      return { success: false };
    }

    // Redis 更新
    await redis.hmset(`match:pending:${matchId}`, { status: 'completed' });
    await redis.expire(`match:pending:${matchId}`, 60); // 完了後1分で削除

    // PostgreSQL 更新
    await prisma.matchLog.update({
      where: { id: matchId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    console.log(`[MatchingService] Match ${matchId} completed! Helper: ${matchData.helperName}`);

    return {
      success: true,
      helperId: matchData.helperId,
    };
  }

  /**
   * マッチングキャンセル
   */
  async cancelMatch(matchId: string, userId: string): Promise<boolean> {
    const matchData = await redis.hgetall(`match:pending:${matchId}`);
    if (!matchData || matchData.requesterId !== userId) {
      return false;
    }

    await redis.del(`match:pending:${matchId}`);
    await redis.del(`match:lock:${matchId}`);

    await prisma.matchLog.update({
      where: { id: matchId },
      data: { status: 'cancelled' },
    });

    return true;
  }
}

export const matchingService = new MatchingService();
