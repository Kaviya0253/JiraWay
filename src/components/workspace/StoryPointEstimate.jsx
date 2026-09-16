import { useState } from 'react'
import { SpinnerArrowsIcon, CheckIcon, CloseIcon } from './icons'

export default function StoryPointEstimate({ value, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEdit() {
    setDraft(value ?? '')
    setEditing(true)
  }

  function confirm() {
    const trimmed = draft.trim()
    onChange?.(trimmed === '' ? null : trimmed)
    setEditing(false)
  }

  function cancel() {
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-shrink-0 items-center gap-1">
        <div className="flex h-7 w-16 items-center gap-1 rounded-md border-2 border-blue-500 bg-white px-2 dark:bg-gray-800">
          <input
            type="text"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirm()
              if (event.key === 'Escape') cancel()
            }}
            className="w-full min-w-0 bg-transparent text-sm text-gray-900 outline-none dark:text-gray-100"
          />
          <SpinnerArrowsIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
        </div>

        <button
          type="button"
          onClick={confirm}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-gray-300 text-green-600 hover:bg-green-50 dark:border-gray-600"
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="group/points relative flex-shrink-0">
      <button
        type="button"
        onClick={startEdit}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
      >
        {value ?? '–'}
      </button>

      <span className="pointer-events-none absolute right-0 top-full z-40 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover/points:opacity-100 dark:bg-gray-700">
        Story point estimate
      </span>
    </div>
  )
}
