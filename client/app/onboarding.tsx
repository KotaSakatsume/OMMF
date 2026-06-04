import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useUserStore } from '@/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  iconName: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: '🚨',
    iconName: 'radio',
    title: 'SEND SOS',
    subtitle: 'SOSを発信',
    description: 'ラスト1レップで限界が来たら、ボタンひとつで\n半径50m以内の全ユーザーに即座にSOS通知。\n種目と重量を入力するだけ。',
    color: Colors.neonRed,
  },
  {
    icon: '💪',
    iconName: 'flash',
    title: 'GET MATCHED',
    subtitle: 'ヘルパーが駆けつける',
    description: '近くにいるリフターが「俺が行く」ボタンを押して\nあなたの元へ駆けつけます。\nマッチングは早い者勝ちの排他制御。',
    color: Colors.neonGreen,
  },
  {
    icon: '🏆',
    iconName: 'trophy',
    title: 'LEVEL UP',
    subtitle: '経験値を獲得',
    description: '補助を完了するとEXPを獲得。\nレベルが上がるとユニークな称号がアンロック。\n目指せ「The Final Boss」！',
    color: Colors.neonYellow,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const setCompletedOnboarding = useUserStore((s) => s.setCompletedOnboarding);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCompletedOnboarding(true);
    router.replace('/disclaimer');
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderStep = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {/* Icon */}
      <View style={[styles.iconCircle, { borderColor: item.color, shadowColor: item.color }]}>
        <Text style={styles.emoji}>{item.icon}</Text>
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const isLast = currentIndex === STEPS.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      )}

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>OMMF</Text>
        <Text style={styles.logoSub}>ONE MORE MUTHA FKER</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={STEPS}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {STEPS.map((step, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? step.color : Colors.surfaceElevated,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next / Start Button */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: STEPS[currentIndex].color }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextText}>
          {isLast ? 'LET\'S GO' : 'NEXT'}
        </Text>
        {!isLast && (
          <Ionicons name="arrow-forward" size={20} color={Colors.background} />
        )}
      </TouchableOpacity>

      {/* Step counter */}
      <Text style={styles.stepCounter}>
        {currentIndex + 1} / {STEPS.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 40,
  },
  skipBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 80,
    marginBottom: Spacing.md,
  },
  logo: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: 8,
  },
  logoSub: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 4,
    marginTop: Spacing.xs,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 56,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.black,
    letterSpacing: 4,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    letterSpacing: 2,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  nextText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.black,
    color: Colors.background,
    letterSpacing: 3,
  },
  stepCounter: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    letterSpacing: 2,
  },
});
