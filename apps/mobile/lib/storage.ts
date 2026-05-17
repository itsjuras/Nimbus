import * as FileSystem from 'expo-file-system'
import { supabase } from './supabase'

const BUCKET = 'job-photos'

export async function uploadJobPhoto(
  companyId: string,
  jobId: string,
  checklistItemId: string,
  localUri: string,
): Promise<string> {
  const uuid = generateUUID()
  const path = `${companyId}/${jobId}/${checklistItemId}/${uuid}.jpg`

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const arrayBuffer = base64ToArrayBuffer(base64)

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: false,
  })

  if (error) throw new Error(error.message)
  return path
}

export async function getSignedPhotoUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) throw new Error(error?.message ?? 'Failed to get signed URL')
  return data.signedUrl
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
