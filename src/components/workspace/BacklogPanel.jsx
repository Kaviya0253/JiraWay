import { useState } from 'react'
import {
  ChevronDownIcon,
  PencilIcon,
  EmptyCheckboxIcon,
  SprintIcon,
  EllipsisIcon,
  PlusIcon,
  CalendarIcon,
  PersonIcon,
  EnterIcon,
  CheckboxIcon,
  BugIcon,
  StoryIcon,
  SubtaskIcon,
  HierarchyIcon,
} from './icons'
import WorkTypeSelector from './WorkTypeSelector'
import DueDatePicker from './DueDatePicker'
import AssigneeAvatar from './AssigneeAvatar'
import PrioritySelector from './PrioritySelector'
import StoryPointEstimate from './StoryPointEstimate'
import { team } from '../../data/sampleProject'

const assignableTeam = team.filter((member) => member.role !== 'Team Lead')

const TYPE_ICON = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done']
const STATUS_COLOR = {
  'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function TicketRow({
  ticket,
  dataTour,
  isDemoTicket,
  activeSprintActionStop,
  isSelected,
  onToggleSelect,
  statusMenuOpen,
  onToggleStatusMenu,
  onChangeStatus,
  onChangeStoryPoints,
  onChangePriority,
  canDelete,
  ticketMenuOpen,
  onToggleTicketMenu,
  onDelete,
  onOpenSubtasks,
  subtaskSummary,
  epics,
  epicMenuOpen,
  onToggleEpicMenu,
  onChangeEpic,
  assigneeMenuOpen,
  onToggleAssigneeMenu,
  onChangeAssignee,
}) {
  const typeMeta = TYPE_ICON[ticket.type] ?? TYPE_ICON.Task
  const TypeIcon = typeMeta.icon

  return (
    <div
      draggable
      data-tour={dataTour}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', ticket.key)}
      className={[
        'group flex cursor-grab items-center gap-3 rounded-md border px-3 py-3 shadow-sm active:cursor-grabbing',
        isSelected
          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:hover:bg-blue-950/60'
          : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50',
      ].join(' ')}
    >
      <span className="flex flex-shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleSelect}
          className={['h-4 w-4', isSelected ? 'visible' : 'invisible group-hover:visible'].join(' ')}
        >
          {isSelected ? (
            <CheckboxIcon className="h-4 w-4" />
          ) : (
            <EmptyCheckboxIcon className="h-4 w-4 text-gray-400" />
          )}
        </button>

        <TypeIcon className={`h-4 w-4 ${typeMeta.color}`} />
      </span>

      <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{ticket.key}</span>

      <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
        {ticket.title}
      </span>

      <span
        className="flex h-4 w-8 flex-shrink-0 items-center justify-center"
        data-tour={isDemoTicket ? 'sprint-subtask' : undefined}
      >
        {subtaskSummary ? (
          <button
            type="button"
            onClick={() => onOpenSubtasks?.(ticket.key)}
            className="group/subtask relative flex h-full w-full items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <HierarchyIcon className="h-4 w-4" />
            <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition group-hover/subtask:opacity-100 dark:bg-gray-700">
              {subtaskSummary.done} of {subtaskSummary.total} child work item
              {subtaskSummary.total === 1 ? '' : 's'} complete
            </span>
          </button>
        ) : (
          // If the guided-tour's current ticket happens to have no subtasks,
          // show the same icon dimmed as a placeholder just for that stop, so
          // there's still something to point at; every other ticket keeps
          // showing nothing.
          isDemoTicket && <HierarchyIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        )}
      </span>

      {epics && (
        <div className="relative flex-shrink-0" data-tour={isDemoTicket ? 'sprint-epic' : undefined}>
          <button
            type="button"
            onClick={onToggleEpicMenu}
            className={[
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              epicMenuOpen || ticket.epicKey || isDemoTicket ? 'visible' : 'invisible group-hover:visible',
              ticket.epicKey
                ? 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300'
                : 'border-gray-300 text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400',
            ].join(' ')}
          >
            {ticket.epicKey
              ? (epics.find((epic) => epic.key === ticket.epicKey)?.title ?? 'Epic')
              : '+ Epic'}
          </button>

          {epicMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onToggleEpicMenu} />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {ticket.epicKey && (
                  <button
                    type="button"
                    onClick={() => onChangeEpic(null)}
                    className="block w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    No epic
                  </button>
                )}
                {epics.map((epic) => (
                  <button
                    key={epic.key}
                    type="button"
                    onClick={() => onChangeEpic(epic.key)}
                    className="block w-full truncate px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {epic.title}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="relative flex-shrink-0" data-tour={isDemoTicket ? 'sprint-status' : undefined}>
        <button
          type="button"
          onClick={onToggleStatusMenu}
          className={[
            'flex items-center gap-1 rounded-md border border-transparent px-1.5 py-0.5 text-sm',
            STATUS_COLOR[ticket.column ?? 'To Do'],
          ].join(' ')}
        >
          {ticket.column ?? 'To Do'}
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </button>

        {statusMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={onToggleStatusMenu} />
            <div className="absolute left-0 top-full z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {STATUS_OPTIONS.filter((status) => status !== (ticket.column ?? 'To Do')).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChangeStatus(status)}
                  className={[
                    'block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                    STATUS_COLOR[status],
                  ].join(' ')}
                >
                  {status}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <span className="inline-flex flex-shrink-0" data-tour={isDemoTicket ? 'sprint-story-points' : undefined}>
        <StoryPointEstimate value={ticket.storyPoints} onChange={onChangeStoryPoints} />
      </span>

      <span className="inline-flex flex-shrink-0" data-tour={isDemoTicket ? 'sprint-priority' : undefined}>
        <PrioritySelector
          value={ticket.priority}
          onChange={onChangePriority}
          forceOpen={isDemoTicket && activeSprintActionStop === 'priority'}
        />
      </span>

      <div className="relative inline-flex flex-shrink-0" data-tour={isDemoTicket ? 'sprint-assignee' : undefined}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            if (onChangeAssignee) onToggleAssigneeMenu?.()
          }}
        >
          <AssigneeAvatar name={ticket.assignee} className="h-7 w-7" />
        </button>

        {assigneeMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={onToggleAssigneeMenu} />
            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => {
                  onChangeAssignee(null)
                  onToggleAssigneeMenu?.()
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <AssigneeAvatar name={null} className="h-5 w-5" />
                Unassigned
              </button>
              {assignableTeam.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    onChangeAssignee(member.name)
                    onToggleAssigneeMenu?.()
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <AssigneeAvatar name={member.name} className="h-5 w-5" />
                  {member.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative h-4 w-4 flex-shrink-0">
        {canDelete && (
          <>
            <button
              type="button"
              onClick={onToggleTicketMenu}
              className={[
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
                ticketMenuOpen ? 'visible' : 'invisible group-hover:visible',
              ].join(' ')}
            >
              <EllipsisIcon className="h-4 w-4" />
            </button>

            {ticketMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={onToggleTicketMenu} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-md dark:border-gray-700 dark:bg-gray-800">
                  {onOpenSubtasks && !ticket.parentKey && (
                    <button
                      type="button"
                      onClick={() => onOpenSubtasks(ticket.key)}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Add subtask
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDelete}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function BacklogPanel({
  title,
  tickets = [],
  totalCount,
  showAddDates = false,
  sprintDates,
  onChangeSprintDates,
  showSprintIcon = false,
  actionLabel,
  actionDisabled,
  onAction,
  onDelete,
  onDeleteTicket,
  onOpenSubtasks,
  onDropTicket,
  onChangeStatus,
  onChangePriority,
  onChangeStoryPoints,
  epics,
  onChangeEpic,
  onChangeAssignee,
  emptyMessage,
  onCreate,
  dataTour,
  actionDataTour,
  highlightTicketKey,
  activeSprintActionStop,
  disableActionsForKey,
}) {
  const workItemCount = tickets.length
  const rawTotal = totalCount ?? workItemCount
  const isFiltered = rawTotal !== workItemCount
  const isActionDisabled = actionDisabled ?? workItemCount === 0
  const [datesOpen, setDatesOpen] = useState(false)
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')

  function toDateInputValue(iso) {
    return iso ? iso.slice(0, 10) : ''
  }

  function openDatesEditor() {
    setStartDateInput(toDateInputValue(sprintDates?.start))
    setEndDateInput(toDateInputValue(sprintDates?.end))
    setDatesOpen(true)
  }

  function saveDates() {
    if (!startDateInput || !endDateInput) return
    onChangeSprintDates?.(
      new Date(startDateInput).toISOString(),
      new Date(endDateInput).toISOString(),
    )
    setDatesOpen(false)
  }

  function formatDateLabel(iso) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const subtasksByParent = new Map()
  tickets.forEach((ticket) => {
    if (!ticket.parentKey) return
    const list = subtasksByParent.get(ticket.parentKey) ?? []
    list.push(ticket)
    subtasksByParent.set(ticket.parentKey, list)
  })
  const topLevelTickets = tickets.filter((ticket) => !ticket.parentKey)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [statusMenuKey, setStatusMenuKey] = useState(null)
  const [selectedTickets, setSelectedTickets] = useState(() => new Set())
  const [ticketMenuKey, setTicketMenuKey] = useState(null)
  const [epicMenuKey, setEpicMenuKey] = useState(null)
  const [assigneeMenuKey, setAssigneeMenuKey] = useState(null)
  const allSelected = tickets.length > 0 && tickets.every((ticket) => selectedTickets.has(ticket.key))

  function toggleTicketSelected(ticketKey) {
    setSelectedTickets((current) => {
      const next = new Set(current)
      if (next.has(ticketKey)) {
        next.delete(ticketKey)
      } else {
        next.add(ticketKey)
      }
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedTickets(allSelected ? new Set() : new Set(tickets.map((ticket) => ticket.key)))
  }

  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [dueDate, setDueDate] = useState(null)
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false)

  function confirmCreate() {
    const title = newTitle.trim()
    if (title) {
      onCreate?.(title, dueDate)
    }
    setNewTitle('')
    setDueDate(null)
    setDueDatePickerOpen(false)
    setIsCreating(false)
  }

  function cancelCreate() {
    setNewTitle('')
    setDueDate(null)
    setDueDatePickerOpen(false)
    setIsCreating(false)
  }

  return (
    <div
      data-tour={dataTour}
      className={[
        'rounded-md border',
        allSelected
          ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-0'
          : 'border-gray-200 dark:border-gray-700',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 bg-gray-100 px-3 py-2 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={workItemCount === 0}
            className={allSelected ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
          >
            {allSelected ? (
              <CheckboxIcon className="h-4 w-4" />
            ) : (
              <EmptyCheckboxIcon className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400"
          >
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`}
            />
          </button>

          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>

          {showAddDates && (
            <div className="relative">
              <button
                type="button"
                data-tour={dataTour === 'sprint-panel' ? 'sprint-dates' : undefined}
                onClick={openDatesEditor}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400"
              >
                <PencilIcon className="h-3 w-3" />
                {sprintDates?.start && sprintDates?.end
                  ? `${formatDateLabel(sprintDates.start)} – ${formatDateLabel(sprintDates.end)}`
                  : 'Add dates'}
              </button>

              {datesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDatesOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Sprint dates
                    </p>

                    <label className="mb-2 block text-xs text-gray-500 dark:text-gray-400">
                      Start date
                      <input
                        type="date"
                        value={startDateInput}
                        onChange={(event) => setStartDateInput(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </label>

                    <label className="mb-3 block text-xs text-gray-500 dark:text-gray-400">
                      End date
                      <input
                        type="date"
                        value={endDateInput}
                        onChange={(event) => setEndDateInput(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={saveDates}
                      disabled={!startDateInput || !endDateInput}
                      className={[
                        'w-full rounded-md px-3 py-1.5 text-sm font-medium',
                        startDateInput && endDateInput
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
                      ].join(' ')}
                    >
                      Save
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <span className="text-xs text-gray-400 dark:text-gray-500">
            {isFiltered
              ? `(${workItemCount} of ${rawTotal} work items visible)`
              : `(${workItemCount} work items)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex overflow-hidden rounded text-xs font-medium">
            <span className="bg-gray-200 px-1.5 py-0.5 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              0
            </span>
            <span className="bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              0
            </span>
            <span className="bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900 dark:text-green-300">
              0
            </span>
          </span>

          {showSprintIcon && <SprintIcon className="h-4 w-4 text-gray-400" />}

          <button
            type="button"
            data-tour={actionDataTour}
            disabled={isActionDisabled}
            onClick={onAction}
            className={[
              'rounded-md px-3 py-1.5 text-sm font-medium',
              isActionDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            ].join(' ')}
          >
            {actionLabel}
          </button>

          {onDelete ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <EllipsisIcon className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete()
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      Delete sprint
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <EllipsisIcon className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {!collapsed && (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            onDropTicket?.(event.dataTransfer.getData('text/plain'))
          }}
          className="bg-gray-100 p-3 dark:bg-gray-800"
        >
          {workItemCount === 0 ? (
            <div className="flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 py-3 text-center text-sm text-gray-400 dark:border-gray-600 dark:bg-gray-800/50">
              {rawTotal > 0 ? "There's nothing that matches this filter" : emptyMessage}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topLevelTickets.map((ticket) => {
                const subtasks = subtasksByParent.get(ticket.key) ?? []
                const canDelete = Boolean(onDeleteTicket)
                const subtaskSummary =
                  subtasks.length > 0
                    ? { done: subtasks.filter((subtask) => subtask.column === 'Done').length, total: subtasks.length }
                    : null

                // During BacklogDemo's "drag" step, the interactive hole has
                // to cover this ticket's whole row for the real drag gesture
                // to work — which otherwise left every other real control on
                // that same row (Epic, Status, Story Points, Priority, the
                // Subtask icon) genuinely clickable too. Only the drag itself
                // should do anything here, so every other handler is a no-op
                // for this one ticket specifically.
                const rowActionsDisabled = ticket.key === disableActionsForKey

                return (
                  <TicketRow
                    key={ticket.key}
                    ticket={ticket}
                    dataTour={ticket.key === highlightTicketKey ? 'backlog-demo-ticket' : undefined}
                    isDemoTicket={ticket.key === highlightTicketKey}
                    activeSprintActionStop={activeSprintActionStop}
                    isSelected={selectedTickets.has(ticket.key)}
                    onToggleSelect={rowActionsDisabled ? undefined : () => toggleTicketSelected(ticket.key)}
                    statusMenuOpen={statusMenuKey === ticket.key}
                    onToggleStatusMenu={
                      rowActionsDisabled
                        ? undefined
                        : () => setStatusMenuKey((key) => (key === ticket.key ? null : ticket.key))
                    }
                    onChangeStatus={
                      rowActionsDisabled
                        ? undefined
                        : (status) => {
                            onChangeStatus?.(ticket.key, status)
                            setStatusMenuKey(null)
                          }
                    }
                    onChangeStoryPoints={
                      rowActionsDisabled ? undefined : (points) => onChangeStoryPoints?.(ticket.key, points)
                    }
                    onChangePriority={
                      rowActionsDisabled ? undefined : (priority) => onChangePriority?.(ticket.key, priority)
                    }
                    canDelete={canDelete}
                    ticketMenuOpen={ticketMenuKey === ticket.key}
                    onToggleTicketMenu={
                      rowActionsDisabled
                        ? undefined
                        : () => setTicketMenuKey((key) => (key === ticket.key ? null : ticket.key))
                    }
                    onDelete={
                      rowActionsDisabled
                        ? undefined
                        : () => {
                            setTicketMenuKey(null)
                            toggleTicketSelected(ticket.key)
                            onDeleteTicket(ticket.key)
                          }
                    }
                    onOpenSubtasks={rowActionsDisabled ? undefined : onOpenSubtasks}
                    subtaskSummary={subtaskSummary}
                    epics={epics}
                    epicMenuOpen={epicMenuKey === ticket.key}
                    onToggleEpicMenu={
                      rowActionsDisabled
                        ? undefined
                        : () => setEpicMenuKey((key) => (key === ticket.key ? null : ticket.key))
                    }
                    onChangeEpic={
                      rowActionsDisabled
                        ? undefined
                        : (epicKey) => {
                            onChangeEpic?.(ticket.key, epicKey)
                            setEpicMenuKey(null)
                          }
                    }
                    assigneeMenuOpen={assigneeMenuKey === ticket.key}
                    onToggleAssigneeMenu={
                      rowActionsDisabled
                        ? undefined
                        : () => setAssigneeMenuKey((key) => (key === ticket.key ? null : ticket.key))
                    }
                    onChangeAssignee={
                      rowActionsDisabled
                        ? undefined
                        : (assignee) => {
                            onChangeAssignee?.(ticket.key, assignee)
                            setAssigneeMenuKey(null)
                          }
                    }
                  />
                )
              })}
            </div>
          )}

          {isCreating ? (
            <>
              <div className="fixed inset-0 z-10" onClick={cancelCreate} />
              <div className="relative z-20 mt-2 flex items-center gap-2 rounded-lg border-2 border-blue-500 bg-white px-2 py-1.5 dark:bg-gray-800">
                <WorkTypeSelector dropUp />

                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmCreate()
                    if (event.key === 'Escape') cancelCreate()
                  }}
                  placeholder="Add one or multiple work items by typing or pasting"
                  className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
                />

                <span className="relative flex flex-shrink-0 text-gray-400">
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

                <PersonIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />

                <button
                  type="button"
                  onClick={confirmCreate}
                  disabled={!newTitle.trim()}
                  className={[
                    'flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-sm font-medium',
                    newTitle.trim()
                      ? 'border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                      : 'cursor-not-allowed border-gray-300 text-gray-300 dark:border-gray-600 dark:text-gray-600',
                  ].join(' ')}
                >
                  Create
                  <EnterIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <PlusIcon className="h-4 w-4" />
              Create
            </button>
          )}
        </div>
      )}
    </div>
  )
}
