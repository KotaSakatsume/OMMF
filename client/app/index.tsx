import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useUserStore } from '@/stores';
import { Colors } from '@/constants/theme';

export default function IndexScreen() {
  const hasAgreedDisclaimer = useUserStore((s) => s.hasAgreedDisclaimer);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasAgreedDisclaimer) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/disclaimer');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hasAgreedDisclaimer]);

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
