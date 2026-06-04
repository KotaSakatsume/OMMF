import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, MatchInfo, MatchStatus } from '../../shared/types';

// ========================================
// Safe Storage Wrapper (Falls back to memory if native module is missing/null)
// ========================================
const memoryStorage: Record<string, string> = {};

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] getItem failed for key "${key}", falling back to memory:`, e);
      return memoryStorage[key] || null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[SafeStorage] setItem failed for key "${key}", falling back to memory:`, e);
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] removeItem failed for key "${key}", falling back to memory:`, e);
      delete memoryStorage[key];
    }
  },
};

// ========================================
// User Store (Persisted)
// ========================================
interface UserState {
  profile: UserProfile | null;
  isRegistered: boolean;
  deviceId: string | null;
  hasAgreedDisclaimer: boolean;
  hasCompletedOnboarding: boolean;
  setProfile: (profile: UserProfile, deviceId?: string) => void;
  setAgreedDisclaimer: (agreed: boolean) => void;
  setCompletedOnboarding: (completed: boolean) => void;
  updateExp: (exp: number, level: number, title: string, totalSpots: number) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isRegistered: false,
      deviceId: null,
      hasAgreedDisclaimer: false,
      hasCompletedOnboarding: false,
      setProfile: (profile, deviceId) => set((state) => ({
        profile,
        isRegistered: true,
        deviceId: deviceId || state.deviceId,
      })),
      setAgreedDisclaimer: (agreed) => set({ hasAgreedDisclaimer: agreed }),
      setCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      updateExp: (exp, level, title, totalSpots) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, exp, level, title, totalSpots }
            : null,
        })),
      reset: () => set({ profile: null, isRegistered: false, deviceId: null, hasAgreedDisclaimer: false, hasCompletedOnboarding: false }),
    }),
    {
      name: 'ommf-user-store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

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

  // マッチ中チャットメッセージ
  chatMessages: ChatMessage[];
  
  // Actions
  setCurrentMatch: (match: MatchInfo | null) => void;
  setMatchStatus: (status: MatchState['matchStatus']) => void;
  setIncomingSOS: (sos: MatchInfo | null) => void;
  setNearbyCount: (count: number) => void;
  setMatchedHelper: (helperId: string, helperName: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  resetMatch: () => void;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  isPreset: boolean;
}

export const useMatchStore = create<MatchState>((set) => ({
  currentMatch: null,
  matchStatus: 'idle',
  incomingSOS: null,
  nearbyCount: 0,
  chatMessages: [],
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
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    })),
  resetMatch: () =>
    set({
      currentMatch: null,
      matchStatus: 'idle',
      incomingSOS: null,
      chatMessages: [],
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

// ========================================
// History Store (Persisted)
// ========================================
export interface HistoryEntry {
  matchId: string;
  exercise: string;
  weight: number;
  partnerName: string;
  role: 'requester' | 'helper';
  expEarned: number;
  completedAt: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 100), // 最大100件
        })),
      clearHistory: () => set({ entries: [] }),
    }),
    {
      name: 'ommf-history-store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);

// ========================================
// Settings Store (Persisted)
// ========================================
interface SettingsState {
  notificationsEnabled: boolean;
  matchRadius: number; // Always 30m
  gymName: string;
  setNotificationsEnabled: (enabled: boolean) => void;
  setGymName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notificationsEnabled: true,
      matchRadius: 30, // Locked at 30m
      gymName: '',
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setGymName: (name) => set({ gymName: name }),
    }),
    {
      name: 'ommf-settings-store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
