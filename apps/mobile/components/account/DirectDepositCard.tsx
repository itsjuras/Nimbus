import { useState } from 'react'
import { View, Text, TextInput, Pressable } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../contexts/ThemeContext'

interface Props {
  profileId: string
  defaultHolderName: string
}

interface BankForm {
  accountHolderName: string
  transitNumber: string
  institutionNumber: string
  accountNumber: string
  email: string
  phone: string
  dateOfBirth: string
  addressLine1: string
  city: string
  province: string
  postalCode: string
}

const EMPTY_FORM: Omit<BankForm, 'accountHolderName'> = {
  transitNumber: '',
  institutionNumber: '',
  accountNumber: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  addressLine1: '',
  city: '',
  province: '',
  postalCode: '',
}

export function DirectDepositCard({ profileId, defaultHolderName }: Props) {
  const { dark } = useTheme()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<BankForm>({ accountHolderName: defaultHolderName, ...EMPTY_FORM })

  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'
  const inputBg = dark ? '#1f2937' : '#f3f4f6'

  const { data: bankLast4 } = useQuery({
    queryKey: ['profile-bank', profileId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('bank_last4').eq('id', profileId).single()
      return (data?.bank_last4 as string | null) ?? null
    },
    enabled: !!profileId,
  })

  const saveBank = useMutation({
    mutationFn: (body: BankForm) =>
      api.post<{ bankLast4: string }>(`/api/v1/payroll/crew/${profileId}/bank`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-bank', profileId] })
      setEditing(false)
      setForm({ accountHolderName: defaultHolderName, ...EMPTY_FORM })
    },
  })

  const set = (key: keyof BankForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const requiredFilled = Object.values(form).every((v) => v.trim().length > 0)
  const showForm = editing || !bankLast4

  const inputStyle = {
    backgroundColor: inputBg,
    borderWidth: 1,
    borderColor,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: textColor,
  }
  const labelStyle = { fontSize: 11, color: mutedColor, letterSpacing: 1, marginBottom: 6 }

  function field(label: string, key: keyof BankForm, options: Partial<React.ComponentProps<typeof TextInput>> = {}) {
    return (
      <View>
        <Text style={labelStyle}>{label}</Text>
        <TextInput
          value={form[key]}
          onChangeText={set(key)}
          placeholderTextColor={mutedColor}
          style={inputStyle}
          {...options}
        />
      </View>
    )
  }

  return (
    <>
      <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: mutedColor, marginBottom: 12, textTransform: 'uppercase' }}>
        Direct Deposit
      </Text>
      <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor, padding: 16, marginBottom: 24, gap: 12 }}>
        {!showForm ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>
                Bank account ····{bankLast4}
              </Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: dark ? '#064e3b' : '#d1fae5' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: dark ? '#6ee7b7' : '#047857' }}>
                  CONNECTED
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setEditing(true)}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor }}>Replace</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 13, color: mutedColor, lineHeight: 18 }}>
              Get your wages paid straight to your bank account. Details go directly to Stripe — Nimbus never
              stores your account numbers.
            </Text>

            {field('ACCOUNT HOLDER NAME', 'accountHolderName', { placeholder: 'Your full name' })}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>TRANSIT (5 DIGITS)</Text>
                <TextInput
                  value={form.transitNumber}
                  onChangeText={set('transitNumber')}
                  placeholder="12345"
                  placeholderTextColor={mutedColor}
                  keyboardType="number-pad"
                  maxLength={5}
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>INSTITUTION (3)</Text>
                <TextInput
                  value={form.institutionNumber}
                  onChangeText={set('institutionNumber')}
                  placeholder="001"
                  placeholderTextColor={mutedColor}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={inputStyle}
                />
              </View>
            </View>
            {field('ACCOUNT NUMBER', 'accountNumber', { placeholder: '1234567', keyboardType: 'number-pad', maxLength: 12 })}

            <Text style={{ fontSize: 11, color: mutedColor, letterSpacing: 1, marginTop: 4 }}>
              IDENTITY — REQUIRED BY STRIPE FOR PAYOUTS
            </Text>

            {field('EMAIL', 'email', { placeholder: 'name@email.com', keyboardType: 'email-address', autoCapitalize: 'none' })}
            {field('PHONE', 'phone', { placeholder: '+1 604 555 1234', keyboardType: 'phone-pad' })}
            {field('DATE OF BIRTH (YYYY-MM-DD)', 'dateOfBirth', { placeholder: '1990-01-31' })}
            {field('STREET ADDRESS', 'addressLine1', { placeholder: '123 Main St' })}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={labelStyle}>CITY</Text>
                <TextInput
                  value={form.city}
                  onChangeText={set('city')}
                  placeholder="Vancouver"
                  placeholderTextColor={mutedColor}
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>PROVINCE</Text>
                <TextInput
                  value={form.province}
                  onChangeText={set('province')}
                  placeholder="BC"
                  placeholderTextColor={mutedColor}
                  autoCapitalize="characters"
                  maxLength={2}
                  style={inputStyle}
                />
              </View>
            </View>
            {field('POSTAL CODE', 'postalCode', { placeholder: 'V6B 1A1', autoCapitalize: 'characters', maxLength: 7 })}

            {saveBank.error instanceof Error && (
              <Text style={{ fontSize: 12, color: dark ? '#f87171' : '#dc2626' }}>{saveBank.error.message}</Text>
            )}

            <Pressable
              onPress={() => saveBank.mutate(form)}
              disabled={!requiredFilled || saveBank.isPending}
              style={({ pressed }) => ({
                backgroundColor: !requiredFilled ? (dark ? '#1f2937' : '#e5e7eb') : (dark ? '#f9fafb' : '#111827'),
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: !requiredFilled ? mutedColor : (dark ? '#111827' : '#ffffff') }}>
                {saveBank.isPending ? 'Saving…' : 'Save Bank Details'}
              </Text>
            </Pressable>
            {editing && (
              <Pressable onPress={() => setEditing(false)} style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: mutedColor }}>Cancel</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </>
  )
}
