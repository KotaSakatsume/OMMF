import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://ommf:ommf_dev_pass@localhost:5432/ommf',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  matchRadiusMeters: parseInt(process.env.MATCH_RADIUS_METERS || '50', 10),
  matchExpireSeconds: parseInt(process.env.MATCH_EXPIRE_SECONDS || '300', 10),
  locationTtlSeconds: 300, // 5 minutes
  activeTtlSeconds: 300,   // 5 minutes
};
