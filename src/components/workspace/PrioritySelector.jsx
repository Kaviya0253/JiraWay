import { useState, useEffect } from 'react'
import { DoubleChevronUpIcon, ChevronUpIcon, RankIcon, ChevronDownIcon, DoubleChevronDownIcon } from './icons'

const PRIORITY_OPTIONS = [
  { key: 'Highest', icon: DoubleChevronUpIcon, color: 'text-red-600' },
  { key: 'High', icon: ChevronUpIcon, color: 'text-orange-500' },
  { key: 'Medium', icon: RankIcon, color: 'text-yellow-500' },
  { key: 'Low', icon: ChevronDownIcon, color: 'text-blue-500' },
  { key: 'Lowest', icon: DoubleChevronDownIcon, color: 'text-blue-700' },
]

export default function PrioritySelector({ value = 'Medium', onChange, dropUp = false, forceOpen = false }) {
  const [open, setOpen] = useState(forceOpen)

  // Lets a guided-tour step show the real dropdown open without a click, so
  // she can see the actual options while it's being explained — and closes
  // it back to normal the moment the tour moves off this stop.
  useEffect(() => {
    setOpen(forceOpen)
  }, [forceOpen])
  const current = PRIORITY_OPTIONS.find((option) => option.key === value) ?? PRIORITY_OPTIONS[2]
  const TriggerIcon = current.icon

  return (
    <div className="group/priority relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`flex h-7 w-7 items-center justify-center rounded-md border ${open ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'} ${current.color}`}
      >
        <TriggerIcon className="h-4 w-4" />
      </button>

      {!open && (
        <span className="pointer-events-none absolute right-0 top-full z-30 mt-1 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover/priority:opacity-100 dark:bg-gray-700">
          Priority: {value}
        </span>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={[
              'absolute right-0 z-20 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
            ].join(' ')}
          >
            {PRIORITY_OPTIONS.filter((option) => option.key !== value).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  onChange?.(option.key)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <option.icon className={`h-4 w-4 flex-shrink-0 ${option.color}`} />
                {option.key}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
