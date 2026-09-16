import { useState, useLayoutEffect, useRef } from 'react'
import CalendarToolbar from './CalendarToolbar'
import { matchesFilters, matchesSearch } from '../../utils/ticketFilters'
import { project } from '../../data/sampleProject'
import { BellIcon, CloseIcon } from './icons'
import { loadState, saveState, scopedKey } from '../../utils/localStorage'

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const BAR_ROW_HEIGHT = 22

const SPRINT_BAR_COLORS = [
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
]

function getMonthWeeks(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // Mon=0 .. Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    cells.push({ day, date: new Date(year, month - 1, day), currentMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, date: new Date(year, month, day), currentMonth: true })
  }
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay, date: new Date(year, month + 1, nextDay), currentMonth: false })
    nextDay += 1
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7).slice(0, 5))
  }
  return weeks
}

function getWeekDays(date) {
  const weekday = (date.getDay() + 6) % 7 // Mon=0 .. Sun=6
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday)
  const days = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    days.push({ day: d.getDate(), date: d, currentMonth: true })
  }
  return [days]
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

function clamp(date, min, max) {
  if (date < min) return min
  if (date > max) return max
  return date
}

export default function CalendarPage({ allTickets, sprintDates, learnerId }) {
  const today = new Date()
  const [anchorDate, setAnchorDate] = useState(today)
  const [viewMode, setViewMode] = useState('Month')
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const todayRowRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(null)

  // Short one-time hint on her first visit to this tab — dismissed and
  // remembered per learner, same as any other first-visit note, rather than
  // a guided lesson (Calendar is recognition-only, not a practiced skill).
  const introSeenKey = scopedKey(learnerId, 'seen-calendar-intro')
  const [showIntro, setShowIntro] = useState(() => !loadState(introSeenKey, false))

  function dismissIntro() {
    setShowIntro(false)
    saveState(introSeenKey, true)
  }

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

  useLayoutEffect(() => {
    todayRowRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [anchorDate, viewMode])

  const dueTickets = allTickets.filter(
    (ticket) => ticket.dueDate && matchesFilters(ticket, filters) && matchesSearch(ticket, searchTerm),
  )

  const sprints = Object.entries(sprintDates).map(([number, range]) => ({
    number: Number(number),
    start: toDateOnly(range.start),
    end: toDateOnly(range.end),
  }))

  const isWeekView = viewMode === 'Week'
  const weeks = isWeekView
    ? getWeekDays(anchorDate)
    : getMonthWeeks(anchorDate.getFullYear(), anchorDate.getMonth())

  const periodLabel = anchorDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  function goToday() {
    setAnchorDate(new Date())
  }

  function shiftPeriod(offset) {
    if (isWeekView) {
      const next = new Date(anchorDate)
      next.setDate(next.getDate() + offset * 7)
      setAnchorDate(next)
      return
    }
    let month = anchorDate.getMonth() + offset
    let year = anchorDate.getFullYear()
    if (month < 0) {
      month = 11
      year -= 1
    } else if (month > 11) {
      month = 0
      year += 1
    }
    setAnchorDate(new Date(year, month, 1))
  }

  function ticketsForDate(date) {
    return dueTickets.filter((ticket) => isSameDay(toDateOnly(ticket.dueDate), date))
  }

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-shrink flex-col"
      style={{ height: containerHeight != null ? `${containerHeight}px` : '100vh' }}
    >
      <CalendarToolbar
        filters={filters}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        periodLabel={periodLabel}
        onToday={goToday}
        onPrev={() => shiftPeriod(-1)}
        onNext={() => shiftPeriod(1)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {showIntro && (
        <div className="mx-3 mt-2 flex items-start justify-between gap-3 rounded-lg bg-blue-600 px-3 py-2 shadow-md">
          <p className="text-sm font-medium text-white">
            This is Calendar — it shows tickets by due date, with your sprint's dates laid out
            alongside them.
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

      <div className="mx-3 mb-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="min-h-0 flex-1 overflow-auto">
        {isWeekView ? (
          <div className="grid grid-cols-5 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {weeks[0].map((cell, i) => {
              const isToday = isSameDay(cell.date, today)
              return (
                <div
                  key={i}
                  className="border-r border-gray-200 px-3 py-2 text-center last:border-r-0 dark:border-gray-700"
                >
                  <span
                    className={
                      isToday
                        ? 'text-xs font-semibold uppercase text-blue-600'
                        : 'text-xs font-semibold uppercase text-gray-500 dark:text-gray-400'
                    }
                  >
                    {WEEKDAY_LABELS[i]}
                  </span>{' '}
                  <span
                    className={
                      isToday
                        ? 'text-sm font-semibold text-blue-600'
                        : 'text-sm font-semibold text-gray-900 dark:text-gray-100'
                    }
                  >
                    {cell.day}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-5 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {weeks.map((weekDays, weekIndex) => {
          const weekStart = weekDays[0].date
          const weekEnd = weekDays[4].date

          const weekBars = sprints
            .filter((sprint) => sprint.start <= weekEnd && sprint.end >= weekStart)
            .map((sprint) => {
              const clippedStart = clamp(sprint.start, weekStart, weekEnd)
              const clippedEnd = clamp(sprint.end, weekStart, weekEnd)
              const startCol = weekDays.findIndex((cell) => isSameDay(cell.date, clippedStart))
              const endCol = weekDays.findIndex((cell) => isSameDay(cell.date, clippedEnd))
              return {
                ...sprint,
                startCol: startCol === -1 ? 0 : startCol,
                endCol: endCol === -1 ? 4 : endCol,
              }
            })

          const barsHeight = weekBars.length * BAR_ROW_HEIGHT
          const containsToday = weekDays.some((cell) => isSameDay(cell.date, today))

          return (
            <div
              key={weekIndex}
              ref={containsToday ? todayRowRef : null}
              className="relative grid grid-cols-5 border-b border-gray-100 dark:border-gray-800"
            >
              {weekDays.map((cell, dayIndex) => {
                const dayTickets = ticketsForDate(cell.date)
                const isToday = isSameDay(cell.date, today)

                return (
                  <div
                    key={dayIndex}
                    className={[
                      'border-r border-gray-100 p-1.5 last:border-r-0 dark:border-gray-800',
                      cell.currentMonth ? '' : 'bg-gray-50 dark:bg-gray-800/50',
                    ].join(' ')}
                    style={{ minHeight: (isWeekView ? 200 : 100) + barsHeight }}
                  >
                    {!isWeekView && (
                      <span
                        className={[
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          isToday
                            ? 'bg-blue-600 font-semibold text-white'
                            : cell.currentMonth
                              ? 'text-gray-700 dark:text-gray-200'
                              : 'text-gray-400 dark:text-gray-600',
                        ].join(' ')}
                      >
                        {cell.day}
                      </span>
                    )}

                    <div style={{ height: barsHeight }} />

                    <div className="mt-1 flex flex-col gap-1">
                      {dayTickets.map((ticket) => (
                        <div
                          key={ticket.key}
                          title={`${ticket.key}: ${ticket.title}`}
                          className="truncate rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          {ticket.key}: {ticket.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {weekBars.map((bar, index) => (
                <div
                  key={bar.number}
                  title={`${project.key} Sprint ${bar.number}`}
                  className={`absolute flex items-center gap-1 truncate px-2 text-xs font-medium ${SPRINT_BAR_COLORS[index % SPRINT_BAR_COLORS.length]}`}
                  style={{
                    left: `${(bar.startCol / 5) * 100}%`,
                    width: `${((bar.endCol - bar.startCol + 1) / 5) * 100}%`,
                    top: `${(isWeekView ? 4 : 28) + index * BAR_ROW_HEIGHT}px`,
                    height: `${BAR_ROW_HEIGHT - 2}px`,
                  }}
                >
                  <BellIcon className="h-3 w-3 flex-shrink-0" />
                  {project.key} Sprint {bar.number}
                </div>
              ))}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
