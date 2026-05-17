import { Pressable, Text, View } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import type { JobChecklistItemDetail } from '@nimbus/shared'

interface ChecklistItemRowProps {
  item: JobChecklistItemDetail
  isActive: boolean
  isPending: boolean
  isPhotoUploading: boolean
  onToggle: (item: JobChecklistItemDetail) => void
  onCameraPress: (checklistItemId: string) => void
}

export function ChecklistItemRow({
  item,
  isActive,
  isPending,
  isPhotoUploading,
  onToggle,
  onCameraPress,
}: ChecklistItemRowProps) {
  const { dark } = useTheme()

  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: dark ? '#1f2937' : '#e5e7eb',
        backgroundColor: dark ? '#111827' : '#ffffff',
        marginBottom: 10,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => onToggle(item)}
        disabled={!isActive || isPending}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: item.completed ? (dark ? '#f9fafb' : '#111827') : dark ? '#374151' : '#d1d5db',
            backgroundColor: item.completed ? (dark ? '#f9fafb' : '#111827') : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.completed && (
            <Text style={{ fontSize: 14, color: dark ? '#111827' : '#ffffff', fontWeight: '700' }}>
              ✓
            </Text>
          )}
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: item.completed
              ? dark ? '#4b5563' : '#9ca3af'
              : dark ? '#f9fafb' : '#111827',
            textDecorationLine: item.completed ? 'line-through' : 'none',
          }}
        >
          {item.label}
        </Text>
      </Pressable>

      {item.requiresPhoto && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: dark ? '#1f2937' : '#f3f4f6',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {item.photos.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: dark ? '#9ca3af' : '#374151' }}>
                ✓ {item.photos.length} photo{item.photos.length !== 1 ? 's' : ''} attached
              </Text>
              {isActive && (
                <Pressable
                  onPress={() => onCameraPress(item.checklistItemId)}
                  style={{ marginLeft: 'auto' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: dark ? '#f9fafb' : '#111827' }}>
                    Add another
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              onPress={() => onCameraPress(item.checklistItemId)}
              disabled={!isActive || isPhotoUploading}
              style={({ pressed }) => ({
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: dark ? '#374151' : '#d1d5db',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: dark ? '#6b7280' : '#9ca3af' }}>
                {isPhotoUploading ? 'Uploading…' : '📷 Take photo (required)'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
