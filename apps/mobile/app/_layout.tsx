import '../global.css'
import { useEffect } from 'react'
import { View, ActivityIndicator, useColorScheme } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFonts,
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import { useAuth } from '../hooks/useAuth'
import { registerForPushNotifications } from '../lib/notifications'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_700Bold,
  })

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  )
}

function AuthGate() {
  const { session, profile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const scheme = useColorScheme()

  useEffect(() => {
    if (loading) return

    SplashScreen.hideAsync()

    const inAuth = segments[0] === '(auth)'
    const inOwner = segments[0] === '(owner)'
    const inCrew = segments[0] === '(crew)'

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login')
      return
    }

    if (!profile) return

    if (profile.role === 'owner' || profile.role === 'manager') {
      if (!inOwner) router.replace('/(owner)/')
    } else {
      if (!inCrew) router.replace('/(crew)/')
    }
  }, [session, profile, loading, segments, router])

  useEffect(() => {
    if (!session) return
    registerForPushNotifications()
  }, [session])

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const jobId = response.notification.request.content.data?.['jobId'] as string | undefined
      if (jobId) {
        const role = profile?.role
        if (role === 'owner' || role === 'manager') {
          router.push(`/(owner)/jobs/${jobId}`)
        } else {
          router.push(`/(crew)/jobs/${jobId}`)
        }
      }
    })
    return () => sub.remove()
  }, [profile, router])

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: scheme === 'dark' ? '#111827' : '#ffffff',
        }}
      >
        <ActivityIndicator size="large" color={scheme === 'dark' ? '#f9fafb' : '#111827'} />
      </View>
    )
  }

  return <Slot />
}
