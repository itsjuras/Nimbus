import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { supabase } from '../db/supabase.js'

export const mobileRouter = Router()

mobileRouter.use(requireAuth)

// POST /api/v1/push-tokens
mobileRouter.post('/push-tokens', async (req, res, next) => {
  try {
    const { token } = req.body as { token: string }
    if (!token) {
      res.status(400).json({ error: { message: 'token is required' } })
      return
    }

    await supabase
      .from('push_tokens')
      .upsert({ profile_id: req.user.id, token }, { onConflict: 'profile_id,token' })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/time-off
mobileRouter.get('/time-off', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('id, start_date, end_date, reason, status')
      .eq('profile_id', req.user.id)
      .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)

    res.json(
      (data ?? []).map((r) => ({
        id: r.id,
        startDate: r.start_date,
        endDate: r.end_date,
        reason: r.reason,
        status: r.status,
      })),
    )
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/time-off
mobileRouter.post('/time-off', async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body as {
      startDate: string
      endDate: string
      reason: string | null
    }

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({
        profile_id: req.user.id,
        company_id: req.user.companyId,
        start_date: startDate,
        end_date: endDate,
        reason: reason ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    res.status(201).json({
      id: data.id,
      startDate: data.start_date,
      endDate: data.end_date,
      reason: data.reason,
      status: data.status,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/availability
mobileRouter.get('/availability', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('crew_availability')
      .select('day_of_week, available')
      .eq('profile_id', req.user.id)

    if (error) throw new Error(error.message)

    res.json((data ?? []).map((a) => ({ dayOfWeek: a.day_of_week, available: a.available })))
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/availability
mobileRouter.post('/availability', async (req, res, next) => {
  try {
    const { dayOfWeek, available } = req.body as { dayOfWeek: number; available: boolean }

    const { error } = await supabase
      .from('crew_availability')
      .upsert(
        { profile_id: req.user.id, day_of_week: dayOfWeek, available },
        { onConflict: 'profile_id,day_of_week' },
      )

    if (error) throw new Error(error.message)

    res.json({ dayOfWeek, available })
  } catch (err) {
    next(err)
  }
})
