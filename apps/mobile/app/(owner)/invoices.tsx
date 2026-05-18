import { View, Text, ScrollView, Pressable, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useInvoices } from '../../hooks/useInvoices'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useTheme } from '../../contexts/ThemeContext'
import type { Invoice, InvoiceStatus } from '@nimbus/shared'

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'DRAFT',
  sent: 'SENT',
  paid: 'PAID',
  void: 'VOID',
}

function invoiceChipStyle(status: InvoiceStatus, dark: boolean) {
  switch (status) {
    case 'paid': return { bg: dark ? '#374151' : '#e5e7eb', text: dark ? '#d1d5db' : '#374151' }
    case 'sent': return { bg: dark ? '#111827' : '#111827', text: '#ffffff' }
    case 'draft': return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#6b7280' : '#9ca3af' }
    case 'void': return { bg: dark ? '#1f2937' : '#f3f4f6', text: dark ? '#4b5563' : '#9ca3af' }
  }
}

export default function InvoicesScreen() {
  const { data: invoices, isLoading } = useInvoices()
  const { dark } = useTheme()

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
          INVOICES
        </Text>
        <ThemeToggle />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (invoices ?? []).length === 0 ? (
        <EmptyState message="No invoices yet" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
          {(invoices ?? []).map((invoice) => (
            <InvoicePill
              key={invoice.id}
              invoice={invoice}
              dark={dark}
              cardBg={cardBg}
              textColor={textColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function InvoicePill({
  invoice, dark, cardBg, textColor, mutedColor, borderColor,
}: {
  invoice: Invoice
  dark: boolean
  cardBg: string
  textColor: string
  mutedColor: string
  borderColor: string
}) {
  const scale = new Animated.Value(1)
  const chip = invoiceChipStyle(invoice.status, dark)

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }
  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start()
  }

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{
        backgroundColor: cardBg,
        borderRadius: 14,
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 20,
        paddingVertical: 18,
        alignItems: 'center',
        transform: [{ scale }],
      }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 6 }}>
          #{invoice.invoiceNumber}
        </Text>
        <Text style={{ fontSize: 13, color: mutedColor, marginBottom: 10 }}>
          {new Date(invoice.issuedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: textColor, marginBottom: 10 }}>
          ${(invoice.total / 100).toFixed(2)}
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: chip.bg }}>
          <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: chip.text }}>
            {STATUS_LABELS[invoice.status]}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}
