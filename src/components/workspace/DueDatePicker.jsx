import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './icons'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getCalendarDays(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    days.push({ day, date: new Date(year, month - 1, day), currentMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ day, date: new Date(year, month, day), currentMonth: true })
  }
  let nextDay = 1
  while (days.length < 42) {
    days.push({ day: nextDay, date: new Date(year, month + 1, nextDay), currentMonth: false })
    nextDay += 1
  }
  return days
}

function isSameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatDate(date) {
  return date ? `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` : ''
}

export default function DueDatePicker({ value, onChange, onClose }) {
  const initial = value ?? new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  const days = getCalendarDays(viewYear, viewMonth)
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  function shiftMonth(offset) {
    let month = viewMonth + offset
    let year = viewYear
    if (month < 0) {
      month = 11
      year -= 1
    } else if (month > 11) {
      month = 0
      year += 1
    }
    setViewMonth(month)
    setViewYear(year)
  }

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Due date</p>

        <div className="mt-1 flex items-center justify-between rounded-md border border-gray-300 px-2 py-1.5 dark:border-gray-600">
          <span className="text-sm text-gray-700 dark:text-gray-200">{formatDate(value)}</span>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-white"
            >
              <CloseIcon className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center text-gray-400">
            <button type="button" onClick={() => setViewYear((y) => y - 1)} className="flex hover:text-blue-600">
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <ChevronLeftIcon className="-ml-2 h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => shiftMonth(-1)} className="ml-1 hover:text-blue-600">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{monthLabel}</p>

          <div className="flex items-center text-gray-400">
            <button type="button" onClick={() => shiftMonth(1)} className="mr-1 hover:text-blue-600">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setViewYear((y) => y + 1)} className="flex hover:text-blue-600">
              <ChevronRightIcon className="h-3.5 w-3.5" />
              <ChevronRightIcon className="-ml-2 h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center text-xs text-gray-400">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
          {days.map(({ day, date, currentMonth }, index) => {
            const selected = isSameDay(date, value)
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onChange(date)
                  onClose()
                }}
                className={[
                  'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                  selected
                    ? 'font-semibold text-blue-600 underline underline-offset-4'
                    : currentMonth
                      ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                      : 'text-gray-300 dark:text-gray-600',
                ].join(' ')}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
