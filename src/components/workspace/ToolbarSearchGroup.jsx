import { useEffect, useRef, useState } from 'react'
import { SearchIcon, FilterIcon, CloseIcon } from './icons'
import { team, getLearnerName } from '../../data/sampleProject'
import AssigneeAvatar from './AssigneeAvatar'
import FilterPanel from './FilterPanel'
import { activeFilterCount, toggleAssigneeFilter, UNASSIGNED } from '../../utils/ticketFilters'

export default function ToolbarSearchGroup({
  placeholder = 'Search board',
  filters = {},
  onFilterChange,
  searchTerm = '',
  onSearchChange,
  restrictAssigneeFilterTo,
  // Genuinely disables search/avatar-filter/Filter during a guided module
  // step — the tour's own click-blocking overlay hole excludes this whole
  // row already, but a dropdown left open from BEFORE that step started (or
  // any other overlay-timing gap) had no way to actually close or block
  // itself, since this state is local here, entirely outside the module's
  // own overlay tree. A real disable can't be bypassed that way.
  disabled = false,
}) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPos, setFilterPos] = useState(null)
  const filterButtonRef = useRef(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const count = activeFilterCount(filters)
  const searchExpanded = searchFocused || searchTerm.length > 0

  // Board's toolbar row scrolls horizontally on narrow screens
  // (overflow-x-auto), which as a CSS side effect also clips anything trying
  // to overflow vertically out of it — this panel included, invisibly, since
  // it was still absolutely positioned inside that row. Portaling straight to
  // <body> with a JS-computed fixed position escapes that clipping, the same
  // fix already used for the sprint badge popover in BoardToolbar.jsx.
  // Closes a dropdown that was already open BEFORE `disabled` turned on —
  // e.g. left open from browsing the plain workspace right before a module
  // started, or from an earlier step. Nothing else would ever close it.
  useEffect(() => {
    if (disabled) setFilterOpen(false)
  }, [disabled])

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
    <div className="flex flex-shrink-0 items-center gap-1.5">
      <div
        data-tour="search-board"
        className={[
          'flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-all duration-150',
          searchExpanded ? 'w-44 border-blue-500' : 'w-32 border-gray-300 dark:border-gray-600',
        ].join(' ')}
      >
        <SearchIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          disabled={disabled}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full min-w-0 truncate bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none disabled:cursor-not-allowed dark:text-gray-200"
        />
        {searchTerm.length > 0 && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSearchChange?.('')}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center">
        <AssigneeAvatar
          name={null}
          tooltip="Unassigned"
          selected={(filters.assignee ?? []).includes(UNASSIGNED)}
          onClick={
            disabled || restrictAssigneeFilterTo
              ? undefined
              : () => onFilterChange?.(toggleAssigneeFilter(filters, UNASSIGNED))
          }
          className="h-8 w-8 border-2 border-white dark:border-gray-900"
        />
        {team
          .filter((member) => member.role !== 'Team Lead')
          .map((member) => {
            // During Module 4's "my-work" tour stop, every avatar except her
            // own is deliberately inert — the tour's click-through gap only
            // covers her own avatar's real screen position, but that's just
            // an overlay; without this, a click landing slightly off that
            // gap (or on an overlapping neighbor in the stack) could still
            // reach a real avatar's onClick underneath and apply the wrong
            // filter.
            const restricted = disabled || (restrictAssigneeFilterTo && member.name !== restrictAssigneeFilterTo)
            return (
              <AssigneeAvatar
                key={member.id}
                name={member.name}
                tooltip={member.name}
                selected={(filters.assignee ?? []).includes(member.name)}
                onClick={
                  restricted ? undefined : () => onFilterChange?.(toggleAssigneeFilter(filters, member.name))
                }
                dataTour={member.name === getLearnerName() ? 'my-work-avatar' : undefined}
                className="-ml-2 h-8 w-8 border-2 border-white dark:border-gray-900"
              />
            )
          })}
      </div>

      <div className="relative">
        <button
          ref={filterButtonRef}
          type="button"
          disabled={disabled}
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
          <FilterPanel
            position={filterPos}
            filters={filters}
            onChange={onFilterChange}
            onClose={() => setFilterOpen(false)}
          />
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
