import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import PixelGrid from './PixelGrid';
import { AvatarState, IslandType } from './theme';

const ISLAND_PALM = [
  '.................llll...........','..............LLlllLLL..........','.............LLLLllLLLL.........',
  '............LLLLllllLLLL........','.............LLllllllLL.........','..............ttlllLL...........',
  '..............tttt...............','.............ttTt...............', '.............tTtt..............f',
  '............ttTtt............fff','...........sstTtttss.........fff','..........ssssttsssssss....fff..',
  '.........sssSssssSsssssss.ff....','........ssssssssssssssssss......','.......ssssSssssssssSssssssss...',
  '......dddssssssssssssssssssddd..', '.....dddddssssssssssssssdddddd..','....ddddddddssssssssddddddddd...',
  '....ddddddddddddddddddddddd.....','.....dddddddddddddddddddd.......','.......ddddddddddddddd..........',
  '....AAAAAAAAAAAAAAAAAAAAAAAAA...','.....aaaaaaaaaaaaaaaaaaaaaaaa...',
];
const ISLAND_MOUNTAIN = [
  '................................','.............MM.................','............MMMM................',
  '...........MMwwMM...............','..........MMwwwwMM..............', '.........MMwwwwwwMM.............',
  '........MMwwwwwwwwMM............','.......MMMMMMMMMMMMMM...........','......MMMMMMMMMMMMMMMM..........',
  '....nnMMMMMMMMMMMMMMMMnn........','...nnnnnnnMMMMMMMMnnnnnnn.......','..nnnnnnnnnnnnnnnnnnnnnnnn......',
  '.ssssnnnnnnnnnnnnnnnnnnnnsss....','ssssssssnnnnnnnnnnnnnnssssssss..','.sssssssssssssssssssssssssss....',
  '..ddddsssssssssssssssssddd......','...dddddddddddddddddddddd.......','....ddddddddddddddddddd.........',
  '......dddddddddddddd............','...AAAAAAAAAAAAAAAAAAAAAAAAAA...','....aaaaaaaaaaaaaaaaaaaaaaaaaa..',
];
const ISLAND_VOLCANO = [
  '................................','..........GGG...................','..........GGG...................',
  '.........rGGGr..................','........rrRRRrr.................', '.......rRRRRRRRr................',
  '......rrRRRRRRRrr...............', '.....rrRRRRRRRRRRrr.............','....rrRRRRRRRRRRRRrr............',
  '...vvRRRRRRRRRRRRRRvv...........','..vvvvvvvvRRRRRvvvvvvvv.........', '.vvvvvvvvvvvvvvvvvvvvvvv........',
  '.sssvvvvvvvvvvvvvvvvssss........','ssssssssvvvvvvvvvvsssssssss.....', '.ssssssssssssssssssssssssss.....',
  '..ddddssssssssssssssssddd.......','...ddddddddddddddddddddd........', '.....dddddddddddddddd...........',
  '...AAAAAAAAAAAAAAAAAAAAAAAAA....','....aaaaaaaaaaaaaaaaaaaaaaaaa...',
];
const ISLAND_BAMBOO = [
  '.................lllll..........','................lLLLLLl.........', '.................lllll..........',
  '..lll......lll....lll...........', '.lLLLl....lLLLl..lLLLl..........','..lll......lll....lll...........',
  '..|||......|||....|||...........','..|||......|||....|||...........', '..|++......|++....|++...........',
  '..|||......|||....|||...........','..|||......|||....|||...........','..|++......|++....|++...........',
  '..sssssssssssssssssssss.........', '.sssssssssssssssssssssss........','.ssssssssssssssssssssssss.......',
  '..ddddsssssssssssssssddd........','...dddddddddddddddddddd.........','....ddddddddddddddd.............',
  '..AAAAAAAAAAAAAAAAAAAAAAAAA.....','...aaaaaaaaaaaaaaaaaaaaaaaaa....',
];
const ISLAND_SHRINE = [
  '................................','.............rrrrr..............','............rrRRRrr.............',
  '...........rrrrrrrrr............','...........pppppppp.............', '...........pwwwwwwp.............',
  '...........pwPPPPwp.............','...........pppppppp.............','..........rrrrrrrrrr............',
  '..........rrrrrrrrrr............','.........pppppppppppp...........','.........pwwwwPwwwwwp...........',
  '.........pppppppppppp...........','........ssssssssssssss..........', '.......sssssssssssssss..........',
  '......ssssssssssssssssss........','.....ddddssssssssssssdddd.......','......dddddddddddddddddd........',
  '........dddddddddddddd..........','....AAAAAAAAAAAAAAAAAAAAAA......','.....aaaaaaaaaaaaaaaaaaaaaaa....',
];

const ISLAND_ROWS: Record<IslandType, string[]> = {
  walk: ISLAND_PALM, sleep: ISLAND_MOUNTAIN, screen: ISLAND_VOLCANO, learn: ISLAND_BAMBOO, quest: ISLAND_SHRINE,
};

type IslandPalette = Record<string, string>;
const ISLAND_PALETTES: Record<AvatarState, IslandPalette> = {
  thriving: { s:'#EAE4DA',S:'#f4efe6',d:'#c8bda6',L:'#3f8577',l:'#245E55',t:'#5a4a3a',T:'#2a1f15',f:'#EAA7C7',M:'#808BC5',w:'#EAE4DA',n:'#3f8577',r:'#4a3a2a',R:'#6a5a42',v:'#3f8577',G:'#7a6856','|':'#3f8577','+':'#1b4a43',p:'#C63F3E',P:'#EAE4DA',A:'#b3e5ed',a:'#5ab3c0' },
  healthy:  { s:'#EAE4DA',S:'#f4efe6',d:'#beb29a',L:'#8eb2aa',l:'#3f8577',t:'#5a4a3a',T:'#3a2a18',f:'#ED773C',M:'#a0a9d0',w:'#d8deec',n:'#8eb2aa',r:'#5a4838',R:'#6a5a42',v:'#8eb2aa',G:'#9a6030','|':'#8eb2aa','+':'#3f8577',p:'#C63F3E',P:'#EAE4DA',A:'#a0d4de',a:'#4896a2' },
  sick:     { s:'#dcd4c2',S:'#e6ded0',d:'#aa9a7e',L:'#b8a68a',l:'#7a6a4a',t:'#6a5a4a',T:'#3a2a1a',f:'#ED773C',M:'#8a90a4',w:'#b8bcca',n:'#a8a07a',r:'#5a4a3a',R:'#6a5a42',v:'#a8a07a',G:'#cc5518','|':'#a8a07a','+':'#6a5a3a',p:'#a85234',P:'#d8c08a',A:'#8cbbc6',a:'#3d7e8a' },
  critical: { s:'#a89a7e',S:'#b8aa8a',d:'#706248',L:'#7a7258',l:'#4a4230',t:'#4a3a2a',T:'#1D1D1B',f:'#8a4a2a',M:'#6a6a7a',w:'#8a8a96',n:'#58604a',r:'#38281a',R:'#483828',v:'#58604a',G:'#ff6600','|':'#6a6850','+':'#38342a',p:'#7a3a3a',P:'#a89868',A:'#6e9098',a:'#2e636a' },
};

const SPARKLE_ROWS = ['.f.', 'fFf', '.f.'];

interface Props {
  type?: IslandType;
  state?: AvatarState;
  scale?: number;
  locked?: boolean;
  bob?: boolean;
}

export default function Island({ type = 'walk', state = 'healthy', scale = 4, locked = false, bob = true }: Props) {
  const bobAnim    = useRef(new Animated.Value(0)).current;
  const twinkleAnim = useRef(new Animated.Value(1)).current;

  const dur = 3 + (type.charCodeAt(0) % 4) * 0.3;

  useEffect(() => {
    if (!bob) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, { toValue: -5, duration: dur * 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(bobAnim, { toValue: 0,  duration: dur * 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
    return () => bobAnim.stopAnimation();
  }, [type, bob]);

  useEffect(() => {
    if (state !== 'thriving') return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(twinkleAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    return () => twinkleAnim.stopAnimation();
  }, [state]);

  const rows    = ISLAND_ROWS[type];
  const palette = ISLAND_PALETTES[state];
  const w       = (rows[0]?.length ?? 32) * scale;

  return (
    <Animated.View style={{ transform: [{ translateY: bob ? bobAnim : 0 }], alignItems: 'center' }}>
      <View style={{ position: 'absolute', bottom: -2, width: w * 0.65, height: 6, borderRadius: 3, backgroundColor: 'rgba(29,29,27,0.18)', alignSelf: 'center' }} />
      <PixelGrid rows={rows} palette={palette} scale={scale} />
      {state === 'thriving' && (
        <>
          <Animated.View style={{ position: 'absolute', bottom: 10, left: '20%', opacity: twinkleAnim }}>
            <PixelGrid rows={SPARKLE_ROWS} palette={{ f: '#EAA7C7', F: '#EAE4DA' }} scale={2} />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', bottom: 14, right: '22%', opacity: Animated.subtract(1.3, twinkleAnim) as any }}>
            <PixelGrid rows={SPARKLE_ROWS} palette={{ f: '#EAC119', F: '#EAE4DA' }} scale={2} />
          </Animated.View>
        </>
      )}
      {locked && (
        <View style={{ position: 'absolute', top: '30%', alignSelf: 'center' }}>
          <View style={{ backgroundColor: 'rgba(29,29,27,0.82)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 }}>
            <Text style={{ color: '#EAE4DA', fontSize: 10, letterSpacing: 1.2 }}>locked</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}
