import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from '../../src/Blob';
import { BackButton, Body, H1, H2, H3, Small, SpeechBubble, StatePill, StreakNum, VQButton, WorldBg } from '../../src/Components';
import Island from '../../src/Island';
import { FRIENDS, Friend } from '../../src/models';
import { AvatarState, IslandType, VQ } from '../../src/theme';

function FriendCard({ f, nudged, onNudge, onVisit }: { f: Friend; nudged: boolean; onNudge: () => void; onVisit: () => void }) {
  const needs = f.state === 'sick' || f.state === 'critical';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: VQ.surface, borderRadius: 6, borderWidth: 1.5, borderColor: VQ.border, borderLeftWidth: needs ? 4 : 1.5, borderLeftColor: needs ? VQ.coral : VQ.border }}>
      <View style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}>
        <Blob state={f.state} scale={2.2} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <H3>{f.name}</H3>
          <Small>Lvl {f.level}</Small>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text style={{ fontSize: 10, color: '#e56042' }}>🔥</Text>
            <StreakNum value={f.streak} />
          </View>
          <StatePill state={f.state} />
        </View>
      </View>
      <Pressable onPress={nudged ? undefined : needs ? onNudge : onVisit}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4, backgroundColor: nudged ? '#6ed4a3' : needs ? VQ.coral : VQ.water2, shadowColor: nudged ? '#4aa882' : needs ? VQ.coralDeep : VQ.water3, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}>
          <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 13, color: nudged ? '#1a3a2a' : '#fff' }}>{nudged ? 'sent ✓' : needs ? 'nudge' : 'visit'}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function FriendVisit({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const quote: Record<string, string> = {
    critical: '"i haven\'t done my habits in days..."',
    sick:     '"volcano has been rough this week."',
    healthy:  '"doing okay — want to trade habits?"',
    thriving: '"everything feels great! you?"',
  };
  const islandTypes: [IslandType, IslandType][] = [['sleep','walk'],['screen','learn']];
  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }}>
            <H3>{friend.name}'s world</H3>
            <Small>Lvl {friend.level} · {friend.state}</Small>
          </View>
        </View>
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={{ position: 'absolute', top: 50, left: 30 }}>
            <Island type="sleep" state={friend.state === 'critical' ? 'critical' : 'healthy'} scale={2.2} />
          </View>
          <View style={{ position: 'absolute', top: 40, right: 20 }}>
            <Island type="walk" state={friend.state === 'critical' ? 'sick' : 'healthy'} scale={2.2} />
          </View>
          <View style={{ position: 'absolute', top: 210, alignSelf: 'center', alignItems: 'center' }}>
            <Blob state={friend.state} scale={3} />
            <Island type="quest" state={friend.state === 'critical' ? 'critical' : 'sick'} scale={2.8} />
          </View>
          <View style={{ position: 'absolute', top: 390, left: 30 }}>
            <Island type="screen" state={friend.state === 'critical' ? 'critical' : 'sick'} scale={2} />
          </View>
          <View style={{ position: 'absolute', top: 370, right: 20 }}>
            <Island type="learn" state="sick" scale={2} locked />
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 32, gap: 10 }}>
          <SpeechBubble>
            <H3>{quote[friend.state]}</H3>
          </SpeechBubble>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}><VQButton label="Send nudge" onPress={onBack} /></View>
            <View style={{ flex: 1 }}><VQButton label="Message" style="ghost" onPress={onBack} /></View>
          </View>
        </View>
      </SafeAreaView>
    </WorldBg>
  );
}

export default function FriendsScreen() {
  const [nudged, setNudged] = useState<Set<string>>(new Set());
  const [visiting, setVisiting] = useState<Friend | null>(null);

  if (visiting) return <FriendVisit friend={visiting} onBack={() => setVisiting(null)} />;

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 8 }}>
          <H1 style={{ marginBottom: 4 }}>Friends</H1>
          <Body style={{ marginBottom: 16 }}>5 companions · 2 need a nudge</Body>
          {FRIENDS.map(f => (
            <FriendCard
              key={f.id} f={f}
              nudged={nudged.has(f.id)}
              onNudge={() => setNudged(prev => new Set([...prev, f.id]))}
              onVisit={() => setVisiting(f)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
