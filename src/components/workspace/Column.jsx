import { Children, useState } from 'react'
import {
  EllipsisIcon,
  ChecklistIcon,
  PlusIcon,
  CalendarIcon,
  PersonIcon,
  EnterIcon,
  SearchIcon,
} from './icons'
import WorkTypeSelector from './WorkTypeSelector'
import DueDatePicker from './DueDatePicker'

export default function Column({
  title,
  showEllipsis,
  showChecklist,
  onDelete,
  onDropTicket,
  alwaysShowCreate,
  onCreateTicket,
  isCreating,
  onOpenCreate,
  onCloseCreate,
  noResults,
  onClearFilters,
  children,
  dataTour,
  actionsDisabled = false,
}) {
  const count = Children.count(children)
  const [menuOpen, setMenuOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [dueDate, setDueDate] = useState(null)
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false)

  function confirmCreate() {
    const title = newTitle.trim()
    if (title) {
      onCreateTicket?.(title, dueDate)
    }
    setNewTitle('')
    setDueDate(null)
    setTypeMenuOpen(false)
    setDueDatePickerOpen(false)
    onCloseCreate?.()
  }

  function cancelCreate() {
    setNewTitle('')
    setDueDate(null)
    setTypeMenuOpen(false)
    setDueDatePickerOpen(false)
    onCloseCreate?.()
  }

  return (
    <div
      data-tour={dataTour}
      className="group flex h-full min-w-[190px] max-w-[290px] shrink flex-grow basis-[268px] flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <div className="relative flex items-center justify-between rounded-md bg-gray-100 px-2 py-1.5 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-gray-600 dark:text-gray-300">
            {title}
          </span>
          {count > 0 && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{count}</span>
          )}
        </div>

        {showChecklist && <ChecklistIcon className="h-4 w-4 text-green-600" />}
        {showEllipsis && <EllipsisIcon className="h-4 w-4 text-gray-500" />}

        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (actionsDisabled) return
              setMenuOpen((open) => !open)
            }}
            className={`text-gray-500 opacity-0 group-hover:opacity-100 ${menuOpen ? 'opacity-100' : ''}`}
          >
            <EllipsisIcon className="h-4 w-4" />
          </button>
        )}

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-md dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  onDelete()
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          onDropTicket?.(event.dataTransfer.getData('text/plain'))
        }}
        className={[
          'flex min-h-[220px] flex-1 flex-col gap-2',
          typeMenuOpen || dueDatePickerOpen ? 'overflow-visible' : 'overflow-y-auto',
        ].join(' ')}
      >
        {children}

        {noResults && (
          <div className="flex flex-col items-center gap-2 rounded-md py-6 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-gray-400 dark:bg-gray-700">
              <SearchIcon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">No search results</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try a different word, phrase or filter.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Clear filters
            </button>
          </div>
        )}

        {onCreateTicket &&
          (isCreating ? (
            <>
              <div className="fixed inset-0 z-10" onClick={cancelCreate} />
              <div className="relative z-20 flex flex-col gap-3 rounded-lg border-2 border-blue-500 bg-white p-4 dark:bg-gray-800">
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmCreate()
                  if (event.key === 'Escape') cancelCreate()
                }}
                placeholder="What needs to be done?"
                className="py-1 text-sm leading-6 text-gray-900 outline-none dark:bg-transparent dark:text-gray-100"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <WorkTypeSelector dropUp={count > 0} onOpenChange={setTypeMenuOpen} />

                  <span className="relative flex">
                    <button
                      type="button"
                      onClick={() => setDueDatePickerOpen((open) => !open)}
                      className={dueDate ? 'text-blue-600' : 'hover:text-blue-600'}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </button>

                    {dueDatePickerOpen && (
                      <DueDatePicker
                        value={dueDate}
                        onChange={setDueDate}
                        onClose={() => setDueDatePickerOpen(false)}
                      />
                    )}
                  </span>

                  <PersonIcon className="h-4 w-4" />
                </div>

                <button
                  type="button"
                  onClick={confirmCreate}
                  disabled={!newTitle.trim()}
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded border',
                    newTitle.trim()
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                      : 'cursor-not-allowed border-gray-300 text-gray-300 dark:border-gray-600 dark:text-gray-600',
                  ].join(' ')}
                >
                  <EnterIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (actionsDisabled) return
                onOpenCreate?.()
              }}
              className={[
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                alwaysShowCreate ? '' : 'opacity-0 group-hover:opacity-100',
              ].join(' ')}
            >
              <PlusIcon className="h-4 w-4" />
              Create
            </button>
          ))}
      </div>
    </div>
  )
}
