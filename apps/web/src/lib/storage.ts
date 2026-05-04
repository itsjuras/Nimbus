import { supabase } from './supabase'

const BUCKET = 'job-photos'

export async function uploadJobPhoto(
  companyId: string,
  jobId: string,
  checklistItemId: string,
  file: File,
): Promise<string> {
  const ext = 'webp'
  const uuid = crypto.randomUUID()
  const path = `${companyId}/${jobId}/${checklistItemId}/${uuid}.${ext}`

  // Convert to webp via canvas for consistent format and smaller size
  const webpBlob = await convertToWebp(file)

  const { error } = await supabase.storage.from(BUCKET).upload(path, webpBlob, {
    contentType: 'image/webp',
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

async function convertToWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Cap at 1920px wide to keep uploads reasonable
      const maxWidth = 1920
      const scale = Math.min(1, maxWidth / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) resolve(blob)
          else reject(new Error('Failed to convert image'))
        },
        'image/webp',
        0.85,
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}
