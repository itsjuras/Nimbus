import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import { useGenerateDraft, useSendEmail } from '../../hooks/useEmails'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'

type Step = 'compose' | 'draft'

export default function EmailsScreen() {
  const { dark } = useTheme()
  const { data: clients = [] } = useClients()
  const generateDraft = useGenerateDraft()
  const sendEmail = useSendEmail()

  const [step, setStep] = useState<Step>('compose')
  const [clientId, setClientId] = useState('')
  const [showClientPicker, setShowClientPicker] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  const selectedClient = clients.find((c) => c.id === clientId)

  const bg        = dark ? '#030712' : '#f9fafb'
  const cardBg    = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg   = dark ? '#1f2937' : '#f9fafb'

  async function handleGenerate() {
    if (!clientId || !prompt.trim()) return
    setSentMessage('')
    const draft = await generateDraft.mutateAsync({ clientId, prompt: prompt.trim() })
    setSubject(draft.subject)
    setBody(draft.body)
    setStep('draft')
  }

  async function handleSend() {
    if (!clientId || !subject.trim() || !body.trim()) return
    await sendEmail.mutateAsync({ clientId, subject: subject.trim(), body: body.trim() })
    setSentMessage(`Email sent to ${selectedClient?.contactEmail ?? selectedClient?.name ?? 'client'}.`)
    setStep('compose')
    setPrompt('')
    setSubject('')
    setBody('')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
            EMAILS
          </Text>
          <ThemeToggle />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }} keyboardShouldPersistTaps="handled">

          {/* Sent banner */}
          {!!sentMessage && (
            <View style={{ backgroundColor: dark ? '#052e16' : '#f0fdf4', borderWidth: 1, borderColor: dark ? '#14532d' : '#bbf7d0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: dark ? '#4ade80' : '#16a34a', fontSize: 13, flex: 1 }}>{sentMessage}</Text>
              <Pressable onPress={() => setSentMessage('')}>
                <Text style={{ color: dark ? '#4ade80' : '#16a34a', fontSize: 18, marginLeft: 8 }}>×</Text>
              </Pressable>
            </View>
          )}

          {step === 'compose' ? (
            <>
              {/* Card */}
              <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, padding: 20, gap: 20 }}>

                {/* To */}
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold', marginBottom: 8 }}>TO</Text>
                  {selectedClient ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: inputBg, borderRadius: 10, borderWidth: 1, borderColor, paddingHorizontal: 14, paddingVertical: 12 }}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{selectedClient.name}</Text>
                        {selectedClient.contactEmail && (
                          <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{selectedClient.contactEmail}</Text>
                        )}
                      </View>
                      <Pressable onPress={() => setClientId('')}>
                        <Text style={{ fontSize: 22, color: mutedColor, lineHeight: 24 }}>×</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable onPress={() => setShowClientPicker(true)}>
                      <View style={{ borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: mutedColor, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor, letterSpacing: 0.5 }}>+ ADD CLIENT</Text>
                      </View>
                    </Pressable>
                  )}
                </View>

                {/* Prompt */}
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold', marginBottom: 8 }}>WHAT SHOULD THE EMAIL SAY?</Text>
                  <TextInput
                    value={prompt}
                    onChangeText={setPrompt}
                    multiline
                    numberOfLines={5}
                    placeholder={'Describe what you want the email to cover.\n\nFor example: "Follow up on last week\'s cleaning and ask if they\'d like to schedule next month."'}
                    placeholderTextColor={mutedColor}
                    style={{ backgroundColor: inputBg, borderWidth: 1, borderColor, borderRadius: 10, padding: 14, fontSize: 14, color: textColor, minHeight: 120, textAlignVertical: 'top' }}
                  />
                </View>
              </View>

              {/* Error */}
              {generateDraft.error instanceof Error && (
                <Text style={{ color: '#ef4444', fontSize: 13 }}>{generateDraft.error.message}</Text>
              )}

              {/* Generate button */}
              <Pressable
                onPress={handleGenerate}
                disabled={generateDraft.isPending || !clientId || !prompt.trim()}
                style={{ backgroundColor: dark ? '#f9fafb' : '#111827', borderRadius: 12, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: (generateDraft.isPending || !clientId || !prompt.trim()) ? 0.4 : 1 }}
              >
                {generateDraft.isPending ? (
                  <ActivityIndicator size="small" color={dark ? '#111827' : '#f9fafb'} />
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: '700', color: dark ? '#111827' : '#f9fafb', letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold' }}>✦ GENERATE DRAFT</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {/* Back */}
              <Pressable onPress={() => setStep('compose')}>
                <Text style={{ color: mutedColor, fontSize: 14 }}>← Back</Text>
              </Pressable>

              {/* Draft card */}
              <View style={{ backgroundColor: cardBg, borderRadius: 16, borderWidth: 1, borderColor, overflow: 'hidden' }}>
                {/* Meta */}
                <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: borderColor, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold', width: 60 }}>TO</Text>
                    <Text style={{ fontSize: 13, color: textColor, flex: 1 }}>
                      {selectedClient?.name}{selectedClient?.contactEmail ? ` <${selectedClient.contactEmail}>` : ''}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: mutedColor, letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold', width: 60 }}>SUBJECT</Text>
                    <TextInput
                      value={subject}
                      onChangeText={setSubject}
                      style={{ fontSize: 13, color: textColor, flex: 1 }}
                      placeholderTextColor={mutedColor}
                      placeholder="Subject…"
                    />
                  </View>
                </View>

                {/* Body */}
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  multiline
                  style={{ padding: 16, fontSize: 14, color: textColor, minHeight: 240, textAlignVertical: 'top', lineHeight: 22 }}
                  placeholderTextColor={mutedColor}
                  placeholder="Email body…"
                />
              </View>

              {/* Error */}
              {sendEmail.error instanceof Error && (
                <Text style={{ color: '#ef4444', fontSize: 13 }}>{sendEmail.error.message}</Text>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  onPress={() => setStep('compose')}
                  style={{ flex: 1, borderWidth: 1, borderColor, borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: textColor, letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold' }}>REGENERATE</Text>
                </Pressable>
                <Pressable
                  onPress={handleSend}
                  disabled={sendEmail.isPending || !subject.trim() || !body.trim()}
                  style={{ flex: 1, backgroundColor: dark ? '#f9fafb' : '#111827', borderRadius: 12, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, opacity: (sendEmail.isPending || !subject.trim() || !body.trim()) ? 0.4 : 1 }}
                >
                  {sendEmail.isPending
                    ? <ActivityIndicator size="small" color={dark ? '#111827' : '#f9fafb'} />
                    : <Text style={{ fontSize: 11, fontWeight: '700', color: dark ? '#111827' : '#f9fafb', letterSpacing: 2, fontFamily: 'IBMPlexMono_700Bold' }}>SEND EMAIL</Text>
                  }
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Client picker modal */}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: borderColor, paddingHorizontal: 20, paddingVertical: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, fontFamily: 'IBMPlexMono_700Bold' }}>SELECT CLIENT</Text>
              <Pressable onPress={() => setShowClientPicker(false)} hitSlop={8}>
                <Text style={{ fontSize: 20, color: mutedColor, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
              {clients.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => { setClientId(c.id); setShowClientPicker(false) }}
                >
                  <View style={{ backgroundColor: dark ? '#1f2937' : '#f9fafb', borderRadius: 12, borderWidth: 1, borderColor, paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{c.name}</Text>
                    {c.contactEmail != null && (
                      <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>{c.contactEmail}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}
