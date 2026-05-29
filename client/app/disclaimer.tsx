import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '@/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

export default function DisclaimerScreen() {
  const setAgreedDisclaimer = useUserStore((s) => s.setAgreedDisclaimer);
  const [checked, setChecked] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (checked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [checked]);

  const handleAgree = async () => {
    if (!checked) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAgreedDisclaimer(true);
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>OMMF</Text>
        <Text style={styles.subtitle}>ONE MORE MUTHA FKER</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Disclaimer Content */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>⚠️ DISCLAIMER</Text>
          <Text style={styles.disclaimerText}>
            {`Welcome to OMMF — the ultimate spotter matching app for those who push beyond their limits.

By using this app, you acknowledge and agree to the following:

🏋️ PHYSICAL RISK
Weightlifting and spotting involve inherent risks of physical injury. You participate at your own risk.

🤝 SPOTTER RESPONSIBILITY
Spotters provide assistance voluntarily. Neither OMMF nor any spotter guarantees your safety.

⚕️ INJURY DISCLAIMER
All injuries sustained during exercises — whether spotted or unspotted — are your sole responsibility. OMMF is not liable for any physical harm.

📍 LOCATION DATA
This app uses your GPS location to find nearby users within your gym. Location data is used in real-time only and is not permanently stored.

🔞 AGE REQUIREMENT
You must be 18 years or older to use this app.`}
          </Text>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => {
            setChecked(!checked);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I understand and accept all risks. Let's fucking go.
          </Text>
        </TouchableOpacity>

        {/* Agree Button */}
        <Animated.View style={{ transform: [{ scale: checked ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            style={[styles.agreeButton, !checked && styles.agreeButtonDisabled]}
            onPress={handleAgree}
            disabled={!checked}
            activeOpacity={0.8}
          >
            <Text style={[styles.agreeButtonText, !checked && styles.agreeButtonTextDisabled]}>
              ENTER THE IRON ZONE
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  logo: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.black,
    color: Colors.neonRed,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 6,
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  disclaimerBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.neonRedDim,
  },
  disclaimerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.neonRed,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  disclaimerText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.neonRed,
    borderColor: Colors.neonRed,
  },
  checkmark: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  agreeButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.neonRed,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: Colors.neonRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  agreeButtonDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
  },
  agreeButtonText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  agreeButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
