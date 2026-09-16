import { useState } from 'react'
import { CheckboxIcon, ChevronDownIcon, BugIcon, StoryIcon } from './icons'
import AddWorkTypeModal from './AddWorkTypeModal'

const TYPE_OPTIONS = [
  { key: 'task', label: 'Task', icon: CheckboxIcon, iconColor: 'text-blue-600' },
  { key: 'bug', label: 'Bug', icon: BugIcon, iconColor: 'text-red-600' },
  { key: 'story', label: 'Story', icon: StoryIcon, iconColor: 'text-green-600' },
]

export default function WorkTypeSelector({ dropUp = false, onOpenChange, onChange }) {
  const [menuOpen, setMenuOpenState] = useState(false)
  const [addWorkTypeOpen, setAddWorkTypeOpen] = useState(false)
  const [selectedType, setSelectedType] = useState('task')

  function setMenuOpen(value) {
    setMenuOpenState(value)
    onOpenChange?.(value)
  }

  function selectType(type) {
    setSelectedType(type)
    setMenuOpen(false)
    onChange?.(type)
  }

  const activeOption = TYPE_OPTIONS.find((option) => option.key === selectedType)
  const TriggerIcon = activeOption?.icon ?? CheckboxIcon

  return (
    <div className="relative flex items-center text-gray-400">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className={[
          'flex items-center gap-0.5 rounded px-1 py-1 hover:text-blue-600',
          activeOption ? activeOption.iconColor : '',
        ].join(' ')}
      >
        <TriggerIcon className="h-6 w-6" />
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            className={[
              'absolute left-0 z-20 w-44 rounded-md border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800',
              dropUp ? 'bottom-full mb-1' : 'top-full mt-1',
            ].join(' ')}
          >
            {TYPE_OPTIONS.filter((option) => option.key !== selectedType).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => selectType(option.key)}
                className="flex w-full items-center gap-2 border-l-2 border-transparent px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <option.icon className={`h-5 w-5 flex-shrink-0 ${option.iconColor}`} />
                {option.label}
              </button>
            ))}

            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setAddWorkTypeOpen(true)
              }}
              className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Add work type
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Edit work type
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Manage
            </button>
          </div>
        </>
      )}

      {addWorkTypeOpen && <AddWorkTypeModal onClose={() => setAddWorkTypeOpen(false)} />}
    </div>
  )
}
