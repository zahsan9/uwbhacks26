import { Tabs } from 'expo-router';
import { VQ } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: VQ.ink,
      tabBarInactiveTintColor: VQ.inkDim,
      tabBarStyle: { backgroundColor: VQ.seashellSoft, borderTopColor: VQ.border },
      tabBarLabelStyle: { fontFamily: 'PixelifySans_500Medium', fontSize: 11 },
    }}>
      <Tabs.Screen name="index"   options={{ title: 'Home',    tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends', tabBarIcon: ({ color }) => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => null }} />
    </Tabs>
  );
}
