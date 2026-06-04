import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserStore } from '@/stores';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const hasAgreedDisclaimer = useUserStore((s) => s.hasAgreedDisclaimer);
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else if (!hasAgreedDisclaimer) {
        router.replace('/disclaimer');
      } else {
        router.replace('/(tabs)/home');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasAgreedDisclaimer, hasCompletedOnboarding]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.neonRed} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
