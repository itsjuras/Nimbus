import React, { useState, useRef } from 'react'
import { ScrollView, View, Text, Pressable, Alert, TextInput, Animated } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJob, useMissJob, useMarkItemComplete, useUpdateJob, useDeleteJob } from '../../../hooks/useJobs'
import { useCrewMembers } from '../../../hooks/useCrew'
import { useClientChecklist, useUpdateChecklist } from '../../../hooks/useChecklists'
import { useUploadPhoto } from '../../../hooks/useCrewJobs'
import type { ChecklistItemDraft } from '../../../hooks/useChecklists'
import { StatusChip } from '../../../components/ui/StatusChip'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Feather } from '@expo/vector-icons'

export default function OwnerJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { dark } = useTheme()

  const [editing, setEditing] = useState(false)
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [checklistName, setChecklistName] = useState('')
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDraft[]>([])

  const { data: job, isLoading } = useJob(id ?? '')
  const { data: allCrew } = useCrewMembers()
  const { data: checklistData } = useClientChecklist(job?.clientId ?? null)
  const missJob = useMissJob(id ?? '')
  const markItem = useMarkItemComplete(id ?? '')
  const updateJob = useUpdateJob(id ?? '')
  const deleteJob = useDeleteJob()
  const updateChecklist = useUpdateChecklist(job?.clientId ?? '')
  const uploadPhoto = useUploadPhoto(id ?? '')

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  async function handleItemPress(checklistItemId: string, requiresPhoto: boolean, currentlyCompleted: boolean) {
    if (!requiresPhoto) {
      markItem.mutate({ checklistItemId, completed: !currentlyCompleted })
      return
    }

    const cameraAvailable = await ImagePicker.getCameraPermissionsAsync()
      .then(() => true)
      .catch(() => false)

    let result: ImagePicker.ImagePickerResult

    if (cameraAvailable) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera access is needed to take a photo for this task.')
        return
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 })
    } else {
      // Simulator fallback — pick from library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Photo library access is needed.')
        return
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 })
    }

    if (result.canceled) return

    const uri = result.assets[0]?.uri
    if (!uri) return

    try {
      await uploadPhoto.mutateAsync({ checklistItemId, localUri: uri })
      markItem.mutate({ checklistItemId, completed: true })
    } catch (err) {
      Alert.alert('Upload failed', err instanceof Error ? err.message : 'Could not upload photo.')
    }
  }

  function enterEdit() {
    setSelectedCrewIds(job?.crew.map((c) => c.id) ?? [])
    const sorted = checklistData?.items.slice().sort((a, b) => a.position - b.position) ?? []
    setChecklistItems(sorted.map((i) => ({ label: i.label, requiresPhoto: i.requiresPhoto, position: i.position })))
    setChecklistName(checklistData?.checklist.name ?? `${job?.clientName ?? ''} Checklist`)
    setEditing(true)
  }

  async function saveEdit() {
    try {
      await Promise.all([
        updateJob.mutateAsync({ crewIds: selectedCrewIds }),
        updateChecklist.mutateAsync({
          name: checklistName.trim() || `${job?.clientName ?? ''} Checklist`,
          items: checklistItems
            .filter((i) => i.label.trim())
            .map((i, idx) => ({ label: i.label.trim(), requiresPhoto: i.requiresPhoto, position: idx })),
        }),
      ])
      setEditing(false)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Job',
      'Are you sure you want to delete this job? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJob.mutateAsync(id ?? '')
              router.back()
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete job.')
            }
          },
        },
      ],
    )
  }

  function toggleCrew(memberId: string) {
    setSelectedCrewIds((prev) =>
      prev.includes(memberId) ? prev.filter((x) => x !== memberId) : [...prev, memberId],
    )
  }

  function addChecklistItem() {
    setChecklistItems((prev) => [...prev, { label: '', requiresPhoto: false, position: prev.length }])
  }

  function removeChecklistItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })))
  }

  function updateItemLabel(index: number, label: string) {
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, label } : item))
  }

  function toggleItemPhoto(index: number) {
    setChecklistItems((prev) => prev.map((item, i) => i === index ? { ...item, requiresPhoto: !item.requiresPhoto } : item))
  }

  if (isLoading) return <LoadingSpinner />
  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: mutedColor, marginBottom: 16 }}>← Back</Text>
          </Pressable>
          <Text style={{ color: mutedColor }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Build a lookup from checklist_item_id → job completion state
  const completionMap = new Map(job.checklistItems.map((i) => [i.checklistItemId, i]))

  // Use the client's template items for display; fall back to job-seeded items if template not loaded
  const templateItems = checklistData?.items.slice().sort((a, b) => a.position - b.position) ?? []
  const completedCount = templateItems.filter((i) => completionMap.get(i.id)?.completed).length

  const isSaving = updateJob.isPending || updateChecklist.isPending || uploadPhoto.isPending

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>← Jobs</Text>
        </Pressable>

        {/* Title + status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold', flex: 1, marginRight: 8 }}>
            {job.clientName}
          </Text>
          <StatusChip status={job.status} />
        </View>

        {/* Date + edit/delete icons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: mutedColor, fontSize: 13 }}>
            {new Date(job.scheduledAt).toLocaleString([], {
              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {editing && (
              <Pressable onPress={confirmDelete} hitSlop={8}>
                <Feather name="trash-2" size={17} color={dark ? '#6b7280' : '#9ca3af'} />
              </Pressable>
            )}
            <Pressable onPress={editing ? saveEdit : enterEdit} hitSlop={8} disabled={isSaving}>
              <Feather
                name={editing ? 'check' : 'edit-2'}
                size={17}
                color={editing ? (dark ? '#f9fafb' : '#111827') : (dark ? '#6b7280' : '#9ca3af')}
              />
            </Pressable>
          </View>
        </View>

        {/* Checklist */}
        <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
            Checklist
          </Text>

          {editing ? (
            <>
              <TextInput
                value={checklistName}
                onChangeText={setChecklistName}
                placeholder="Checklist name"
                placeholderTextColor={mutedColor}
                style={{
                  fontSize: 13, color: textColor, borderWidth: 1, borderColor,
                  borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
                  marginBottom: 10, backgroundColor: bg,
                }}
              />
              {checklistItems.map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 8, borderTopWidth: 1, borderTopColor: borderColor,
                  }}
                >
                  <TextInput
                    value={item.label}
                    onChangeText={(text) => updateItemLabel(index, text)}
                    placeholder="Item label"
                    placeholderTextColor={mutedColor}
                    style={{ flex: 1, fontSize: 14, color: textColor }}
                  />
                  <Pressable onPress={() => toggleItemPhoto(index)} hitSlop={8}>
                    <View style={{
                      width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: item.requiresPhoto
                        ? (dark ? '#f9fafb' : '#111827')
                        : (dark ? '#1f2937' : '#f3f4f6'),
                    }}>
                      <Feather
                        name="camera"
                        size={13}
                        color={item.requiresPhoto ? (dark ? '#111827' : '#ffffff') : mutedColor}
                      />
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeChecklistItem(index)} hitSlop={8}>
                    <Text style={{ fontSize: 18, color: mutedColor, lineHeight: 20 }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addChecklistItem} style={{ marginTop: 10 }}>
                <View style={{
                  borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: mutedColor,
                  paddingVertical: 10, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor, letterSpacing: 0.5 }}>+ ADD ITEM</Text>
                </View>
              </Pressable>
            </>
          ) : templateItems.length === 0 ? (
            <Text style={{ fontSize: 14, color: mutedColor }}>No checklist items. Tap edit to add some.</Text>
          ) : (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: mutedColor }}>{completedCount} of {templateItems.length} done</Text>
                <Text style={{ fontSize: 13, color: mutedColor }}>
                  {Math.round((completedCount / templateItems.length) * 100)}%
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? '#1f2937' : '#f3f4f6', marginBottom: 4 }}>
                <View style={{
                  height: 6, borderRadius: 3,
                  backgroundColor: dark ? '#f9fafb' : '#111827',
                  width: `${Math.round((completedCount / templateItems.length) * 100)}%`,
                }} />
              </View>
              {templateItems.map((item) => {
                const jobItem = completionMap.get(item.id)
                return (
                  <ChecklistRow
                    key={item.id}
                    onPress={() => handleItemPress(item.id, item.requiresPhoto, jobItem?.completed ?? false)}
                    borderColor={dark ? '#1f2937' : '#f3f4f6'}
                  >
                    <Text style={{ fontSize: 14, color: jobItem?.completed ? mutedColor : textColor }}>
                      {jobItem?.completed ? '✓' : '○'}
                    </Text>
                    <Text style={{
                      flex: 1, fontSize: 14,
                      color: jobItem?.completed ? mutedColor : textColor,
                      textDecorationLine: jobItem?.completed ? 'line-through' : 'none',
                    }}>
                      {item.label}
                    </Text>
                    {item.requiresPhoto && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="camera" size={13} color={jobItem?.photos && jobItem.photos.length > 0 ? mutedColor : '#ef4444'} />
                        {jobItem?.photos && jobItem.photos.length > 0 && (
                          <Text style={{ fontSize: 11, color: mutedColor }}>{jobItem.photos.length}</Text>
                        )}
                      </View>
                    )}
                  </ChecklistRow>
                )
              })}
            </>
          )}
        </View>

        {/* Crew */}
        <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
            Assigned Crew
          </Text>
          {editing ? (
            (allCrew ?? []).map((member) => {
              const selected = selectedCrewIds.includes(member.id)
              return (
                <Pressable
                  key={member.id}
                  onPress={() => toggleCrew(member.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingVertical: 10, borderTopWidth: 1, borderTopColor: borderColor,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: selected ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#f3f4f6'),
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 14, color: selected ? (dark ? '#111827' : '#ffffff') : mutedColor }}>
                      {member.fullName[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{member.fullName}</Text>
                    <Text style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {member.role}
                    </Text>
                  </View>
                  {selected && <Feather name="check" size={16} color={dark ? '#f9fafb' : '#111827'} />}
                </Pressable>
              )
            })
          ) : job.crew.length === 0 ? (
            <Text style={{ fontSize: 14, color: mutedColor }}>No crew assigned</Text>
          ) : (
            job.crew.map((member) => (
              <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: dark ? '#1f2937' : '#f3f4f6',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, color: mutedColor }}>{member.fullName[0]?.toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{member.fullName}</Text>
                  <Text style={{ fontSize: 11, color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {member.role}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notes */}
        {job.notes != null && (
          <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
              Notes
            </Text>
            <Text style={{ fontSize: 14, color: textColor, lineHeight: 22 }}>{job.notes}</Text>
          </View>
        )}

        {/* Save in edit mode */}
        {editing && (
          <Pressable onPress={saveEdit} disabled={isSaving} style={{ marginBottom: 12 }}>
            <View style={{
              backgroundColor: dark ? '#f9fafb' : '#111827',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', letterSpacing: 0.5, color: dark ? '#111827' : '#ffffff' }}>
                {isSaving ? 'SAVING…' : 'SAVE CHANGES'}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Mark as missed */}
        {!editing && (job.status === 'scheduled' || job.status === 'in_progress') && (
          <Pressable onPress={() => missJob.mutate()} disabled={missJob.isPending}>
            <View style={{
              borderWidth: 1, borderColor: mutedColor, borderRadius: 10,
              paddingVertical: 10, alignItems: 'center', marginBottom: 10,
              backgroundColor: 'transparent',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.5, color: mutedColor }}>
                {missJob.isPending ? 'UPDATING…' : 'MARK AS MISSED'}
              </Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function ChecklistRow({
  onPress,
  borderColor,
  children,
}: {
  onPress: () => void
  borderColor: string
  children: React.ReactNode
}) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 80, bounciness: 0 }).start()
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingVertical: 8, borderTopWidth: 1, borderTopColor: borderColor, marginTop: 4,
          transform: [{ scale }],
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  )
}
