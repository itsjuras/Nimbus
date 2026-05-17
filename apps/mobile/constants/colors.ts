export const colors = {
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  white: '#ffffff',
  black: '#000000',
} as const

export const statusColors = {
  scheduled: {
    bg: colors.gray[100],
    text: colors.gray[600],
    bgDark: colors.gray[800],
    textDark: colors.gray[400],
  },
  in_progress: {
    bg: colors.gray[900],
    text: colors.white,
    bgDark: colors.gray[100],
    textDark: colors.gray[900],
  },
  completed: {
    bg: colors.gray[200],
    text: colors.gray[700],
    bgDark: colors.gray[700],
    textDark: colors.gray[300],
  },
  missed: {
    bg: colors.gray[100],
    text: colors.gray[400],
    bgDark: colors.gray[800],
    textDark: colors.gray[500],
  },
} as const
