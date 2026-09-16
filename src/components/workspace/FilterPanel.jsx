import { useState } from 'react'
import { createPortal } from 'react-dom'
import { team } from '../../data/sampleProject'
import { PlusIcon, SearchIcon, BugIcon, LightningIcon, StoryIcon, SubtaskIcon, CheckboxIcon } from './icons'
import { UNASSIGNED } from '../../utils/ticketFilters'

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done']
const TYPE_OPTIONS = [
  { key: 'Bug', icon: BugIcon, color: 'text-red-600' },
  { key: 'Epic', icon: LightningIcon, color: 'text-purple-600' },
  { key: 'Story', icon: StoryIcon, color: 'text-green-600' },
  { key: 'Subtask', icon: SubtaskIcon, color: 'text-blue-500' },
  { key: 'Task', icon: CheckboxIcon, color: 'text-blue-600' },
]

const FIELDS = [
  { key: 'parent', label: 'Parent' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'status', label: 'Status' },
  { key: 'workType', label: 'Work type' },
  { key: 'labels', label: 'Labels' },
]

function Checkbox({ label, checked, onChange, icon: Icon, iconColor }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
      />
      {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />}
      {label}
    </label>
  )
}

export default function FilterPanel({ filters, onChange, onClose, position }) {
  const [activeField, setActiveField] = useState(null)
  const [search, setSearch] = useState('')

  function selectField(fieldKey) {
    setActiveField(fieldKey)
    setSearch('')
  }

  function toggleValue(fieldKey, value) {
    const current = filters[fieldKey] ?? []
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]
    onChange({ ...filters, [fieldKey]: next })
  }

  function clearAll() {
    onChange({})
    setActiveField(null)
  }

  const activeFieldLabel = FIELDS.find((field) => field.key === activeField)?.label.toLowerCase()

  const assigneeOptions = [
    { name: 'Unassigned', value: UNASSIGNED },
    ...team.filter((member) => member.role !== 'Team Lead').map((member) => ({
      name: member.name,
      value: member.name,
    })),
  ].filter((option) => option.name.toLowerCase().includes(search.toLowerCase()))

  const statusOptions = STATUS_OPTIONS.filter((status) =>
    status.toLowerCase().includes(search.toLowerCase()),
  )

  const typeOptions = TYPE_OPTIONS.filter((type) =>
    type.key.toLowerCase().includes(search.toLowerCase()),
  )

  return createPortal(
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="fixed z-20 flex w-[420px] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex w-40 flex-shrink-0 flex-col gap-0.5 border-r border-gray-200 p-3 dark:border-gray-700">
          {FIELDS.map((field) => {
            const count = (filters[field.key] ?? []).length
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => selectField(field.key)}
                className={[
                  'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                  activeField === field.key
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                {field.label}
                {count > 0 && (
                  <span className="rounded-full bg-blue-100 px-1.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {count}
                  </span>
                )}
              </button>
            )
          })}

          <button
            type="button"
            className="mt-2 flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-left text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add field
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="mt-4 text-left text-sm text-gray-400 hover:text-blue-600 dark:text-gray-500"
          >
            Clear all
          </button>
        </div>

        <div className="min-h-[240px] flex-1 p-3">
          {!activeField && (
            <p className="p-1 text-sm text-gray-500 dark:text-gray-400">
              Select a field to start creating a filter.
            </p>
          )}

          {activeField && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-600">
              <SearchIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Search ${activeFieldLabel}`}
                className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
              />
            </div>
          )}

          {activeField === 'parent' && (
            <div className="flex flex-col gap-1">
              <Checkbox
                label="No parent"
                checked={(filters.parent ?? []).includes('no-parent')}
                onChange={() => toggleValue('parent', 'no-parent')}
              />
            </div>
          )}

          {activeField === 'assignee' && (
            <div className="flex flex-col gap-1">
              {assigneeOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  label={option.name}
                  checked={(filters.assignee ?? []).includes(option.value)}
                  onChange={() => toggleValue('assignee', option.value)}
                />
              ))}
            </div>
          )}

          {activeField === 'status' && (
            <div className="flex flex-col gap-1">
              {statusOptions.map((status) => (
                <Checkbox
                  key={status}
                  label={status}
                  checked={(filters.status ?? []).includes(status)}
                  onChange={() => toggleValue('status', status)}
                />
              ))}
            </div>
          )}

          {activeField === 'workType' && (
            <div className="flex flex-col gap-1">
              {typeOptions.map((type) => (
                <Checkbox
                  key={type.key}
                  label={type.key}
                  icon={type.icon}
                  iconColor={type.color}
                  checked={(filters.workType ?? []).includes(type.key)}
                  onChange={() => toggleValue('workType', type.key)}
                />
              ))}
            </div>
          )}

          {activeField === 'labels' && (
            <div className="flex flex-col gap-1">
              <Checkbox
                label="No label"
                checked={(filters.labels ?? []).includes('no-label')}
                onChange={() => toggleValue('labels', 'no-label')}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
