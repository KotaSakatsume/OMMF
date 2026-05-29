import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redisUrl);

const GEO_KEY = 'ommf:locations';

export class LocationService {
  /**
   * ユーザーのGPS座標をRedis GEOに保存
   */
  async updateLocation(userId: string, lat: number, lng: number): Promise<void> {
    // GEOADD で座標を保存
    await redis.geoadd(GEO_KEY, lng, lat, userId);
    // アクティブフラグ設定（TTL付き）
    await redis.setex(`user:active:${userId}`, config.activeTtlSeconds, '1');
  }

  /**
   * 指定座標から半径N メートル以内のアクティブユーザーを検索
   */
  async findNearbyUsers(lat: number, lng: number, radiusMeters: number): Promise<string[]> {
    // GEORADIUS で近くのユーザーIDを取得
    const results = await redis.georadius(
      GEO_KEY,
      lng,
      lat,
      radiusMeters,
      'm' // メートル単位
    );

    // アクティブなユーザーのみフィルタ
    const activeUsers: string[] = [];
    for (const userId of results) {
      const isActive = await redis.exists(`user:active:${userId}`);
      if (isActive) {
        activeUsers.push(userId as string);
      }
    }

    return activeUsers;
  }

  /**
   * 周辺のアクティブユーザー数を返す（自分を除く）
   */
  async getNearbyCount(userId: string, lat: number, lng: number): Promise<number> {
    const nearbyUsers = await this.findNearbyUsers(lat, lng, config.matchRadiusMeters);
    return nearbyUsers.filter(id => id !== userId).length;
  }

  /**
   * ユーザーの位置情報を削除（非アクティブ化）
   */
  async removeUser(userId: string): Promise<void> {
    await redis.zrem(GEO_KEY, userId);
    await redis.del(`user:active:${userId}`);
  }
}

export const locationService = new LocationService();
