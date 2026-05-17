import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJobs, useCreateJob, useClientChecklist } from '../../../hooks/useJobs'
import { useClients } from '../../../hooks/useClients'
import { useCrewMembers } from '../../../hooks/useCrew'
import { JobCard } from '../../../components/jobs/JobCard'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ThemeToggle } from '../../../components/ui/ThemeToggle'
import { useTheme } from '../../../contexts/ThemeContext'
import type { JobStatus } from '@nimbus/shared'

const STATUSES: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
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
  const chipBg = (active: boolean) => (active ? (dark ? '#f9fafb' : '#111827') : dark ? '#1f2937' : '#f3f4f6')
  const chipText = (active: boolean) => (active ? (dark ? '#111827' : '#ffffff') : mutedColor)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
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
            JOBS
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => setShowModal(true)}>
              <View
                style={{
                  backgroundColor: dark ? '#f9fafb' : '#111827',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
                  SCHEDULE JOB
                </Text>
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
              style={{
                backgroundColor: chipBg(filter === value),
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 0.5,
                  color: chipText(filter === value),
                }}
              >
                {label.toUpperCase()}
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

      <ScheduleJobModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        dark={dark}
      />
    </SafeAreaView>
  )
}

function ScheduleJobModal({ visible, onClose, dark }: { visible: boolean; onClose: () => void; dark: boolean }) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState(roundToNextHour())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [step, setStep] = useState<'client' | 'details'>('client')

  const { data: clients } = useClients()
  const { data: crew } = useCrewMembers()
  const { data: checklist } = useClientChecklist(selectedClientId)
  const createJob = useCreateJob()

  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#f9fafb'
  const selectedBg = dark ? '#f9fafb' : '#111827'
  const selectedText = dark ? '#111827' : '#ffffff'

  function reset() {
    setSelectedClientId(null)
    setSelectedCrewIds([])
    setScheduledAt(roundToNextHour())
    setNotes('')
    setStep('client')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function toggleCrew(id: string) {
    setSelectedCrewIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  async function handleSubmit() {
    if (!selectedClientId || !checklist || selectedCrewIds.length === 0) return
    try {
      await createJob.mutateAsync({
        clientId: selectedClientId,
        checklistId: checklist.id,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes.trim() || undefined,
        crewIds: selectedCrewIds,
      })
      handleClose()
    } catch {
      Alert.alert('Error', 'Failed to schedule job. Please try again.')
    }
  }

  const canSubmit =
    selectedClientId != null &&
    checklist != null &&
    selectedCrewIds.length > 0 &&
    !createJob.isPending

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: dark ? '#030712' : '#f9fafb' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          <Pressable onPress={handleClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            SCHEDULE JOB
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Client */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Client
            </Text>
            <View style={{ gap: 8 }}>
              {(clients ?? []).map((client) => {
                const active = selectedClientId === client.id
                return (
                  <Pressable
                    key={client.id}
                    onPress={() => setSelectedClientId(client.id)}
                    style={{
                      backgroundColor: active ? selectedBg : cardBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? (dark ? '#f9fafb' : '#111827') : borderColor,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: active ? selectedText : textColor }}>
                      {client.name}
                    </Text>
                    {client.address != null && (
                      <Text style={{ fontSize: 12, color: active ? (dark ? '#374151' : '#9ca3af') : mutedColor, marginTop: 2 }}>
                        {client.address}
                      </Text>
                    )}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Date & Time */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Date & Time
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  flex: 1,
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 14, color: textColor }}>
                  {scheduledAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={{
                  flex: 1,
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 14, color: textColor }}>
                  {scheduledAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </Pressable>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={scheduledAt}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'android')
                  if (date) {
                    const next = new Date(scheduledAt)
                    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
                    setScheduledAt(next)
                  }
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledAt}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowTimePicker(Platform.OS === 'android')
                  if (date) {
                    const next = new Date(scheduledAt)
                    next.setHours(date.getHours(), date.getMinutes())
                    setScheduledAt(next)
                  }
                }}
              />
            )}
          </View>

          {/* Crew */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Assign Crew
            </Text>
            <View style={{ gap: 8 }}>
              {(crew ?? []).map((member) => {
                const active = selectedCrewIds.includes(member.id)
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => toggleCrew(member.id)}
                    style={{
                      backgroundColor: active ? selectedBg : cardBg,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? (dark ? '#f9fafb' : '#111827') : borderColor,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: active ? selectedText : textColor }}>
                        {member.fullName}
                      </Text>
                      <Text style={{ fontSize: 12, color: active ? (dark ? '#374151' : '#9ca3af') : mutedColor, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {member.role}
                      </Text>
                    </View>
                    {active && (
                      <Text style={{ fontSize: 16, color: selectedText }}>✓</Text>
                    )}
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any special instructions..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 14,
                color: textColor,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => ({
              backgroundColor: canSubmit ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              marginTop: 4,
            })}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: canSubmit ? (dark ? '#111827' : '#ffffff') : mutedColor }}>
              {createJob.isPending ? 'Scheduling…' : 'Schedule Job'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}

function roundToNextHour(): Date {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}
