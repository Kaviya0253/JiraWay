import { useState } from 'react'
import { ChevronDownIcon } from './icons'

const DESTINATIONS = [
  { key: 'new-sprint', label: 'New sprint' },
  { key: 'backlog', label: 'Backlog' },
]

export default function CompleteSprintModal({
  sprintTitle,
  completedCount,
  openCount,
  onCancel,
  onConfirm,
}) {
  const [destination, setDestination] = useState('new-sprint')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const selectedLabel = DESTINATIONS.find((option) => option.key === destination)?.label

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="flex h-24 items-center justify-center bg-gradient-to-r from-cyan-400 to-teal-400">
          <span className="text-4xl">🏆</span>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Complete {sprintTitle}
          </h2>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            This sprint contains{' '}
            <strong>
              {completedCount} completed work item{completedCount === 1 ? '' : 's'}
            </strong>{' '}
            and{' '}
            <strong>
              {openCount} open work item{openCount === 1 ? '' : 's'}
            </strong>
            .
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            <li>Completed work items includes everything in the last column on the board, Done.</li>
            <li>
              Open work items includes everything from any other column on the board. Move these to a
              new sprint or the backlog.
            </li>
          </ul>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Move open work items to
            </label>

            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md border-2 border-blue-500 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              >
                {selectedLabel}
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {DESTINATIONS.filter((option) => option.key !== destination).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setDestination(option.key)
                          setDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {confirming && (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              This will end the current sprint. Are you sure?
            </p>
          )}

          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            {confirming ? (
              <button
                type="button"
                onClick={() => onConfirm(destination)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                OK
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Complete sprint
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
