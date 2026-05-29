import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { getSocket, connectSocket } from '../services/socket';
import { useUserStore, useMatchStore, useLocationStore } from '../stores';
import { Platform } from 'react-native';

// ========================================
// useSocket: Socket.io 接続管理
// ========================================
export function useSocket() {
  const socket = getSocket();
  const setProfile = useUserStore((s) => s.setProfile);
  const setNearbyCount = useMatchStore((s) => s.setNearbyCount);
  const setIncomingSOS = useMatchStore((s) => s.setIncomingSOS);
  const setMatchedHelper = useMatchStore((s) => s.setMatchedHelper);
  const setMatchStatus = useMatchStore((s) => s.setMatchStatus);
  const updateExp = useUserStore((s) => s.updateExp);

  useEffect(() => {
    connectSocket();

    socket.on('user:registered', (profile) => {
      console.log('[useSocket] Registered:', profile.displayName);
      setProfile(profile);
    });

    socket.on('nearby:count', (data) => {
      setNearbyCount(data.count);
    });

    socket.on('match:sos', (matchInfo) => {
      console.log('[useSocket] SOS received:', matchInfo.exercise, matchInfo.weight);
      setIncomingSOS(matchInfo);
    });

    socket.on('match:accepted', (data) => {
      console.log('[useSocket] Match accepted by:', data.helperName);
      setMatchedHelper(data.helperId, data.helperName);
    });

    socket.on('match:already_taken', (data) => {
      console.log('[useSocket] Match already taken:', data.matchId);
      setIncomingSOS(null);
    });

    socket.on('match:completed', (data) => {
      console.log('[useSocket] Match completed! EXP:', data.exp);
      if (data.exp > 0) {
        updateExp(data.newTotalExp, data.level, data.title, data.totalSpots);
      }
      setMatchStatus('completed');
    });

    socket.on('match:cancelled', () => {
      setMatchStatus('idle');
      setIncomingSOS(null);
    });

    return () => {
      socket.off('user:registered');
      socket.off('nearby:count');
      socket.off('match:sos');
      socket.off('match:accepted');
      socket.off('match:already_taken');
      socket.off('match:completed');
      socket.off('match:cancelled');
    };
  }, []);

  const register = useCallback((deviceId: string) => {
    socket.emit('user:register', { deviceId });
  }, []);

  const sendSOS = useCallback((exercise: string, weight: number) => {
    socket.emit('match:request', { exercise, weight });
  }, []);

  const acceptMatch = useCallback((matchId: string) => {
    socket.emit('match:accept', { matchId });
  }, []);

  const completeMatch = useCallback((matchId: string) => {
    socket.emit('match:complete', { matchId });
  }, []);

  const cancelMatch = useCallback((matchId: string) => {
    socket.emit('match:cancel', { matchId });
  }, []);

  const updateLocation = useCallback((lat: number, lng: number) => {
    socket.emit('location:update', { lat, lng });
  }, []);

  const updateName = useCallback((displayName: string) => {
    socket.emit('user:update_name', { displayName });
  }, []);

  return {
    socket,
    register,
    sendSOS,
    acceptMatch,
    completeMatch,
    cancelMatch,
    updateLocation,
    updateName,
  };
}

// ========================================
// useLocation: GPS位置情報管理
// ========================================
export function useLocationTracking(updateLocation: (lat: number, lng: number) => void) {
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPermission = useLocationStore((s) => s.setPermission);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[Location] Permission denied');
          setPermission(false);
          return;
        }
        setPermission(true);

        // 初回取得
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (mounted) {
          setLocation(location.coords.latitude, location.coords.longitude);
          updateLocation(location.coords.latitude, location.coords.longitude);
        }

        // 10秒ごとに位置更新
        intervalRef.current = setInterval(async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            if (mounted) {
              setLocation(loc.coords.latitude, loc.coords.longitude);
              updateLocation(loc.coords.latitude, loc.coords.longitude);
            }
          } catch (e) {
            console.error('[Location] Update error:', e);
          }
        }, 10000);
      } catch (error) {
        console.error('[Location] Init error:', error);
      }
    };

    startTracking();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
