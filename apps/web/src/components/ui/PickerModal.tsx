interface PickerOption {
  id: string
  label: string
  sublabel?: string | null
}

interface PickerModalProps {
  open: boolean
  onClose: () => void
  title: string
  options: PickerOption[]
  onSelect: (id: string) => void
}

export function PickerModal({ open, onClose, title, options, onSelect }: PickerModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-3 space-y-1">
          {options.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              Nothing to select.
            </p>
          ) : (
            options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => { onSelect(option.id); onClose() }}
                className="w-full rounded-xl px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 normal-case tracking-normal">{option.label}</p>
                {option.sublabel && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal mt-0.5">{option.sublabel}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function PickerField({
  label,
  placeholder,
  selectedLabel,
  selectedSublabel,
  onOpen,
  onClear,
}: {
  label: string
  placeholder: string
  selectedLabel: string | null
  selectedSublabel?: string | null | undefined
  onOpen: () => void
  onClear?: (() => void) | undefined
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
        {label}
      </p>
      {selectedLabel ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5">
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100 normal-case tracking-normal">{selectedLabel}</p>
            {selectedSublabel && (
              <p className="truncate text-xs text-gray-400 dark:text-gray-500 normal-case tracking-normal">{selectedSublabel}</p>
            )}
          </button>
          {onClear && (
            <button type="button" onClick={onClear} className="ml-2 shrink-0 text-lg leading-none text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
              ×
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="w-full rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-3 py-2.5 text-left text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors normal-case tracking-normal"
        >
          {placeholder}
        </button>
      )}
    </div>
  )
}
