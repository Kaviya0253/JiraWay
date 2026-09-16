import { useRef, useState } from 'react'
import { FilterIcon } from './icons'
import { team } from '../../data/sampleProject'
import AssigneeAvatar from './AssigneeAvatar'
import FilterPanel from './FilterPanel'
import { activeFilterCount, toggleAssigneeFilter, UNASSIGNED } from '../../utils/ticketFilters'

export default function SummaryToolbar({ filters = {}, onFilterChange }) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPos, setFilterPos] = useState(null)
  const filterButtonRef = useRef(null)
  const count = activeFilterCount(filters)

  // FilterPanel always portals to <body> and requires a computed screen
  // position (it reads position.top/left directly) — this toolbar was
  // rendering it with no `position` prop at all, which throws the instant
  // the panel opens. Same fix as Board's ToolbarSearchGroup: measure the
  // button's own rect right before opening.
  function toggleFilterOpen() {
    setFilterOpen((open) => {
      const next = !open
      if (next) {
        const rect = filterButtonRef.current?.getBoundingClientRect()
        if (rect) setFilterPos({ top: rect.bottom + 4, left: rect.left })
      }
      return next
    })
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-3">
      <div className="flex items-center">
        <AssigneeAvatar
          name={null}
          tooltip="Unassigned"
          selected={(filters.assignee ?? []).includes(UNASSIGNED)}
          onClick={() => onFilterChange?.(toggleAssigneeFilter(filters, UNASSIGNED))}
          className="h-8 w-8 border-2 border-white dark:border-gray-900"
        />
        {team
          .filter((member) => member.role !== 'Team Lead')
          .map((member) => (
            <AssigneeAvatar
              key={member.id}
              name={member.name}
              tooltip={member.name}
              selected={(filters.assignee ?? []).includes(member.name)}
              onClick={() => onFilterChange?.(toggleAssigneeFilter(filters, member.name))}
              className="-ml-2 h-8 w-8 border-2 border-white dark:border-gray-900"
            />
          ))}
      </div>

      <div className="relative">
        <button
          ref={filterButtonRef}
          type="button"
          onClick={toggleFilterOpen}
          className={[
            'flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm font-medium',
            filterOpen || count > 0
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
          ].join(' ')}
        >
          <FilterIcon className="h-4 w-4" />
          Filter
          {count > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
              {count}
            </span>
          )}
        </button>

        {filterOpen && filterPos && (
          <FilterPanel position={filterPos} filters={filters} onChange={onFilterChange} onClose={() => setFilterOpen(false)} />
        )}
      </div>

      {count > 0 && (
        <button
          type="button"
          onClick={() => onFilterChange?.({})}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
