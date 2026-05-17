import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { FloatingTabBar } from '../../components/ui/FloatingTabBar'

export default function OwnerLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        contentStyle: { paddingBottom: 100 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
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
        name="clients/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="clients/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="crew/index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="crew/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="invoices"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
