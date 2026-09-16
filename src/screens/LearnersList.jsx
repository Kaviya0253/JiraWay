import { useState } from 'react'
import {
  getKnownLearners,
  getLearnerModuleProgress,
  getLearnerModuleTimings,
  getLearnerTabTimings,
  getLearnerLastSeen,
  getLearnerReplayedModules,
  getLearnerDecorativeClicks,
  getLearnerActivityCounts,
  getLearnerFirstActionTimings,
  removeAllLearnersExceptAdmin,
  removeLearner,
} from '../utils/localStorage'
import { ChevronLeftIcon, CloseIcon, ClockIcon } from '../components/workspace/icons'

export const MODULE_LABELS = [
  { key: 'module1', label: 'Module 1' },
  { key: 'module2', label: 'Module 2' },
  { key: 'module3', label: 'Module 3' },
  { key: 'module4', label: 'Module 4' },
  { key: 'backlog-demo', label: 'Module 5' },
]

export const TAB_LABELS = [
  { key: 'summary', label: 'Summary' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'board', label: 'Board' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'timeline', label: 'Timeline' },
]

export const ACTIVITY_LABELS = [
  { key: 'ticketsCreated', label: 'Tickets created' },
  { key: 'statusChanges', label: 'Status changes' },
  { key: 'commentsAdded', label: 'Comments added' },
]

function formatLoginDate(value) {
  if (!value) return null
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ProgressBadge({ learnerId }) {
  const { completedModules, totalModules, status } = getLearnerModuleProgress(learnerId)

  if (status === 'completed') {
    return (
      <span className="flex-shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-950 dark:text-green-400">
        All {totalModules} modules complete
      </span>
    )
  }
  if (status === 'in-progress') {
    return (
      <span className="flex-shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {completedModules}/{totalModules} modules
      </span>
    )
  }
  if (status === 'workspace') {
    return (
      <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        In workspace
      </span>
    )
  }
  return (
    <span className="flex-shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      Not started
    </span>
  )
}

function TimingRow({ label, entry, emptyLabel = 'not reached', subLabel }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-1 text-[11px] text-gray-500 first:border-t-0 first:pt-0 dark:border-gray-700 dark:text-gray-400">
      <span>
        {label}
        {subLabel && <span className="ml-1.5 text-gray-400 dark:text-gray-500">({subLabel})</span>}
      </span>
      {entry ? (
        <span className="text-gray-600 dark:text-gray-300">
          {entry.label}
          {entry.visitCount > 1 && (
            <span className="ml-1.5 rounded bg-blue-50 px-1 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              visited {entry.visitCount}x
            </span>
          )}
        </span>
      ) : (
        <span className="text-gray-300 dark:text-gray-600">{emptyLabel}</span>
      )}
    </div>
  )
}

function CountRow({ label, count }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-1 text-[11px] text-gray-500 first:border-t-0 first:pt-0 dark:border-gray-700 dark:text-gray-400">
      <span>{label}</span>
      <span className="text-gray-600 dark:text-gray-300">{count}</span>
    </div>
  )
}

export function TimingDetails({ learnerId }) {
  const { perModule, workspaceLabel, totalLabel } = getLearnerModuleTimings(learnerId)
  const perTab = getLearnerTabTimings(learnerId)
  const replayed = getLearnerReplayedModules(learnerId)
  const decorativeClicks = getLearnerDecorativeClicks(learnerId)
  const activityCounts = getLearnerActivityCounts(learnerId)
  const firstActions = getLearnerFirstActionTimings(learnerId)
  const lastSeen = getLearnerLastSeen(learnerId)

  const hasTabData = Object.keys(perTab).length > 0
  const hasActivity = ACTIVITY_LABELS.some(({ key }) => activityCounts[key] > 0)
  const decorativeEntries = Object.entries(decorativeClicks)
  const hasDecorativeClicks = decorativeEntries.length > 0

  if (!totalLabel) {
    return (
      <div className="ml-8 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
        No time data recorded yet — this only starts logging from the moment this button was added.
      </div>
    )
  }

  return (
    <div className="ml-8 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
      <div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Time on product: {totalLabel}</p>
        {lastSeen && (
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            Last seen: {lastSeen.screenLabel} · {lastSeen.relativeLabel}
          </p>
        )}
        {replayed.length > 0 && (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
            Replayed:
            {replayed.map(({ label, visitCount }) => (
              <span
                key={label}
                className="rounded bg-amber-50 px-1 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              >
                {label} ({visitCount}x)
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {MODULE_LABELS.map(({ key, label }) => (
          <TimingRow key={key} label={label} entry={perModule[key]} subLabel={firstActions[key] && `first action: ${firstActions[key]}`} />
        ))}
        <TimingRow
          label="Workspace (after curriculum)"
          entry={workspaceLabel ? { label: workspaceLabel, visitCount: 1 } : null}
          emptyLabel="not there yet"
        />
      </div>

      {hasTabData && (
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Tabs visited in workspace</p>
          <div className="mt-1.5 flex flex-col gap-1">
            {TAB_LABELS.map(({ key, label }) => (
              <TimingRow key={key} label={label} entry={perTab[key]} emptyLabel="never opened" />
            ))}
          </div>
        </div>
      )}

      {hasActivity && (
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Real activity in workspace</p>
          <div className="mt-1.5 flex flex-col gap-1">
            {ACTIVITY_LABELS.map(({ key, label }) =>
              activityCounts[key] > 0 ? <CountRow key={key} label={label} count={activityCounts[key]} /> : null,
            )}
          </div>
        </div>
      )}

      {hasDecorativeClicks && (
        <div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Clicked things that don't do anything yet
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {decorativeEntries.map(([label, count]) => (
              <CountRow key={label} label={label} count={count} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LearnersList({ onBack, onViewAnalytics }) {
  const [knownLearners, setKnownLearners] = useState(() =>
    // Most recent login first — this list exists for reviewing test
    // activity, so what happened last is what's most useful up top.
    [...getKnownLearners()].sort((a, b) => new Date(b.lastLoginAt ?? 0) - new Date(a.lastLoginAt ?? 0)),
  )
  const [confirmingRemoveAll, setConfirmingRemoveAll] = useState(false)
  // Which single row is mid-confirm, if any — a row's own "×" needs a
  // lighter one-at-a-time confirm than the bulk action above, since
  // removing one stray test account (including a stray admin-flagged one)
  // shouldn't need the same "how many am I nuking" framing.
  const [confirmingRemoveId, setConfirmingRemoveId] = useState(null)
  // Which rows have their time-details box open — collapsed by default so
  // the list stays a compact scan of names, only expanding per-module timing
  // for whichever learner you actually want to look at.
  const [expandedTimingId, setExpandedTimingId] = useState(null)
  const nonAdminCount = knownLearners.filter((entry) => entry.role !== 'admin').length

  function handleRemoveAll() {
    removeAllLearnersExceptAdmin()
    setKnownLearners((current) => current.filter((entry) => entry.role === 'admin'))
    setConfirmingRemoveAll(false)
  }

  function handleRemoveOne(learnerId) {
    removeLearner(learnerId)
    setKnownLearners((current) => current.filter((entry) => entry.id !== learnerId))
    setConfirmingRemoveId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {onViewAnalytics && (
            <button
              type="button"
              onClick={onViewAnalytics}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              View analytics
            </button>
          )}

          {nonAdminCount > 0 &&
          (confirmingRemoveAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Remove {nonAdminCount} learner{nonAdminCount === 1 ? '' : 's'}?
              </span>
              <button
                type="button"
                onClick={handleRemoveAll}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Confirm remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmingRemoveAll(false)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingRemoveAll(true)}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              Remove all learners (except admin)
            </button>
          ))}
        </div>
      </div>

      <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Learners on this device</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {knownLearners.length} learner{knownLearners.length === 1 ? '' : 's'} total.
      </p>

      {knownLearners.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No one has logged in yet.</p>
      ) : (
        <div className="mt-4 flex max-w-2xl flex-col gap-1.5">
          {knownLearners.map((learner) => (
            <div key={learner.id} className="flex flex-col gap-1">
            <div
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {learner.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                {learner.name}
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">{learner.email}</span>
              </span>
              <ProgressBadge learnerId={learner.id} />
              <button
                type="button"
                onClick={() =>
                  setExpandedTimingId((current) => (current === learner.id ? null : learner.id))
                }
                aria-label={`${expandedTimingId === learner.id ? 'Hide' : 'Show'} time details for ${learner.name}`}
                className={[
                  'flex flex-shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  expandedTimingId === learner.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300',
                ].join(' ')}
              >
                <ClockIcon className="h-3 w-3" />
                Time
              </button>
              {formatLoginDate(learner.lastLoginAt) && (
                <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {formatLoginDate(learner.lastLoginAt)}
                </span>
              )}
              {learner.role === 'admin' && (
                <span className="flex-shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Admin
                </span>
              )}

              {/* Never offered for admin rows — this is the real admin
                  account (or a stray admin-flagged test one), and an
                  accidental delete here has no bulk-remove equivalent to
                  fall back on since that action already skips admins too. */}
              {learner.role !== 'admin' &&
                (confirmingRemoveId === learner.id ? (
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveOne(learner.id)}
                      className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingRemoveId(null)}
                      className="rounded border border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingRemoveId(learner.id)}
                    aria-label={`Remove ${learner.name}`}
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                ))}
            </div>
            {expandedTimingId === learner.id && <TimingDetails learnerId={learner.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
