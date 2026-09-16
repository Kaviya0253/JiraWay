import { useState } from 'react'
import { CloseIcon, ChevronDownIcon, BugIcon, StoryIcon, CustomTypeIcon } from './icons'

const WORK_TYPES = [
  {
    key: 'bug',
    label: 'Bug',
    description: 'Bugs track problems or errors.',
    icon: BugIcon,
    iconColor: 'text-red-600',
  },
  {
    key: 'story',
    label: 'Story',
    description: 'Stories track functionality or features expressed as user goals.',
    icon: StoryIcon,
    iconColor: 'text-green-600',
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Create your own work type.',
    icon: CustomTypeIcon,
    iconColor: 'text-gray-500',
  },
]

export default function AddWorkTypeModal({ onClose, onAdd }) {
  const [selected, setSelected] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedType = WORK_TYPES.find((type) => type.key === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add work type</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          Required fields are marked with an asterisk <span className="text-red-500">*</span>
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Work type <span className="text-red-500">*</span>
          </label>

          <div className="relative mt-1">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-md border-2 border-blue-500 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
            >
              {selectedType ? selectedType.label : 'Select work type'}
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {WORK_TYPES.map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setSelected(type.key)
                      setDropdownOpen(false)
                    }}
                    className={[
                      'flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left',
                      selected === type.key
                        ? 'border-blue-600 bg-gray-100 dark:bg-gray-700'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700',
                    ].join(' ')}
                  >
                    <type.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${type.iconColor}`} />
                    <span>
                      <span className="block text-sm text-gray-900 dark:text-gray-100">{type.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {type.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => {
              onAdd?.(selectedType)
              onClose()
            }}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium',
              selected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
            ].join(' ')}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
