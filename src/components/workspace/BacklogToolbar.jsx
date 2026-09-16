import { ChartTrendIcon, SlidersIcon, EllipsisIcon } from './icons'
import ToolbarSearchGroup from './ToolbarSearchGroup'

export default function BacklogToolbar({ filters, onFilterChange, searchTerm, onSearchChange }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3">
      <ToolbarSearchGroup
        placeholder="Search backlog"
        filters={filters}
        onFilterChange={onFilterChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
      />

      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600">
          <ChartTrendIcon className="h-4 w-4" />
        </span>
        <span className="flex h-8 w-8 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600">
          <SlidersIcon className="h-4 w-4" />
        </span>
        <span className="flex h-8 w-8 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600">
          <EllipsisIcon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
