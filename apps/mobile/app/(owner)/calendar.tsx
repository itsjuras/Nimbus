import { useState, useRef } from 'react'
import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useJobs } from '../../hooks/useJobs'
import { useClients } from '../../hooks/useClients'
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
  const { bottom } = useSafeAreaInsets()
  const touchStartX = useRef<number | null>(null)

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
  }
  function nextMonth() {
    setCurrent(new Date(year, month + 1, 1))
  }

  const today = new Date()

  // Build weeks: fill leading/trailing slots with prev/next month days
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  type Cell = { day: number; current: boolean }
  const cells: Cell[] = [
    ...Array.from({ length: firstDay }, (_, i) => ({
      day: daysInPrevMonth - firstDay + 1 + i,
      current: false,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, current: true })),
  ]
  let trailing = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing++, current: false })
  }
  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, padding: 16, paddingBottom: 50 + bottom + 4 + 28 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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

        {/* Calendar card fills the rest of the page */}
        <View
          style={{
            flex: 1,
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor,
            padding: 12,
          }}
        >
          {/* Month navigation */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable onPress={prevMonth} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ color: textColor, fontSize: 20 }}>‹</Text>
            </Pressable>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
              {MONTHS[month]!.toUpperCase()} {year}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12} style={{ padding: 8 }}>
              <Text style={{ color: textColor, fontSize: 20 }}>›</Text>
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: mutedColor, letterSpacing: 0.8, fontWeight: '600' }}>
                  {d.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid — weeks stretch to fill remaining vertical space */}
          <View
            style={{ flex: 1, gap: 4 }}
            onTouchStart={(e) => { touchStartX.current = e.nativeEvent.pageX }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return
              const delta = e.nativeEvent.pageX - touchStartX.current
              if (Math.abs(delta) > 50) delta < 0 ? nextMonth() : prevMonth()
              touchStartX.current = null
            }}
          >
            {weeks.map((week, wi) => (
              <View key={wi} style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                {week.map((cell, di) => {
                  const { day, current } = cell
                  const monthOffset = current ? 0 : di < 4 && wi === 0 ? -1 : 1
                  const date = new Date(year, month + monthOffset, day)
                  const isToday = current && date.toDateString() === today.toDateString()
                  const dayJobs = current ? jobsByDay.get(day) ?? [] : []
                  const outsideColor = dark ? '#374151' : '#d1d5db'

                  return (
                    <Pressable
                      key={`${wi}-${di}`}
                      onPress={() => current && setSelectedDate(date)}
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        padding: 4,
                        alignItems: 'center',
                        backgroundColor: isToday ? (dark ? '#1f2937' : '#f3f4f6') : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isToday ? '700' : '500',
                          color: !current ? outsideColor : textColor,
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
                            backgroundColor: dark ? '#9ca3af' : '#374151',
                            marginTop: 3,
                          }}
                        />
                      )}
                    </Pressable>
                  )
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Selected day jobs — centered modal matching the web */}
      <Modal
        visible={selectedDate != null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedDate(null)}
      >
        <Pressable
          onPress={() => setSelectedDate(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 380,
              maxHeight: '75%',
              backgroundColor: cardBg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 12,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
                paddingHorizontal: 20,
                paddingVertical: 14,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() => setSelectedDate(null)}
                hitSlop={8}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 18, color: mutedColor, lineHeight: 18 }}>×</Text>
              </Pressable>
            </View>

            {/* Body */}
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
              {selectedJobs.length === 0 ? (
                <Text style={{ color: mutedColor, textAlign: 'center', paddingVertical: 24, fontSize: 14 }}>
                  No jobs scheduled
                </Text>
              ) : (
                selectedJobs.map((job) => {
                  const chip = chipStyle(job.status, dark)
                  return (
                    <Pressable
                      key={job.id}
                      onPress={() => { setSelectedDate(null); router.push(`/(owner)/jobs/${job.id}`) }}
                    >
                      <View style={{
                        backgroundColor: bg,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor,
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 4, textAlign: 'center' }}>
                          {clientMap.get(job.clientId) ?? '—'}
                        </Text>
                        <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 10 }}>
                          {new Date(job.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: chip.bg }}>
                          <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: chip.text }}>
                            {STATUS_LABEL[job.status]}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const STATUS_LABEL: Record<Job['status'], string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  missed: 'Missed',
}

function chipStyle(status: Job['status'], dark: boolean): { bg: string; text: string } {
  switch (status) {
    case 'scheduled':
      return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#9ca3af' : '#4b5563' }
    case 'in_progress':
      return { bg: dark ? '#f3f4f6' : '#111827', text: dark ? '#111827' : '#ffffff' }
    case 'completed':
      return { bg: dark ? '#374151' : '#e5e7eb', text: dark ? '#d1d5db' : '#374151' }
    case 'missed':
      return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#6b7280' : '#9ca3af' }
  }
}
