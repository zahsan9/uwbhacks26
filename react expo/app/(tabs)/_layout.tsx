import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTabAccentMode } from '../../src/tabAccent';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused, blue }: { name: IoniconName; focused: boolean; blue: boolean }) {
  const active = blue ? '#D6EDF2' : '#E8E0D4';
  const inactive = blue ? 'rgba(214,237,242,0.35)' : 'rgba(232,224,212,0.35)';

  return (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: 3 }] }}>
      <Ionicons
        name={focused ? name : `${name}-outline` as IoniconName}
        size={24}
        color={focused ? active : inactive}
      />
      {focused && (
        <View style={{ position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: active }} />
      )}
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
        backgroundColor: blueTabs ? '#12384a' : '#0a1a0b',
        borderTopWidth: 0,
        height: 72,
        paddingTop: 16,
        paddingBottom: 6,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'absolute',
        shadowColor: blueTabs ? '#08161e' : '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }}>
      <Tabs.Screen name="index"   options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="map"     options={{ tabBarIcon: ({ focused }) => <TabIcon name="map" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="friends" options={{ tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} blue={blueTabs} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} blue={blueTabs} /> }} />
    </Tabs>
  );
}
