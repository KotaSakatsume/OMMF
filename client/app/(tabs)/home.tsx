import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useSocket, useLocationTracking } from '@/hooks/useSocket';
import { useUserStore, useMatchStore, useLocationStore } from '@/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, EXERCISES } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { register, sendSOS, updateLocation } = useSocket();
  const profile = useUserStore((s) => s.profile);
  const isRegistered = useUserStore((s) => s.isRegistered);
  const nearbyCount = useMatchStore((s) => s.nearbyCount);
  const setCurrentMatch = useMatchStore((s) => s.setCurrentMatch);
  const setMatchStatus = useMatchStore((s) => s.setMatchStatus);
  const latitude = useLocationStore((s) => s.latitude);

  const hasGps = latitude !== null;
  const radarColor = hasGps ? Colors.neonGreen : Colors.neonRed;
  const radarColorDim = hasGps ? Colors.neonGreenDim : Colors.neonRedDim;

  const [selectedExercise, setSelectedExercise] = useState('Bench Press');
  const [customExercise, setCustomExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Location tracking
  useLocationTracking(updateLocation);

  // Auto-register on mount
  useEffect(() => {
    if (!isRegistered) {
      const deviceId = Device.modelId || `dev_${Date.now()}`;
      register(deviceId);
    }
  }, [isRegistered]);

  // Radar pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(radarAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Button pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleHelpMe = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const finalExercise = selectedExercise === 'Other' && customExercise.trim() !== '' 
      ? customExercise.trim() 
      : selectedExercise;
      
    sendSOS(finalExercise, parseFloat(weight));
    setMatchStatus('waiting');
    router.push('/(tabs)/matching');
  };

  const radarScale = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 2.5],
  });

  const radarOpacity = radarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>OMMF</Text>
        <View style={styles.nearbyBadge}>
          <View style={styles.nearbyDot} />
          <Text style={styles.nearbyText}>
            {nearbyCount} MUTHA FKER{nearbyCount !== 1 ? 'S' : ''} NEARBY
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Radar Visual */}
        <View style={styles.radarContainer}>
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: radarScale }],
                opacity: radarOpacity,
                borderColor: radarColor,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRing,
              {
                transform: [{ scale: radarScale }],
                opacity: radarOpacity,
                borderColor: radarColorDim,
              },
            ]}
          />
          <View style={[styles.radarCenter, { backgroundColor: radarColorDim, borderColor: radarColor }]}>
            <Ionicons name="radio" size={32} color={radarColor} />
          </View>
          <Text style={styles.radarLabel}>
            {hasGps ? 'SCANNING 50m RADIUS' : 'WAITING FOR GPS...'}
          </Text>
        </View>

        {/* Exercise Selector */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>EXERCISE</Text>
          <TouchableOpacity
            style={styles.exerciseSelector}
            onPress={() => setShowExercisePicker(!showExercisePicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.exerciseSelectorText}>{selectedExercise}</Text>
            <Ionicons
              name={showExercisePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {showExercisePicker && (
            <View style={styles.exerciseList}>
              {EXERCISES.map((exercise) => (
                <TouchableOpacity
                  key={exercise}
                  style={[
                    styles.exerciseItem,
                    selectedExercise === exercise && styles.exerciseItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedExercise(exercise);
                    setShowExercisePicker(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    style={[
                      styles.exerciseItemText,
                      selectedExercise === exercise && styles.exerciseItemTextSelected,
                    ]}
                  >
                    {exercise}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {selectedExercise === 'Other' && (
            <View style={[styles.weightInputContainer, { marginTop: Spacing.sm }]}>
              <TextInput
                style={[styles.weightInput, { fontSize: FontSize.lg, fontWeight: FontWeight.bold }]}
                value={customExercise}
                onChangeText={setCustomExercise}
                placeholder="Enter custom exercise"
                placeholderTextColor={Colors.textMuted}
                maxLength={30}
              />
            </View>
          )}
        </View>

        {/* Weight Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
          <View style={styles.weightInputContainer}>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.weightUnit}>KG</Text>
          </View>
        </View>

        {/* HELP ME Button */}
        <View style={styles.helpButtonContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.helpButton,
                (!weight || parseFloat(weight) <= 0) && styles.helpButtonDisabled,
              ]}
              onPress={handleHelpMe}
              disabled={!weight || parseFloat(weight) <= 0}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.helpButtonGlow,
                  { opacity: weight && parseFloat(weight) > 0 ? glowAnim : 0 },
                ]}
              />
              <Text style={styles.helpButtonText}>HELP ME</Text>
              <Text style={styles.helpButtonSub}>SEND SOS TO NEARBY LIFTERS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  logo: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 6,
  },
  nearbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neonGreenDim,
  },
  nearbyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neonGreen,
    marginRight: Spacing.sm,
  },
  nearbyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.neonGreen,
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  // Radar
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginVertical: Spacing.lg,
  },
  radarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.neonGreen,
  },
  radarCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.neonGreenDim,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neonGreen,
  },
  radarLabel: {
    position: 'absolute',
    bottom: 0,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  // Input Section
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: Spacing.sm,
  },
  exerciseSelector: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
  },
  exerciseSelectorText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  exerciseList: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  exerciseItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceElevated,
  },
  exerciseItemSelected: {
    backgroundColor: Colors.neonRedDim,
  },
  exerciseItemText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  exerciseItemTextSelected: {
    color: Colors.neonRed,
  },
  // Weight Input
  weightInputContainer: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
  },
  weightInput: {
    flex: 1,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },
  weightUnit: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  // Help Button
  helpButtonContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  helpButton: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.neonRed,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: Colors.neonRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 15,
  },
  helpButtonDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
  },
  helpButtonGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: Colors.neonRed,
    borderRadius: 999,
  },
  helpButtonText: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  helpButtonSub: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
});
