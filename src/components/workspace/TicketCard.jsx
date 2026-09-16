import { useRef, useState } from 'react'
import {
  CalendarIcon,
  CheckboxIcon,
  EllipsisIcon,
  BugIcon,
  StoryIcon,
  LightningIcon,
  SubtaskIcon,
  ChevronDownIcon,
  DoubleChevronUpIcon,
  ChevronUpIcon,
  RankIcon,
  DoubleChevronDownIcon,
} from './icons'
import AssigneeAvatar from './AssigneeAvatar'
import { team } from '../../data/sampleProject'

function formatDueDate(value) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_ICON = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Epic: { icon: LightningIcon, color: 'text-purple-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done']
const STATUS_COLOR = {
  'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

const PRIORITY_ICON = {
  Highest: { icon: DoubleChevronUpIcon, color: 'text-red-600' },
  High: { icon: ChevronUpIcon, color: 'text-orange-500' },
  Medium: { icon: RankIcon, color: 'text-yellow-500' },
  Low: { icon: ChevronDownIcon, color: 'text-blue-500' },
  Lowest: { icon: DoubleChevronDownIcon, color: 'text-blue-700' },
}

const assignableTeam = team.filter((member) => member.role !== 'Team Lead')

export default function TicketCard({
  ticket,
  subtasks = [],
  onDragStart,
  onDelete,
  onDeleteSubtask,
  onAddSubtask,
  onChangeSubtaskStatus,
  onChangeAssignee,
  onChangeSubtaskAssignee,
  epics,
  onChangeEpic,
  epicEditable = true,
  onOpenDetail,
  actionsDisabled = false,
  dragEnabled = true,
}) {
  const isDone = ticket.column === 'Done'
  const [menuOpen, setMenuOpen] = useState(false)
  const [subtasksOpen, setSubtasksOpen] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [subtaskStatusMenuKey, setSubtaskStatusMenuKey] = useState(null)
  const [subtaskAssigneeMenuKey, setSubtaskAssigneeMenuKey] = useState(null)
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false)
  const [epicMenuOpen, setEpicMenuOpen] = useState(false)
  const typeMeta = TYPE_ICON[ticket.type] ?? TYPE_ICON.Task
  const TypeIcon = typeMeta.icon
  const priorityMeta = PRIORITY_ICON[ticket.priority] ?? PRIORITY_ICON.Medium
  const PriorityIcon = priorityMeta.icon
  const doneSubtasks = subtasks.filter((subtask) => subtask.column === 'Done').length

  // Native HTML5 drag-and-drop can still fire a trailing click once the drag
  // ends (browser-dependent) — without this guard, dragging the card to
  // another column would also pop the detail panel open, since both
  // onDragStart and onClick live on the same element. Cleared a tick after
  // dragend (not immediately) so it's still true for that trailing click.
  const dragStartedRef = useRef(false)

  function handleDragStart(event) {
    dragStartedRef.current = true
    onDragStart?.(event)
  }

  function handleDragEnd() {
    setTimeout(() => {
      dragStartedRef.current = false
    }, 0)
  }

  function handleClick() {
    if (dragStartedRef.current || actionsDisabled) return
    onOpenDetail?.(ticket.key)
  }

  function confirmAddSubtask() {
    const title = subtaskTitle.trim()
    if (title) {
      onAddSubtask?.(title)
    }
    setSubtaskTitle('')
    setAddingSubtask(false)
  }

  return (
    <div
      draggable={dragEnabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`group relative flex flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 ${!dragEnabled ? 'cursor-default' : onOpenDetail ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.title}</p>

        {onDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (actionsDisabled) return
              setMenuOpen((open) => !open)
            }}
            className={`flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 ${menuOpen ? 'opacity-100' : ''}`}
          >
            <EllipsisIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-2 top-8 z-20 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-md dark:border-gray-700 dark:bg-gray-800"
            onClick={(event) => event.stopPropagation()}
          >
            {onAddSubtask && !ticket.parentKey && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setSubtasksOpen(true)
                  setAddingSubtask(true)
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Add subtask
              </button>
            )}
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

      {epics && !epicEditable && ticket.epicKey && (
        <span className="flex items-center gap-1 rounded-full border border-purple-200 px-2 py-0.5 text-xs font-medium text-purple-700 dark:border-purple-800 dark:text-purple-300">
          {epics.find((epic) => epic.key === ticket.epicKey)?.title ?? 'Epic'}
        </span>
      )}

      {epics && epicEditable && (
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              if (actionsDisabled) return
              setEpicMenuOpen((open) => !open)
            }}
            className={[
              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              ticket.epicKey
                ? 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300'
                : 'border-gray-300 text-gray-400 opacity-0 group-hover:opacity-100 dark:border-gray-600',
            ].join(' ')}
          >
            {ticket.epicKey
              ? (epics.find((epic) => epic.key === ticket.epicKey)?.title ?? 'Epic')
              : '+ Epic'}
          </button>

          {epicMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setEpicMenuOpen(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {ticket.epicKey && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeEpic?.(null)
                      setEpicMenuOpen(false)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    No epic
                  </button>
                )}
                {epics.map((epic) => (
                  <button
                    key={epic.key}
                    type="button"
                    onClick={() => {
                      onChangeEpic?.(epic.key)
                      setEpicMenuOpen(false)
                    }}
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

      {ticket.dueDate && (
        <span className="inline-flex w-fit items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300">
          <CalendarIcon className="h-3.5 w-3.5" />
          {formatDueDate(ticket.dueDate)}
        </span>
      )}

      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            'flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400',
            isDone ? 'line-through' : '',
          ].join(' ')}
        >
          <TypeIcon className={`h-3.5 w-3.5 flex-shrink-0 ${typeMeta.color}`} />
          {ticket.key}
        </span>

        <div className="flex items-center gap-1.5">
          {ticket.storyPoints != null && (
            <span
              title="Story point estimate"
              className="flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded border border-gray-300 px-1 text-[11px] font-medium text-gray-500 dark:border-gray-600 dark:text-gray-400"
            >
              {ticket.storyPoints}
            </span>
          )}
          <PriorityIcon className={`h-3.5 w-3.5 flex-shrink-0 ${priorityMeta.color}`} />

          <div className="relative flex-shrink-0">
            <button
              type="button"
              data-tour="ticket-assignee"
              onClick={(event) => {
                event.stopPropagation()
                if (actionsDisabled) return
                if (onChangeAssignee) setAssigneeMenuOpen((open) => !open)
              }}
            >
              <AssigneeAvatar name={ticket.assignee} className="h-6 w-6" disableTooltip={actionsDisabled} />
            </button>

            {assigneeMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setAssigneeMenuOpen(false)} />
                <div
                  data-tour="assignee-dropdown"
                  className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChangeAssignee(null)
                      setAssigneeMenuOpen(false)
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
                        setAssigneeMenuOpen(false)
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
        </div>
      </div>

      {(subtasks.length > 0 || addingSubtask) && (
        <div
          className="border-t border-gray-100 pt-2 dark:border-gray-700"
          onClick={(event) => event.stopPropagation()}
        >
          {subtasks.length > 0 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (actionsDisabled) return
                  setSubtasksOpen((open) => !open)
                }}
                className="flex w-full items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <SubtaskIcon className="h-3.5 w-3.5 flex-shrink-0" />
                Subtasks
                <span className="text-gray-400 dark:text-gray-500">
                  {doneSubtasks}/{subtasks.length}
                </span>
                <ChevronDownIcon
                  className={`ml-auto h-3.5 w-3.5 transition-transform ${subtasksOpen ? '' : '-rotate-90'}`}
                />
              </button>

              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${(doneSubtasks / subtasks.length) * 100}%` }}
                />
              </div>
            </>
          )}

          {subtasksOpen && (
            <div className="mt-2 flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
              {subtasks.map((subtask) => {
                const subtaskMeta = TYPE_ICON[subtask.type] ?? TYPE_ICON.Subtask
                const SubtaskTypeIcon = subtaskMeta.icon
                return (
                  <div
                    key={subtask.key}
                    className="flex flex-col gap-1.5 rounded-md border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs text-gray-900 dark:text-gray-100">
                        {subtask.title}
                      </span>
                      {onDeleteSubtask && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteSubtask(subtask.key)
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <EllipsisIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <SubtaskTypeIcon className={`h-3.5 w-3.5 flex-shrink-0 ${subtaskMeta.color}`} />
                      <span className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {subtask.key}
                      </span>
                      {onChangeSubtaskStatus ? (
                        <div className="relative ml-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (actionsDisabled) return
                              setSubtaskStatusMenuKey((key) => (key === subtask.key ? null : subtask.key))
                            }}
                            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[subtask.column ?? 'To Do']}`}
                          >
                            {subtask.column ?? 'To Do'}
                            <ChevronDownIcon className="h-3 w-3" />
                          </button>

                          {subtaskStatusMenuKey === subtask.key && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setSubtaskStatusMenuKey(null)}
                              />
                              <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                {STATUS_OPTIONS.filter(
                                  (status) => status !== (subtask.column ?? 'To Do'),
                                ).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => {
                                      onChangeSubtaskStatus(subtask.key, status)
                                      setSubtaskStatusMenuKey(null)
                                    }}
                                    className={`block w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${STATUS_COLOR[status]}`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span
                          className={`ml-auto flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[subtask.column ?? 'To Do']}`}
                        >
                          {subtask.column ?? 'To Do'}
                        </span>
                      )}
                      {onChangeSubtaskAssignee ? (
                        <div className="relative flex-shrink-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (actionsDisabled) return
                              setSubtaskAssigneeMenuKey((key) =>
                                key === subtask.key ? null : subtask.key,
                              )
                            }}
                          >
                            <AssigneeAvatar name={subtask.assignee} className="h-5 w-5" disableTooltip={actionsDisabled} />
                          </button>

                          {subtaskAssigneeMenuKey === subtask.key && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setSubtaskAssigneeMenuKey(null)}
                              />
                              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onChangeSubtaskAssignee(subtask.key, null)
                                    setSubtaskAssigneeMenuKey(null)
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
                                      onChangeSubtaskAssignee(subtask.key, member.name)
                                      setSubtaskAssigneeMenuKey(null)
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
                      ) : (
                        <AssigneeAvatar name={subtask.assignee} className="h-5 w-5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}

              {addingSubtask && (
                <div className="flex items-center gap-2 rounded-md border-2 border-blue-500 bg-white px-2 py-1.5 dark:bg-gray-800">
                  <SubtaskIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                  <input
                    type="text"
                    autoFocus
                    value={subtaskTitle}
                    onChange={(event) => setSubtaskTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') confirmAddSubtask()
                      if (event.key === 'Escape') {
                        setSubtaskTitle('')
                        setAddingSubtask(false)
                      }
                    }}
                    onBlur={confirmAddSubtask}
                    placeholder="What needs to be done?"
                    className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
                  />
                </div>
              )}

              {onAddSubtask && !addingSubtask && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setAddingSubtask(true)
                  }}
                  className="flex items-center gap-1 px-1 py-1 text-left text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  + Create
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
