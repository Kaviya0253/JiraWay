import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDownIcon, SprintIcon, TrendingUpIcon, SlidersIcon, EllipsisIcon } from './icons'
import ToolbarSearchGroup from './ToolbarSearchGroup'
import { project } from '../../data/sampleProject'

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLeft(endIso) {
  return Math.max(0, Math.ceil((new Date(endIso).getTime() - Date.now()) / DAY_MS))
}

export default function BoardToolbar({
  onCompleteSprint,
  completeSprintDisabled,
  // Separate from completeSprintDisabled on purpose — that one means "there's
  // a real reason this can't be used right now" (no active sprint) and looks
  // greyed out to say so. A module forcing this off mid-tutorial isn't that
  // kind of disabled — the button should still look like its normal,
  // available self; only the click itself is what's actually blocked.
  forceDisableCompleteSprint = false,
  disableSearchAndFilter = false,
  filters,
  onFilterChange,
  searchTerm,
  onSearchChange,
  sprintNumbers = [],
  sprintDates = {},
  restrictAssigneeFilterTo,
}) {
  const [sprintPopoverOpen, setSprintPopoverOpen] = useState(false)
  const sprintButtonRef = useRef(null)
  const [sprintPopoverPos, setSprintPopoverPos] = useState(null)

  // The popover used to be a plain absolute child of this button — which,
  // once open, could grow the page past the viewport height. That made the
  // page's own vertical scrollbar appear/disappear right as she clicked,
  // shifting the whole toolbar (icon included) sideways by the scrollbar's
  // width. Portaling straight to <body> with a fixed, JS-computed position
  // (same trick AssigneeAvatar's tooltip already uses) takes it fully out
  // of the page's normal layout, so it can never affect scroll height, and
  // therefore never triggers that shift.
  function toggleSprintPopover() {
    setSprintPopoverOpen((open) => {
      const next = !open
      if (next) {
        const rect = sprintButtonRef.current?.getBoundingClientRect()
        if (rect) setSprintPopoverPos({ top: rect.bottom + 4, left: rect.right - 256 })
      }
      return next
    })
  }

  return (
    // min-w-0 + overflow-x-auto — this row's own content (search box, avatar
    // stack, action buttons) doesn't wrap and doesn't shrink below its
    // natural width, same as the board's columns below it. Without both of
    // these, a narrow screen doesn't just scroll this row sideways — the
    // whole toolbar forces the PAGE itself wider, since a bare flex row has
    // no minimum-width ceiling of its own to stop at.
    <div className="flex min-w-0 items-center justify-between gap-3 overflow-x-auto px-3 py-3">
      <ToolbarSearchGroup
        filters={filters}
        onFilterChange={onFilterChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        restrictAssigneeFilterTo={restrictAssigneeFilterTo}
        disabled={disableSearchAndFilter}
      />

      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          data-tour="complete-sprint-button"
          disabled={completeSprintDisabled || forceDisableCompleteSprint}
          onClick={onCompleteSprint}
          className={[
            'rounded-md px-3 py-1.5 text-sm font-medium',
            completeSprintDisabled
              ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ].join(' ')}
        >
          Complete sprint
        </button>

        <div className="relative">
          <button
            ref={sprintButtonRef}
            type="button"
            data-tour="sprint-badge"
            disabled={disableSearchAndFilter}
            onClick={toggleSprintPopover}
            className={[
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border text-gray-500 disabled:cursor-not-allowed dark:text-gray-400',
              sprintPopoverOpen
                ? 'border-blue-400 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-blue-600 dark:border-blue-500',
            ].join(' ')}
          >
            <SprintIcon className="h-4 w-4" />
          </button>

          {sprintPopoverOpen &&
            sprintPopoverPos &&
            createPortal(
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSprintPopoverOpen(false)} />
                <div
                  data-tour="sprint-popover"
                  className="fixed z-20 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  style={{ top: sprintPopoverPos.top, left: sprintPopoverPos.left }}
                >
                  {sprintNumbers.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No active sprint.</p>
                  ) : (
                    sprintNumbers.map((number, index) => {
                      const dates = sprintDates[number]
                      return (
                        <div
                          key={number}
                          className={index > 0 ? 'mt-3 border-t border-gray-100 pt-3 dark:border-gray-700' : ''}
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {project.key} Sprint {number}
                          </p>
                          {dates && (
                            <>
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                {daysLeft(dates.end)} days left
                              </p>
                              <div className="mt-2 flex justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">Start date</p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">{formatDate(dates.start)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">End date</p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300">{formatDate(dates.end)}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </>,
              document.body,
            )}
        </div>

        <button
          type="button"
          className="flex cursor-default items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
        >
          Group
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 dark:border-gray-600">
          <TrendingUpIcon className="h-4 w-4" />
        </span>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 dark:border-gray-600">
          <SlidersIcon className="h-4 w-4" />
        </span>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-500 dark:border-gray-600">
          <EllipsisIcon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
