import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { useTabAccentMode } from '../../src/tabAccent';
import { VQ } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  label,
  focused,
  blue,
}: {
  name: IoniconName;
  label: string;
  focused: boolean;
  blue: boolean;
}) {
  const active = blue ? VQ.cyanBright : '#E8E0D4';
  const inactive = blue ? 'rgba(207,234,242,0.35)' : 'rgba(232,224,212,0.35)';
  const activeBg = blue ? 'rgba(234,228,218,0.94)' : 'rgba(232,224,212,0.14)';
  const activeFg = blue ? VQ.midnightSoft : active;
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const bgOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const borderOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={{ width: 66, alignItems: 'center', justifyContent: 'center', gap: 4, transform: [{ translateY: 2 }] }}>
      <Animated.View
        style={{
          minWidth: 44,
          height: 34,
          paddingHorizontal: 10,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            backgroundColor: activeBg,
            opacity: bgOpacity,
          }}
        />
        <Ionicons
          name={focused ? name : `${name}-outline` as IoniconName}
          size={18}
          color={focused ? activeFg : inactive}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(207,234,242,0.18)',
            opacity: borderOpacity,
          }}
        />
      </Animated.View>
      <Animated.Text
        style={{
          fontFamily: 'PixelifySans_600SemiBold',
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: focused ? active : inactive,
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.82, 1],
          }),
        }}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

export default function TabLayout() {
  const accent = useTabAccentMode();
  const blueTabs = accent === 'blue';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: blueTabs ? VQ.midnightSoft : '#0a1a0b',
        borderTopWidth: 0,
        height: 82,
        paddingTop: 12,
        paddingBottom: 10,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        position: 'absolute',
        shadowColor: blueTabs ? VQ.midnight : '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }}>
      <Tabs.Screen name="index"   options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" label="Home" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="map"     options={{ tabBarIcon: ({ focused }) => <TabIcon name="map" label="Map" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="friends" options={{ tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" label="Friends" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" label="Profile" focused={focused} blue={blueTabs} /> }} />
    </Tabs>
  );
}
