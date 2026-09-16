import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { project } from '../../data/sampleProject'
import {
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EmptyCheckboxIcon,
  CheckboxIcon,
  LightningIcon,
  BugIcon,
  StoryIcon,
  SubtaskIcon,
  PlusIcon,
  SlidersIcon,
  EllipsisIcon,
  InfoIcon,
  CloseIcon,
} from './icons'
import { loadState, saveState, scopedKey } from '../../utils/localStorage'

const TYPE_ICON = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
}

const DAY_MS = 24 * 60 * 60 * 1000
const VIEW_MODES = ['Weeks', 'Months', 'Quarters']
const MODE_CONFIG = {
  Weeks: { dayWidth: 40, headerHeight: 52, showDayNumbers: true },
  Months: { dayWidth: 9, headerHeight: 32, showDayNumbers: false },
  Quarters: { dayWidth: 3, headerHeight: 32, showDayNumbers: false },
}

// Cycled by sprint number so adjacent sprints never share a shade — makes
// the boundary between them readable even before the gap between bars does.
const SPRINT_COLORS = [
  'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'border-teal-300 bg-teal-100 text-teal-700 dark:border-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  'border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
]

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done']
const STATUS_COLOR = {
  'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function startOfWeek(date) {
  const weekday = (date.getDay() + 6) % 7 // Mon=0 .. Sun=6
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday)
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function toDateOnly(value) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getRange(mode, today, sprintDates) {
  if (mode === 'Weeks') {
    // Zoom out far enough to fit every sprint's real start date, not just a
    // fixed week-before-today window — otherwise older sprints (0, 1) get
    // clipped out of the grid entirely instead of just scrolled out of view.
    const sprintStarts = Object.values(sprintDates ?? {}).map((range) => toDateOnly(range.start))
    const earliestStart = sprintStarts.reduce(
      (min, date) => (date < min ? date : min),
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7),
    )
    const start = startOfWeek(earliestStart)
    const paddedEnd = new Date(today)
    paddedEnd.setDate(paddedEnd.getDate() + 14)
    const totalDays = Math.max(28, Math.round((paddedEnd - start) / DAY_MS) + 1)
    return { start, totalDays }
  }
  if (mode === 'Months') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 5, 0)
    return { start, totalDays: Math.round((end - start) / DAY_MS) + 1 }
  }
  const start = new Date(today.getFullYear(), today.getMonth() - 4, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 10, 0)
  return { start, totalDays: Math.round((end - start) / DAY_MS) + 1 }
}

function groupKeyFor(day, mode) {
  if (mode === 'Weeks') return startOfWeek(day).getTime()
  if (mode === 'Months') return `${day.getFullYear()}-${day.getMonth()}`
  return `${day.getFullYear()}-${Math.floor(day.getMonth() / 3)}`
}

function groupDays(days, mode) {
  const groups = []
  let current = null
  days.forEach((day) => {
    const key = groupKeyFor(day, mode)
    if (!current || current.key !== key) {
      current = { key, days: [] }
      groups.push(current)
    }
    current.days.push(day)
  })
  return groups
}

function labelForGroup(group, mode) {
  const first = group.days[0]
  const last = group.days[group.days.length - 1]
  if (mode === 'Weeks') {
    const a = first.toLocaleString('en-US', { month: 'short' })
    const b = last.toLocaleString('en-US', { month: 'short' })
    return a === b ? a : `${a}/${b}`
  }
  const a = first.toLocaleString('en-US', { month: 'long' })
  const b = last.toLocaleString('en-US', { month: 'long' })
  return a === b ? a : `${a} - ${b}`
}

export default function Timeline({ allTickets, sprintDates, createTicket, learnerId }) {
  const today = toDateOnly(new Date())
  const [viewMode, setViewMode] = useState('Weeks')

  // Short one-time hint on her first visit to this tab — dismissed and
  // remembered per learner, same as Calendar's (Timeline is recognition-only,
  // not a practiced skill, so this is a note rather than a guided lesson).
  const introSeenKey = scopedKey(learnerId, 'seen-timeline-intro')
  const [showIntro, setShowIntro] = useState(() => !loadState(introSeenKey, false))

  function dismissIntro() {
    setShowIntro(false)
    saveState(introSeenKey, true)
  }

  const { dayWidth, headerHeight, showDayNumbers } = MODE_CONFIG[viewMode]

  const { start: rangeStart, totalDays } = useMemo(
    () => getRange(viewMode, today, sprintDates),
    [viewMode, sprintDates],
  )
  const gridWidth = totalDays * dayWidth

  const days = useMemo(
    () =>
      Array.from({ length: totalDays }, (_, i) => {
        const d = new Date(rangeStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [rangeStart, totalDays],
  )

  const groups = useMemo(() => groupDays(days, viewMode), [days, viewMode])

  let cursor = 0
  const groupPositions = groups.map((group) => {
    const left = cursor
    const width = group.days.length * dayWidth
    cursor += width
    return { ...group, left, width }
  })

  function dayIndexOf(date) {
    return Math.round((toDateOnly(date) - rangeStart) / DAY_MS)
  }

  const todayIndex = dayIndexOf(today)

  const scrollRef = useRef(null)

  // Bounds Timeline to the real remaining viewport height, same technique
  // Backlog/Summary/Board use — without it, `min-h-screen` on the page root
  // lets the whole document grow past the viewport instead of capping here,
  // so this component's own `overflow-hidden`/`overflow-auto` regions never
  // get a finite height to actually scroll within, and the project header
  // above gets dragged off-screen by the document scroll instead.
  const containerRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(null)
  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const top = containerRef.current.getBoundingClientRect().top
      setContainerHeight(window.innerHeight - top)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  function scrollToToday() {
    if (!scrollRef.current) return
    const target = Math.max(0, todayIndex * dayWidth - 120)
    scrollRef.current.scrollTo({ left: target, behavior: 'smooth' })
  }

  useLayoutEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollLeft = Math.max(0, todayIndex * dayWidth - 120)
  }, [viewMode])

  const allEpics = allTickets.filter((ticket) => ticket.type === 'Epic')

  const [searchTerm, setSearchTerm] = useState('')
  const isSearching = searchTerm.trim().length > 0

  function matchesSearch(text) {
    if (!isSearching) return true
    return text.toLowerCase().includes(searchTerm.trim().toLowerCase())
  }

  const [epicMenuOpen, setEpicMenuOpen] = useState(false)
  const [epicFilter, setEpicFilter] = useState([])
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState([])
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState([])

  function toggleEpicFilter(key) {
    setEpicFilter((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )
  }

  function toggleTypeFilter(type) {
    setTypeFilter((current) =>
      current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    )
  }

  function toggleStatusFilter(status) {
    setStatusFilter((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    )
  }

  // An epic's own `column` is never updated (it's not board work), so its
  // displayed status has to be derived from its linked tickets' real
  // progress instead — otherwise every epic reads as permanently "To Do".
  function statusForEpic(epicKey) {
    const children = allTickets.filter((ticket) => ticket.epicKey === epicKey)
    if (children.length === 0) return 'To Do'
    if (children.every((ticket) => ticket.column === 'Done')) return 'Done'
    if (children.some((ticket) => ticket.column === 'Done' || ticket.column === 'In Progress')) {
      return 'In Progress'
    }
    return 'To Do'
  }

  const epics = allEpics.filter((epic) => {
    if (epicFilter.length > 0 && !epicFilter.includes(epic.key)) return false
    if (statusFilter.length > 0 && !statusFilter.includes(statusForEpic(epic.key))) return false
    if (isSearching) {
      const children = allTickets.filter((ticket) => ticket.epicKey === epic.key)
      const epicMatches = matchesSearch(`${epic.key} ${epic.title}`)
      const childMatches = children.some((ticket) => matchesSearch(`${ticket.key} ${ticket.title}`))
      if (!epicMatches && !childMatches) return false
    }
    return true
  })

  const [expandedEpics, setExpandedEpics] = useState(() => new Set())
  const [selectedRows, setSelectedRows] = useState(() => new Set())

  function toggleEpicExpanded(epicKey) {
    setExpandedEpics((current) => {
      const next = new Set(current)
      if (next.has(epicKey)) next.delete(epicKey)
      else next.add(epicKey)
      return next
    })
  }

  function toggleRowSelected(rowKey) {
    setSelectedRows((current) => {
      const next = new Set(current)
      if (next.has(rowKey)) next.delete(rowKey)
      else next.add(rowKey)
      return next
    })
  }

  // One flattened row list drives both the left list and the right grid, so
  // an expanded epic's children stay perfectly aligned between the two.
  const rows = epics.flatMap((epic) => {
    const allChildren = allTickets.filter((ticket) => ticket.epicKey === epic.key)
    let visibleChildren =
      typeFilter.length === 0 ? allChildren : allChildren.filter((ticket) => typeFilter.includes(ticket.type))
    if (isSearching) {
      visibleChildren = visibleChildren.filter((ticket) => matchesSearch(`${ticket.key} ${ticket.title}`))
    }
    const epicRow = { kind: 'epic', key: epic.key, epic, hasChildren: allChildren.length > 0 }
    // A type/status/epic filter (not just a text search) should surface
    // every matching ticket the same way — previously only a live search
    // force-expanded a collapsed epic to reveal its matches; picking a type
    // or status checkbox instead left a collapsed epic collapsed, hiding
    // tickets that actually matched the filter until she happened to have
    // (or manually clicked to) expand that specific epic already.
    const isFiltering = isSearching || typeFilter.length > 0 || statusFilter.length > 0 || epicFilter.length > 0
    const expanded = isFiltering ? visibleChildren.length > 0 : expandedEpics.has(epic.key)
    if (!expanded) return [epicRow]
    return [epicRow, ...visibleChildren.map((ticket) => ({ kind: 'child', key: ticket.key, ticket }))]
  })

  const sprintBars = Object.entries(sprintDates)
    .map(([number, range]) => {
      const start = toDateOnly(range.start)
      const end = toDateOnly(range.end)
      return {
        number: Number(number),
        start,
        end,
        days: Math.round((end - start) / DAY_MS),
        startIndex: Math.max(0, dayIndexOf(start)),
        endIndex: Math.min(totalDays - 1, dayIndexOf(end)),
      }
    })
    .filter((bar) => bar.endIndex >= 0 && bar.startIndex < totalDays)

  function formatFullDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const [isCreatingEpic, setIsCreatingEpic] = useState(false)
  const [newEpicTitle, setNewEpicTitle] = useState('')

  function confirmCreateEpic() {
    const title = newEpicTitle.trim()
    if (title) {
      createTicket?.({ title, type: 'Epic' })
    }
    setNewEpicTitle('')
    setIsCreatingEpic(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ height: containerHeight != null ? `${containerHeight}px` : undefined }}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex w-56 items-center gap-2 rounded-md border border-gray-300 px-2.5 py-1.5 dark:border-gray-600">
            <SearchIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search timeline"
              className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="text-sm leading-none">×</span>
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setEpicMenuOpen((open) => !open)}
              className={[
                'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium',
                epicMenuOpen || epicFilter.length > 0
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
              ].join(' ')}
            >
              Epic
              {epicFilter.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                  {epicFilter.length}
                </span>
              )}
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>

            {epicMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setEpicMenuOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {allEpics.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No epics yet.</p>
                  ) : (
                    allEpics.map((epic) => (
                      <label
                        key={epic.key}
                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={epicFilter.includes(epic.key)}
                          onChange={() => toggleEpicFilter(epic.key)}
                          className="h-3.5 w-3.5 flex-shrink-0 rounded border-gray-300 text-blue-600"
                        />
                        <span className="min-w-0 flex-1 truncate">{epic.title}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setTypeMenuOpen((open) => !open)}
              className={[
                'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium',
                typeMenuOpen || typeFilter.length > 0
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
              ].join(' ')}
            >
              Type
              {typeFilter.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                  {typeFilter.length}
                </span>
              )}
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>

            {typeMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setTypeMenuOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {Object.entries(TYPE_ICON).map(([type, meta]) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={typeFilter.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                        className="h-3.5 w-3.5 flex-shrink-0 rounded border-gray-300 text-blue-600"
                      />
                      <meta.icon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />
                      {type}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusMenuOpen((open) => !open)}
              className={[
                'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium',
                statusMenuOpen || statusFilter.length > 0
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
              ].join(' ')}
            >
              Status category
              {statusFilter.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                  {statusFilter.length}
                </span>
              )}
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>

            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setStatusMenuOpen(false)} />
                <div className="absolute left-0 top-full z-40 mt-1 w-44 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {STATUS_OPTIONS.map((status) => (
                    <label
                      key={status}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleStatusFilter(status)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 cursor-default items-center justify-center rounded-md border border-gray-300 text-gray-500 dark:border-gray-600">
            <SlidersIcon className="h-4 w-4" />
          </span>
          <span className="flex h-8 w-8 flex-shrink-0 cursor-default items-center justify-center rounded-md border border-gray-300 text-gray-500 dark:border-gray-600">
            <EllipsisIcon className="h-4 w-4" />
          </span>
        </div>
      </div>

      {showIntro && (
        <div className="mx-3 mb-3 flex items-start justify-between gap-3 rounded-lg bg-blue-600 px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-white">
            This is Timeline — it lays out your team's epics and sprints across weeks, months, or
            quarters, for planning ahead.
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

      <div className="mx-3 mb-3 flex min-h-0 flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 dark:border-gray-700">
          <div
            style={{ height: headerHeight }}
            className="flex flex-shrink-0 items-center border-b border-gray-200 px-3 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100"
          >
            Work
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex h-9 items-center border-b border-gray-100 px-3 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Sprints
            </div>

            {epics.length === 0 && allEpics.length > 0 && (
              <div className="flex h-10 items-center px-3 text-sm text-gray-400 dark:text-gray-500">
                No epics match these filters.
              </div>
            )}

            {rows.map((row) => {
              if (row.kind === 'epic') {
                const { epic, hasChildren } = row
                const expanded = expandedEpics.has(epic.key)
                const selected = selectedRows.has(epic.key)
                return (
                  <div
                    key={row.key}
                    className="flex h-10 items-center gap-1.5 border-b border-gray-100 px-3 dark:border-gray-800"
                  >
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleEpicExpanded(epic.key)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ChevronDownIcon
                          className={`h-3.5 w-3.5 transition-transform ${expanded ? '' : '-rotate-90'}`}
                        />
                      </button>
                    ) : (
                      <span className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <button type="button" onClick={() => toggleRowSelected(epic.key)} className="flex-shrink-0">
                      {selected ? (
                        <CheckboxIcon className="h-3.5 w-3.5" />
                      ) : (
                        <EmptyCheckboxIcon className="h-3.5 w-3.5 text-gray-300" />
                      )}
                    </button>
                    <LightningIcon className="h-3.5 w-3.5 flex-shrink-0 text-purple-600" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                      {epic.key}: {epic.title}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[statusForEpic(epic.key)]}`}
                    >
                      {statusForEpic(epic.key)}
                    </span>
                  </div>
                )
              }

              const { ticket } = row
              const typeMeta = TYPE_ICON[ticket.type] ?? TYPE_ICON.Task
              const TypeIcon = typeMeta.icon
              const selected = selectedRows.has(ticket.key)
              return (
                <div
                  key={row.key}
                  className="flex h-10 items-center gap-1.5 border-b border-gray-100 pl-9 pr-3 dark:border-gray-800"
                >
                  <button type="button" onClick={() => toggleRowSelected(ticket.key)} className="flex-shrink-0">
                    {selected ? (
                      <CheckboxIcon className="h-3.5 w-3.5" />
                    ) : (
                      <EmptyCheckboxIcon className="h-3.5 w-3.5 text-gray-300" />
                    )}
                  </button>
                  <TypeIcon className={`h-3.5 w-3.5 flex-shrink-0 ${typeMeta.color}`} />
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                    {ticket.key}: {ticket.title}
                  </span>
                  <span
                    className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[ticket.column ?? 'To Do']}`}
                  >
                    {ticket.column ?? 'To Do'}
                  </span>
                </div>
              )
            })}

            {isCreatingEpic ? (
              <div className="px-3 py-2">
                <input
                  type="text"
                  autoFocus
                  value={newEpicTitle}
                  onChange={(event) => setNewEpicTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmCreateEpic()
                    if (event.key === 'Escape') {
                      setNewEpicTitle('')
                      setIsCreatingEpic(false)
                    }
                  }}
                  onBlur={confirmCreateEpic}
                  placeholder="What needs to be done?"
                  className="w-full min-w-0 rounded border border-blue-400 bg-white px-2 py-1 text-sm text-gray-700 outline-none dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingEpic(true)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Create Epic
              </button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="relative flex-1 overflow-auto">
          <div style={{ width: gridWidth }} className="relative">
            {/* z-[3], not 20 — this only needs to stay above this grid's own
                local layers (row shading z-0, sprint bars z-[1], the
                "today" line z-[2]) while scrolling. At z-20 it outranked
                the page's own sticky chrome above it (TopBar z-10, the
                project header/tab row z-[5]) even though it isn't a
                sibling of theirs, because none of the ancestors in between
                establish their own stacking context — so whenever this
                header's box visually overlapped that chrome (a scroll/
                measurement edge case), it painted over it instead of
                staying underneath. */}
            <div
              style={{ height: headerHeight }}
              className="sticky top-0 z-[3] flex flex-shrink-0 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            >
              {groupPositions.map((group, groupIndex) => (
                <div
                  key={group.key}
                  style={{ width: group.width }}
                  className={[
                    'flex-shrink-0 border-r border-gray-200 dark:border-gray-700',
                    groupIndex % 2 === 1 ? 'bg-gray-100 dark:bg-gray-800' : '',
                  ].join(' ')}
                >
                  <div className="px-2 pt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {labelForGroup(group, viewMode)}
                  </div>
                  {showDayNumbers && (
                    <div className="flex">
                      {group.days.map((day, dayIndex) => {
                        const isToday = isSameDay(day, today)
                        return (
                          <div
                            key={dayIndex}
                            style={{ width: dayWidth }}
                            className="flex flex-shrink-0 items-center justify-center pb-1"
                          >
                            {isToday ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                {day.getDate()}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {day.getDate()}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {groupPositions.map(
              (group, groupIndex) =>
                groupIndex % 2 === 1 && (
                  <div
                    key={group.key}
                    className="absolute z-0 bg-gray-50 dark:bg-gray-800/40"
                    style={{ left: group.left, width: group.width, top: headerHeight, bottom: 0 }}
                  />
                ),
            )}

            {todayIndex >= 0 && todayIndex < totalDays && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-[2] w-px bg-blue-500"
                style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
              />
            )}

            <div className="relative z-[1] h-10 border-b border-gray-100 dark:border-gray-800">
              {sprintBars.map((bar) => (
                <div
                  key={bar.number}
                  title={`${project.key} Sprint ${bar.number}: ${formatFullDate(bar.start)} - ${formatFullDate(bar.end)} (${bar.days} days)`}
                  className={`absolute top-2 flex h-6 items-center truncate rounded border px-2 text-xs font-medium ${SPRINT_COLORS[bar.number % SPRINT_COLORS.length]}`}
                  style={{
                    left: bar.startIndex * dayWidth + 3,
                    width: Math.max(0, (bar.endIndex - bar.startIndex + 1) * dayWidth - 6),
                  }}
                >
                  {project.key} Sprint {bar.number}
                </div>
              ))}
            </div>

            <div className="relative z-[1]">
              {rows.map((row) => {
                if (row.kind === 'epic') {
                  const { epic } = row
                  const linked = allTickets.filter((ticket) => ticket.epicKey === epic.key)
                  const bar =
                    linked.length > 0
                      ? (() => {
                          const minCreated = Math.min(
                            ...linked.map((ticket) => new Date(ticket.createdAt).getTime()),
                          )
                          const maxUpdated = Math.max(
                            ...linked.map((ticket) => new Date(ticket.updatedAt).getTime()),
                          )
                          const startIndex = Math.max(0, dayIndexOf(new Date(minCreated)))
                          const endIndex = Math.min(totalDays - 1, dayIndexOf(new Date(maxUpdated)))
                          return endIndex >= 0 && startIndex < totalDays
                            ? { startIndex, endIndex: Math.max(endIndex, startIndex) }
                            : null
                        })()
                      : null

                  return (
                    <div
                      key={row.key}
                      className="relative h-10 border-b border-gray-100 dark:border-gray-800"
                    >
                      {bar && (
                        <div
                          title={`${epic.title} (${linked.length} linked ticket${linked.length === 1 ? '' : 's'})`}
                          className="absolute top-2 flex h-6 items-center truncate rounded border border-purple-300 bg-purple-50 px-2 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          style={{
                            left: bar.startIndex * dayWidth,
                            width: (bar.endIndex - bar.startIndex + 1) * dayWidth,
                          }}
                        >
                          {epic.title}
                        </div>
                      )}
                    </div>
                  )
                }

                const { ticket } = row
                const markerIndex = Math.min(
                  totalDays - 1,
                  Math.max(0, dayIndexOf(new Date(ticket.updatedAt))),
                )
                const markerColor =
                  ticket.column === 'Done'
                    ? 'bg-green-500'
                    : ticket.column === 'In Progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-400'

                return (
                  <div
                    key={row.key}
                    className="relative h-10 border-b border-gray-100 dark:border-gray-800"
                  >
                    <div
                      title={`${ticket.key}: ${ticket.title}`}
                      className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ${markerColor}`}
                      style={{ left: markerIndex * dayWidth + dayWidth / 2 - 5 }}
                    />
                  </div>
                )
              })}

              {isCreatingEpic && <div className="h-10" />}
            </div>
          </div>
        </div>
      </div>

      {/* z-[4] — above this grid's own layers (the "today" line tops out at
          z-[2], the sticky date header at z-[3]) so it always renders in
          front of them instead of the line cutting through it, but still
          under the page's own chrome (TopBar z-10, project header z-[5]). */}
      <div className="absolute bottom-4 right-4 z-[4] flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={scrollToToday}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Today
        </button>
        {VIEW_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={[
              'rounded-md border px-3 py-1.5 text-sm font-medium',
              viewMode === mode
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {mode}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <span className="flex h-7 w-7 cursor-default items-center justify-center text-gray-400">
          <InfoIcon className="h-4 w-4" />
        </span>
        <span className="flex h-7 w-7 cursor-default items-center justify-center text-gray-400">
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
