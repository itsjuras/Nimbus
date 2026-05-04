import { supabase } from '../db/supabase.js'
import { createProfile } from '../db/queries/profiles.js'
import { AppError } from '../middleware/errorHandler.js'
import type { SignUpRequest, InviteCrewRequest, Profile } from '@nimbus/shared'

export interface SignUpResult {
  userId: string
  companyId: string
  profile: Profile
}

export async function signUpOwner(data: SignUpRequest): Promise<SignUpResult> {
  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    throw new AppError('SIGNUP_FAILED', authError?.message ?? 'Failed to create user', 400)
  }

  const userId = authData.user.id

  try {
    // 2. Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: data.companyName, owner_id: userId })
      .select()
      .single()

    if (companyError || !company) {
      throw new AppError('SIGNUP_FAILED', 'Failed to create company', 500)
    }

    const companyId = (company as Record<string, unknown>)['id'] as string

    // 3. Create the owner profile
    const profile = await createProfile({
      id: userId,
      companyId,
      role: 'owner',
      fullName: data.fullName,
    })

    return { userId, companyId, profile }
  } catch (err) {
    // Roll back the auth user if anything after it fails
    await supabase.auth.admin.deleteUser(userId)
    throw err
  }
}

export interface InviteCrewResult {
  profile: Profile
}

export async function inviteCrew(
  companyId: string,
  data: InviteCrewRequest,
): Promise<InviteCrewResult> {
  // 1. Send the Supabase invite email — creates the auth user in pending state
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    data.email,
    { data: { company_id: companyId, full_name: data.fullName } },
  )

  if (inviteError || !inviteData.user) {
    if (inviteError?.message?.includes('already been registered')) {
      throw new AppError('EMAIL_IN_USE', 'A user with that email already exists', 409)
    }
    throw new AppError('INVITE_FAILED', inviteError?.message ?? 'Failed to send invite', 500)
  }

  // 2. Create the profile row immediately so requireAuth works when they accept
  const profile = await createProfile({
    id: inviteData.user.id,
    companyId,
    role: data.role,
    fullName: data.fullName,
    ...(data.phone !== undefined && { phone: data.phone }),
  })

  return { profile }
}
