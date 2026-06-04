import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, Dimensions, FlatList, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSocket } from '@/hooks/useSocket';
import { useMatchStore, useUserStore, useHistoryStore, ChatMessage } from '@/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';

const PRESET_MESSAGES = [
  '向かってます 🏃‍♂️',
  '到着しました 👋',
  'どこにいますか？ 📍',
  'ありがとう 🙏',
  'ナイス！💪',
];


function WaitingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

export default function MatchingScreen() {
  const { acceptMatch, completeMatch, cancelMatch, sendChatMessage } = useSocket();
  const matchStatus = useMatchStore((s) => s.matchStatus);
  const currentMatch = useMatchStore((s) => s.currentMatch);
  const incomingSOS = useMatchStore((s) => s.incomingSOS);
  const setMatchStatus = useMatchStore((s) => s.setMatchStatus);
  const setIncomingSOS = useMatchStore((s) => s.setIncomingSOS);
  const setCurrentMatch = useMatchStore((s) => s.setCurrentMatch);
  const resetMatch = useMatchStore((s) => s.resetMatch);
  const chatMessages = useMatchStore((s) => s.chatMessages);
  const profile = useUserStore((s) => s.profile);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const chatScrollRef = useRef<ScrollView>(null);


  useEffect(() => {
    if (matchStatus === 'waiting') {
      Animated.loop(Animated.timing(spinAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      })).start();
    }
  }, [matchStatus]);

  useEffect(() => {
    if (matchStatus === 'matched') {
      Animated.spring(bounceAnim, { toValue: 1, tension: 50, friction: 3, useNativeDriver: true }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [matchStatus]);

  useEffect(() => {
    if (matchStatus === 'completed') {
      Animated.parallel([
        Animated.timing(fadeInAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
      ]).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save to history
      if (currentMatch) {
        addHistoryEntry({
          matchId: currentMatch.matchId,
          exercise: currentMatch.exercise,
          weight: currentMatch.weight,
          partnerName: currentMatch.helperName || currentMatch.requesterName,
          role: currentMatch.requesterId === profile?.id ? 'requester' : 'helper',
          expEarned: currentMatch.requesterId === profile?.id ? 0 : 50,
          completedAt: new Date().toISOString(),
        });
      }
    }
  }, [matchStatus]);

  const handleSendPreset = (msg: string) => {
    if (currentMatch && profile) {
      sendChatMessage(currentMatch.matchId, msg);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // IDLE
  if (matchStatus === 'idle' && !incomingSOS) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="flash-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.idleTitle}>NO ACTIVE MATCH</Text>
          <Text style={styles.idleSub}>Send an SOS from home or wait for a call</Text>
        </View>
      </View>
    );
  }

  // INCOMING SOS
  if (incomingSOS && matchStatus === 'idle') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <View style={styles.sosHeader}>
            <Text style={styles.sosAlert}>🚨 SOS ALERT 🚨</Text>
            <Text style={styles.sosName}>{incomingSOS.requesterName}</Text>
            <Text style={styles.sosNeeds}>NEEDS A SPOTTER</Text>
          </View>
          <View style={styles.sosDetails}>
            <View style={styles.sosRow}>
              <Text style={styles.sosLabel}>EXERCISE</Text>
              <Text style={styles.sosValue}>{incomingSOS.exercise}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.sosRow}>
              <Text style={styles.sosLabel}>WEIGHT</Text>
              <Text style={styles.sosValue}>{incomingSOS.weight} KG</Text>
            </View>
            {incomingSOS.gymName ? (
              <>
                <View style={styles.divider} />
                <View style={styles.sosRow}>
                  <Text style={styles.sosLabel}>GYM</Text>
                  <Text style={styles.sosValue}>{incomingSOS.gymName}</Text>
                </View>
              </>
            ) : null}
          </View>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            acceptMatch(incomingSOS.matchId);
            setCurrentMatch(incomingSOS);
            setMatchStatus('matched');
          }} activeOpacity={0.8}>
            <Text style={styles.acceptText}>俺が行く</Text>
            <Text style={styles.acceptSub}>I'M ON MY WAY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ignoreBtn} onPress={() => setIncomingSOS(null)}>
            <Text style={styles.ignoreText}>IGNORE</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // WAITING
  if (matchStatus === 'waiting') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="radio" size={80} color={Colors.neonRed} />
          </Animated.View>
          <Text style={styles.waitTitle}>BROADCASTING SOS</Text>
          <Text style={styles.waitSub}>Searching for a spotter nearby...</Text>

          <View style={styles.dots}>{[0,1,2].map(i => <WaitingDot key={i} delay={i*300}/>)}</View>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => {
            if (currentMatch) cancelMatch(currentMatch.matchId);
            resetMatch(); router.push('/(tabs)/home');
          }}><Text style={styles.cancelText}>CANCEL SOS</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  // MATCHED (with chat)
  if (matchStatus === 'matched') {
    const name = currentMatch?.helperName || 'SOMEONE';
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.matchedContent}>
          {/* Match info */}
          <View style={styles.matchedHeader}>
            <Animated.View style={{ transform: [{ scale: bounceAnim.interpolate({ inputRange:[0,1], outputRange:[0.5,1] }) }] }}>
              <Ionicons name="checkmark-circle" size={60} color={Colors.neonGreen} />
            </Animated.View>
            <Text style={styles.matchTitle}>MATCH FOUND!</Text>
            <Text style={styles.matchName}>{name.toUpperCase()}</Text>
            <Text style={styles.matchComing}>IS COMING</Text>
            {currentMatch?.gymName ? (
              <Text style={styles.matchGym}>📍 {currentMatch.gymName}</Text>
            ) : null}
          </View>

          {/* Chat messages */}
          <View style={styles.chatSection}>
            <Text style={styles.chatHeader}>QUICK MESSAGES</Text>
            {chatMessages.length > 0 && (
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatList}
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              >
                {chatMessages.map((item, index) => (
                  <View key={`${item.id}_${index}`} style={[
                    styles.chatBubble,
                    item.senderId === profile?.id ? styles.chatBubbleMine : styles.chatBubbleTheirs,
                  ]}>
                    <Text style={styles.chatSender}>{item.senderName}</Text>
                    <Text style={styles.chatMsg}>{item.message}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.presetRow}>
              {PRESET_MESSAGES.slice(0, 3).map((msg) => (
                <TouchableOpacity
                  key={msg}
                  style={styles.presetBtn}
                  onPress={() => handleSendPreset(msg)}
                >
                  <Text style={styles.presetText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Complete button */}
          <TouchableOpacity style={styles.completeBtn} onPress={() => {
            if (currentMatch) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); completeMatch(currentMatch.matchId); }
          }} activeOpacity={0.8}>
            <Ionicons name="thumbs-up" size={28} color={Colors.textPrimary} />
            <Text style={styles.completeText}>ナイス補助</Text>
            <Text style={styles.completeSub}>NICE SPOT — COMPLETE</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // COMPLETED
  if (matchStatus === 'completed') {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View style={{ opacity: fadeInAnim, transform: [{ scale: scaleAnim }] }}>
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.doneTitle}>NICE SPOT!</Text>
            <Text style={styles.doneSub}>補助完了 — Great teamwork!</Text>
            <View style={styles.expBox}>
              <Text style={styles.expLabel}>EXP EARNED</Text>
              <Text style={styles.expVal}>+50</Text>
            </View>
          </Animated.View>
          <TouchableOpacity style={styles.backBtn} onPress={() => { resetMatch(); router.push('/(tabs)/home'); }}>
            <Text style={styles.backText}>BACK TO RADAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg },
  idleTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textMuted, marginTop: Spacing.lg, letterSpacing: 2 },
  idleSub: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
  sosHeader: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  sosAlert: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.neonRed, letterSpacing: 4 },
  sosName: { fontSize: FontSize.display, fontWeight: FontWeight.black, color: Colors.textPrimary, marginTop: Spacing.md },
  sosNeeds: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary, letterSpacing: 3, marginTop: Spacing.xs },
  sosDetails: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.surfaceElevated },
  sosRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  sosLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 2 },
  sosValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.surfaceElevated, marginVertical: Spacing.sm },
  acceptBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.xxl, backgroundColor: Colors.neonGreen, paddingVertical: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center', shadowColor: Colors.neonGreen, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  acceptText: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.background },
  acceptSub: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(0,0,0,0.6)', letterSpacing: 2, marginTop: Spacing.xs },
  ignoreBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  ignoreText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 2 },
  waitTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.neonRed, marginTop: Spacing.xl, letterSpacing: 2 },
  waitSub: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  dots: { flexDirection: 'row', marginTop: Spacing.xl, gap: Spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.neonRed },
  cancelBtn: { marginTop: Spacing.xxxl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.textMuted },
  cancelText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 2 },
  // Matched with chat
  matchedContent: { flexGrow: 1, paddingHorizontal: Spacing.lg },
  matchedHeader: { alignItems: 'center', paddingTop: Spacing.lg },
  matchTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.neonGreen, letterSpacing: 2, marginTop: Spacing.sm },
  matchName: { fontSize: FontSize.xxxl, fontWeight: FontWeight.black, color: Colors.textPrimary, marginTop: Spacing.xs },
  matchComing: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.neonGreen, letterSpacing: 4, marginTop: Spacing.xs },
  matchGym: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginTop: Spacing.sm },
  // Chat
  chatSection: { flexGrow: 1, marginTop: Spacing.lg, paddingBottom: Spacing.lg },
  chatHeader: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Colors.textMuted, letterSpacing: 3, marginBottom: Spacing.sm },
  chatList: { maxHeight: 120, marginBottom: Spacing.sm },
  chatBubble: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, maxWidth: '80%' },
  chatBubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.neonRedDim },
  chatBubbleTheirs: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceLight },
  chatSender: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, marginBottom: 2 },
  chatMsg: { fontSize: FontSize.md, color: Colors.textPrimary },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  presetBtn: { backgroundColor: Colors.surfaceLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.surfaceElevated },
  presetText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  completeBtn: { marginTop: Spacing.lg, marginBottom: Spacing.xl, backgroundColor: Colors.neonBlue, paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center', shadowColor: Colors.neonBlue, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  completeText: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.textPrimary, marginTop: Spacing.sm },
  completeSub: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.6)', letterSpacing: 2, marginTop: Spacing.xs },
  trophy: { fontSize: 80, textAlign: 'center' },
  doneTitle: { fontSize: FontSize.display, fontWeight: FontWeight.black, color: Colors.neonYellow, textAlign: 'center', marginTop: Spacing.md, letterSpacing: 2 },
  doneSub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  expBox: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: Colors.neonYellowDim, minWidth: 200 },
  expLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted, letterSpacing: 3 },
  expVal: { fontSize: FontSize.display, fontWeight: FontWeight.black, color: Colors.neonYellow, marginTop: Spacing.xs },
  backBtn: { marginTop: Spacing.xxl, backgroundColor: Colors.neonRed, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, borderRadius: BorderRadius.lg },
  backText: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: 2 },
});
