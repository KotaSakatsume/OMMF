// ========================================
// OMMF Shared Types
// Client ↔ Server 共有型定義
// ========================================

// --- User ---
export interface UserProfile {
  id: string;
  displayName: string;
  level: number;
  exp: number;
  totalSpots: number;
  title: string;
}

// --- Match ---
export type MatchStatus = 'pending' | 'matched' | 'completed' | 'expired' | 'cancelled';

export interface MatchRequest {
  exercise: string;
  weight: number;
  gymName?: string;
}

export interface MatchInfo {
  matchId: string;
  requesterId: string;
  requesterName: string;
  exercise: string;
  weight: number;
  status: MatchStatus;
  helperId?: string;
  helperName?: string;
  createdAt: string;
  gymName?: string;
}

// --- Socket Events: Client → Server ---
export interface ClientToServerEvents {
  'location:update': (data: { lat: number; lng: number }) => void;
  'match:request': (data: MatchRequest) => void;
  'match:accept': (data: { matchId: string }) => void;
  'match:complete': (data: { matchId: string }) => void;
  'match:cancel': (data: { matchId: string }) => void;
  'match:message': (data: { matchId: string; message: string }) => void;
  'user:register': (data: { deviceId: string }) => void;
  'user:update_name': (data: { displayName: string }) => void;
}

// --- Socket Events: Server → Client ---
export interface ServerToClientEvents {
  'nearby:count': (data: { count: number }) => void;
  'match:sos': (data: MatchInfo) => void;
  'match:accepted': (data: { matchId: string; helperId: string; helperName: string }) => void;
  'match:already_taken': (data: { matchId: string }) => void;
  'match:completed': (data: { matchId: string; exp: number; newTotalExp: number; level: number; title: string; totalSpots: number }) => void;
  'match:expired': (data: { matchId: string }) => void;
  'match:cancelled': (data: { matchId: string }) => void;
  'match:chat': (data: { matchId: string; senderId: string; senderName: string; message: string }) => void;
  'user:registered': (data: UserProfile) => void;
  'error': (data: { message: string }) => void;
}

// --- Location ---
export interface GeoLocation {
  lat: number;
  lng: number;
}

// --- Level/Title System ---
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2100,
  8: 2800,
  9: 3600,
  10: 4500,
  11: 5500,
  12: 6600,
  13: 7800,
  14: 9100,
  15: 10500,
  16: 12000,
  17: 13600,
  18: 15300,
  19: 17100,
  20: 19000,
};

export const TITLES: Record<number, string> = {
  1: 'Novice Spotter',
  3: 'Gym Bro',
  5: 'Iron Guardian',
  8: 'Beast Protector',
  10: 'Legendary Spotter',
  13: 'Mutha Fkin Hero',
  15: 'God of Spots',
  18: 'OMMF Legend',
  20: 'The Final Boss',
};

export const EXP_PER_SPOT = 50;

export function calculateLevel(exp: number): number {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(LEVEL_THRESHOLDS)) {
    if (exp >= threshold) {
      level = parseInt(lvl);
    }
  }
  return level;
}

export function getTitle(level: number): string {
  let title = 'Novice Spotter';
  for (const [lvl, t] of Object.entries(TITLES)) {
    if (level >= parseInt(lvl)) {
      title = t;
    }
  }
  return title;
}
