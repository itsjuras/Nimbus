/**
 * Demo seed — creates a fully populated Brightline Cleaning Co. account.
 *
 * Login: demo@nimbus.app / demo1234
 *
 * Run: pnpm --filter api seed
 */
import { supabase } from './supabase.js'

const DEMO_EMAIL = 'demo@nimbus.app'
const DEMO_PASSWORD = 'demo1234'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

function todayAt(hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

async function insert<T extends Record<string, unknown>>(
  table: string,
  rows: Record<string, unknown> | Record<string, unknown>[],
) {
  const { data, error } = await supabase.from(table).insert(rows).select()
  if (error) throw new Error(`Insert into ${table}: ${error.message}`)
  // .select() returns every inserted row, so the result is never empty
  return data as [T, ...T[]]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  Starting seed…')

  // ── 1. Guard: skip if demo account already exists ──────────────────────────
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const alreadySeeded = existingUsers.users.some((u) => u.email === DEMO_EMAIL)
  if (alreadySeeded) {
    console.log('⏭   Demo account already exists — skipping.')
    process.exit(0)
  }

  // ── 2. Create auth users ───────────────────────────────────────────────────
  console.log('  Creating auth users…')

  const { data: ownerAuth, error: ownerErr } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  })
  if (ownerErr || !ownerAuth.user) throw new Error(ownerErr?.message ?? 'Failed to create owner')

  const { data: crew1Auth, error: crew1Err } = await supabase.auth.admin.createUser({
    email: 'tom@nimbus.app',
    password: DEMO_PASSWORD,
    email_confirm: true,
  })
  if (crew1Err || !crew1Auth.user) throw new Error(crew1Err?.message ?? 'Failed to create crew1')

  const { data: crew2Auth, error: crew2Err } = await supabase.auth.admin.createUser({
    email: 'maria@nimbus.app',
    password: DEMO_PASSWORD,
    email_confirm: true,
  })
  if (crew2Err || !crew2Auth.user) throw new Error(crew2Err?.message ?? 'Failed to create crew2')

  const ownerId = ownerAuth.user.id
  const crew1Id = crew1Auth.user.id
  const crew2Id = crew2Auth.user.id

  // ── 3. Company ─────────────────────────────────────────────────────────────
  console.log('  Creating company…')
  const [company] = await insert('companies', {
    name: 'Brightline Cleaning Co.',
    owner_id: ownerId,
  })
  const companyId = company['id'] as string

  // ── 4. Profiles ────────────────────────────────────────────────────────────
  console.log('  Creating profiles…')
  await insert('profiles', [
    { id: ownerId, company_id: companyId, role: 'owner', full_name: 'Sarah Mitchell' },
    { id: crew1Id, company_id: companyId, role: 'crew', full_name: 'Tom Harris' },
    { id: crew2Id, company_id: companyId, role: 'crew', full_name: 'Maria Santos' },
  ])

  // ── 5. Clients ─────────────────────────────────────────────────────────────
  console.log('  Creating clients…')
  const [apex] = await insert('clients', {
    company_id: companyId,
    name: 'Apex Financial Group',
    address: '200 Bay St, Toronto, ON',
    contact_name: 'James Park',
    contact_email: 'james.park@apexfin.com',
    notes: 'Floors 12–14. Security badge required — pick up from reception. Do not enter server room.',
  })
  const [riverside] = await insert('clients', {
    company_id: companyId,
    name: 'Riverside Elementary School',
    address: '45 River Rd, Mississauga, ON',
    contact_name: 'Linda Kowalski',
    contact_email: 'lkowalski@riverside.edu',
    notes: 'Evening cleans only. Gym and cafeteria are highest priority.',
  })
  const [metro] = await insert('clients', {
    company_id: companyId,
    name: 'Metro Fitness Center',
    address: '1010 King St W, Toronto, ON',
    contact_name: 'Derek Osei',
    contact_email: 'derek@metrofitness.ca',
    notes: 'Pay extra attention to locker rooms and showers. Non-slip floor treatment weekly.',
  })
  const [cloudbase] = await insert('clients', {
    company_id: companyId,
    name: 'CloudBase Technologies',
    address: '33 Tech Ave, Waterloo, ON',
    contact_name: 'Priya Nair',
    contact_email: 'priya.nair@cloudbase.io',
    notes: 'Open-plan office. Use silent vacuum after 6pm. Snack bar area needs daily wipe down.',
  })

  const apexId = apex['id'] as string
  const riversideId = riverside['id'] as string
  const metroId = metro['id'] as string
  const cloudbaseId = cloudbase['id'] as string

  // ── 6. Checklists + items ──────────────────────────────────────────────────
  console.log('  Creating checklists…')

  // Apex
  const [apexCl] = await insert('checklists', { company_id: companyId, client_id: apexId, name: 'Standard Office Clean' })
  const apexClId = apexCl['id'] as string
  const apexItems = await insert('checklist_items', [
    { checklist_id: apexClId, label: 'Vacuum all carpeted areas', requires_photo: false, position: 0 },
    { checklist_id: apexClId, label: 'Wipe down all desks and surfaces', requires_photo: false, position: 1 },
    { checklist_id: apexClId, label: 'Clean kitchen and restock supplies', requires_photo: true, position: 2 },
    { checklist_id: apexClId, label: 'Empty all bins and replace liners', requires_photo: false, position: 3 },
    { checklist_id: apexClId, label: 'Clean toilets, sinks, and mirrors', requires_photo: true, position: 4 },
  ])

  // Riverside
  const [riverCl] = await insert('checklists', { company_id: companyId, client_id: riversideId, name: 'School Cleaning Protocol' })
  const riverClId = riverCl['id'] as string
  const riverItems = await insert('checklist_items', [
    { checklist_id: riverClId, label: 'Sweep and mop all hallways', requires_photo: false, position: 0 },
    { checklist_id: riverClId, label: 'Clean and sanitise all classrooms', requires_photo: false, position: 1 },
    { checklist_id: riverClId, label: 'Clean cafeteria tables and floor', requires_photo: true, position: 2 },
    { checklist_id: riverClId, label: 'Gym floor dust and mop', requires_photo: true, position: 3 },
    { checklist_id: riverClId, label: 'Sanitise bathrooms (4 blocks)', requires_photo: true, position: 4 },
    { checklist_id: riverClId, label: 'Take out all waste to bins', requires_photo: false, position: 5 },
  ])

  // Metro
  const [metroCl] = await insert('checklists', { company_id: companyId, client_id: metroId, name: 'Gym & Locker Room Clean' })
  const metroClId = metroCl['id'] as string
  const metroItems = await insert('checklist_items', [
    { checklist_id: metroClId, label: 'Wipe down all machines and equipment', requires_photo: false, position: 0 },
    { checklist_id: metroClId, label: 'Mop gym floor with disinfectant', requires_photo: true, position: 1 },
    { checklist_id: metroClId, label: 'Clean and disinfect men\'s locker room', requires_photo: true, position: 2 },
    { checklist_id: metroClId, label: 'Clean and disinfect women\'s locker room', requires_photo: true, position: 3 },
    { checklist_id: metroClId, label: 'Scrub showers and replace toiletries', requires_photo: false, position: 4 },
    { checklist_id: metroClId, label: 'Restock paper towels and soap dispensers', requires_photo: false, position: 5 },
    { checklist_id: metroClId, label: 'Wipe mirrors throughout facility', requires_photo: false, position: 6 },
  ])

  // CloudBase
  const [cloudCl] = await insert('checklists', { company_id: companyId, client_id: cloudbaseId, name: 'Tech Office Clean' })
  const cloudClId = cloudCl['id'] as string
  const cloudItems = await insert('checklist_items', [
    { checklist_id: cloudClId, label: 'Vacuum open-plan floor area', requires_photo: false, position: 0 },
    { checklist_id: cloudClId, label: 'Wipe all standing desks and monitors', requires_photo: false, position: 1 },
    { checklist_id: cloudClId, label: 'Clean snack bar and kitchen', requires_photo: true, position: 2 },
    { checklist_id: cloudClId, label: 'Sanitise meeting room surfaces', requires_photo: false, position: 3 },
    { checklist_id: cloudClId, label: 'Clean bathrooms and restock', requires_photo: true, position: 4 },
  ])

  // ── 7. Jobs ────────────────────────────────────────────────────────────────
  console.log('  Creating jobs…')

  // ---- SCHEDULED (future) ---------------------------------------------------
  const [jobS1] = await insert('jobs', {
    company_id: companyId, client_id: cloudbaseId, checklist_id: cloudClId,
    scheduled_at: daysFromNow(1), status: 'scheduled',
    notes: 'Evening clean — access via side door code 4821.',
  })
  const [jobS2] = await insert('jobs', {
    company_id: companyId, client_id: apexId, checklist_id: apexClId,
    scheduled_at: daysFromNow(2), status: 'scheduled',
    notes: 'Floor 14 boardroom needs extra attention before Friday client event.',
  })
  const [jobS3] = await insert('jobs', {
    company_id: companyId, client_id: riversideId, checklist_id: riverClId,
    scheduled_at: daysFromNow(3), status: 'scheduled',
  })

  // ---- IN PROGRESS (today) -------------------------------------------------
  const [jobIP1] = await insert('jobs', {
    company_id: companyId, client_id: metroId, checklist_id: metroClId,
    scheduled_at: todayAt(8, 0), status: 'in_progress',
  })
  const [jobIP2] = await insert('jobs', {
    company_id: companyId, client_id: apexId, checklist_id: apexClId,
    scheduled_at: todayAt(9, 30), status: 'in_progress',
    notes: 'Client requested extra focus on kitchen area today.',
  })

  // ---- COMPLETED (past) ----------------------------------------------------
  const [jobC1] = await insert('jobs', {
    company_id: companyId, client_id: apexId, checklist_id: apexClId,
    scheduled_at: daysAgo(1), status: 'completed',
  })
  const [jobC2] = await insert('jobs', {
    company_id: companyId, client_id: riversideId, checklist_id: riverClId,
    scheduled_at: daysAgo(2), status: 'completed',
  })
  const [jobC3] = await insert('jobs', {
    company_id: companyId, client_id: cloudbaseId, checklist_id: cloudClId,
    scheduled_at: daysAgo(3), status: 'completed',
  })
  const [jobC4] = await insert('jobs', {
    company_id: companyId, client_id: metroId, checklist_id: metroClId,
    scheduled_at: daysAgo(4), status: 'completed',
  })

  // ---- MISSED ---------------------------------------------------------------
  const [jobM1] = await insert('jobs', {
    company_id: companyId, client_id: cloudbaseId, checklist_id: cloudClId,
    scheduled_at: daysAgo(6), status: 'missed',
    notes: 'Crew unavailable — reschedule.',
  })

  // ── 8. Job crew assignments ────────────────────────────────────────────────
  console.log('  Assigning crew…')
  await insert('job_crew', [
    // Scheduled
    { job_id: jobS1['id'], profile_id: crew1Id },
    { job_id: jobS1['id'], profile_id: crew2Id },
    { job_id: jobS2['id'], profile_id: crew1Id },
    { job_id: jobS3['id'], profile_id: crew2Id },
    // In progress
    { job_id: jobIP1['id'], profile_id: crew1Id },
    { job_id: jobIP1['id'], profile_id: crew2Id },
    { job_id: jobIP2['id'], profile_id: crew2Id },
    // Completed
    { job_id: jobC1['id'], profile_id: crew1Id },
    { job_id: jobC2['id'], profile_id: crew1Id },
    { job_id: jobC2['id'], profile_id: crew2Id },
    { job_id: jobC3['id'], profile_id: crew2Id },
    { job_id: jobC4['id'], profile_id: crew1Id },
    { job_id: jobC4['id'], profile_id: crew2Id },
    // Missed
    { job_id: jobM1['id'], profile_id: crew1Id },
  ])

  // ── 9. job_checklist_items for in-progress jobs ────────────────────────────
  console.log('  Seeding checklist items for in-progress jobs…')

  // jobIP1 (Metro Fitness) — 4 of 7 done
  const ip1Items = await insert('job_checklist_items',
    metroItems.map((item, i) => ({
      job_id: jobIP1['id'],
      checklist_item_id: item['id'],
      completed: i < 4,
      completed_by: i < 4 ? crew1Id : null,
      completed_at: i < 4 ? todayAt(8, 10 + i * 15) : null,
    }))
  )

  // jobIP2 (Apex) — 2 of 5 done
  await insert('job_checklist_items',
    apexItems.map((item, i) => ({
      job_id: jobIP2['id'],
      checklist_item_id: item['id'],
      completed: i < 2,
      completed_by: i < 2 ? crew2Id : null,
      completed_at: i < 2 ? todayAt(9, 40 + i * 20) : null,
    }))
  )

  // ── 10. job_checklist_items + completions for completed jobs ───────────────
  console.log('  Seeding checklist items for completed jobs…')

  async function completeJob(
    jobId: string,
    items: Record<string, unknown>[],
    completedById: string,
    dayOffset: number,
  ) {
    await insert('job_checklist_items',
      items.map((item, i) => ({
        job_id: jobId,
        checklist_item_id: item['id'],
        completed: true,
        completed_by: completedById,
        completed_at: daysAgo(dayOffset),
      }))
    )
    await insert('job_completions', {
      job_id: jobId,
      completed_by: completedById,
      completed_at: daysAgo(dayOffset),
    })
  }

  await completeJob(jobC1['id'] as string, apexItems, crew1Id, 1)
  await completeJob(jobC2['id'] as string, riverItems, crew2Id, 2)
  await completeJob(jobC3['id'] as string, cloudItems, crew2Id, 3)
  await completeJob(jobC4['id'] as string, metroItems, crew1Id, 4)

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('')
  console.log('✅  Seed complete!')
  console.log('')
  console.log('   Login:    demo@nimbus.app')
  console.log('   Password: demo1234')
  console.log('')
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
