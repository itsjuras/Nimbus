import { Resend } from 'resend'

const apiKey = process.env['RESEND_API_KEY']
if (!apiKey) throw new Error('Missing RESEND_API_KEY')

export const resend = new Resend(apiKey)

export const fromEmail = process.env['REPORT_FROM_EMAIL'] ?? 'onboarding@resend.dev'
