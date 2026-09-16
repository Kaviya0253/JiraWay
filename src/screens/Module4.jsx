import { useState, useEffect, useMemo, useRef } from 'react'
import JiraWorkspace from '../components/JiraWorkspace'
import ModuleProgressBar, {
  useModulePanelCollapsed,
  MODULE_PANEL_WIDTH,
  MODULE_PANEL_WIDTH_COLLAPSED,
} from '../components/ModuleProgressBar'
import SplitStepButton from '../components/SplitStepButton'
import { loadState, saveState, recordFirstAction } from '../utils/localStorage'
import { getLearnerName } from '../data/sampleProject'
import { INTRO_CARD_CLASSNAME } from '../constants/introCard'
import { INTRO_IMAGE_FIT_SIZE } from '../components/ImageSizeIndicator'
import boardViewImage from '../assets/boardd.svg'
import niceWorkImage from '../assets/nice work.svg'

const TOUR_CARD_POSITIONS_KEY = 'jiraway-module4-tour-card-positions'

const INTRO_IMAGE_POSITION_KEY = 'jiraway-module4-intro-image-position'
const INTRO_IMAGE_SIZE_KEY = 'jiraway-module4-intro-image-size'
// Capped at the card's fixed available space — see Module1.jsx's identical
// comment on this same constant.
const INTRO_IMAGE_DEFAULT_SIZE = INTRO_IMAGE_FIT_SIZE
const INTRO_IMAGE_MIN_SIZE = 60
const INTRO_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE

// Drag-to-calibrate the intro image's position — same pattern as Module 1's
// intro image (a plain pixel offset, since this is a static centered modal
// with nothing on the real page to spotlight).
function useDraggableOffset(storageKey) {
  const [offset, setOffset] = useState(() => loadState(storageKey, { top: 0, left: 0 }))
  const dragRef = useRef(null)
  const rafRef = useRef(null)

  function onPointerDown(event) {
    dragRef.current = { startX: event.clientX, startY: event.clientY, originTop: offset.top, originLeft: offset.left }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    if (!dragRef.current) return
    dragRef.current.lastX = event.clientX
    dragRef.current.lastY = event.clientY
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const drag = dragRef.current
      if (!drag) return
      setOffset({ top: drag.originTop + (drag.lastY - drag.startY), left: drag.originLeft + (drag.lastX - drag.startX) })
    })
  }

  function onPointerUp(event) {
    dragRef.current = null
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setOffset((current) => {
      saveState(storageKey, current)
      return current
    })
  }

  return { offset, onPointerDown, onPointerMove, onPointerUp }
}

// Drag-to-calibrate the intro image's size — grab the handle on its corner
// and drag. Saved to localStorage immediately on release.
function useResizableSize(storageKey, defaultSize, minSize, maxSize) {
  const [size, setSize] = useState(() => loadState(storageKey, defaultSize))
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef(null)
  const rafRef = useRef(null)

  function onPointerDown(event) {
    event.stopPropagation()
    setIsResizing(true)
    dragRef.current = { startX: event.clientX, originSize: size }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    if (!dragRef.current) return
    dragRef.current.lastX = event.clientX
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const drag = dragRef.current
      if (!drag) return
      const next = drag.originSize + (drag.lastX - drag.startX)
      setSize(Math.min(maxSize, Math.max(minSize, next)))
    })
  }

  function onPointerUp(event) {
    dragRef.current = null
    setIsResizing(false)
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setSize((current) => {
      saveState(storageKey, current)
      return current
    })
  }

  return { size, isResizing, onPointerDown, onPointerMove, onPointerUp }
}

const SPRINT_BADGE_SELECTOR = '[data-tour="sprint-badge"]'
const MY_WORK_AVATAR_SELECTOR = '[data-tour="my-work-avatar"]'
const SEARCH_BOARD_SELECTOR = '[data-tour="search-board"]'
const COMPLETE_SPRINT_SELECTOR = '[data-tour="complete-sprint-button"]'

const CARD_WIDTH = 300
const CARD_MARGIN = 16

// Every recognition stop in this module, in order — each highlights one real
// element. Unified into one array (instead of four separate hand-written
// steps) so a single Back/Next pair can move between all of them, the same
// stepper pattern used in every other module's tour. The arrows are the
// only way through — a real click on the highlighted element doesn't also
// advance, so stepping through this tour always means an explicit Next.
const STOPS = [
  {
    key: 'sprint',
    selector: SPRINT_BADGE_SELECTOR,
    // A real click here opens the actual sprint popover (not blocked, like
    // every other stop but "complete-sprint") — this tells the tour to
    // track that real popover once it's open, so the message card moves
    // below it instead of sitting wherever the bare icon alone would place
    // it, overlapping the popover's own content.
    popoverSelector: '[data-tour="sprint-popover"]',
    ringClassName: 'rounded-lg',
    text: "This shows which sprint your team is currently working in. You won't plan or run one today — just know it's here.",
    position: 'below',
    arrow: 'top',
  },
  {
    key: 'my-work',
    selector: MY_WORK_AVATAR_SELECTOR,
    ringClassName: 'rounded-full',
    text: 'Click your own avatar to filter the board down to just your work.',
    position: 'right',
    arrow: 'left',
  },
  {
    key: 'search',
    selector: SEARCH_BOARD_SELECTOR,
    ringClassName: 'rounded-md',
    text: 'Use this to quickly find a ticket by its title.',
    position: 'below',
    arrow: 'top',
  },
  {
    key: 'complete-sprint',
    selector: COMPLETE_SPRINT_SELECTOR,
    ringClassName: 'rounded-md',
    text: "Complete Sprint ends the current sprint and affects the team's work — only used when your team expects it, not something you'll click today.",
    position: 'below-left',
    arrow: 'top',
    // Recognition only — unlike the stops above, a real click here must NOT
    // go through, since it would end the team's actual sprint. The overlay
    // below stays a real click-blocker (not pointer-events-none) for this
    // one stop specifically.
    blockRealClicks: true,
  },
]

function unionOf(rects) {
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return { top, left, right, bottom, width: right - left, height: bottom - top }
}

function positionRightOf(rect) {
  if (!rect) return null
  return { top: rect.top, left: rect.right + 12 }
}

function positionBelow(rect) {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  let left = rect.left + rect.width / 2 - CARD_WIDTH / 2
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - CARD_WIDTH - CARD_MARGIN))
  return { top: rect.bottom + 12, left }
}

function positionFor(stop, rect) {
  if (stop.position === 'right') return positionRightOf(rect)
  if (stop.position === 'below-left') {
    if (!rect) return { top: 120, left: Math.max(CARD_MARGIN, window.innerWidth / 2 - CARD_WIDTH / 2) }
    return { top: rect.bottom + 12, left: Math.max(CARD_MARGIN, rect.left - CARD_WIDTH) }
  }
  return positionBelow(rect)
}

// Small diamond, half clipped by the card's own background so only the
// outward-facing point shows — aimed back at whichever real element this
// stop is explaining. For the "top" direction, `left` is computed from the
// real highlighted rect (see arrowLeft below) rather than a fixed offset —
// a fixed left-6/right-6 only lined up with the highlighted element by
// coincidence, and drifted off it (e.g. pointing at "Complete sprint"
// instead of the sprint badge next to it) whenever the card's actual
// position didn't happen to match.
function PointerArrow({ direction, left }) {
  if (direction === 'left') {
    return (
      <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950" />
    )
  }
  return (
    <div
      className="absolute -top-1.5 h-3 w-3 rotate-45 border-l-2 border-t-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      style={{ left: left ?? 24 }}
    />
  )
}

export default function Module4({ learnerId, learner, onComplete, onLogout, isReplay = false, onSelectModule, onBackToWorkspace, onChooseModule }) {
  const [panelCollapsed, togglePanelCollapsed] = useModulePanelCollapsed()
  const [step, setStep] = useState('intro')
  // Time-to-first-action tracking for the admin Learners list — see
  // Module1.jsx's identical hook for the full reasoning.
  const moduleMountTimeRef = useRef(Date.now())
  const firstActionRecordedRef = useRef(false)
  useEffect(() => {
    if (step === 'intro' || firstActionRecordedRef.current) return
    firstActionRecordedRef.current = true
    recordFirstAction(learnerId, 'module4', Date.now() - moduleMountTimeRef.current)
  }, [step, learnerId])
  const [stopIndex, setStopIndex] = useState(0)
  const [stopRect, setStopRect] = useState(null)
  const [popoverRect, setPopoverRect] = useState(null)
  const [isDraggingCard, setIsDraggingCard] = useState(false)
  const [ticketActions, setTicketActions] = useState(null)
  const [manualPositions, setManualPositions] = useState(() => loadState(TOUR_CARD_POSITIONS_KEY, {}))
  const dragRef = useRef(null)
  const dragRafRef = useRef(null)
  const introImageDrag = useDraggableOffset(INTRO_IMAGE_POSITION_KEY)
  const introImageResize = useResizableSize(INTRO_IMAGE_SIZE_KEY, INTRO_IMAGE_DEFAULT_SIZE, INTRO_IMAGE_MIN_SIZE, INTRO_IMAGE_MAX_SIZE)
  // .at(-1), not .find() — see the identical fix in Module3.jsx: tickets
  // are appended on creation, so this picks the one she most recently made
  // instead of silently sticking with the oldest leftover non-seed ticket.
  const ticket = ticketActions?.allTickets?.filter((entry) => !entry.isSeed).at(-1) ?? null

  // Drag the message box to wherever you want — remembered per stop, same
  // rAF-batched pattern as Module 1's tour card (committing a position on
  // every raw pointermove event outpaces the browser's redraw rate and
  // freezes the tab on a fast mouse/trackpad).
  function handleCardPointerDown(event) {
    const current = manualPositions[stopIndex] ?? stopCardPos
    if (!current) return
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: current.top,
      originLeft: current.left,
    }
    setIsDraggingCard(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleCardPointerMove(event) {
    if (!dragRef.current) return
    dragRef.current.lastX = event.clientX
    dragRef.current.lastY = event.clientY
    if (dragRafRef.current != null) return
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null
      const drag = dragRef.current
      if (!drag) return
      setManualPositions((positions) => ({
        ...positions,
        [stopIndex]: {
          top: drag.originTop + (drag.lastY - drag.startY),
          left: drag.originLeft + (drag.lastX - drag.startX),
        },
      }))
    })
  }

  function handleCardPointerUp(event) {
    dragRef.current = null
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current)
      dragRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setManualPositions((positions) => {
      saveState(TOUR_CARD_POSITIONS_KEY, positions)
      return positions
    })
    setIsDraggingCard(false)
  }

  // This module works on the ticket Module 2 creates — normally that already
  // exists by the time she gets here. Entering directly via "Practice again"
  // skips Modules 2-3 entirely though, so there'd be no ticket at all and
  // this screen would sit on "intro" forever waiting for one. Falls back to
  // creating the same starter ticket Module 2 would have, so jumping
  // straight into this module on its own still works.
  useEffect(() => {
    if (step !== 'intro' || ticket || !ticketActions?.createTicket) return
    ticketActions.createTicket({
      title: 'Fix broken login button on homepage',
      type: 'Task',
      assignee: learner?.name,
      sprint: 2,
      onBoard: true,
      column: 'To Do',
    })
  }, [step, ticket, ticketActions, learner?.name])

  function startTour() {
    setStopIndex(0)
    setStep('tour')
  }

  // "tour" — one stop at a time, from STOPS. Measures the current stop's
  // real element and keeps it glued to it. No time-based auto-advance —
  // going back to review an earlier stop used to restart its 5s timer,
  // which would then silently drag the highlight forward again while she
  // was still reading it. The only way through is the explicit Back/Next
  // arrows — clicking the real highlighted element doesn't advance it.
  useEffect(() => {
    if (step !== 'tour') return
    const stop = STOPS[stopIndex]

    function measure() {
      const el = document.querySelector(stop.selector)
      setStopRect(el ? el.getBoundingClientRect() : null)
      if (stop.popoverSelector) {
        const popoverEl = document.querySelector(stop.popoverSelector)
        setPopoverRect(popoverEl ? popoverEl.getBoundingClientRect() : null)
      } else {
        setPopoverRect(null)
      }
    }

    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    // capture: true — scrolling inside a nested container (e.g. a board
    // column) doesn't bubble a 'scroll' event up to window, but it does fire
    // during the capture phase, so this still catches it and keeps the
    // highlight box glued to the element instead of drifting on scroll.
    window.addEventListener('scroll', measure, true)

    // A real click on this stop's own element (e.g. the sprint badge) can
    // open real UI of its own (the actual sprint popover, portaled to
    // <body>) without firing a resize or scroll event — remeasuring on
    // click catches that, so the card can move to make room for it instead
    // of sitting wherever it was before the popover existed.
    const el = document.querySelector(stop.selector)
    function onRealClick() {
      requestAnimationFrame(measure)
    }
    el?.addEventListener('click', onRealClick)

    // Belt-and-suspenders over the click listener above: React dispatches
    // its own onClick (the one that actually opens the popover) from the
    // root container, which — for a native listener attached directly to
    // the button itself, like the one above — fires AFTER, not before,
    // meaning a rAF scheduled from it can still land before the popover
    // has actually mounted. Watching <body> directly for the popover
    // element being added or removed catches the real moment it exists,
    // with no timing guess involved either way.
    let observer = null
    if (stop.popoverSelector) {
      observer = new MutationObserver(measure)
      observer.observe(document.body, { childList: true, subtree: true })
    }

    // The search box itself grows/shrinks (w-32 -> w-44 on focus, via a CSS
    // transition) — that resize fires neither a window 'resize' nor
    // 'scroll' event, so without this the highlight ring stayed stuck at
    // whatever width it had when the stop was first measured. A
    // ResizeObserver fires continuously as the element's box actually
    // changes size, including mid-transition, so the ring tracks it live.
    let resizeObserver = null
    if (el) {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(el)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      el?.removeEventListener('click', onRealClick)
      observer?.disconnect()
      resizeObserver?.disconnect()
    }
  }, [step, stopIndex])

  function nextStop() {
    setStopIndex((current) => {
      if (current < STOPS.length - 1) return current + 1
      setStep('complete-sprint-note')
      return current
    })
  }

  function previousStop() {
    setStopIndex((current) => Math.max(0, current - 1))
  }

  const workspace = useMemo(
    () => (
      <JiraWorkspace
        // Remounts on every tour stop change — any real interaction the
        // highlighted element allowed (sprint popover open, my-work filter
        // applied) is local component state inside the workspace, so a
        // fresh mount is what puts it back to its actual/default position
        // when she moves to the next stop.
        key={step === 'tour' ? `tour-${stopIndex}` : 'base'}
        learnerId={learnerId}
        learner={learner}
        showSidebar={false}
        showTabs={true}
        highlightTicketKey={ticket?.key ?? null}
        onExposeActions={setTicketActions}
        onLogout={onLogout}
        // Only her own avatar's filter click is real during this specific
        // stop — everyone else's is inert, so a click that lands slightly
        // off the tour's highlighted gap (or on a neighboring avatar in the
        // overlapping stack) can't apply the wrong person's filter.
        restrictAssigneeFilterTo={
          step === 'tour' && STOPS[stopIndex]?.key === 'my-work' ? getLearnerName() : undefined
        }
        disableTopBarActions
      />
    ),
    [learnerId, learner, ticket?.key, onLogout, step, stopIndex],
  )

  const currentStop = STOPS[stopIndex]
  // When the real popover is open, position against the icon+popover
  // union — the card then lands below the popover instead of overlapping
  // it, and the click-through gap widens to cover the popover too so it
  // stays usable rather than getting dimmed/blocked like the rest of the
  // page.
  const combinedStopRect = popoverRect && stopRect ? unionOf([stopRect, popoverRect]) : stopRect
  const stopCardPos = positionFor(currentStop, combinedStopRect)
  // A manually-dragged position (calibrated with the popover closed) can't
  // know about the popover — using it while the popover is open would
  // silently undo the repositioning above and let the card cover the real
  // sprint info again. The freshly computed position always wins whenever
  // the popover is actually open; manual calibration only applies the rest
  // of the time.
  const effectiveStopCardPos = popoverRect ? stopCardPos : (manualPositions[stopIndex] ?? stopCardPos)
  // Aims the "top" arrow at the real highlighted element's actual center,
  // rather than a fixed pixel offset — a manually-dragged card position
  // (see manualPositions above) doesn't keep the element centered under it,
  // so a fixed offset only lined up by coincidence.
  const arrowLeft =
    stopRect && effectiveStopCardPos
      ? Math.min(CARD_WIDTH - 24, Math.max(16, stopRect.left + stopRect.width / 2 - effectiveStopCardPos.left - 6))
      : 24

  return (
    <div
      className="relative min-h-screen"
      style={{ paddingLeft: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
    >
      <style>{`
        @keyframes tourGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35); }
          50% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        }
        .tour-glow { animation: tourGlow 1.6s ease-in-out infinite; }
        .tour-spotlight { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.25); }
        .tour-help-glow { box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.7); }

        /* Tighter pulse for the avatar circle specifically — tourGlow's
           ripple expands 10px past the highlighted box, which bleeds into
           the neighboring team avatars sitting right next to hers in the
           stack, making it look like all of them are highlighted together.
           This one stays inside a couple px of the ring itself instead. */
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.7); }
          50% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35); }
        }
        .avatar-pulse { animation: avatarPulse 1.6s ease-in-out infinite; }
      `}</style>

      <ModuleProgressBar
        moduleNumber={4}
        title="Boards & Sprints"
        onLogout={onLogout}
        collapsed={panelCollapsed}
        onToggleCollapsed={togglePanelCollapsed}
        hideEarlierProgress={isReplay}
        onSelectModule={onSelectModule}
        onBackToWorkspace={onBackToWorkspace}
        onChooseModule={onChooseModule}
      />

      {workspace}

      {step === 'intro' && ticket && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-white dark:bg-gray-800`}>
            <div
              className="relative flex-shrink-0 select-none"
              style={{
                width: introImageResize.size,
                height: introImageResize.size,
                transform: `translate(${introImageDrag.offset.left}px, ${introImageDrag.offset.top}px)`,
              }}
            >
              <img src={boardViewImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                A few more things on this board worth knowing.
              </p>
              <button
                type="button"
                onClick={startTour}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'tour' && stopRect && (
        <>
          {currentStop.blockRealClicks ? (
            // Recognition-only stop — no gap at all, the highlighted
            // element itself must not be clickable either.
            <div className="fixed inset-0 z-50" />
          ) : (
            // Four blocking strips tiling everything OUTSIDE combinedStopRect
            // (the icon, plus its real popover once open), so nothing else
            // on the page (e.g. the real Sprint tab) can be clicked during
            // this stop — only the true gap left over the highlighted
            // element (and its popover) lets a real click reach it.
            <>
              <div
                className="fixed inset-x-0 top-0 z-50"
                style={{ height: Math.max(0, combinedStopRect.top) }}
              />
              <div className="fixed inset-x-0 bottom-0 z-50" style={{ top: combinedStopRect.bottom }} />
              <div
                className="fixed left-0 z-50"
                style={{
                  top: combinedStopRect.top,
                  height: combinedStopRect.height,
                  width: Math.max(0, combinedStopRect.left),
                }}
              />
              <div
                className="fixed right-0 z-50"
                style={{ top: combinedStopRect.top, height: combinedStopRect.height, left: combinedStopRect.right }}
              />
            </>
          )}
          <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className={`tour-help-glow pointer-events-none absolute ${currentStop.key === 'my-work' ? 'avatar-pulse' : 'tour-glow'} ${currentStop.ringClassName}`}
            style={
              currentStop.key === 'my-work'
                ? // Forced square, centered on the avatar's real center —
                  // the overlapping avatar stack (-ml-2, each with its own
                  // white separator ring) made a plain width+4/height+4 box
                  // read as an off-center oval instead of a clean circle
                  // around just her own avatar.
                  (() => {
                    const size = Math.max(stopRect.width, stopRect.height) + 8
                    return {
                      top: stopRect.top + stopRect.height / 2 - size / 2,
                      left: stopRect.left + stopRect.width / 2 - size / 2,
                      width: size,
                      height: size,
                    }
                  })()
                : {
                    top: stopRect.top - 2,
                    left: stopRect.left - 2,
                    width: stopRect.width + 4,
                    height: stopRect.height + 4,
                  }
            }
          />
          {effectiveStopCardPos && (
            <div
              className={[
                'pointer-events-auto absolute flex items-center gap-3',
                // Only while it's settling into a computed position (e.g.
                // moving to make room for the sprint popover) — animating
                // this during an actual drag would lag a frame behind the
                // pointer, fighting the rAF-batched updates above instead
                // of tracking the cursor directly.
                isDraggingCard ? '' : 'transition-[top,left] duration-200 ease-out',
              ].join(' ')}
              style={{ top: effectiveStopCardPos.top, left: effectiveStopCardPos.left }}
            >
              <div
                className="relative w-max max-w-xs select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <PointerArrow direction={currentStop.arrow} left={arrowLeft} />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentStop.text}</p>
              </div>
              <SplitStepButton
                onBack={previousStop}
                onNext={nextStop}
                canGoBack={stopIndex > 0}
                isLast={stopIndex === STOPS.length - 1}
              />
            </div>
          )}
          </div>
        </>
      )}

      {step === 'complete-sprint-note' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-white dark:bg-gray-800`}>
            <div className="flex-shrink-0 select-none" style={{ width: 260, height: 260 }}>
              <img src={niceWorkImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Nice work — you know your way around the board now.
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="mt-6 rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
