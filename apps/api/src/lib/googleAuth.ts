import { OAuth2Client } from 'google-auth-library'

const clientId = process.env['GOOGLE_CLIENT_ID']
const clientSecret = process.env['GOOGLE_CLIENT_SECRET']
export const REDIRECT_URI =
  process.env['GOOGLE_REDIRECT_URI'] ?? 'http://localhost:3001/api/v1/company/gmail/callback'
export const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'http://localhost:5173'

export function createOAuth2Client() {
  return new OAuth2Client(clientId, clientSecret, REDIRECT_URI)
}

// In-memory state store — maps a random token to companyId for the duration of the OAuth flow
const stateMap = new Map<string, { companyId: string; expiresAt: number }>()

export function generateOAuthState(companyId: string): string {
  const token = crypto.randomUUID()
  stateMap.set(token, { companyId, expiresAt: Date.now() + 10 * 60 * 1000 })
  return token
}

export function consumeOAuthState(token: string): string | null {
  const entry = stateMap.get(token)
  stateMap.delete(token)
  if (!entry || entry.expiresAt < Date.now()) return null
  return entry.companyId
}
