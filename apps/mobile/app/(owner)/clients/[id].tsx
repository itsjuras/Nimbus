import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert, Animated } from 'react-native'
import { useTheme } from '../../../contexts/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useClient, useUpdateClient } from '../../../hooks/useClients'
import { useJobs } from '../../../hooks/useJobs'
import { useClientChecklist, useUpdateChecklist } from '../../../hooks/useChecklists'
import type { ChecklistItemDraft } from '../../../hooks/useChecklists'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { Feather } from '@expo/vector-icons'

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { dark } = useTheme()
  const [showEdit, setShowEdit] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)

  const { data: client, isLoading } = useClient(id ?? '')
  const { data: jobs } = useJobs()
  const { data: checklistData } = useClientChecklist(id ?? null)

  const clientJobs = (jobs ?? [])
    .filter((j) => j.clientId === id)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  if (isLoading) return <LoadingSpinner />

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Back + Edit row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: mutedColor, fontSize: 14 }}>← Clients</Text>
          </Pressable>
          {client != null && (
            <Pressable onPress={() => setShowEdit(true)}>
              <View style={{
                backgroundColor: dark ? '#f9fafb' : '#111827',
                borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
                  EDIT CLIENT
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {client != null && (
          <>
            <Text style={{
              fontSize: 22, fontWeight: '700', color: textColor,
              fontFamily: 'IBMPlexMono_700Bold', marginBottom: 20, textTransform: 'uppercase',
            }}>
              {client.name}
            </Text>

            {/* Info card */}
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 20, marginBottom: 20, gap: 20 }}>
              {client.address != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>ADDRESS</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>{client.address}</Text>
                </View>
              )}
              {client.contactName != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>CONTACT</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>{client.contactName}</Text>
                </View>
              )}
              {client.contactEmail != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>EMAIL</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>{client.contactEmail}</Text>
                </View>
              )}
              {client.contactPhone != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>PHONE</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>{client.contactPhone}</Text>
                </View>
              )}
              {client.notes != null && (
                <View>
                  <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }}>NOTES</Text>
                  <Text style={{ fontSize: 16, color: textColor }}>{client.notes}</Text>
                </View>
              )}
            </View>

            {/* Checklist section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, textTransform: 'uppercase' }}>
                Checklist
              </Text>
              <Pressable onPress={() => setShowChecklist(true)}>
                <View style={{ backgroundColor: dark ? '#f9fafb' : '#111827', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#ffffff' }}>
                    {checklistData ? 'EDIT' : 'SET UP'}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, marginBottom: 20, overflow: 'hidden' }}>
              {!checklistData || checklistData.items.length === 0 ? (
                <Pressable onPress={() => setShowChecklist(true)}>
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: mutedColor, fontSize: 14 }}>No checklist items yet</Text>
                    <Text style={{ color: mutedColor, fontSize: 12, marginTop: 4 }}>Tap SET UP to add items</Text>
                  </View>
                </Pressable>
              ) : (
                checklistData.items
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((item, i) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 20, paddingVertical: 14,
                        borderTopWidth: i === 0 ? 0 : 1, borderTopColor: borderColor,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: textColor, flex: 1 }}>{item.label}</Text>
                      {item.requiresPhoto && (
                        <Feather name="camera" size={14} color={mutedColor} style={{ marginLeft: 8 }} />
                      )}
                    </View>
                  ))
              )}
            </View>

            {/* Job History */}
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
              Job History
            </Text>

            {clientJobs.length === 0 ? (
              <Text style={{ color: mutedColor, textAlign: 'center', paddingVertical: 20 }}>No jobs yet</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {clientJobs.map((job) => (
                  <JobPill
                    key={job.id}
                    job={job}
                    dark={dark}
                    cardBg={cardBg}
                    textColor={textColor}
                    mutedColor={mutedColor}
                    borderColor={borderColor}
                    onPress={() => router.push(`/(owner)/jobs/${job.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {client != null && (
        <>
          <EditClientModal
            visible={showEdit}
            onClose={() => setShowEdit(false)}
            dark={dark}
            client={client}
            id={id ?? ''}
          />
          <EditChecklistModal
            visible={showChecklist}
            onClose={() => setShowChecklist(false)}
            dark={dark}
            clientId={id ?? ''}
            clientName={client.name}
            existingItems={checklistData?.items.slice().sort((a, b) => a.position - b.position) ?? []}
            existingName={checklistData?.checklist.name ?? `${client.name} Checklist`}
          />
        </>
      )}
    </SafeAreaView>
  )
}

function EditChecklistModal({
  visible, onClose, dark, clientId, clientName, existingItems, existingName,
}: {
  visible: boolean
  onClose: () => void
  dark: boolean
  clientId: string
  clientName: string
  existingItems: { id: string; label: string; requiresPhoto: boolean; position: number }[]
  existingName: string
}) {
  const [name, setName] = useState(existingName)
  const [items, setItems] = useState<ChecklistItemDraft[]>(
    existingItems.map((i) => ({ label: i.label, requiresPhoto: i.requiresPhoto, position: i.position }))
  )
  const updateChecklist = useUpdateChecklist(clientId)

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#ffffff'

  function addItem() {
    setItems((prev) => [...prev, { label: '', requiresPhoto: false, position: prev.length }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })))
  }

  function updateLabel(index: number, label: string) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, label } : item))
  }

  function togglePhoto(index: number) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, requiresPhoto: !item.requiresPhoto } : item))
  }

  async function handleSave() {
    const validItems = items.filter((i) => i.label.trim()).map((item, idx) => ({
      label: item.label.trim(),
      requiresPhoto: item.requiresPhoto,
      position: idx,
    }))
    try {
      await updateChecklist.mutateAsync({ name: name.trim() || `${clientName} Checklist`, items: validItems })
      onClose()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save checklist.')
    }
  }

  // Reset state when modal opens with fresh data
  const handleOpen = () => {
    setName(existingName)
    setItems(existingItems.map((i) => ({ label: i.label, requiresPhoto: i.requiresPhoto, position: i.position })))
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
        }}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            CHECKLIST
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Checklist name */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Checklist Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={`${clientName} Checklist`}
              placeholderTextColor={mutedColor}
              style={{
                backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
                paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, color: textColor,
              }}
            />
          </View>

          {/* Items */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 10, textTransform: 'uppercase' }}>
              Items
            </Text>

            {items.length > 0 && (
              <View style={{ backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor, overflow: 'hidden', marginBottom: 10 }}>
                {items.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingHorizontal: 16, paddingVertical: 12,
                      borderTopWidth: index === 0 ? 0 : 1, borderTopColor: borderColor,
                    }}
                  >
                    <TextInput
                      value={item.label}
                      onChangeText={(text) => updateLabel(index, text)}
                      placeholder="Item label"
                      placeholderTextColor={mutedColor}
                      style={{ flex: 1, fontSize: 14, color: textColor }}
                    />
                    {/* Photo toggle */}
                    <Pressable onPress={() => togglePhoto(index)} hitSlop={8}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: item.requiresPhoto
                          ? (dark ? '#f9fafb' : '#111827')
                          : (dark ? '#1f2937' : '#f3f4f6'),
                      }}>
                        <Feather
                          name="camera"
                          size={14}
                          color={item.requiresPhoto ? (dark ? '#111827' : '#ffffff') : mutedColor}
                        />
                      </View>
                    </Pressable>
                    {/* Remove */}
                    <Pressable onPress={() => removeItem(index)} hitSlop={8}>
                      <Text style={{ fontSize: 18, color: mutedColor, lineHeight: 20 }}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add item */}
            <Pressable onPress={addItem}>
              <View style={{
                borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: mutedColor,
                paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center',
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, letterSpacing: 0.5 }}>+ ADD ITEM</Text>
              </View>
            </Pressable>
          </View>

          {/* Save */}
          <Pressable onPress={handleSave} disabled={updateChecklist.isPending}>
            <View style={{
              backgroundColor: dark ? '#f9fafb' : '#111827',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: dark ? '#111827' : '#ffffff', letterSpacing: 0.5 }}>
                {updateChecklist.isPending ? 'SAVING…' : 'SAVE CHECKLIST'}
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}

function JobPill({
  job, dark, cardBg, textColor, mutedColor, borderColor, onPress,
}: {
  job: { id: string; scheduledAt: string; status: string }
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
  onPress: () => void
}) {
  const scale = new Animated.Value(1)

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{
        backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor,
        paddingHorizontal: 20, paddingVertical: 18, alignItems: 'center',
        transform: [{ scale }],
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6 }}>
          {new Date(job.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={{ fontSize: 13, color: mutedColor }}>
          {new Date(job.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

function EditClientModal({
  visible, onClose, dark, client, id,
}: {
  visible: boolean
  onClose: () => void
  dark: boolean
  client: { name: string; address: string | null; contactName: string | null; contactEmail: string | null; contactPhone: string | null; notes: string | null }
  id: string
}) {
  const [name, setName] = useState(client.name)
  const [address, setAddress] = useState(client.address ?? '')
  const [contactName, setContactName] = useState(client.contactName ?? '')
  const [contactEmail, setContactEmail] = useState(client.contactEmail ?? '')
  const [contactPhone, setContactPhone] = useState(client.contactPhone ?? '')
  const [notes, setNotes] = useState(client.notes ?? '')
  const updateClient = useUpdateClient(id)

  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#ffffff'

  function handleOpen() {
    setName(client.name)
    setAddress(client.address ?? '')
    setContactName(client.contactName ?? '')
    setContactEmail(client.contactEmail ?? '')
    setContactPhone(client.contactPhone ?? '')
    setNotes(client.notes ?? '')
  }

  async function handleSave() {
    if (!name.trim()) return
    try {
      await updateClient.mutateAsync({
        name: name.trim(),
        address: address.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save changes.')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={handleOpen}>
      <View style={{ flex: 1, backgroundColor: dark ? '#030712' : '#f9fafb' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: borderColor,
        }}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 15, color: mutedColor }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>
            EDIT CLIENT
          </Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {[
            { label: 'Name', value: name, setter: setName, placeholder: 'Client name', keyboard: 'default' },
            { label: 'Address', value: address, setter: setAddress, placeholder: '123 Main St', keyboard: 'default' },
            { label: 'Contact Name', value: contactName, setter: setContactName, placeholder: 'Jane Smith', keyboard: 'default' },
            { label: 'Contact Email', value: contactEmail, setter: setContactEmail, placeholder: 'jane@company.com', keyboard: 'email-address' },
            { label: 'Contact Phone', value: contactPhone, setter: setContactPhone, placeholder: '+1 (555) 000-0000', keyboard: 'phone-pad' },
          ].map(({ label, value, setter, placeholder, keyboard }) => (
            <View key={label}>
              <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
                {label}
              </Text>
              <TextInput
                value={value}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor={mutedColor}
                keyboardType={keyboard as any}
                autoCapitalize="none"
                style={{
                  backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: textColor,
                }}
              />
            </View>
          ))}

          <View>
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: mutedColor, marginBottom: 8, textTransform: 'uppercase' }}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes…"
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 12,
                paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: textColor,
                minHeight: 80, textAlignVertical: 'top',
              }}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || updateClient.isPending}
            style={{
              backgroundColor: name.trim() ? (dark ? '#f9fafb' : '#111827') : (dark ? '#1f2937' : '#e5e7eb'),
              borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: name.trim() ? (dark ? '#111827' : '#ffffff') : mutedColor }}>
              {updateClient.isPending ? 'Saving…' : 'Save Changes'}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  )
}
