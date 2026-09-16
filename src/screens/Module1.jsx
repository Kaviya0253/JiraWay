import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import JiraWorkspace from '../components/JiraWorkspace'
import ModuleProgressBar, {
  useModulePanelCollapsed,
  MODULE_PANEL_WIDTH,
  MODULE_PANEL_WIDTH_COLLAPSED,
} from '../components/ModuleProgressBar'
import module1Image from '../assets/module1.svg'
import module1EndImage from '../assets/module 1-end.svg'
import SplitStepButton from '../components/SplitStepButton'
import { loadState, saveState, recordFirstAction } from '../utils/localStorage'
import { INTRO_CARD_CLASSNAME } from '../constants/introCard'
import { INTRO_IMAGE_FIT_SIZE } from '../components/ImageSizeIndicator'

const INTRO_IMAGE_POSITION_KEY = 'jiraway-module1-intro-image-position'
const INTRO_IMAGE_SIZE_KEY = 'jiraway-module1-intro-image-size'
const INTRO_IMAGE_DEFAULT_SIZE = 160
const INTRO_IMAGE_MIN_SIZE = 60
// Capped at the card's fixed available space — the card itself is a fixed
// h-80 (see constants/introCard.js), so an image can never resize past this
// without the card having to grow taller than every other module's.
const INTRO_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE

const END_IMAGE_POSITION_KEY = 'jiraway-module1-end-image-position'
const END_IMAGE_SIZE_KEY = 'jiraway-module1-end-image-size'
const END_IMAGE_DEFAULT_SIZE = 160
const END_IMAGE_MIN_SIZE = 60
const END_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE

// Drag-to-calibrate the intro image's position — a plain pixel offset, not
// anchored to any page element (this is a static centered modal, nothing on
// the real page to spotlight). Saved to localStorage immediately on release,
// same pattern as every other drag-to-calibrate element in this app.
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

const HIGHLIGHT_DURATION_MS = 1500
const ASSIGNEE_AVATAR_SELECTOR = '[data-tour="ticket-card"] [data-tour="ticket-assignee"]'
const ASSIGNEE_DROPDOWN_SELECTOR = '[data-tour="assignee-dropdown"]'
const TOUR_CARD_OFFSETS_KEY = 'jiraway-module1-tour-card-offsets'

const TOUR_STOPS = [
  {
    selectors: ['[data-tour="project-header"]'],
    text: "This is your project — everything you see here belongs to it.",
  },
  {
    selectors: ['[data-tour="tab-backlog"]'],
    text: "The Backlog shows work that hasn't been scheduled yet — waiting to be picked for a future sprint.",
  },
  {
    selectors: ['[data-tour="tab-board"]'],
    text: 'The Board shows work your team is actively doing right now — organized into To Do, In Progress, and Done.',
  },
  {
    selectors: ['[data-tour="board-column"]'],
    text: 'Each column is a stage of work — To Do, In Progress, or Done.',
    placement: 'right',
  },
  {
    selectors: ['[data-tour="ticket-card"]'],
    text: 'Each card is one ticket — a single piece of work, like a task or a bug.',
  },
  {
    selectors: [ASSIGNEE_AVATAR_SELECTOR, ASSIGNEE_DROPDOWN_SELECTOR],
    text: "This shows who it's assigned to — like Yavika or Arun.",
    triggerSelector: ASSIGNEE_AVATAR_SELECTOR,
    separateHighlights: true,
  },
  {
    id: 'teams',
    selectors: ['[data-tour="teams-nav"]', '[data-tour="team-list"]'],
    text: "Here's your whole team — Karthik (your team lead), Yavika, and Arun.",
    triggerSelector: '[data-tour="teams-nav"]',
    separateHighlights: true,
    // Position the card off the team grid (index 1), not the union with the
    // Teams nav link (index 0) way over in the sidebar — see the comment on
    // positionRect above.
    positionRectIndex: 1,
    // No longer draggable — the manual offset calibrated while it was is
    // still applied (see displayCardPos), so the card stays exactly where
    // it was left.
  },
  {
    selectors: ['[data-tour="profile-avatar"]'],
    text: "That's you.",
  },
  {
    selectors: ['[data-tour="create-button"]'],
    text: 'This is the Create button — click it whenever there\'s new work to add, like a new ticket.',
  },
]

const CARD_WIDTH = 320
const CARD_HEIGHT_ESTIMATE = 56
const BUTTON_WIDTH = 84
const BUTTON_HEIGHT = 34
const BUTTON_GAP = 10
const CARD_MARGIN = 28

function measureRects(selectors) {
  return selectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean)
    .map((el) => el.getBoundingClientRect())
}

function unionOf(rects) {
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return { top, left, right, bottom, width: right - left, height: bottom - top }
}

function cardPositionFor(rect, cardWidth, cardHeight, placement = 'auto') {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const groupWidth = cardWidth + BUTTON_GAP + BUTTON_WIDTH

  if (placement === 'right' && rect.right + CARD_MARGIN + groupWidth <= viewportWidth - CARD_MARGIN) {
    const top = Math.max(CARD_MARGIN, Math.min(rect.top, viewportHeight - cardHeight - CARD_MARGIN))
    return { top, left: rect.right + CARD_MARGIN }
  }

  let top = rect.bottom + CARD_MARGIN
  if (top + cardHeight > viewportHeight) {
    top = rect.top - cardHeight - CARD_MARGIN
  }
  top = Math.max(CARD_MARGIN, Math.min(top, viewportHeight - cardHeight - CARD_MARGIN))

  let left = rect.left + rect.width / 2 - cardWidth / 2
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - groupWidth - CARD_MARGIN))

  return { top, left }
}

// Button sits to the right of the card, vertically centered on its real
// (measured) height — falls back below only if there's no room to the right.
function buttonPositionFor(cardPos, cardWidth, cardHeight) {
  if (!cardPos) return null
  const viewportWidth = window.innerWidth
  const rightEdge = cardPos.left + cardWidth + BUTTON_GAP + BUTTON_WIDTH

  if (rightEdge <= viewportWidth - CARD_MARGIN) {
    return {
      top: cardPos.top + (cardHeight - BUTTON_HEIGHT) / 2,
      left: cardPos.left + cardWidth + BUTTON_GAP,
    }
  }
  return {
    top: cardPos.top + cardHeight + BUTTON_GAP,
    left: cardPos.left + cardWidth - BUTTON_WIDTH,
  }
}

export default function Module1({ learnerId, learner, onComplete, onLogout, isReplay = false, onSelectModule, onBackToWorkspace, onChooseModule, welcomeMessage }) {
  const [panelCollapsed, togglePanelCollapsed] = useModulePanelCollapsed()
  const introImageDrag = useDraggableOffset(INTRO_IMAGE_POSITION_KEY)
  const introImageResize = useResizableSize(INTRO_IMAGE_SIZE_KEY, INTRO_IMAGE_DEFAULT_SIZE, INTRO_IMAGE_MIN_SIZE, INTRO_IMAGE_MAX_SIZE)
  const endImageDrag = useDraggableOffset(END_IMAGE_POSITION_KEY)
  const endImageResize = useResizableSize(END_IMAGE_SIZE_KEY, END_IMAGE_DEFAULT_SIZE, END_IMAGE_MIN_SIZE, END_IMAGE_MAX_SIZE)
  const [step, setStep] = useState('intro')
  // Time-to-first-action tracking for the admin Learners list — how long
  // between this module mounting and her first real step past the intro
  // screen (a proxy for hesitation vs. confidence). Fires once per mount;
  // replaying the module re-mounts it, so a fresh attempt gets a fresh
  // reading rather than keeping whatever the first pass recorded.
  const moduleMountTimeRef = useRef(Date.now())
  const firstActionRecordedRef = useRef(false)
  useEffect(() => {
    if (step === 'intro' || firstActionRecordedRef.current) return
    firstActionRecordedRef.current = true
    recordFirstAction(learnerId, 'module1', Date.now() - moduleMountTimeRef.current)
  }, [step, learnerId])
  const [tourIndex, setTourIndex] = useState(0)
  const [highlightRects, setHighlightRects] = useState([])
  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: CARD_HEIGHT_ESTIMATE })
  const cardRef = useRef(null)
  // No stop is draggable right now, but a stop's calibrated offset (from
  // when it was) is still applied — see displayCardPos below. Keyed by the
  // stop's own stable `id`, not tourIndex — an index-keyed version of this
  // same idea previously broke silently the moment TOUR_STOPS got reordered.
  const [cardOffsets] = useState(() => loadState(TOUR_CARD_OFFSETS_KEY, {}))
  // Ground truth for which trigger (if any) is actually open right now —
  // NOT inferred from "click the same trigger again on cleanup to toggle it
  // back". That symmetric click assumption quietly breaks under fast or
  // backward navigation (a stale querySelector result, an effect cleanup
  // racing the next one), leaving the assignee dropdown or the Teams page
  // open when it shouldn't be, or closed when it should be open — the same
  // class of bug Module 2's help walkthrough had, fixed there the same way.
  const openTriggerRef = useRef(null)

  function handleTap() {
    if (step !== 'beat0-prompt') return
    setStep('beat0-highlighting')
  }

  useEffect(() => {
    if (step !== 'beat0-highlighting') return
    const timer = setTimeout(() => setStep('beat0-reveal'), HIGHLIGHT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'tour') return
    const stop = TOUR_STOPS[tourIndex]

    function measure() {
      setHighlightRects(measureRects(stop.selectors))
    }

    // Close whatever's actually open (per the ground-truth ref, not an
    // assumption about direction) if this stop doesn't want it — covers
    // both "moved to a stop with a different trigger" and "moved to a stop
    // with no trigger at all".
    const hadDifferentTriggerOpen = openTriggerRef.current && openTriggerRef.current !== stop.triggerSelector
    if (hadDifferentTriggerOpen) {
      document.querySelector(openTriggerRef.current)?.click()
      openTriggerRef.current = null
    }

    // Some stops need something clicked open first — the assignee dropdown,
    // or the real Teams nav link (which swaps the whole board out for the
    // Team page). Only clicks it open if it isn't already (the close above
    // already cleared anything stale, so reaching here with the same
    // trigger already set means it's genuinely already open).
    const needsOpen = Boolean(stop.triggerSelector) && openTriggerRef.current !== stop.triggerSelector

    function openNewTrigger() {
      if (!needsOpen) return
      document.querySelector(stop.triggerSelector)?.click()
      openTriggerRef.current = stop.triggerSelector
    }

    // The close above (if it happened) triggers an async React state
    // update — e.g. swapping the Team page back to the Board — so the new
    // trigger's own element (the assignee avatar, say) may not exist in the
    // DOM again for a render pass or two. Clicking it in the very same tick
    // can silently hit nothing, leaving this ref believing something's open
    // that never actually opened. Deferring the open past a frame (only
    // needed when something else just closed first) gives that render a
    // chance to land before this tries to click the new trigger.
    let openRaf = null
    if (needsOpen && hadDifferentTriggerOpen) {
      openRaf = requestAnimationFrame(openNewTrigger)
    } else {
      openNewTrigger()
    }

    measure()
    const raf = requestAnimationFrame(measure) // re-measure once the triggered content has actually mounted
    // Defense-in-depth on top of the rAF above — opening a dropdown or
    // swapping to the Team page can take a render pass longer than one rAF
    // to actually land in the DOM, which left the highlight measuring
    // nothing (and so not showing) on some Back/Next presses.
    const settleTimer = needsOpen ? setTimeout(measure, 350) : null
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      if (openRaf != null) cancelAnimationFrame(openRaf)
      if (settleTimer) clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
    }
  }, [step, tourIndex])

  // Closes anything still open the moment she leaves the tour entirely
  // (finishing it, or navigating away) — the per-stop effect above only
  // closes a trigger when moving to a DIFFERENT stop, not when the tour
  // ends altogether.
  useEffect(() => {
    if (step === 'tour') return
    if (openTriggerRef.current) {
      document.querySelector(openTriggerRef.current)?.click()
      openTriggerRef.current = null
    }
  }, [step])

  function nextTourStop() {
    if (tourIndex < TOUR_STOPS.length - 1) {
      setTourIndex((i) => i + 1)
    } else {
      setStep('complete')
    }
  }

  function previousTourStop() {
    if (tourIndex > 0) {
      setTourIndex((i) => i - 1)
    }
  }

  const beat0Active = step === 'beat0-prompt' || step === 'beat0-highlighting' || step === 'beat0-reveal'
  const currentStop = step === 'tour' ? TOUR_STOPS[tourIndex] : null
  const highlightUnion = step === 'tour' ? unionOf(highlightRects) : null
  const holes = currentStop?.separateHighlights ? highlightRects : highlightUnion ? [highlightUnion] : []
  // Card position anchors to a single rect, chosen via positionRectIndex when
  // a stop's selectors point at two things far apart (e.g. the Teams nav
  // link plus the whole team grid) — unioning both for positioning produces
  // an oversized box that pushes the card away from where it actually reads
  // well. Rings/holes above are unaffected, still built from every selector.
  const positionRect =
    currentStop?.positionRectIndex != null ? highlightRects[currentStop.positionRectIndex] ?? null : highlightUnion
  const cardPos =
    step === 'tour' ? cardPositionFor(positionRect, cardSize.width, cardSize.height, currentStop.placement) : null
  // A saved manual offset (from when the Teams stop was still draggable)
  // wins over the computed position when present — applied regardless of
  // whether dragging is currently enabled, so turning `draggable` back off
  // freezes the card exactly where it was last left, not back to computed.
  const displayCardPos = (currentStop?.id ? cardOffsets[currentStop.id] : null) ?? cardPos
  const buttonPos = step === 'tour' ? buttonPositionFor(displayCardPos, cardSize.width, cardSize.height) : null

  // Re-measures the card's real rendered size only when the stop changes
  // (its text is the only thing that changes its size) — NOT on every
  // render, otherwise sub-pixel rounding during drag (fractional top/left)
  // makes this fire forever: measure → tiny float diff → setState → render
  // → measure again, an infinite loop that eventually crashes the page.
  useLayoutEffect(() => {
    if (step !== 'tour' || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    if (rect.width) setCardSize({ width: rect.width, height: rect.height })
  }, [step, tourIndex])

  // Dragging updates Module1's own state dozens of times a second, which
  // would otherwise re-render this entire (heavy) subtree every time too.
  // Memoizing it keeps the same element reference across those re-renders,
  // so React skips re-rendering the real workspace while you're dragging.
  const workspace = useMemo(
    () => (
      <JiraWorkspace
        learnerId={learnerId}
        learner={learner}
        showSidebar={true}
        showTabs={true}
        onLogout={onLogout}
        disableTopBarActions
      />
    ),
    [learnerId, learner, onLogout],
  )

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

        /* Soft static blue glow drawn around each highlighted piece — the dim
           cutout itself is handled by the SVG mask below, not box-shadow,
           since a stop can highlight more than one piece at once. */
        .tour-spotlight-glow {
          box-shadow: 0 0 14px 2px rgba(37, 99, 235, 0.45);
        }

        /* A slow "breathing" outline for the message card — distinct from the
           expanding-ring tour-glow used elsewhere, so this reads as its own thing. */
        @keyframes tourBreathe {
          0%, 100% { border-color: rgba(37, 99, 235, 0.35); box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.15); }
          50% { border-color: rgba(37, 99, 235, 0.9); box-shadow: 0 4px 20px -2px rgba(37, 99, 235, 0.35); }
        }
        .tour-breathe { animation: tourBreathe 2.2s ease-in-out infinite; }

        /* A quick little "pop" a moment after each new stop's card appears,
           layered on top of the ongoing breathe pulse — two animations on
           one element, so both need to be in the same declaration or the
           second class would just override the first instead of adding to it.
           "backwards" holds the 0% (shrunk) state through the delay so it
           doesn't jump the instant the delay ends. */
        @keyframes tourBump {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .tour-bump { animation: tourBreathe 2.2s ease-in-out infinite, tourBump 0.3s ease-out 250ms backwards; }

        @keyframes tourDropdownIn {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        [data-tour="assignee-dropdown"] { animation: tourDropdownIn 0.2s ease-out; }
      `}</style>

      <ModuleProgressBar
        moduleNumber={1}
        title="Orientation"
        onLogout={onLogout}
        collapsed={panelCollapsed}
        onToggleCollapsed={togglePanelCollapsed}
        hideEarlierProgress={isReplay}
        onSelectModule={onSelectModule}
        onBackToWorkspace={onBackToWorkspace}
        onChooseModule={onChooseModule}
      />

      {workspace}

      {step === 'intro' && (
        <div
          className={[
            'fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6',
            // Extra breathing room only while the welcome toast is also up —
            // it's a separate message (the toast) from this card's own
            // "Welcome to JiraWay" heading, and centered-vertically they sat
            // close enough to touch. Nudges the card down instead of
            // shrinking or removing either one.
            welcomeMessage ? 'pt-20' : '',
          ].join(' ')}
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
              <img src={module1Image} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {welcomeMessage && (
                  <span className="text-2xl text-blue-600 dark:text-blue-400">{welcomeMessage} </span>
                )}
                <span className={welcomeMessage ? 'mt-1 block text-lg' : 'text-2xl'}>
                  Let's take a look at your team's workspace.
                </span>
              </p>
              <button
                type="button"
                onClick={() => setStep('beat0-prompt')}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Click to start
              </button>
            </div>
          </div>
        </div>
      )}

      {beat0Active && (
        <div
        className="fixed inset-y-0 right-0 z-50"
        style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        onClick={step === 'beat0-prompt' ? handleTap : undefined}
      >
          {(step === 'beat0-prompt' || step === 'beat0-reveal') && (
            <div className="absolute inset-0 bg-black/40" />
          )}

          {step === 'beat0-highlighting' && (
            <div className="tour-glow pointer-events-none absolute inset-x-3 bottom-3 top-14 rounded-lg border-2 border-blue-500" />
          )}

          {(step === 'beat0-prompt' || step === 'beat0-reveal') && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-6">
              <div
                className={[
                  'tour-glow pointer-events-auto w-full max-w-md rounded-lg border-2 p-5 text-center shadow-lg',
                  step === 'beat0-reveal'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                    : 'border-blue-400 bg-white dark:border-blue-600 dark:bg-gray-900',
                ].join(' ')}
              >
                {step === 'beat0-prompt' && (
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Click here to explore the workspace
                  </p>
                )}
                {step === 'beat0-reveal' && (
                  <>
                    <p className="text-base font-medium text-blue-900 dark:text-blue-100">
                      This is your team's Jira workspace — where all their work lives, gets tracked, and moves forward together.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep('tour')}
                      className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'tour' && (
        <div className="fixed inset-0 z-50">
          {holes.length > 0 ? (
            <>
              {/* One SVG mask dims the whole screen except a hole per highlighted
                  piece — so a stop can spotlight two separate things (like the
                  avatar and the dropdown) without either leaking dimness onto
                  the other, which stacked box-shadow cutouts can't do cleanly. */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <mask id="tour-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {holes.map((r, index) => (
                      <rect
                        key={index}
                        x={r.left - 6}
                        y={r.top - 6}
                        width={r.width + 12}
                        height={r.height + 12}
                        rx="10"
                        fill="black"
                      />
                    ))}
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="black" fillOpacity="0.3" mask="url(#tour-mask)" />
              </svg>

              {holes.map((r, index) => (
                <div
                  key={index}
                  className="tour-spotlight-glow pointer-events-none absolute rounded-lg"
                  style={{ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 }}
                />
              ))}
            </>
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}

          {/* Message card — position frozen at whatever was last calibrated
              (or computed fresh, for stops with no saved offset). No longer
              draggable for any stop.
              The bump/breathe animation lives on the INNER div, not this one —
              a scale() transform changes what getBoundingClientRect() reports,
              so animating the same element we measure for positioning would
              feed a briefly-shrunk size into the button-placement math. This
              outer wrapper stays untransformed and is what we actually measure. */}
          <div
            ref={cardRef}
            className="pointer-events-auto absolute w-max max-w-xs select-none"
            style={
              displayCardPos
                ? { top: displayCardPos.top, left: displayCardPos.left }
                : { bottom: 24, left: `calc(50% - ${(BUTTON_GAP + BUTTON_WIDTH) / 2}px)` }
            }
          >
            <div key={tourIndex} className="tour-bump rounded-lg border-2 bg-blue-50 p-3 shadow-lg dark:bg-blue-950">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {TOUR_STOPS[tourIndex].text}
              </p>
            </div>
          </div>

          {/* Split circle — left half Back, right half Next/Done. One
              element where Next used to sit alone, so no separate mirrored
              position for Back is needed any more. */}
          <div
            className="absolute"
            style={
              buttonPos
                ? { top: buttonPos.top, left: buttonPos.left }
                : { bottom: 24 + (BUTTON_HEIGHT - 34) / 2, left: `calc(50% + ${CARD_WIDTH / 2 + BUTTON_GAP}px)` }
            }
          >
            <SplitStepButton
              onBack={previousTourStop}
              onNext={nextTourStop}
              canGoBack={tourIndex > 0}
              isLast={tourIndex === TOUR_STOPS.length - 1}
            />
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-gray-100 dark:bg-gray-800`}>
            <div
              className="relative flex-shrink-0 select-none"
              style={{
                width: endImageResize.size,
                height: endImageResize.size,
                transform: `translate(${endImageDrag.offset.left}px, ${endImageDrag.offset.top}px)`,
              }}
            >
              <img src={module1EndImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                You've learned to read a Jira screen with confidence. Everything from here
                builds on that.
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
