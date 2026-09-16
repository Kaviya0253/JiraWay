import { useState } from 'react'
import { project, team } from '../../data/sampleProject'
import AssigneeAvatar from './AssigneeAvatar'
import {
  SearchIcon,
  CloseIcon,
  BugIcon,
  StoryIcon,
  LightningIcon,
  SubtaskIcon,
  CheckboxIcon,
  BoardIcon,
} from './icons'

const DAY_MS = 24 * 60 * 60 * 1000

const TYPE_ICON = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Epic: { icon: LightningIcon, color: 'text-purple-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
}

const LAST_UPDATED_OPTIONS = ['Any time', 'Today', 'Yesterday', 'Past 7 days', 'Past 30 days', 'Past year']
const STATUS_OPTIONS = ['Open', 'Done']

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function matchesLastUpdated(ticket, filter) {
  if (filter === 'Any time') return true
  const updated = new Date(ticket.updatedAt)
  const now = new Date()
  if (filter === 'Today') return isSameDay(updated, now)
  if (filter === 'Yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    return isSameDay(updated, yesterday)
  }
  const diffDays = (now - updated) / DAY_MS
  if (filter === 'Past 7 days') return diffDays <= 7
  if (filter === 'Past 30 days') return diffDays <= 30
  if (filter === 'Past year') return diffDays <= 365
  return true
}

export default function GlobalSearch({ allTickets, onSelectView, onOpenTeam, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState('Any time')
  const [assigneeFilter, setAssigneeFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [projectChecked, setProjectChecked] = useState(true)
  const [reportedByMe, setReportedByMe] = useState(false)

  const assignableTeam = team.filter((member) => member.role !== 'Team Lead')

  function toggleAssignee(name) {
    setAssigneeFilter((current) =>
      current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name],
    )
  }

  function toggleStatus(status) {
    setStatusFilter((current) =>
      current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status],
    )
  }

  const trimmedQuery = query.trim().toLowerCase()

  const filteredTickets = allTickets
    .filter((ticket) => {
      if (!projectChecked) return false
      if (reportedByMe && ticket.isSeed) return false

      const matchesQuery =
        trimmedQuery.length === 0 ||
        ticket.title.toLowerCase().includes(trimmedQuery) ||
        ticket.key.toLowerCase().includes(trimmedQuery)
      const status = ticket.column === 'Done' ? 'Done' : 'Open'
      return (
        matchesQuery &&
        matchesLastUpdated(ticket, lastUpdated) &&
        (assigneeFilter.length === 0 || assigneeFilter.includes(ticket.assignee)) &&
        (statusFilter.length === 0 || statusFilter.includes(status))
      )
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  const resultTickets = filteredTickets.slice(0, trimmedQuery ? 8 : 5)

  function goToTicket(ticket) {
    onSelectView?.(ticket.onBoard ? 'board' : 'backlog')
    setOpen(false)
  }

  function goToAllWorkItems() {
    onSelectView?.('backlog')
    setOpen(false)
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div
        className={[
          'flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-1.5 dark:bg-gray-800',
          open ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600',
        ].join(' ')}
      >
        <SearchIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
        <input
          type="text"
          placeholder="Search Jira"
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none disabled:cursor-not-allowed dark:text-gray-200"
        />
        {query.length > 0 && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setQuery('')}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1 flex w-[640px] flex-col rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex">
            <div className="flex w-72 flex-shrink-0 flex-col border-r border-gray-100 p-4 dark:border-gray-800">
              <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Jira</p>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {trimmedQuery ? 'SEARCH RESULTS' : 'RECENTLY VIEWED'}
              </p>

              {resultTickets.length === 0 ? (
                <p className="px-1 py-2 text-sm text-gray-400 dark:text-gray-500">No work items match.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {resultTickets.map((ticket) => {
                    const meta = TYPE_ICON[ticket.type] ?? TYPE_ICON.Task
                    const TypeIcon = meta.icon
                    return (
                      <button
                        key={ticket.key}
                        type="button"
                        onClick={() => goToTicket(ticket)}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <TypeIcon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />
                        <span className="truncate">{ticket.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              <p className="mb-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                RECENT BOARDS, PROJECTS, FILTERS AND PLANS
              </p>
              <button
                type="button"
                onClick={() => {
                  onSelectView?.('board')
                  setOpen(false)
                }}
                className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <BoardIcon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                {project.key} board
              </button>
              <span className="flex items-center gap-2 px-1.5 py-1.5 text-sm text-gray-700 dark:text-gray-200">
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-blue-600 text-[9px] font-bold text-white">
                  W
                </span>
                {project.name} ({project.key})
              </span>

              <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <span>Go to all:</span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectView?.('board')
                    setOpen(false)
                  }}
                  className="rounded bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Boards
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenTeam?.()
                    setOpen(false)
                  }}
                  className="rounded bg-gray-100 px-2 py-0.5 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  People
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">LAST UPDATED</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {LAST_UPDATED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLastUpdated(option)}
                    className={[
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      lastUpdated === option
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                    ].join(' ')}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">FILTER BY PROJECT</p>
              <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={projectChecked}
                  onChange={(event) => setProjectChecked(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                />
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
                  W
                </span>
                {project.name}
              </label>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">FILTER BY ASSIGNEE</p>
              <div className="mb-4 flex flex-col gap-1.5">
                {assignableTeam.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={assigneeFilter.includes(member.name)}
                      onChange={() => toggleAssignee(member.name)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    <AssigneeAvatar name={member.name} className="h-5 w-5" />
                    {member.name}
                  </label>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">FILTER BY REPORTER</p>
              <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={reportedByMe}
                  onChange={(event) => setReportedByMe(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                />
                Reported by me
              </label>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">FILTER BY STATUS</p>
              <div className="mb-4 flex gap-4">
                {STATUS_OPTIONS.map((status) => (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                    />
                    {status}
                  </label>
                ))}
              </div>

              <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">FILTER BY LABEL</p>
              <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">No labels in this project.</p>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
            <button
              type="button"
              onClick={goToAllWorkItems}
              className="flex w-full items-center gap-2 text-left text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <SearchIcon className="h-4 w-4 flex-shrink-0" />
              View all work items
            </button>
          </div>
          </div>
        </>
      )}
    </div>
  )
}
