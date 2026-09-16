import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './icons'
import ToolbarSearchGroup from './ToolbarSearchGroup'

const VIEW_OPTIONS = ['Month', 'Week']

export default function CalendarToolbar({
  filters,
  onFilterChange,
  searchTerm,
  onSearchChange,
  periodLabel,
  onToday,
  onPrev,
  onNext,
  viewMode,
  onChangeViewMode,
}) {
  const [viewMenuOpen, setViewMenuOpen] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
      <ToolbarSearchGroup
        placeholder="Search calendar"
        filters={filters}
        onFilterChange={onFilterChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Today
        </button>

        <div className="flex items-center gap-1 rounded-md border border-gray-300 px-1.5 py-1.5 dark:border-gray-600">
          <button
            type="button"
            onClick={onPrev}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="flex-shrink-0 whitespace-nowrap px-1 text-center text-sm font-medium text-gray-700 dark:text-gray-200">
            {periodLabel}
          </span>
          <button
            type="button"
            onClick={onNext}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setViewMenuOpen((open) => !open)}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            {viewMode}
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {viewMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setViewMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {VIEW_OPTIONS.filter((option) => option !== viewMode).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChangeViewMode?.(option)
                      setViewMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
