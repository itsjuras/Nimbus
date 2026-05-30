import { supabase } from '../supabase.js'
import type { FinanceSummary } from '@nimbus/shared'

export async function getFinanceSummary(
  companyId: string,
  from: string,
  to: string,
): Promise<FinanceSummary> {
  // Revenue: sum of line items on paid invoices in the period
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'paid')
    .gte('paid_at', from)
    .lte('paid_at', to)

  const invoiceIds = ((invoices ?? []) as Record<string, unknown>[]).map((i) => i['id'] as string)

  let revenueCents = 0
  if (invoiceIds.length > 0) {
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('quantity, unit_amount_cents')
      .in('invoice_id', invoiceIds)

    for (const item of (lineItems ?? []) as Record<string, unknown>[]) {
      revenueCents += (item['quantity'] as number) * (item['unit_amount_cents'] as number)
    }
  }

  // Supply costs: approved expenses in the period
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount_cents')
    .eq('company_id', companyId)
    .eq('status', 'approved')
    .gte('created_at', from)
    .lte('created_at', to)

  const supplyCostsCents = ((expenses ?? []) as Record<string, unknown>[]).reduce(
    (sum, e) => sum + (e['amount_cents'] as number),
    0,
  )

  // Wage costs: all wage entries in the period
  const { data: wages } = await supabase
    .from('wage_entries')
    .select('total_cents')
    .eq('company_id', companyId)
    .gte('period_date', from.split('T')[0]!)
    .lte('period_date', to.split('T')[0]!)

  const wageCostsCents = ((wages ?? []) as Record<string, unknown>[]).reduce(
    (sum, w) => sum + (w['total_cents'] as number),
    0,
  )

  const totalCostsCents = supplyCostsCents + wageCostsCents

  return {
    revenueCents,
    supplyCostsCents,
    wageCostsCents,
    totalCostsCents,
    profitCents: revenueCents - totalCostsCents,
    period: { from, to },
  }
}
