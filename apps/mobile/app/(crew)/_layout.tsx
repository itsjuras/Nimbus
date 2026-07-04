import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FloatingTabBar } from '../../components/ui/FloatingTabBar'

export default function CrewLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { paddingBottom: 100 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="jobs/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
