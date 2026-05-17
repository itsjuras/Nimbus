import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useJob, useStartJob } from '../../../hooks/useJobs'
import { useMarkItemComplete, useUploadPhoto, useCompleteJob } from '../../../hooks/useCrewJobs'
import { ChecklistItemRow } from '../../../components/jobs/ChecklistItemRow'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import type { JobChecklistItemDetail } from '@nimbus/shared'

export default function CrewJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const { data: job, isLoading } = useJob(id ?? '')
  const startJob = useStartJob()
  const markItem = useMarkItemComplete(id ?? '')
  const uploadPhoto = useUploadPhoto(id ?? '')
  const completeJob = useCompleteJob()

  const [pendingPhotoItemId, setPendingPhotoItemId] = useState<string | null>(null)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />
  if (!job) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <View style={{ padding: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: mutedColor }}>← Back</Text>
          </Pressable>
          <Text style={{ color: mutedColor, marginTop: 16 }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const canStart = job.status === 'scheduled'
  const isActive = job.status === 'in_progress'
  const isDone = job.status === 'completed'

  const completedCount = job.checklistItems.filter((i) => i.completed).length
  const allCompleted = job.checklistItems.every((i) => i.completed)
  const allPhotosPresent = job.checklistItems
    .filter((i) => i.requiresPhoto)
    .every((i) => i.photos.length > 0)
  const canComplete = isActive && allCompleted && allPhotosPresent
  const progress = job.checklistItems.length > 0
    ? Math.round((completedCount / job.checklistItems.length) * 100)
    : 0

  async function handleToggleItem(item: JobChecklistItemDetail) {
    if (!isActive) return
    await markItem.mutateAsync({ checklistItemId: item.checklistItemId, completed: !item.completed })
  }

  async function handleCameraPress(checklistItemId: string) {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    if (!asset.uri) return

    setPendingPhotoItemId(checklistItemId)
    try {
      await uploadPhoto.mutateAsync({ checklistItemId, localUri: asset.uri })
    } finally {
      setPendingPhotoItemId(null)
    }
  }

  async function handleComplete() {
    setCompleteError(null)
    try {
      await completeJob.mutateAsync(id ?? '')
      router.replace('/(crew)/')
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : 'Failed to complete job')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: borderColor, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>← My Jobs</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
          {job.clientName}
        </Text>
        <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>
          {new Date(job.scheduledAt).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        {isActive && job.checklistItems.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, color: mutedColor }}>{completedCount} of {job.checklistItems.length} done</Text>
              <Text style={{ fontSize: 12, color: mutedColor }}>{progress}%</Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? '#1f2937' : '#f3f4f6' }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: dark ? '#f9fafb' : '#111827', width: `${progress}%` }} />
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: canStart || isActive ? 120 : 40 }}>
        {job.notes != null && (
          <View style={{ backgroundColor: dark ? '#1f2937' : '#f3f4f6', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: textColor }}>
              <Text style={{ fontWeight: '700' }}>Note: </Text>{job.notes}
            </Text>
          </View>
        )}

        {/* Start button */}
        {canStart && (
          <Pressable
            onPress={() => startJob.mutate(id ?? '')}
            disabled={startJob.isPending}
            style={({ pressed }) => ({
              backgroundColor: dark ? '#f9fafb' : '#111827',
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              marginBottom: 20,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
              {startJob.isPending ? 'Starting…' : 'Start Job'}
            </Text>
          </Pressable>
        )}

        {/* Checklist */}
        {(isActive || isDone) && job.checklistItems.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            isActive={isActive}
            isPending={markItem.isPending}
            isPhotoUploading={uploadPhoto.isPending && pendingPhotoItemId === item.checklistItemId}
            onToggle={handleToggleItem}
            onCameraPress={handleCameraPress}
          />
        ))}

        {/* Completed state */}
        {isDone && (
          <View style={{ backgroundColor: dark ? '#1f2937' : '#f3f4f6', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 28 }}>✓</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, marginTop: 8 }}>Job completed</Text>
            {job.completedAt != null && (
              <Text style={{ fontSize: 13, color: mutedColor, marginTop: 4 }}>
                {new Date(job.completedAt).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Complete button sticky footer */}
      {isActive && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: cardBg,
            borderTopWidth: 1,
            borderTopColor: borderColor,
            padding: 20,
            paddingBottom: 32,
          }}
        >
          {completeError != null && (
            <View style={{ backgroundColor: dark ? '#1f2937' : '#f3f4f6', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, color: dark ? '#9ca3af' : '#374151' }}>{completeError}</Text>
            </View>
          )}
          <Pressable
            onPress={handleComplete}
            disabled={!canComplete || completeJob.isPending}
            style={({ pressed }) => ({
              backgroundColor: canComplete ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: canComplete ? (dark ? '#111827' : '#ffffff') : (dark ? '#4b5563' : '#9ca3af'),
              }}
            >
              {completeJob.isPending
                ? 'Completing…'
                : canComplete
                ? 'Complete Job'
                : `${job.checklistItems.length - completedCount} item${job.checklistItems.length - completedCount !== 1 ? 's' : ''} remaining`}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}
