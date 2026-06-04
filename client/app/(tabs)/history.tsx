import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHistoryStore, HistoryEntry } from '@/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function HistoryItem({ entry }: { entry: HistoryEntry }) {
  const isHelper = entry.role === 'helper';
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={[styles.roleBadge, { backgroundColor: isHelper ? Colors.neonGreenDim : Colors.neonBlueDim }]}>
          <Ionicons
            name={isHelper ? 'hand-left' : 'megaphone'}
            size={14}
            color={isHelper ? Colors.neonGreen : Colors.neonBlue}
          />
          <Text style={[styles.roleText, { color: isHelper ? Colors.neonGreen : Colors.neonBlue }]}>
            {isHelper ? 'SPOTTER' : 'REQUESTER'}
          </Text>
        </View>
        <Text style={styles.historyDate}>{formatDate(entry.completedAt)}</Text>
      </View>
      <View style={styles.historyBody}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyExercise}>{entry.exercise}</Text>
          <Text style={styles.historyWeight}>{entry.weight} KG</Text>
        </View>
        <View style={styles.historyRight}>
          <Text style={styles.historyPartner}>{entry.partnerName}</Text>
          {entry.expEarned > 0 && (
            <Text style={styles.historyExp}>+{entry.expEarned} EXP</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const entries = useHistoryStore((s) => s.entries);

  // Stats calculation
  const totalMatches = entries.length;
  const totalExp = entries.reduce((sum, e) => sum + e.expEarned, 0);
  const helperCount = entries.filter((e) => e.role === 'helper').length;
  const favoriteExercise = entries.length > 0
    ? Object.entries(
        entries.reduce<Record<string, number>>((acc, e) => {
          acc[e.exercise] = (acc[e.exercise] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    : '-';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HISTORY</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <StatCard icon="flash" value={totalMatches} label="MATCHES" color={Colors.neonRed} />
          <StatCard icon="hand-left" value={helperCount} label="SPOTS" color={Colors.neonGreen} />
          <StatCard icon="star" value={totalExp} label="EXP" color={Colors.neonYellow} />
        </View>

        {/* Favorite Exercise */}
        <View style={styles.favoriteCard}>
          <Ionicons name="barbell" size={20} color={Colors.neonBlue} />
          <Text style={styles.favoriteLabel}>MOST SPOTTED EXERCISE</Text>
          <Text style={styles.favoriteValue}>{favoriteExercise}</Text>
        </View>

        {/* Match List */}
        <View style={styles.listSection}>
          <Text style={styles.listHeader}>RECENT MATCHES</Text>
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>NO HISTORY YET</Text>
              <Text style={styles.emptySub}>Your completed matches will appear here</Text>
            </View>
          ) : (
            entries.map((entry) => (
              <HistoryItem key={entry.matchId} entry={entry} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 4 },
  // Stats
  statsGrid: { flexDirection: 'row', marginHorizontal: Spacing.lg, marginTop: Spacing.lg, gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceElevated },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 1, marginTop: 2 },
  // Favorite
  favoriteCard: { marginHorizontal: Spacing.lg, marginTop: Spacing.lg, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.neonBlueDim },
  favoriteLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 2, marginTop: Spacing.sm },
  favoriteValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.neonBlue, marginTop: Spacing.xs },
  // List
  listSection: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  listHeader: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.textMuted, letterSpacing: 3, marginBottom: Spacing.md },
  // History Card
  historyCard: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceElevated },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, gap: 4 },
  roleText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 1 },
  historyDate: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  historyBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyInfo: {},
  historyExercise: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  historyWeight: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyPartner: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  historyExp: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.neonYellow, marginTop: 2 },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textMuted, letterSpacing: 2, marginTop: Spacing.lg },
  emptySub: { fontSize: FontSize.md, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});
