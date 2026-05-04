import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../db/supabase.js'

export interface AuthUser {
  id: string
  companyId: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing Bearer token' } })
    return
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } })
    return
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'User profile not found' } })
    return
  }

  req.user = {
    id: data.user.id,
    companyId: profile.company_id as string,
    role: profile.role as string,
  }

  next()
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
      return
    }
    next()
  }
}
