import { useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJobs, useCreateJob } from '../../../hooks/useJobs'
import { useClientChecklist } from '../../../hooks/useChecklists'
import { useClients } from '../../../hooks/useClients'
import { useCrewMembers } from '../../../hooks/useCrew'
import { useCreateInvoice } from '../../../hooks/useInvoices'
import { JobCard } from '../../../components/jobs/JobCard'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { useTheme } from '../../../contexts/ThemeContext'
import type { Client, Profile, JobStatus } from '@nimbus/shared'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const STATUSES: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'scheduled', label: 'SCHEDULED' },
  { value: 'in_progress', label: 'IN PROGRESS' },
  { value: 'completed', label: 'COMPLETED' },
  { value: 'missed', label: 'MISSED' },
]

export default function JobsScreen() {
  const [filter, setFilter] = useState<JobStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const { dark } = useTheme()

  const { data: jobs, isLoading } = useJobs(filter !== 'all' ? { status: filter } : {})
  const { data: clients } = useClients()
  const clientMap = new Map(clients?.map((c) => [c.id, c.name]) ?? [])

  const bg = dark ? '#030712' : '#f9fafb'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const chipBg = (active: boolean) => active ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#f3f4f6')
  const chipText = (active: boolean) => active ? (dark ? '#111827' : '#ffffff') : mutedColor

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
            JOBS
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => setShowModal(true)}>
              <View style={{ backgroundColor: dark ? '#f9fafb' : '#111827', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>SCHEDULE JOB</Text>
              </View>
            </Pressable>
            <ThemeToggle />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={{ backgroundColor: chipBg(filter === value), paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: chipText(filter === value) }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {(jobs ?? []).length === 0 ? (
            <EmptyState message="No jobs found" />
          ) : (
            (jobs ?? [])
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  clientName={clientMap.get(job.clientId) ?? '—'}
                  onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                />
              ))
          )}
        </ScrollView>
      )}

      <ScheduleJobModal visible={showModal} onClose={() => setShowModal(false)} dark={dark} />
    </SafeAreaView>
  )
}

function ScheduleJobModal({ visible, onClose, dark }: { visible: boolean; onClose: () => void; dark: boolean }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedCrew, setSelectedCrew] = useState<Profile[]>([])
  const [scheduledAt, setScheduledAt] = useState(roundToNextHour())
  const [notes, setNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [generateInvoice, setGenerateInvoice] = useState(false)
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [showCrewPicker, setShowCrewPicker] = useState(false)

  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()
  const { data: checklist } = useClientChecklist(selectedClient?.id ?? null)
  const createJob = useCreateJob()
  const createInvoice = useCreateInvoice()

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  function reset() {
    setSelectedClient(null)
    setSelectedCrew([])
    setScheduledAt(roundToNextHour())
    setNotes('')
    setIsRecurring(false)
    setRecurrence('weekly')
    setGenerateInvoice(false)
    setInvoiceAmount('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function removeCrew(id: string) {
    setSelectedCrew((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleSubmit() {
    if (!selectedClient || selectedCrew.length === 0) return
    try {
      const occurrencesMap = { daily: 30, weekly: 52, biweekly: 26, monthly: 12 }
      await createJob.mutateAsync({
        clientId: selectedClient.id,
        checklistId: checklist?.checklist.id,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes.trim() || undefined,
        crewIds: selectedCrew.map((m) => m.id),
        ...(isRecurring && {
          recurrence: {
            frequency: recurrence,
            occurrences: occurrencesMap[recurrence],
          },
        }),
      })
      if (generateInvoice && invoiceAmount.trim()) {
        const total = Math.round(parseFloat(invoiceAmount) * 100)
        if (!isNaN(total) && total > 0) {
          const dueAt = new Date(scheduledAt)
          dueAt.setDate(dueAt.getDate() + 30)
          await createInvoice.mutateAsync({
            clientId: selectedClient.id,
            currency: 'cad',
            dueDate: dueAt.toISOString(),
            lineItems: [{ description: 'Cleaning service', quantity: 1, unitAmountCents: total }],
          })
        }
      }
      handleClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      Alert.alert('Error', msg)
    }
  }

  const isPending = createJob.isPending || createInvoice.isPending
  const canSubmit = selectedClient != null && selectedCrew.length > 0 && !isPending

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
        }}>
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            SCHEDULE JOB
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
          {/* CLIENT */}
          <View>
            <SectionLabel label="Client" color={mutedColor} />
            {selectedClient ? (
              <View style={{
                backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
                paddingHorizontal: 20, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{selectedClient.name}</Text>
                <Pressable onPress={() => setSelectedClient(null)} hitSlop={8}>
                  <Text style={{ fontSize: 20, color: mutedColor, lineHeight: 22 }}>×</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowClientPicker(true)}>
                <View style={{
                  borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: mutedColor,
                  paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, letterSpacing: 0.5 }}>+ ADD CLIENT</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* DATE */}
          <View>
            <SectionLabel label="Date" color={mutedColor} />
            <MiniCalendar
              selected={scheduledAt}
              onSelect={(date) => {
                const next = new Date(scheduledAt)
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                setScheduledAt(next)
              }}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          </View>

          {/* TIME */}
          <View>
            <SectionLabel label="Time" color={mutedColor} />
            <TimeScrollPicker
              scheduledAt={scheduledAt}
              onChange={setScheduledAt}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          </View>

          {/* REPEAT */}
          <View>
            <SectionLabel label="Repeat" color={mutedColor} />
            <SegmentedControl
              options={[{ value: 'one-time', label: 'ONE TIME' }, { value: 'recurring', label: 'RECURRING' }]}
              selected={isRecurring ? 'recurring' : 'one-time'}
              onSelect={(v) => setIsRecurring(v === 'recurring')}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
            {isRecurring && (
              <View style={{ marginTop: 10 }}>
                <SegmentedControl
                  options={[
                    { value: 'daily', label: 'DAILY' },
                    { value: 'weekly', label: 'WEEKLY' },
                    { value: 'biweekly', label: 'BIWEEKLY' },
                    { value: 'monthly', label: 'MONTHLY' },
                  ]}
                  selected={recurrence}
                  onSelect={(v) => setRecurrence(v as typeof recurrence)}
                  dark={dark}
                  cardBg={cardBg}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  borderColor={borderColor}
                  slim
                />
              </View>
            )}
          </View>

          {/* CREW */}
          <View>
            <SectionLabel label="Crew" color={mutedColor} />
            {selectedCrew.length > 0 && (
              <View style={{ gap: 8, marginBottom: 8 }}>
                {selectedCrew.map((member) => (
                  <View key={member.id} style={{
                    backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
                    paddingHorizontal: 20, paddingVertical: 14,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{member.fullName}</Text>
                    <Pressable onPress={() => removeCrew(member.id)} hitSlop={8}>
                      <Text style={{ fontSize: 20, color: mutedColor, lineHeight: 22 }}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Pressable onPress={() => setShowCrewPicker(true)}>
              <View style={{
                borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: mutedColor,
                paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, letterSpacing: 0.5 }}>+ ADD CREW MEMBER</Text>
              </View>
            </Pressable>
          </View>

          {/* INVOICE */}
          <View>
            <SectionLabel label="Invoice" color={mutedColor} />
            <SegmentedControl
              options={[{ value: 'no', label: 'NO INVOICE' }, { value: 'yes', label: 'GENERATE INVOICE' }]}
              selected={generateInvoice ? 'yes' : 'no'}
              onSelect={(v) => setGenerateInvoice(v === 'yes')}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
            {generateInvoice && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  value={invoiceAmount}
                  onChangeText={setInvoiceAmount}
                  placeholder="Amount (e.g. 250.00)"
                  placeholderTextColor={mutedColor}
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
                    paddingHorizontal: 20, paddingVertical: 14,
                    fontSize: 15, color: textColor,
                  }}
                />
                <Text style={{ fontSize: 11, color: mutedColor, marginTop: 6, marginLeft: 4 }}>
                  Invoice will be created as a draft, due 30 days from the job date.
                </Text>
              </View>
            )}
          </View>

          {/* NOTES */}
          <View>
            <SectionLabel label="Notes (optional)" color={mutedColor} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
                paddingHorizontal: 20, paddingVertical: 14,
                fontSize: 14, color: textColor, minHeight: 80, textAlignVertical: 'top',
              }}
            />
          </View>

          {/* SUBMIT */}
          <Pressable onPress={handleSubmit} disabled={!canSubmit}>
            <View style={{
              backgroundColor: canSubmit ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: canSubmit ? (dark ? '#111827' : '#ffffff') : mutedColor, letterSpacing: 0.5 }}>
                {isPending ? 'SCHEDULING…' : 'SCHEDULE JOB'}
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>

      {/* Client picker overlay */}
      <Modal visible={showClientPicker} animationType="fade" transparent onRequestClose={() => setShowClientPicker(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}
          onPress={() => setShowClientPicker(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor,
              maxHeight: '70%', overflow: 'hidden',
              shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
            }}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderBottomWidth: 1, borderBottomColor: borderColor, paddingHorizontal: 20, paddingVertical: 14,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>SELECT CLIENT</Text>
              <Pressable onPress={() => setShowClientPicker(false)} hitSlop={8}>
                <Text style={{ fontSize: 20, color: mutedColor, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
              {(clients ?? []).map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => { setSelectedClient(client); setShowClientPicker(false) }}
                >
                  <View style={{
                    backgroundColor: dark ? '#1f2937' : '#f9fafb',
                    borderRadius: 12, borderWidth: 1, borderColor,
                    paddingHorizontal: 16, paddingVertical: 14,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{client.name}</Text>
                    {client.address != null && (
                      <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{client.address}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Crew picker overlay */}
      <Modal visible={showCrewPicker} animationType="fade" transparent onRequestClose={() => setShowCrewPicker(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}
          onPress={() => setShowCrewPicker(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor,
              maxHeight: '70%', overflow: 'hidden',
              shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
            }}
          >
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              borderBottomWidth: 1, borderBottomColor: borderColor, paddingHorizontal: 20, paddingVertical: 14,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>ADD CREW MEMBER</Text>
              <Pressable onPress={() => setShowCrewPicker(false)} hitSlop={8}>
                <Text style={{ fontSize: 20, color: mutedColor, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
              {(crew ?? []).filter((m) => !selectedCrew.some((s) => s.id === m.id)).map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => { setSelectedCrew((prev) => [...prev, member]); setShowCrewPicker(false) }}
                >
                  <View style={{
                    backgroundColor: dark ? '#1f2937' : '#f9fafb',
                    borderRadius: 12, borderWidth: 1, borderColor,
                    paddingHorizontal: 16, paddingVertical: 14,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{member.fullName}</Text>
                    <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {member.role}
                    </Text>
                  </View>
                </Pressable>
              ))}
              {(crew ?? []).filter((m) => !selectedCrew.some((s) => s.id === m.id)).length === 0 && (
                <Text style={{ color: mutedColor, textAlign: 'center', paddingVertical: 20, fontSize: 14 }}>
                  All crew members assigned
                </Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  )
}

function SegmentedControl({
  options, selected, onSelect, dark, cardBg, textColor, mutedColor, borderColor, slim,
}: {
  options: { value: string; label: string }[]
  selected: string
  onSelect: (value: string) => void
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
  slim?: boolean
}) {
  const activeBg = dark ? '#f9fafb' : '#111827'
  const activeText = dark ? '#111827' : '#ffffff'

  return (
    <View style={{
      flexDirection: 'row', backgroundColor: cardBg,
      borderRadius: 14, borderWidth: 1, borderColor, padding: 4, gap: 4,
    }}>
      {options.map(({ value, label }) => {
        const active = selected === value
        return (
          <Pressable key={value} onPress={() => onSelect(value)} style={{ flex: 1 }}>
            <View style={{
              borderRadius: 10, paddingVertical: slim ? 8 : 10, alignItems: 'center',
              backgroundColor: active ? activeBg : 'transparent',
            }}>
              <Text style={{
                fontSize: slim ? 10 : 12, fontWeight: '700', letterSpacing: 0.5,
                color: active ? activeText : mutedColor,
              }}>
                {label}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function MiniCalendar({
  selected, onSelect, dark, cardBg, textColor, mutedColor, borderColor,
}: {
  selected: Date
  onSelect: (date: Date) => void
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
}) {
  const [current, setCurrent] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const touchStartX = useRef<number | null>(null)

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  type Cell = { day: number; isCurrentMonth: boolean }
  const cells: Cell[] = [
    ...Array.from({ length: firstDay }, (_, i) => ({ day: daysInPrevMonth - firstDay + 1 + i, isCurrentMonth: false })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, isCurrentMonth: true })),
  ]
  let trailing = 1
  while (cells.length % 7 !== 0) cells.push({ day: trailing++, isCurrentMonth: false })
  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const today = new Date()
  const selectedStr = selected.toDateString()
  const accentBg = dark ? '#f9fafb' : '#111827'
  const accentText = dark ? '#111827' : '#ffffff'
  const dimColor = dark ? '#374151' : '#d1d5db'

  return (
    <View
      style={{ backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor, padding: 12 }}
      onTouchStart={(e) => { touchStartX.current = e.nativeEvent.pageX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const delta = e.nativeEvent.pageX - touchStartX.current
        if (Math.abs(delta) > 40) {
          setCurrent(delta < 0 ? new Date(year, month + 1, 1) : new Date(year, month - 1, 1))
        }
        touchStartX.current = null
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Pressable onPress={() => setCurrent(new Date(year, month - 1, 1))} hitSlop={12} style={{ padding: 6 }}>
          <Text style={{ color: textColor, fontSize: 20, lineHeight: 22 }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 13, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
          {MONTHS[month]!.toUpperCase()} {year}
        </Text>
        <Pressable onPress={() => setCurrent(new Date(year, month + 1, 1))} hitSlop={12} style={{ padding: 6 }}>
          <Text style={{ color: textColor, fontSize: 20, lineHeight: 22 }}>›</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {WDAYS.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, color: mutedColor, fontWeight: '600', letterSpacing: 0.5 }}>{d}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((cell, di) => {
            const { day, isCurrentMonth } = cell
            const monthOffset = isCurrentMonth ? 0 : (di < 4 && wi === 0 ? -1 : 1)
            const date = new Date(year, month + monthOffset, day)
            const isSelected = isCurrentMonth && date.toDateString() === selectedStr
            const isToday = isCurrentMonth && date.toDateString() === today.toDateString()

            return (
              <Pressable
                key={`${wi}-${di}`}
                onPress={() => isCurrentMonth && onSelect(date)}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}
              >
                <View style={{
                  width: 34, height: 34, borderRadius: 17,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? accentBg : isToday ? (dark ? '#1f2937' : '#f3f4f6') : 'transparent',
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: isSelected || isToday ? '700' : '400',
                    color: isSelected ? accentText : !isCurrentMonth ? dimColor : textColor,
                  }}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      ))}
    </View>
  )
}

const ITEM_H = 44
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function TimeScrollPicker({
  scheduledAt, onChange, dark, cardBg, textColor, mutedColor, borderColor,
}: {
  scheduledAt: Date
  onChange: (date: Date) => void
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
}) {
  const h24 = scheduledAt.getHours()
  const h12 = h24 % 12 || 12
  const roundedMin = Math.round(scheduledAt.getMinutes() / 5) * 5 % 60

  const [isAM, setIsAM] = useState(h24 < 12)
  const [hourIdx, setHourIdx] = useState(h12 - 1)
  const [minIdx, setMinIdx] = useState(roundedMin / 5)

  function applyTime(hIdx: number, mIdx: number, am: boolean) {
    const hour12 = hIdx + 1
    const newH24 = am ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12)
    const next = new Date(scheduledAt)
    next.setHours(newH24, mIdx * 5, 0, 0)
    onChange(next)
  }

  const highlightBg = dark ? '#1f2937' : '#f3f4f6'

  return (
    <View>
      <View style={{ overflow: 'hidden' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: ITEM_H, left: 0, right: 0, height: ITEM_H,
            backgroundColor: highlightBg,
            borderRadius: 10,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScrollColumn
            items={HOURS}
            initialIdx={hourIdx}
            onSelectIdx={(idx) => { setHourIdx(idx); applyTime(idx, minIdx, isAM) }}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, width: 16, textAlign: 'center' }}>:</Text>
          <ScrollColumn
            items={MINUTES}
            initialIdx={minIdx}
            onSelectIdx={(idx) => { setMinIdx(idx); applyTime(hourIdx, idx, isAM) }}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <ScrollColumn
            items={['AM', 'PM']}
            initialIdx={isAM ? 0 : 1}
            onSelectIdx={(idx) => { const am = idx === 0; setIsAM(am); applyTime(hourIdx, minIdx, am) }}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <View style={{ width: 16 }} />
        </View>
      </View>
</View>
  )
}

function ScrollColumn({
  items, initialIdx, onSelectIdx, textColor, mutedColor,
}: {
  items: string[]
  initialIdx: number
  onSelectIdx: (idx: number) => void
  textColor: string
  mutedColor: string
}) {
  const [liveIdx, setLiveIdx] = useState(initialIdx)

  return (
    <ScrollView
      style={{ flex: 1, height: ITEM_H * 3 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      contentOffset={{ x: 0, y: initialIdx * ITEM_H }}
      scrollEventThrottle={16}
      onScroll={(e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
        setLiveIdx(Math.max(0, Math.min(idx, items.length - 1)))
      }}
      onMomentumScrollEnd={(e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H)
        const clamped = Math.max(0, Math.min(idx, items.length - 1))
        setLiveIdx(clamped)
        onSelectIdx(clamped)
      }}
    >
      <View style={{ height: ITEM_H }} />
      {items.map((item, i) => (
        <View key={i} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: i === liveIdx ? 20 : 15,
            fontWeight: i === liveIdx ? '700' : '400',
            color: i === liveIdx ? textColor : mutedColor,
          }}>
            {item}
          </Text>
        </View>
      ))}
      <View style={{ height: ITEM_H }} />
    </ScrollView>
  )
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color, marginBottom: 10, textTransform: 'uppercase' }}>
      {label}
    </Text>
  )
}

function roundToNextHour(): Date {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}
