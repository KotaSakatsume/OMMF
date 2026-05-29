import { PrismaClient } from '@prisma/client';
import { calculateLevel, getTitle, EXP_PER_SPOT } from '../../../shared/types';

const prisma = new PrismaClient();

export class UserService {
  /**
   * デバイスIDでユーザーを検索、なければ新規作成（匿名ログイン）
   */
  async findOrCreateByDeviceId(deviceId: string) {
    let user = await prisma.user.findUnique({
      where: { deviceId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          deviceId,
          displayName: `Lifter_${deviceId.slice(-6).toUpperCase()}`,
        },
      });
      console.log(`[UserService] New user created: ${user.id} (${user.displayName})`);
    }

    return {
      id: user.id,
      displayName: user.displayName,
      level: user.level,
      exp: user.exp,
      totalSpots: user.totalSpots,
      title: user.title,
    };
  }

  /**
   * ヘルパーにEXPを付与し、レベルと称号を更新
   */
  async awardExp(userId: string): Promise<{
    exp: number;
    newTotalExp: number;
    level: number;
    title: string;
    totalSpots: number;
  }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newExp = user.exp + EXP_PER_SPOT;
    const newLevel = calculateLevel(newExp);
    const newTitle = getTitle(newLevel);
    const newTotalSpots = user.totalSpots + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        exp: newExp,
        level: newLevel,
        title: newTitle,
        totalSpots: newTotalSpots,
      },
    });

    return {
      exp: EXP_PER_SPOT,
      newTotalExp: newExp,
      level: newLevel,
      title: newTitle,
      totalSpots: newTotalSpots,
    };
  }

  /**
   * ユーザープロフィール取得
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      displayName: user.displayName,
      level: user.level,
      exp: user.exp,
      totalSpots: user.totalSpots,
      title: user.title,
    };
  }

  /**
   * ユーザー名変更
   */
  async updateDisplayName(userId: string, displayName: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });
    return {
      id: user.id,
      displayName: user.displayName,
      level: user.level,
      exp: user.exp,
      totalSpots: user.totalSpots,
      title: user.title,
    };
  }
}

export const userService = new UserService();
