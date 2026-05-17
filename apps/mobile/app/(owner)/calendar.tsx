import { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJobs } from '../../hooks/useJobs'
import { useClients } from '../../hooks/useClients'
import { StatusChip } from '../../components/ui/StatusChip'
import type { Job } from '@nimbus/shared'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarScreen() {
  const [current, setCurrent] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const router = useRouter()
  const { dark } = useTheme()

  const year = current.getFullYear()
  const month = current.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthStart = new Date(year, month, 1).toISOString()
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data: jobs } = useJobs({ from: monthStart, to: monthEnd })
  const { data: clients } = useClients()
  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const jobsByDay = new Map<number, Job[]>()
  ;(jobs ?? []).forEach((job) => {
    const d = new Date(job.scheduledAt).getDate()
    const arr = jobsByDay.get(d) ?? []
    arr.push(job)
    jobsByDay.set(d, arr)
  })

  const selectedJobs = selectedDate
    ? (jobs ?? []).filter(
        (j) => new Date(j.scheduledAt).toDateString() === selectedDate.toDateString(),
      )
    : []

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  function prevMonth() {
    setCurrent(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }
  function nextMonth() {
    setCurrent(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const today = new Date()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: textColor,
              letterSpacing: 1,
              fontFamily: 'IBMPlexMono_700Bold',
            }}
          >
            CALENDAR
          </Text>
          <ThemeToggle />
        </View>

        {/* Month navigation */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable onPress={prevMonth} style={{ padding: 8 }}>
              <Text style={{ color: textColor, fontSize: 18 }}>‹</Text>
            </Pressable>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable onPress={nextMonth} style={{ padding: 8 }}>
              <Text style={{ color: textColor, fontSize: 18 }}>›</Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 0.5 }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`empty-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(year, month, day)
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selectedDate?.toDateString() === date.toDateString()
              const dayJobs = jobsByDay.get(day) ?? []

              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDate(isSelected ? null : date)}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: isSelected
                      ? dark ? '#f9fafb' : '#111827'
                      : isToday
                      ? dark ? '#1f2937' : '#f3f4f6'
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isToday || isSelected ? '700' : '400',
                      color: isSelected
                        ? dark ? '#111827' : '#ffffff'
                        : isToday
                        ? textColor
                        : mutedColor,
                    }}
                  >
                    {day}
                  </Text>
                  {dayJobs.length > 0 && (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: isSelected
                          ? dark ? '#374151' : '#9ca3af'
                          : dark ? '#9ca3af' : '#374151',
                        marginTop: 2,
                      }}
                    />
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Selected day jobs */}
        {selectedDate != null && (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, letterSpacing: 1, marginBottom: 12 }}>
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
            </Text>
            {selectedJobs.length === 0 ? (
              <Text style={{ color: dark ? '#374151' : '#d1d5db', textAlign: 'center', paddingVertical: 20 }}>
                No jobs on this day
              </Text>
            ) : (
              selectedJobs.map((job) => (
                <Pressable
                  key={job.id}
                  onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                  style={({ pressed }) => ({
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor,
                    padding: 14,
                    marginBottom: 10,
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  })}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>
                      {clientMap.get(job.clientId) ?? '—'}
                    </Text>
                    <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                      {new Date(job.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <StatusChip status={job.status} />
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
