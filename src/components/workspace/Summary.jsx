import { useState, useLayoutEffect, useRef } from 'react'
import { team, project } from '../../data/sampleProject'
import SummaryToolbar from './SummaryToolbar'
import AssigneeAvatar from './AssigneeAvatar'
import { matchesFilters, activeFilterCount } from '../../utils/ticketFilters'
import { distributePercentages } from '../../utils/percentages'
import {
  CheckIcon,
  PencilIcon,
  ChecklistIcon,
  CalendarIcon,
  BugIcon,
  LightningIcon,
  StoryIcon,
  SubtaskIcon,
  CheckboxIcon,
  DoubleChevronUpIcon,
  ChevronUpIcon,
  RankIcon,
  ChevronDownIcon,
  DoubleChevronDownIcon,
  CloseIcon,
} from './icons'
import { loadState, saveState, scopedKey } from '../../utils/localStorage'

const DAY_MS = 24 * 60 * 60 * 1000

const TYPE_META = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Epic: { icon: LightningIcon, color: 'text-purple-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
}

const PRIORITY_META = [
  { key: 'Highest', icon: DoubleChevronUpIcon, color: 'text-red-600' },
  { key: 'High', icon: ChevronUpIcon, color: 'text-orange-500' },
  { key: 'Medium', icon: RankIcon, color: 'text-yellow-500' },
  { key: 'Low', icon: ChevronDownIcon, color: 'text-blue-500' },
  { key: 'Lowest', icon: DoubleChevronDownIcon, color: 'text-blue-700' },
]

const STATUS_COLOR = {
  'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function isWithinPastDays(isoString, days) {
  if (!isoString) return false
  const diff = Date.now() - new Date(isoString).getTime()
  return diff >= 0 && diff <= days * DAY_MS
}

function isWithinNextDays(isoString, days) {
  if (!isoString) return false
  const diff = new Date(isoString).getTime() - Date.now()
  return diff >= 0 && diff <= days * DAY_MS
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `about ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function isToday(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function StatTile({ icon: Icon, iconClass, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
  )
}

function ProgressRow({ icon: Icon, iconColor, avatar, label, percent }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-28 flex-shrink-0 items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
        {avatar}
        {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />}
        <span className="truncate">{label}</span>
      </div>
      <div className="relative h-6 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded bg-gray-400 dark:bg-gray-500"
          style={{ width: `${Math.max(percent, percent > 0 ? 6 : 0)}%` }}
        />
        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-900 dark:text-gray-100">
          {percent}%
        </span>
      </div>
    </div>
  )
}

export default function Summary({ allTickets, activity, sprintDates = {}, learnerId }) {
  const [filters, setFilters] = useState({})
  const containerRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(null)

  // Short one-time hint on her first visit to this tab — dismissed and
  // remembered per learner, same as Calendar's/Timeline's (Summary is
  // recognition-only, not a practiced skill, so this is a note rather than
  // a guided lesson).
  const introSeenKey = scopedKey(learnerId, 'seen-summary-intro')
  const [showIntro, setShowIntro] = useState(() => !loadState(introSeenKey, false))

  function dismissIntro() {
    setShowIntro(false)
    saveState(introSeenKey, true)
  }

  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const top = containerRef.current.getBoundingClientRect().top
      setContainerHeight(Math.floor(window.innerHeight - top))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const filteredTickets = allTickets.filter((ticket) => matchesFilters(ticket, filters))
  const isFiltered = activeFilterCount(filters) > 0

  const activeSprintNumber = allTickets.find((ticket) => ticket.onBoard && ticket.sprint !== null)?.sprint
  const activeSprintRange = activeSprintNumber != null ? sprintDates[activeSprintNumber] : null
  const sprintCountdown = activeSprintRange
    ? (() => {
        const daysLeft = Math.ceil((new Date(activeSprintRange.end) - Date.now()) / DAY_MS)
        return daysLeft >= 0
          ? `ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
          : `ended ${-daysLeft} day${-daysLeft === 1 ? '' : 's'} ago`
      })()
    : null

  const completed = filteredTickets.filter(
    (ticket) => ticket.column === 'Done' && isWithinPastDays(ticket.updatedAt, 7),
  ).length
  const updated = filteredTickets.filter((ticket) => isWithinPastDays(ticket.updatedAt, 7)).length
  const created = filteredTickets.filter((ticket) => isWithinPastDays(ticket.createdAt, 7)).length
  const dueSoon = filteredTickets.filter((ticket) => isWithinNextDays(ticket.dueDate, 7)).length

  const total = filteredTickets.length
  const done = filteredTickets.filter((ticket) => ticket.column === 'Done').length
  const inProgress = filteredTickets.filter((ticket) => ticket.column === 'In Progress').length
  const todo = total - done - inProgress

  const donePct = total ? (done / total) * 100 : 0
  const inProgressPct = total ? (inProgress / total) * 100 : 0
  const ringStyle = {
    background:
      total === 0
        ? undefined
        : `conic-gradient(#3b82f6 0% ${donePct}%, #f59e0b ${donePct}% ${donePct + inProgressPct}%, #22c55e ${donePct + inProgressPct}% 100%)`,
  }

  const priorityCounts = PRIORITY_META.map((entry) => ({
    ...entry,
    count: filteredTickets.filter((ticket) => ticket.priority === entry.key).length,
  }))
  const maxPriorityCount = Math.max(1, ...priorityCounts.map((entry) => entry.count))

  const typeCountsRaw = Object.entries(TYPE_META).map(([type, meta]) => ({
    type,
    ...meta,
    count: filteredTickets.filter((ticket) => ticket.type === type).length,
  }))
  const typePercents = distributePercentages(typeCountsRaw.map((entry) => entry.count))
  const typeCounts = typeCountsRaw.map((entry, index) => ({ ...entry, percent: typePercents[index] }))

  const assigneeGroupsRaw = [
    { id: 'unassigned', name: 'Unassigned', avatar: <AssigneeAvatar name={null} className="h-5 w-5" /> },
    ...team
      .filter((member) => member.role !== 'Team Lead')
      .map((member) => ({
        id: member.id,
        name: member.name,
        avatar: <AssigneeAvatar name={member.name} className="h-5 w-5" />,
      })),
  ]
    .map((entry) => ({
      ...entry,
      count: filteredTickets.filter((ticket) =>
        entry.id === 'unassigned' ? !ticket.assignee : ticket.assignee === entry.name,
      ).length,
    }))
    .sort((a, b) => b.count - a.count)
  const assigneePercents = distributePercentages(assigneeGroupsRaw.map((entry) => entry.count))
  const assigneeGroups = assigneeGroupsRaw.map((entry, index) => ({
    ...entry,
    percent: assigneePercents[index],
  }))

  const todaysActivity = activity.filter((entry) => isToday(entry.timestamp))
  const earlierActivity = activity.filter((entry) => !isToday(entry.timestamp))

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto px-6 pb-6"
      style={{ height: containerHeight != null ? `${containerHeight}px` : undefined }}
    >
      <SummaryToolbar filters={filters} onFilterChange={setFilters} />

      {showIntro && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-blue-600 px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-white">
            This is Summary — a quick overview of your team's progress, without opening every
            ticket one by one.
          </p>
          <button
            type="button"
            onClick={dismissIntro}
            aria-label="Dismiss"
            className="flex-shrink-0 text-blue-100 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {sprintCountdown && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {project.key} Sprint {activeSprintNumber}
          </span>{' '}
          {sprintCountdown}.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile
          icon={CheckIcon}
          iconClass="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
          title={`${completed} completed`}
          subtitle="in the last 7 days"
        />
        <StatTile
          icon={PencilIcon}
          iconClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
          title={`${updated} updated`}
          subtitle="in the last 7 days"
        />
        <StatTile
          icon={ChecklistIcon}
          iconClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
          title={`${created} created`}
          subtitle="in the last 7 days"
        />
        <StatTile
          icon={CalendarIcon}
          iconClass="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300"
          title={`${dueSoon} due soon`}
          subtitle="in the next 7 days"
        />
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Status overview</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get a snapshot of the status of your work items.
        </p>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <div className="relative flex h-48 w-48 items-center justify-center rounded-full" style={ringStyle}>
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center dark:bg-gray-900">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total work items</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm bg-blue-500" />
              Done: {done}
            </span>
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm bg-amber-500" />
              In Progress: {inProgress}
            </span>
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm bg-green-500" />
              To Do: {todo}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent activity</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Stay up to date with what's happening across the space.
          </p>
        </div>

        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Nothing has happened yet.</p>
        ) : (
          <div className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
            {todaysActivity.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Today</p>
                {todaysActivity.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </>
            )}
            {earlierActivity.length > 0 && (
              <>
                <p className="mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Earlier</p>
                {earlierActivity.map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Priority breakdown</h2>
            {isFiltered && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                Filtered
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get a holistic view of how work is being prioritized.
          </p>

          <div className="mt-6 flex h-44 items-end gap-4">
            {priorityCounts.map((entry) => (
              <div key={entry.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="h-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {entry.count > 0 ? entry.count : ''}
                </span>
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className="w-8 rounded-t bg-gray-400 dark:bg-gray-600"
                    style={{ height: `${(entry.count / maxPriorityCount) * 100}%` }}
                  />
                </div>
                <entry.icon className={`mt-1 h-4 w-4 ${entry.color}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Types of work</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get a breakdown of work items by their types.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {typeCounts.map((entry) => (
              <ProgressRow
                key={entry.type}
                icon={entry.icon}
                iconColor={entry.color}
                label={entry.type}
                percent={entry.percent}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Team workload</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor the capacity of your team.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {assigneeGroups.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">No work items to show.</p>
            ) : (
              assigneeGroups.map((entry) => (
                <ProgressRow
                  key={entry.id}
                  avatar={entry.avatar}
                  label={entry.name}
                  percent={entry.percent}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Epic progress</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use epics to track larger initiatives in your space.
          </p>
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ entry }) {
  const typeMeta = TYPE_META[entry.ticketType] ?? TYPE_META.Task
  const TypeIcon = typeMeta.icon

  return (
    <div className="flex items-start gap-2 text-sm">
      <AssigneeAvatar name={entry.actor} className="h-6 w-6 flex-shrink-0" tooltip={entry.actor} />
      <div>
        <p className="text-gray-700 dark:text-gray-200">
          <span className="font-medium text-blue-600 dark:text-blue-400">{entry.actor}</span>{' '}
          {entry.action} on{' '}
          <TypeIcon className={`inline h-3.5 w-3.5 ${typeMeta.color}`} />{' '}
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {entry.ticketKey}: {entry.ticketTitle}
          </span>{' '}
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLOR[entry.status] ?? STATUS_COLOR['To Do']}`}
          >
            {entry.status}
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(entry.timestamp)}</p>
      </div>
    </div>
  )
}
