import { useState } from 'react'
import { loadState, saveState } from '../utils/localStorage'
import { ChevronLeftIcon, ChevronRightIcon } from './workspace/icons'

const PANEL_COLLAPSED_KEY = 'jiraway-module-panel-collapsed'
export const MODULE_PANEL_WIDTH = 208
export const MODULE_PANEL_WIDTH_COLLAPSED = 24
const TOTAL_MODULES = 5
const CIRCLE_SIZE = 28
const ROW_GAP = 28
const MODULE_KEYS = ['module1', 'module2', 'module3', 'module4', 'backlog-demo']

// Collapsed/expanded must be the SAME state the caller uses to size its own
// left padding — two independent copies (one read by this component, one by
// the screen) would drift apart the instant either side changed, the same
// class of bug the ticket-store desync earlier this session was. Lifting it
// into one hook the screen owns and passes down as props keeps both in sync.
// Default itself — never a saved preference — collapsed on a narrow screen:
// at 208px wide, this panel alone eats over half a phone's viewport and
// pushes everything else off-screen, the same "sidebar collapses on mobile"
// requirement the real workspace Sidebar already follows.
export function useModulePanelCollapsed() {
  const [collapsed, setCollapsed] = useState(() =>
    loadState(PANEL_COLLAPSED_KEY, typeof window !== 'undefined' && window.innerWidth < 768),
  )

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      saveState(PANEL_COLLAPSED_KEY, next)
      return next
    })
  }

  return [collapsed, toggleCollapsed]
}

// Shared fixed left-side panel for every module screen (Module 1-4 plus
// BacklogDemo, counted here as "Module 5") — one circle per module (filled
// once passed, outlined for the current one, dim for ones still ahead) on a
// connecting line so it reads as an actual progress stepper, each labeled
// "Module N", plus a real "Exit module" option pinned to the bottom (saved
// progress means logging back in resumes here rather than restarting).
// Collapses to a slim edge tab when hidden. Callers must
// reserve MODULE_PANEL_WIDTH (or MODULE_PANEL_WIDTH_COLLAPSED, matching
// `collapsed`) of left padding on their own outermost element — a
// fixed-position panel can't push sibling content aside on its own the way
// a spacer div in normal flow can.
export default function ModuleProgressBar({
  moduleNumber,
  title,
  onLogout,
  collapsed,
  onToggleCollapsed,
  children,
  hideEarlierProgress = false,
  onSelectModule,
  onBackToWorkspace,
  onChooseModule,
}) {
  const canJumpToAnyModule = Boolean(onSelectModule) && hideEarlierProgress

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Show module progress"
        className="fixed left-0 top-1/2 z-[60] flex h-10 w-6 -translate-y-1/2 items-center justify-center rounded-r-md bg-gray-900 text-blue-400 hover:bg-gray-800 hover:text-blue-300"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div
      className="fixed inset-y-0 left-0 z-[60] flex flex-col bg-gray-900 px-5 py-6 text-white"
      style={{ width: MODULE_PANEL_WIDTH }}
    >
      {/* Fixed height, not just fixed spacing — a short title ("Orientation")
          and a long one ("Before Your Ticket Reached You") wrap to a
          different number of lines, which was pushing the circles below up
          or down depending on which module this is. Reserving room for the
          longest title (up to 3 lines) up front keeps the circles landing at
          the same spot every time; line-clamp-3 is the backstop for
          anything longer still. */}
      <div className="mb-6 flex items-start justify-between gap-2" style={{ minHeight: 84 }}>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-gray-300">Your progress</p>
          <p className="mt-1 line-clamp-3 text-sm font-medium text-gray-100">{title}</p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Hide module progress"
          className="flex-shrink-0 rounded p-1 text-blue-400 hover:bg-gray-800 hover:text-blue-300"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex flex-col" style={{ gap: ROW_GAP }}>
        {/* The connecting line sits behind the circles, spanning from the
            center of the first to the center of the last — its own filled
            overlay (width based on how far through the modules she is)
            gives the line, not just the circles, a sense of progress. */}
        <div
          className="absolute left-0 top-0 w-0.5 bg-gray-700"
          style={{
            left: CIRCLE_SIZE / 2 - 1,
            top: CIRCLE_SIZE / 2,
            height: (TOTAL_MODULES - 1) * (CIRCLE_SIZE + ROW_GAP),
          }}
        />
        <div
          className="absolute w-0.5 bg-blue-400"
          style={{
            left: CIRCLE_SIZE / 2 - 1,
            top: CIRCLE_SIZE / 2,
            height: hideEarlierProgress ? 0 : Math.max(0, moduleNumber - 1) * (CIRCLE_SIZE + ROW_GAP),
          }}
        />

        {Array.from({ length: TOTAL_MODULES }, (_, index) => index + 1).map((n) => {
          // Jumping straight into a module via "Learn a module again" isn't
          // real sequential progress — showing earlier modules checked off
          // would claim she'd just completed them in order, which she
          // hasn't. Only the module she actually picked gets highlighted.
          const isDone = !hideEarlierProgress && n < moduleNumber
          const isCurrent = n === moduleNumber
          const Row = canJumpToAnyModule ? 'button' : 'div'
          return (
            <Row
              key={n}
              type={canJumpToAnyModule ? 'button' : undefined}
              onClick={canJumpToAnyModule && !isCurrent ? () => onSelectModule(MODULE_KEYS[n - 1]) : undefined}
              className={[
                'relative flex items-center gap-3 text-left',
                canJumpToAnyModule && !isCurrent ? 'cursor-pointer hover:opacity-80' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'flex flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  isDone
                    ? 'border-blue-400 bg-blue-400 text-gray-900'
                    : isCurrent
                      ? 'border-blue-400 bg-gray-900 text-blue-400 ring-4 ring-blue-400/20'
                      : 'border-gray-600 bg-gray-900 text-gray-500',
                ].join(' ')}
                style={{ height: CIRCLE_SIZE, width: CIRCLE_SIZE }}
              >
                {isDone ? '✓' : n}
              </span>
              <span
                className={
                  isCurrent
                    ? 'text-sm font-semibold text-white'
                    : isDone
                      ? 'text-sm text-gray-300'
                      : 'text-sm text-gray-500'
                }
              >
                Module {n}
              </span>
            </Row>
          )
        })}
      </div>

      <div className="mt-auto flex flex-col items-start gap-2 border-t border-gray-800 pt-4">
        {/* All three only offered while replaying (via "Practice again") or
            for an admin (who can exit any module at any point, first-time
            sequential flow or not) — a learner working through the
            curriculum for the real first time has no workspace unlocked yet
            to go back to, and no free-floating "exit" out of the sequence
            either; she finishes the module she's in. Kept together under the
            one onBackToWorkspace check (App.jsx gates all three the same
            way) so this bottom section sits at the same fixed spot whether
            it's showing zero or three buttons. */}
        {onBackToWorkspace && (
          <>
            <button
              type="button"
              onClick={onBackToWorkspace}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Back to workspace
            </button>
            {/* Exits straight into the module picker instead — one click to
                jump to a different module, rather than landing on the
                workspace and clicking "Practice again" separately. */}
            {onChooseModule && (
              <button
                type="button"
                onClick={onChooseModule}
                className="flex items-center gap-1 rounded-md border border-blue-500 bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-900"
              >
                Choose a module
              </button>
            )}
            {/* Real feature, not a test shortcut — lets her step out mid-module
                at any point while replaying. Progress is saved per-learner
                (App.jsx persists the current screen under her own id), so
                logging back in with the same name+email resumes exactly here
                rather than restarting. Also doubles as the only way back to
                Landing while one of the modal-style screens some modules show
                is up, since those sit on an opaque backdrop that blocks
                clicks through to the real avatar menu's Log out option
                underneath. */}
            <button
              type="button"
              onClick={() => onLogout?.()}
              className="flex items-center gap-1 rounded-md border border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-800"
            >
              Exit module
            </button>
          </>
        )}
        {children}
      </div>
    </div>
  )
}
