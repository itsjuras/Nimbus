import { View, Text, ScrollView, useColorScheme } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useInvoices } from '../../hooks/useInvoices'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import type { InvoiceStatus } from '@nimbus/shared'

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
  const scheme = useColorScheme()
  const dark = scheme === 'dark'

  const bg = dark ? '#030712' : '#f9fafb'
  const cardBg = dark ? '#111827' : '#ffffff'
  const textColor = dark ? '#f9fafb' : '#111827'
  const mutedColor = dark ? '#6b7280' : '#9ca3af'
  const borderColor = dark ? '#1f2937' : '#e5e7eb'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, letterSpacing: 1, fontFamily: 'IBMPlexMono_700Bold' }}>
          INVOICES
        </Text>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (invoices ?? []).length === 0 ? (
        <EmptyState message="No invoices yet" />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          {(invoices ?? []).map((invoice) => {
            const chip = invoiceChipStyle(invoice.status, dark)
            return (
              <View
                key={invoice.id}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
                    #{invoice.invoiceNumber}
                  </Text>
                  <Text style={{ fontSize: 12, color: mutedColor, marginTop: 3 }}>
                    {new Date(invoice.issuedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>
                    ${(invoice.total / 100).toFixed(2)}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: chip.bg,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1, color: chip.text }}>
                      {STATUS_LABELS[invoice.status]}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
