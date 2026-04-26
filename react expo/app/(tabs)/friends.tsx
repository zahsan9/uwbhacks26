import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Blob from '../../src/Blob';
import { BackButton, Eyebrow, H1, H3, SectionDivider, Small, SpeechBubble, UI, VQButton, WaterBg, WorldBg } from '../../src/Components';
import Island from '../../src/Island';
import { FRIENDS, Friend } from '../../src/models';
import { AvatarState, IslandType, stateColor } from '../../src/theme';
import { setTabAccentMode } from '../../src/tabAccent';

const PANDA_GIF: Record<string, any> = {
  thriving: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_happy_south.gif'),
  healthy:  require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_standing_south.gif'),
  sick:     require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_sleepy_south.gif'),
  critical: require('../../assets/cute_chubby_fat_blue_panda_round_roly-poly_body_si_crying_south.gif'),
};

const STATE_LABEL: Record<string, string> = {
  thriving: 'On A Roll',
  healthy:  'Doing Well',
  sick:     'Falling Behind',
  critical: 'Struggling',
};

const MAP_ISLAND_IMG: Partial<Record<IslandType, any>> = {
  walk: require('../../assets/walk_island.png'),
  sleep: require('../../assets/sleep_island.png'),
  screen: require('../../assets/screen_island.png'),
};
const HOME_ISLAND_IMG = require('../../assets/home_island.png');

function MapIslandArt({ type, state, scale, locked }: { type: IslandType; state: AvatarState; scale: number; locked?: boolean }) {
  const source = MAP_ISLAND_IMG[type];
  if (!source) return <Island type={type} state={state} scale={scale} locked={locked} />;
  return (
    <View style={{ opacity: locked ? 0.62 : 1 }}>
      <Image source={source} style={{ width: 52 * scale, height: 32 * scale }} contentFit="contain" />
    </View>
  );
}

function HomeIslandArt({ scale }: { scale: number }) {
  return <Image source={HOME_ISLAND_IMG} style={{ width: 64 * scale, height: 40 * scale }} contentFit="contain" />;
}

function StreakBadge({ value }: { value: number }) {
  if (value === 0) return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: UI.surface.creamSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: UI.radius.pill }}>
      <Ionicons name="moon-outline" size={11} color="rgba(232,224,212,0.45)" />
      <Text style={{ fontFamily: 'PixelifySans_600SemiBold', fontSize: 11, color: UI.text.soft }}>No Streak</Text>
    </View>
  );
  const hot   = value >= 20;
  const warm  = value >= 7;
  const bg    = hot ? 'rgba(200,134,10,0.22)' : warm ? 'rgba(224,122,32,0.18)' : UI.surface.creamSoft;
  const color = hot ? '#c8860a' : warm ? '#e07a20' : 'rgba(232,224,212,0.55)';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 3, borderRadius: UI.radius.pill }}>
      <Ionicons name="flame" size={11} color={color} />
      <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 11, color }}>{value} Day{value !== 1 ? 's' : ''}</Text>
    </View>
  );
}

function SupportButton({ nudged, onPress }: { nudged: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={nudged ? undefined : onPress} hitSlop={8}>
      <View style={{
        width: 38, height: 38, borderRadius: UI.radius.control, alignItems: 'center', justifyContent: 'center',
        backgroundColor: nudged ? 'rgba(110,212,163,0.14)' : 'rgba(235,130,120,0.12)',
        borderWidth: 1,
        borderColor: nudged ? UI.border.goodStrong : UI.border.careStrong,
      }}>
        <Ionicons name={nudged ? 'checkmark' : 'megaphone-outline'} size={16} color={nudged ? 'rgba(110,212,163,0.94)' : 'rgba(235,130,120,0.92)'} />
      </View>
    </Pressable>
  );
}

function FriendCard({ f, nudged, onNudge, onVisit }: { f: Friend; nudged: boolean; onNudge: () => void; onVisit: () => void }) {
  const needs = f.state === 'sick' || f.state === 'critical';
  return (
    <Pressable onPress={onVisit}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 13,
        backgroundColor: needs ? 'rgba(44,24,18,0.62)' : UI.surface.base,
        borderRadius: UI.radius.card, borderWidth: 1,
        borderColor: needs ? UI.border.care : UI.border.sky,
        padding: 12, marginBottom: 10,
        position: 'relative', overflow: 'hidden',
      }}>
        <View style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderTopRightRadius: 2, borderBottomRightRadius: 2, backgroundColor: needs ? UI.border.careStrong : 'rgba(142,178,170,0.58)' }} />
        <View style={{ width: 58, height: 58, borderRadius: UI.radius.card, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.surface.raised, overflow: 'hidden', borderWidth: 1, borderColor: needs ? UI.border.care : UI.border.sky }}>
          <Image source={PANDA_GIF[f.state]} style={{ width: 104, height: 104, marginTop: 42 }} contentFit="contain" />
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#E8E0D4', lineHeight: 19 }}>{f.name}</Text>
            <Text style={{ fontFamily: 'VT323_400Regular', fontSize: 18, color: UI.text.muted, lineHeight: 18 }}>Lv {f.level}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <StreakBadge value={f.streak} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor[f.state] }} />
              <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 11, color: needs ? 'rgba(235,130,120,0.9)' : UI.text.muted }}>
                {STATE_LABEL[f.state]}
              </Text>
            </View>
          </View>
        </View>
        {needs ? (
          <SupportButton nudged={nudged} onPress={onNudge} />
        ) : (
          <View style={{ width: 38, height: 38, borderRadius: UI.radius.control, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: UI.border.sky, backgroundColor: 'rgba(158,214,223,0.06)' }}>
            <Ionicons name="map-outline" size={15} color="rgba(158,214,223,0.78)" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function FriendVisit({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const quote: Record<string, string> = {
    critical: '"I Haven\'t Done My Habits In Days..."',
    sick:     '"Volcano Has Been Rough This Week."',
    healthy:  '"Doing Okay — Want To Trade Habits?"',
    thriving: '"Everything Feels Great! You?"',
  };
  return (
    <WaterBg>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
          <BackButton onPress={onBack} />
          <View style={{ flex: 1 }}>
            <H3>{friend.name}'s World</H3>
            <Small>Lv {friend.level} · {STATE_LABEL[friend.state]}</Small>
          </View>
        </View>
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={{ position: 'absolute', top: 50, left: 30 }}>
            <MapIslandArt type="sleep" state={friend.state === 'critical' ? 'critical' : 'healthy'} scale={2.2} />
          </View>
          <View style={{ position: 'absolute', top: 40, right: 20 }}>
            <MapIslandArt type="walk" state={friend.state === 'critical' ? 'sick' : 'healthy'} scale={2.2} />
          </View>
          <View style={{ position: 'absolute', top: 210, alignSelf: 'center', alignItems: 'center' }}>
            <View style={{ marginBottom: -50, zIndex: 1 }}>
              <Blob state={friend.state} scale={3} />
            </View>
            <HomeIslandArt scale={2.8} />
          </View>
          <View style={{ position: 'absolute', top: 390, left: 30 }}>
            <MapIslandArt type="screen" state={friend.state === 'critical' ? 'critical' : 'sick'} scale={2} />
          </View>
          <View style={{ position: 'absolute', top: 370, right: 20 }}>
            <MapIslandArt type="learn" state="sick" scale={2} locked />
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
    </WaterBg>
  );
}

export default function FriendsScreen() {
  const [nudged, setNudged]     = useState<Set<string>>(new Set());
  const [visiting, setVisiting] = useState<Friend | null>(null);

  useFocusEffect(
    useCallback(() => {
      setTabAccentMode(visiting ? 'blue' : 'green');
    }, [visiting])
  );

  useEffect(() => {
    setTabAccentMode(visiting ? 'blue' : 'green');
  }, [visiting]);

  if (visiting) return <FriendVisit friend={visiting} onBack={() => setVisiting(null)} />;

  const needsAttention = FRIENDS.filter(f => f.state === 'sick' || f.state === 'critical');
  const doingWell      = FRIENDS.filter(f => f.state !== 'sick' && f.state !== 'critical');

  const renderCard = (f: Friend) => (
    <FriendCard
      key={f.id} f={f}
      nudged={nudged.has(f.id)}
      onNudge={() => setNudged(prev => new Set([...prev, f.id]))}
      onVisit={() => setVisiting(f)}
    />
  );

  return (
    <WorldBg>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 54 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <H1>Friends</H1>
            </View>
            <Pressable onPress={() => {}}>
              <View style={{ width: 40, height: 40, borderRadius: UI.radius.control, backgroundColor: UI.surface.cream, borderWidth: 1, borderColor: UI.border.base, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person-add-outline" size={17} color="rgba(232,224,212,0.75)" />
              </View>
            </Pressable>
          </View>

          <View style={{ backgroundColor: UI.surface.base, borderRadius: UI.radius.card, borderWidth: 1, borderColor: UI.border.sky, padding: 14, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 76, height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <HomeIslandArt scale={1.05} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 15, color: '#E8E0D4' }}>
                  {needsAttention.length} World{needsAttention.length === 1 ? '' : 's'} Need Support
                </Text>
                <Text style={{ fontFamily: 'PixelifySans_400Regular', fontSize: 12, color: UI.text.muted, lineHeight: 17 }}>
                  Send A Nudge Or Visit An Island To Check In.
                </Text>
              </View>
            </View>
          </View>

          <SectionDivider label="Worlds" style={{ marginTop: 20, marginBottom: 12 }} />

          {needsAttention.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Eyebrow style={{ marginBottom: 9, color: 'rgba(235,130,120,0.88)' }}>Needs Support</Eyebrow>
              {needsAttention.map(renderCard)}
            </View>
          )}

          {doingWell.length > 0 && (
            <View>
              <Eyebrow style={{ marginBottom: 9 }}>All Worlds</Eyebrow>
              {doingWell.map(renderCard)}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </WorldBg>
  );
}
