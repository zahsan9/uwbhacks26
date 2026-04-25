import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Blob from '../../src/Blob';
import { BackButton, Body, Eyebrow, H1, H3, Small, SpeechBubble, VQButton, WorldBg } from '../../src/Components';
import Island from '../../src/Island';
import { FRIENDS, Friend } from '../../src/models';
import { VQ, stateColor } from '../../src/theme';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

const STATE_LABEL: Record<string, string> = {
  thriving: 'on a roll',
  healthy:  'doing well',
  sick:     'falling behind',
  critical: 'struggling',
};

function StreakBadge({ value }: { value: number }) {
  if (value === 0) return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(232,224,212,0.08)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 }}>
      <Ionicons name="moon-outline" size={11} color="rgba(232,224,212,0.45)" />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: 'rgba(232,224,212,0.45)' }}>no streak</Text>
    </View>
  );
  const hot   = value >= 20;
  const warm  = value >= 7;
  const bg    = hot ? 'rgba(200,134,10,0.22)' : warm ? 'rgba(224,122,32,0.18)' : 'rgba(232,224,212,0.08)';
  const color = hot ? '#c8860a' : warm ? '#e07a20' : 'rgba(232,224,212,0.55)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 }}>
      <Ionicons name="flame" size={11} color={color} />
      <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 11, color }}>{value} day{value !== 1 ? 's' : ''}</Text>
    </View>
  );
}

function FriendRow({ f, nudged, onNudge, onVisit, last }: { f: Friend; nudged: boolean; onNudge: () => void; onVisit: () => void; last?: boolean }) {
  const needs = f.state === 'sick' || f.state === 'critical';

  return (
    <Pressable onPress={onVisit}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: 'rgba(232,224,212,0.12)' }}>

        {/* Avatar */}
        <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,30,18,0.8)', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(232,224,212,0.35)' }}>
          <Image source={PANDA_GIF[f.state]} style={{ width: 100, height: 100, marginTop: 40 }} contentFit="contain" />
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 15, color: '#E8E0D4' }}>{f.name}</Text>
            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 10, color: 'rgba(232,224,212,0.5)' }}>Lvl {f.level}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <StreakBadge value={f.streak} />
            <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: needs ? stateColor[f.state] : 'rgba(232,224,212,0.55)' }}>
              {STATE_LABEL[f.state]}
            </Text>
          </View>
        </View>

        {/* Action */}
        {needs ? (
          <Pressable onPress={nudged ? undefined : onNudge} hitSlop={8}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
              backgroundColor: nudged ? 'rgba(110,212,163,0.12)' : 'rgba(199,80,80,0.12)',
              borderWidth: 1,
              borderColor: nudged ? 'rgba(110,212,163,0.4)' : 'rgba(199,80,80,0.4)',
            }}>
              <Ionicons name={nudged ? 'checkmark' : 'notifications-outline'} size={11} color={nudged ? 'rgba(110,212,163,0.9)' : 'rgba(220,120,120,0.9)'} />
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 12, color: nudged ? 'rgba(110,212,163,0.9)' : 'rgba(220,120,120,0.9)' }}>
                {nudged ? 'sent' : 'nudge'}
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(232,224,212,0.28)' }}>
            <Ionicons name="map-outline" size={11} color="rgba(232,224,212,0.6)" />
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 12, color: 'rgba(232,224,212,0.75)' }}>visit</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function FriendVisit({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const quote: Record<string, string> = {
    critical: '"i haven\'t done my habits in days..."',
    sick:     '"volcano has been rough this week."',
    healthy:  '"doing okay — want to trade habits?"',
    thriving: '"everything feels great! you?"',
  };
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
  const [nudged, setNudged]     = useState<Set<string>>(new Set());
  const [visiting, setVisiting] = useState<Friend | null>(null);

  if (visiting) return <FriendVisit friend={visiting} onBack={() => setVisiting(null)} />;

  const needsAttention = FRIENDS.filter(f => f.state === 'sick' || f.state === 'critical');
  const doingWell      = FRIENDS.filter(f => f.state !== 'sick' && f.state !== 'critical');

  const renderRow = (f: Friend, last: boolean) => (
    <FriendRow
      key={f.id} f={f} last={last}
      nudged={nudged.has(f.id)}
      onNudge={() => setNudged(prev => new Set([...prev, f.id]))}
      onVisit={() => setVisiting(f)}
    />
  );

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <H1 style={{ flex: 1 }}>Friends</H1>
            <Pressable onPress={() => {}}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(10,26,14,0.70)', borderWidth: 1, borderColor: 'rgba(232,224,212,0.38)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-add-outline" size={16} color="rgba(232,224,212,0.55)" />
              </View>
            </Pressable>
          </View>

          {needsAttention.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Eyebrow style={{ marginBottom: 10, color: 'rgba(220,120,100,0.85)' }}>Needs attention</Eyebrow>
              <View style={{ backgroundColor: 'rgba(10,26,14,0.88)', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(232,224,212,0.38)' }}>
                {needsAttention.map((f, i) => renderRow(f, i === needsAttention.length - 1))}
              </View>
            </View>
          )}

          {doingWell.length > 0 && (
            <View>
              <Eyebrow style={{ marginBottom: 10 }}>Friends</Eyebrow>
              <View style={{ backgroundColor: 'rgba(10,26,14,0.88)', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(232,224,212,0.38)' }}>
                {doingWell.map((f, i) => renderRow(f, i === doingWell.length - 1))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
