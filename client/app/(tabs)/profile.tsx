import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/stores';
import { useSocket } from '@/hooks/useSocket';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
// Level thresholds (mirrored from shared/types.ts)
const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 300, 4: 600, 5: 1000,
  6: 1500, 7: 2100, 8: 2800, 9: 3600, 10: 4500,
  11: 5500, 12: 6600, 13: 7800, 14: 9100, 15: 10500,
  16: 12000, 17: 13600, 18: 15300, 19: 17100, 20: 19000,
};

export default function ProfileScreen() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const { updateName } = useSocket();
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const level = profile?.level || 1;
  const exp = profile?.exp || 0;
  const totalSpots = profile?.totalSpots || 0;
  const title = profile?.title || 'Novice Spotter';
  const displayName = profile?.displayName || 'Anonymous Lifter';

  // Calculate EXP progress to next level
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || currentThreshold + 500;
  const progress = (exp - currentThreshold) / (nextThreshold - currentThreshold);

  const handleSaveName = () => {
    if (editName.trim().length > 0 && profile) {
      updateName(editName.trim());
      setProfile({ ...profile, displayName: editName.trim() });
    }
    setIsEditing(false);
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: Math.min(progress, 1),
      duration: 1000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Avatar Area */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={48} color={Colors.neonRed} />
        </View>

        {isEditing ? (
          <View style={styles.nameEditContainer}>
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              maxLength={20}
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
              <Ionicons name="checkmark" size={24} color={Colors.neonGreen} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.nameContainer} 
            onPress={() => {
              setEditName(displayName);
              setIsEditing(true);
            }}
          >
            <Text style={styles.displayName}>{displayName}</Text>
            <Ionicons name="pencil" size={16} color={Colors.textMuted} style={styles.editIcon} />
          </TouchableOpacity>
        )}

        <View style={styles.titleBadge}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      </View>

      {/* Level Display */}
      <View style={styles.levelSection}>
        <Text style={styles.levelLabel}>LEVEL</Text>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>

      {/* EXP Progress Bar */}
      <View style={styles.expSection}>
        <View style={styles.expHeader}>
          <Text style={styles.expLabel}>EXP</Text>
          <Text style={styles.expValue}>{exp} / {nextThreshold}</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="hand-left" size={28} color={Colors.neonGreen} />
          <Text style={styles.statValue}>{totalSpots}</Text>
          <Text style={styles.statLabel}>TOTAL SPOTS</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={28} color={Colors.neonYellow} />
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>LEVEL</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={28} color={Colors.neonBlue} />
          <Text style={styles.statValue}>{exp}</Text>
          <Text style={styles.statLabel}>TOTAL EXP</Text>
        </View>
      </View>

      {/* Title Progress */}
      <View style={styles.titlesSection}>
        <Text style={styles.titlesHeader}>TITLE PROGRESSION</Text>
        {[
          { lvl: 1, name: 'Novice Spotter', icon: '🌱' },
          { lvl: 3, name: 'Gym Bro', icon: '💪' },
          { lvl: 5, name: 'Iron Guardian', icon: '🛡️' },
          { lvl: 8, name: 'Beast Protector', icon: '🐻' },
          { lvl: 10, name: 'Legendary Spotter', icon: '⭐' },
          { lvl: 13, name: 'Mutha Fkin Hero', icon: '🦸' },
          { lvl: 15, name: 'God of Spots', icon: '👑' },
          { lvl: 20, name: 'The Final Boss', icon: '🔥' },
        ].map((t) => (
          <View key={t.lvl} style={[styles.titleRow, level >= t.lvl && styles.titleRowUnlocked]}>
            <Text style={styles.titleIcon}>{t.icon}</Text>
            <View style={styles.titleInfo}>
              <Text style={[styles.titleName, level >= t.lvl && styles.titleNameUnlocked]}>
                {t.name}
              </Text>
              <Text style={styles.titleLvl}>Lv.{t.lvl}</Text>
            </View>
            {level >= t.lvl ? (
              <Ionicons name="checkmark-circle" size={20} color={Colors.neonGreen} />
            ) : (
              <Ionicons name="lock-closed" size={20} color={Colors.textMuted} />
            )}
          </View>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 4 },
  avatarSection: { alignItems: 'center', marginTop: Spacing.lg },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.neonRedDim, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.neonRed },
  nameContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  displayName: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary },
  editIcon: { marginLeft: Spacing.sm },
  nameEditContainer: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md },
  nameInput: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.neonRed, paddingBottom: 4, minWidth: 150, textAlign: 'center' },
  saveButton: { marginLeft: Spacing.md, padding: Spacing.xs },
  titleBadge: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.neonRedDim },
  titleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.neonRed, letterSpacing: 1 },
  levelSection: { alignItems: 'center', marginTop: Spacing.xl },
  levelLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.textMuted, letterSpacing: 4 },
  levelNumber: { fontSize: FontSize.hero, fontWeight: FontWeight.black, color: Colors.textPrimary },
  expSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg },
  expHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  expLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 2 },
  expValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  progressBar: { height: 8, backgroundColor: Colors.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.neonRed, borderRadius: 4 },
  statsGrid: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.xl, gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceElevated },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, marginTop: Spacing.sm },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 1, marginTop: Spacing.xs },
  titlesSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl, paddingBottom: Spacing.xxxl },
  titlesHeader: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.textMuted, letterSpacing: 3, marginBottom: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, backgroundColor: Colors.surfaceLight, opacity: 0.5 },
  titleRowUnlocked: { opacity: 1, borderWidth: 1, borderColor: Colors.neonGreenDim },
  titleIcon: { fontSize: 24, marginRight: Spacing.md },
  titleInfo: { flex: 1 },
  titleName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted },
  titleNameUnlocked: { color: Colors.textPrimary },
  titleLvl: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
});
