import { create } from 'zustand';
import { UserProfile, MatchInfo, MatchStatus } from '../../shared/types';

// ========================================
// User Store
// ========================================
interface UserState {
  profile: UserProfile | null;
  isRegistered: boolean;
  hasAgreedDisclaimer: boolean;
  setProfile: (profile: UserProfile) => void;
  setAgreedDisclaimer: (agreed: boolean) => void;
  updateExp: (exp: number, level: number, title: string, totalSpots: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isRegistered: false,
  hasAgreedDisclaimer: false,
  setProfile: (profile) => set({ profile, isRegistered: true }),
  setAgreedDisclaimer: (agreed) => set({ hasAgreedDisclaimer: agreed }),
  updateExp: (exp, level, title, totalSpots) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, exp, level, title, totalSpots }
        : null,
    })),
  reset: () => set({ profile: null, isRegistered: false, hasAgreedDisclaimer: false }),
}));

// ========================================
// Match Store
// ========================================
interface MatchState {
  // 現在のマッチング状態
  currentMatch: MatchInfo | null;
  matchStatus: 'idle' | 'requesting' | 'waiting' | 'matched' | 'completed';
  
  // SOSとして受信したマッチング（ヘルパー側）
  incomingSOS: MatchInfo | null;
  
  // 近くのユーザー数
  nearbyCount: number;
  
  // Actions
  setCurrentMatch: (match: MatchInfo | null) => void;
  setMatchStatus: (status: MatchState['matchStatus']) => void;
  setIncomingSOS: (sos: MatchInfo | null) => void;
  setNearbyCount: (count: number) => void;
  setMatchedHelper: (helperId: string, helperName: string) => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  currentMatch: null,
  matchStatus: 'idle',
  incomingSOS: null,
  nearbyCount: 0,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setMatchStatus: (status) => set({ matchStatus: status }),
  setIncomingSOS: (sos) => set({ incomingSOS: sos }),
  setNearbyCount: (count) => set({ nearbyCount: count }),
  setMatchedHelper: (helperId, helperName) =>
    set((state) => ({
      currentMatch: state.currentMatch
        ? { ...state.currentMatch, helperId, helperName, status: 'matched' }
        : null,
      matchStatus: 'matched',
    })),
  resetMatch: () =>
    set({
      currentMatch: null,
      matchStatus: 'idle',
      incomingSOS: null,
    }),
}));

// ========================================
// Location Store
// ========================================
interface LocationState {
  latitude: number | null;
  longitude: number | null;
  hasPermission: boolean;
  setLocation: (lat: number, lng: number) => void;
  setPermission: (has: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  hasPermission: false,
  setLocation: (lat, lng) => set({ latitude: lat, longitude: lng }),
  setPermission: (has) => set({ hasPermission: has }),
}));
