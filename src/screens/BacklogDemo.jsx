import { useState, useEffect, useMemo, useRef } from 'react'
import JiraWorkspace from '../components/JiraWorkspace'
import ModuleProgressBar, {
  useModulePanelCollapsed,
  MODULE_PANEL_WIDTH,
  MODULE_PANEL_WIDTH_COLLAPSED,
} from '../components/ModuleProgressBar'
import useTicketStore from '../hooks/useTicketStore'
import { ChevronRightIcon } from '../components/workspace/icons'
import SplitStepButton from '../components/SplitStepButton'
import { loadState, saveState, recordFirstAction } from '../utils/localStorage'
import { INTRO_CARD_CLASSNAME, VIDEO_CARD_CLASSNAME } from '../constants/introCard'
import { INTRO_IMAGE_FIT_SIZE } from '../components/ImageSizeIndicator'
import introVideo from '../assets/before ticket reach you.mp4'
import seeItOnBoardImage from '../assets/see it on board.avif'
import backlogToSprintImage from '../assets/backlog to sprint.svg'
import finalImage from '../assets/last.svg'

// These position tweaks only correct how a few tour cards look on the
// deployed (production) build — locally they already render correctly, so
// gating them behind PROD keeps dev's already-correct layout untouched.
const IS_DEPLOYED_BUILD = import.meta.env.PROD

const INTRO_VIDEO_POSITION_KEY = 'jiraway-backlog-demo-intro-video-position'
const HIGHLIGHT_BACKLOG_CARD_POSITION_KEY = 'jiraway-backlog-demo-highlight-card-position'
const SPRINT_ACTION_CARD_POSITIONS_KEY = 'jiraway-backlog-demo-sprint-action-card-positions'
const DRAG_CARD_POSITION_KEY = 'jiraway-backlog-demo-drag-card-position'
const BOARD_CARD_POSITION_KEY = 'jiraway-backlog-demo-board-card-position'
const CREATE_SPRINT_CARD_POSITION_KEY = 'jiraway-backlog-demo-create-sprint-card-position'
const SPRINT_INTRO_CARD_POSITION_KEY = 'jiraway-backlog-demo-sprint-intro-card-position'
const SPRINT_DATES_CARD_POSITION_KEY = 'jiraway-backlog-demo-sprint-dates-card-position'
const DRAG_NOTE_CARD_POSITION_KEY = 'jiraway-backlog-demo-drag-note-card-position'
const HIGHLIGHT_BACKLOG_CARD_WIDTH_KEY = 'jiraway-backlog-demo-highlight-card-width'
const CREATE_SPRINT_CARD_WIDTH_KEY = 'jiraway-backlog-demo-create-sprint-card-width'
const SPRINT_INTRO_CARD_WIDTH_KEY = 'jiraway-backlog-demo-sprint-intro-card-width'
const SPRINT_DATES_CARD_WIDTH_KEY = 'jiraway-backlog-demo-sprint-dates-card-width'
const DRAG_NOTE_CARD_WIDTH_KEY = 'jiraway-backlog-demo-drag-note-card-width'
const DRAG_CARD_WIDTH_KEY = 'jiraway-backlog-demo-drag-card-width'
const BOARD_CARD_WIDTH_KEY = 'jiraway-backlog-demo-board-card-width'
const RIPPLE_IMAGE_SIZE_KEY = 'jiraway-backlog-demo-ripple-image-size'
const RIPPLE_IMAGE_DEFAULT_SIZE = 192
const RIPPLE_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE
const COMPLETE_IMAGE_SIZE_KEY = 'jiraway-backlog-demo-complete-image-size'
const COMPLETE_IMAGE_DEFAULT_SIZE = 128
// Capped at the card's fixed available space — see Module1.jsx's identical
// comment on this same constant.
const COMPLETE_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE
const COMPLETE_IMAGE_POSITION_KEY = 'jiraway-backlog-demo-complete-image-position'
const RIPPLE_IMAGE_POSITION_KEY = 'jiraway-backlog-demo-ripple-image-position'
const EXPLORE_IMAGE_SIZE_KEY = 'jiraway-backlog-demo-explore-image-size'
const EXPLORE_IMAGE_DEFAULT_SIZE = 192
const EXPLORE_IMAGE_MAX_SIZE = INTRO_IMAGE_FIT_SIZE
const EXPLORE_IMAGE_POSITION_KEY = 'jiraway-backlog-demo-explore-image-position'
// The ripple image sits in a static, centered modal — not spotlighting a
// page element like every other draggable card here — so there's no real
// anchor rect to offset from. A fixed {top:0, left:0} anchor makes
// useDraggableCardOffset's stored offset behave as a plain pixel
// translate instead, which is all a free-floating drag needs.
const ZERO_RECT = { top: 0, left: 0 }
const SPRINT_ACTION_CARD_WIDTHS_KEY = 'jiraway-backlog-demo-sprint-action-card-widths'
const MIN_CARD_WIDTH = 140
const MAX_CARD_WIDTH = 520

const DEMO_TICKET_KEY = 'WEB-5'
// The field-by-field tour (Subtask/Epic/Story Points/Priority/Assignee) is
// anchored on WEB-3 instead — it's already sitting in the sprint, so the
// tour doesn't need WEB-5 dragged in first, and WEB-5 stays put in the
// Backlog until its own dedicated drag step right after.
const FIELD_TOUR_TICKET_KEY = 'WEB-3'
const TICKET_ROW_SELECTOR = '[data-tour="backlog-demo-ticket"]'
const BACKLOG_LIST_SELECTOR = '[data-tour="backlog-list"]'
const SPRINT_PANEL_SELECTOR = '[data-tour="sprint-panel"]'
const SPRINT_DATES_SELECTOR = '[data-tour="sprint-dates"]'
const CREATE_SPRINT_SELECTOR = '[data-tour="create-sprint-button"]'
const SPRINT_DROPZONE_SELECTOR = '[data-tour="sprint-dropzone"]'
const BOARD_TICKET_SELECTOR = '[data-tour="created-ticket"]'

const CARD_WIDTH = 260
const CARD_MARGIN = 16
const DAY_MS = 24 * 60 * 60 * 1000

// This video has no narration worth hearing — it plays silently on loop, so
// it just needs the Chrome cast/PiP hover overlay turned off
// (disableRemotePlaybackApi is JS-only, can't be set as a JSX prop).
function setupSilentVideo(el) {
  if (!el) return
  el.disableRemotePlaybackApi = true
}

// Drag-to-calibrate which part of the video shows through its object-cover
// crop — only the video's own internal framing moves, never the container
// around it. Saved to localStorage immediately on release so it survives
// reloads.
function useVideoPan(storageKey) {
  const [pan, setPan] = useState(() => loadState(storageKey, { x: 50, y: 50 }))
  const elRef = useRef(null)
  const dragRef = useRef(null)
  const rafRef = useRef(null)

  function onPointerDown(event) {
    dragRef.current = { startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event) {
    if (!dragRef.current || !elRef.current) return
    dragRef.current.lastX = event.clientX
    dragRef.current.lastY = event.clientY
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const drag = dragRef.current
      if (!drag || !elRef.current) return
      const { width, height } = elRef.current.getBoundingClientRect()
      const deltaXPercent = ((drag.lastX - drag.startX) / width) * 100
      const deltaYPercent = ((drag.lastY - drag.startY) / height) * 100
      setPan({
        x: Math.min(100, Math.max(0, drag.originX - deltaXPercent)),
        y: Math.min(100, Math.max(0, drag.originY - deltaYPercent)),
      })
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
    setPan((current) => {
      saveState(storageKey, current)
      return current
    })
  }

  return { pan, elRef, onPointerDown, onPointerMove, onPointerUp }
}

// Every stop shares one card width and one sentence style — a short,
// plain-English description of what the field is, matched in length to the
// subtask stop's message — so the walkthrough doesn't visually jump between
// differently-sized cards as she moves from field to field.
const SPRINT_ACTION_CARD_WIDTH = 260
const SPRINT_ACTION_STOPS = [
  {
    key: 'subtask',
    selector: '[data-tour="sprint-subtask"]',
    text: 'Subtasks break a ticket into smaller pieces of work. WEB-3 has one — click the icon to see it.',
    cardWidth: 220,
  },
  {
    key: 'epic',
    selector: '[data-tour="sprint-epic"]',
    text: 'Epic — groups related tickets under one bigger theme.',
    cardWidth: SPRINT_ACTION_CARD_WIDTH,
  },
  {
    key: 'status',
    selector: '[data-tour="sprint-status"]',
    text: 'Status shows where this ticket is right now — To Do, In Progress, or Done.',
    cardWidth: SPRINT_ACTION_CARD_WIDTH,
  },
  {
    key: 'story-points',
    selector: '[data-tour="sprint-story-points"]',
    text: 'Story Points show how big a task feels compared to others — not exact hours, just a rough size your team agrees on together.',
    cardWidth: SPRINT_ACTION_CARD_WIDTH,
  },
  {
    key: 'priority',
    selector: '[data-tour="sprint-priority"]',
    text: 'Priority shows how urgent this ticket is compared to the rest of the sprint.',
    cardWidth: SPRINT_ACTION_CARD_WIDTH,
  },
  {
    key: 'assignee',
    selector: '[data-tour="sprint-assignee"]',
    text: 'Assignee shows who\'s doing this ticket — set when it\'s picked up.',
    cardWidth: SPRINT_ACTION_CARD_WIDTH,
  },
]

// width defaults to CARD_WIDTH but can be overridden per-caller — a card
// that actually renders wider than CARD_WIDTH (e.g. Story Points' much
// longer message) would otherwise get clamped as if it were narrower than
// it really is, and run off the right edge of the screen.
// Every card in this module is nudged an extra 20px further left than its
// raw computed spot.
const LEFT_NUDGE = 20

// Reserves room for the card's own height (plus its Back/Next button) at
// the bottom of the viewport — without this, a tall highlighted rect (e.g.
// the whole Backlog list) could push `top` past the visible screen entirely,
// leaving the explanation and its Next button completely unreachable.
const CARD_BOTTOM_RESERVE = 140

function positionBelow(rect, width = CARD_WIDTH) {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  let left = rect.left + rect.width / 2 - width / 2 - LEFT_NUDGE
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - width - CARD_MARGIN))
  const top = Math.max(CARD_MARGIN, Math.min(rect.bottom + 12, window.innerHeight - CARD_BOTTOM_RESERVE))
  return { top, left }
}

// Same horizontal centering as positionBelow, but anchored to the top of the
// rect instead of the bottom — for a rect spanning a whole list/panel
// (Backlog, Sprint), rect.bottom sits far down the page and gets clamped to
// the middle of the viewport, which reads as "floating in the middle" rather
// than attached to the thing it's introducing.
function positionAtTop(rect, width = CARD_WIDTH) {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  let left = rect.left + rect.width / 2 - width / 2 - LEFT_NUDGE
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - width - CARD_MARGIN))
  const top = Math.max(CARD_MARGIN, Math.min(rect.top + 12, window.innerHeight - CARD_BOTTOM_RESERVE))
  return { top, left }
}

// For the sprint-action fields specifically — their real controls (Epic,
// Priority, Assignee) each open a dropdown directly below themselves, so a
// message card placed below would sit right on top of it once opened. Left
// of the field instead, clamped so it never goes past the screen edge.
function positionLeftOf(rect, width = CARD_WIDTH) {
  if (!rect) return null
  const left = Math.max(CARD_MARGIN, rect.left - width - 12 - LEFT_NUDGE)
  return { top: rect.top, left }
}

function unionOf(rects) {
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return { top, left, right, bottom, width: right - left, height: bottom - top }
}

// Four strips tiling everything OUTSIDE `hole`, so nothing else on the real
// workspace (other tabs, other tickets, other fields) can be clicked during
// a recognition-only stop — only the highlighted element itself stays
// interactive. Each stop's own wrapper is pointer-events-none (so the
// message card can opt back in individually), which on its own leaves the
// entire real page underneath fully clickable — this is the actual blocker.
// Not used on 'drag' (needs the whole area free for a real drag gesture) or
// 'highlight-backlog' (full-width strips would also block wheel/trackpad
// scrolling on the real Backlog list sitting right underneath them).
function TourClickBlocker({ hole }) {
  if (!hole) return null
  return (
    <>
      <div className="pointer-events-auto fixed inset-x-0 top-0" style={{ height: Math.max(0, hole.top) }} />
      <div className="pointer-events-auto fixed inset-x-0 bottom-0" style={{ top: hole.bottom }} />
      <div
        className="pointer-events-auto fixed left-0"
        style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }}
      />
      <div
        className="pointer-events-auto fixed right-0"
        style={{ top: hole.top, height: hole.height, left: hole.right }}
      />
    </>
  )
}

// A full-page click-blocker (no hole) still needs to let real scrolling
// through — a plain pointer-events-auto div swallows wheel/trackpad input
// the same way it swallows clicks, since the browser hit-tests the topmost
// element either way, leaving the real (internally-scrollable) Backlog list
// stuck wherever it happened to be when the step started. Forwarding the
// wheel delta straight to that real scroll container keeps scrolling working
// without opening up any real clicks.
function forwardWheelToBacklogScroll(event) {
  // Without this, the browser still tries its own default wheel handling
  // alongside the manual scrollBy below (React's onWheel doesn't suppress
  // it on its own) — the two fighting over the same scroll produced the
  // jumpy/shaky feel, since the page could shift slightly on top of the
  // manual scroll rather than only the real list moving.
  event.preventDefault()
  const scrollEl = document.querySelector('[data-tour="backlog-scroll-area"]')
  scrollEl?.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: 'smooth' })
}

// Touch equivalent of the wheel forwarder above — the same full-screen
// blocking overlay that swallows wheel scrolling also swallows a touch-drag
// scroll (trackpad or touchscreen), which was leaving the real Backlog list
// stuck exactly where it was during these tour steps, with no way to scroll
// it at all on a touch input. Tracked as a plain module-level value (these
// are plain functions, not hooks) rather than animated — a touch drag needs
// to track the finger 1:1, not lag behind a smooth-scroll animation.
let lastTouchY = null

function forwardTouchStartToBacklogScroll(event) {
  lastTouchY = event.touches[0]?.clientY ?? null
}

function forwardTouchMoveToBacklogScroll(event) {
  if (lastTouchY == null) return
  const currentY = event.touches[0]?.clientY
  if (currentY == null) return
  event.preventDefault()
  const deltaY = lastTouchY - currentY
  lastTouchY = currentY
  const scrollEl = document.querySelector('[data-tour="backlog-scroll-area"]')
  scrollEl?.scrollBy({ top: deltaY })
}

// Blocks real clicks on the sticky header (search bar, tabs, toolbar,
// avatars, Filter) during every tour step — a sibling of the clipped
// overlay below, not inside it, since clip-path excludes its own clipped
// region from hit-testing too. Without this separate strip, clipping the
// main overlay so the header shows through correctly also accidentally
// left it clickable, letting her navigate away (e.g. to the Board tab)
// mid-explanation. Fully invisible — the header still renders normally,
// it just can't be clicked while a tour step is up.
function HeaderClickBlocker({ headerBottom }) {
  return <div className="pointer-events-auto fixed inset-x-0 top-0 z-50" style={{ height: headerBottom }} />
}

// Every step whose own overlay is clipped at headerBottom (see each step's
// `clipPath` below) — kept as one shared list so the single
// HeaderClickBlocker render above stays in sync with them, instead of
// needing its own copy threaded into each individual step block.
const HEADER_CLIPPED_STEPS = [
  'highlight-backlog',
  'create-sprint',
  'sprint-intro',
  'sprint-dates',
  'drag-note',
  'drag',
  'moved',
  'sprint-actions',
  'board',
]

// Shared drag-to-calibrate hook for a message card anchored to a real
// element's position — stores an OFFSET from that element (not an absolute
// screen position), so the card keeps following the element on scroll
// instead of staying pinned to a fixed spot on the page. Saved to
// localStorage immediately on release so it survives reloads.
function useDraggableCardOffset(storageKey, anchorRect) {
  const [offset, setOffset] = useState(() => loadState(storageKey, null))
  const dragRef = useRef(null)
  const rafRef = useRef(null)

  function onPointerDown(event) {
    if (!anchorRect) return
    const rect = event.currentTarget.getBoundingClientRect()
    const currentOffset = offset ?? { top: rect.top - anchorRect.top, left: rect.left - anchorRect.left }
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: currentOffset.top,
      originLeft: currentOffset.left,
    }
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

// Drag-to-calibrate a message card's own width — grab the handle on its
// right edge and drag sideways. Saved to localStorage immediately on
// release, same pattern as the position/offset calibration above.
function useResizableCardWidth(storageKey, defaultWidth, maxWidth = MAX_CARD_WIDTH, minWidth = MIN_CARD_WIDTH) {
  const [width, setWidth] = useState(() => loadState(storageKey, defaultWidth))
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef(null)
  const rafRef = useRef(null)

  function onPointerDown(event) {
    // Stop this from also triggering the card's own move-drag handler,
    // which sits on the same element and would otherwise fire alongside it.
    event.stopPropagation()
    setIsResizing(true)
    dragRef.current = { startX: event.clientX, originWidth: width }
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
      const next = drag.originWidth + (drag.lastX - drag.startX)
      setWidth(Math.min(maxWidth, Math.max(minWidth, next)))
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
    setWidth((current) => {
      saveState(storageKey, current)
      return current
    })
  }

  return { width, isResizing, onPointerDown, onPointerMove, onPointerUp }
}

export default function BacklogDemo({ learnerId, learner, onComplete, onLogout, isReplay = false, onSelectModule, onBackToWorkspace, onChooseModule }) {
  const [panelCollapsed, togglePanelCollapsed] = useModulePanelCollapsed()
  const [step, setStep] = useState('intro')
  // Time-to-first-action tracking for the admin Learners list — see
  // Module1.jsx's identical hook for the full reasoning.
  const moduleMountTimeRef = useRef(Date.now())
  const firstActionRecordedRef = useRef(false)
  useEffect(() => {
    if (step === 'intro' || firstActionRecordedRef.current) return
    firstActionRecordedRef.current = true
    recordFirstAction(learnerId, 'backlog-demo', Date.now() - moduleMountTimeRef.current)
  }, [step, learnerId])
  const [ticketRect, setTicketRect] = useState(null)
  const [backlogListRect, setBacklogListRect] = useState(null)
  const [sprintPanelRect, setSprintPanelRect] = useState(null)
  const [sprintDatesRect, setSprintDatesRect] = useState(null)
  const [createSprintRect, setCreateSprintRect] = useState(null)
  const [dropZoneRect, setDropZoneRect] = useState(null)
  const [boardTicketRect, setBoardTicketRect] = useState(null)
  // Bottom edge of the real sticky header (search bar, tabs, toolbar) — used
  // to clip the tour overlay below, so its highlight ring and message card
  // get hidden behind the header the same way a real scrolled ticket row
  // does, instead of the overlay's own z-50 painting over it.
  const [headerBottom, setHeaderBottom] = useState(0)
  const dragCardDrag = useDraggableCardOffset(DRAG_CARD_POSITION_KEY, dropZoneRect)
  const boardCardDrag = useDraggableCardOffset(BOARD_CARD_POSITION_KEY, boardTicketRect)
  const createSprintCardDrag = useDraggableCardOffset(CREATE_SPRINT_CARD_POSITION_KEY, createSprintRect)
  const sprintIntroCardDrag = useDraggableCardOffset(SPRINT_INTRO_CARD_POSITION_KEY, sprintPanelRect)
  const sprintDatesCardDrag = useDraggableCardOffset(SPRINT_DATES_CARD_POSITION_KEY, sprintDatesRect)
  const dragNoteCardDrag = useDraggableCardOffset(DRAG_NOTE_CARD_POSITION_KEY, ticketRect)
  const highlightBacklogCardWidth = useResizableCardWidth(HIGHLIGHT_BACKLOG_CARD_WIDTH_KEY, CARD_WIDTH)
  const createSprintCardWidth = useResizableCardWidth(CREATE_SPRINT_CARD_WIDTH_KEY, CARD_WIDTH)
  const sprintIntroCardWidth = useResizableCardWidth(SPRINT_INTRO_CARD_WIDTH_KEY, CARD_WIDTH)
  const sprintDatesCardWidth = useResizableCardWidth(SPRINT_DATES_CARD_WIDTH_KEY, CARD_WIDTH)
  const dragNoteCardWidth = useResizableCardWidth(DRAG_NOTE_CARD_WIDTH_KEY, CARD_WIDTH)
  const dragCardWidth = useResizableCardWidth(DRAG_CARD_WIDTH_KEY, CARD_WIDTH)
  const boardCardWidth = useResizableCardWidth(BOARD_CARD_WIDTH_KEY, CARD_WIDTH)
  const rippleImageSize = useResizableCardWidth(RIPPLE_IMAGE_SIZE_KEY, RIPPLE_IMAGE_DEFAULT_SIZE, RIPPLE_IMAGE_MAX_SIZE)
  const rippleImageDrag = useDraggableCardOffset(RIPPLE_IMAGE_POSITION_KEY, ZERO_RECT)
  const completeImageSize = useResizableCardWidth(COMPLETE_IMAGE_SIZE_KEY, COMPLETE_IMAGE_DEFAULT_SIZE, COMPLETE_IMAGE_MAX_SIZE)
  const completeImageDrag = useDraggableCardOffset(COMPLETE_IMAGE_POSITION_KEY, ZERO_RECT)
  const exploreImageSize = useResizableCardWidth(EXPLORE_IMAGE_SIZE_KEY, EXPLORE_IMAGE_DEFAULT_SIZE, EXPLORE_IMAGE_MAX_SIZE)
  const exploreImageDrag = useDraggableCardOffset(EXPLORE_IMAGE_POSITION_KEY, ZERO_RECT)
  const introVideoPan = useVideoPan(INTRO_VIDEO_POSITION_KEY)
  const ticketStore = useTicketStore(learnerId)
  const activeSprintNumber = ticketStore.sprintNumbers[0] ?? null

  // JiraWorkspace mounts its OWN separate useTicketStore(learnerId) instance
  // internally (see JiraWorkspace.jsx) — a plain custom hook, not a shared
  // store, so it's independent React state from this component's own
  // ticketStore above. The actual drag-and-drop happens inside Backlog.jsx,
  // a child of JiraWorkspace's instance, so it mutates THAT copy — this
  // component's own ticketStore.allTickets never sees the change. Reading
  // allTickets back out via onExposeActions (the same mechanism Module 2/4
  // already use) is what lets demoTicket below reflect the real, live data
  // instead of going stale the moment she actually drags WEB-5 in.
  const [exposedActions, setExposedActions] = useState(null)
  const liveAllTickets = exposedActions?.allTickets ?? ticketStore.allTickets
  const demoTicket = liveAllTickets.find((ticket) => ticket.key === DEMO_TICKET_KEY) ?? null

  // Every step of this demo assumes WEB-5 starts out sitting in the Backlog
  // (the backlog highlight, the drag-note's "still waiting here" message,
  // the drag step itself). Ticket state persists per learner in
  // localStorage, so a learner replaying this demo after already dragging
  // WEB-5 into the sprint on a prior run would otherwise see it start there
  // instead — reset it back to the Backlog once on mount so the demo always
  // begins from the same state. Waits for exposedActions since the reset
  // must go through the SAME live ticketStore instance Backlog.jsx reads
  // from — moveToSprint on this component's own separate copy would silently
  // no-op as far as the actual displayed board/backlog is concerned.
  const hasResetDemoTicketRef = useRef(false)
  useEffect(() => {
    if (hasResetDemoTicketRef.current || !exposedActions) return
    hasResetDemoTicketRef.current = true
    if (demoTicket && demoTicket.sprint !== null) {
      exposedActions.moveToSprint(DEMO_TICKET_KEY, null)
    }
  }, [exposedActions, demoTicket])

  // TEMPORARY, for calibrating the "highlight-backlog" message card's
  // position — drag it wherever it should sit, saved to localStorage so it's
  // kept between reloads while deciding. Stored as an OFFSET from the
  // Backlog panel's own top-left (not an absolute screen position) — the
  // panel scrolls with the rest of the page, so an absolute position would
  // stay pinned to the screen and drift away from the highlight on scroll;
  // an offset re-anchors to the panel's current (re-measured-on-scroll)
  // position every render instead. Once the position is settled, tell
  // Claude to "fix" it: it'll bake the final offset into the JSX below as
  // fixed values and remove this whole drag setup.
  const [highlightCardOffset, setHighlightCardOffset] = useState(() =>
    loadState(HIGHLIGHT_BACKLOG_CARD_POSITION_KEY, null),
  )
  const highlightCardDragRef = useRef(null)
  const highlightCardDragRafRef = useRef(null)

  function handleHighlightCardPointerDown(event) {
    if (!backlogListRect) return
    const rect = event.currentTarget.getBoundingClientRect()
    const currentOffset = highlightCardOffset ?? {
      top: rect.top - backlogListRect.top,
      left: rect.left - backlogListRect.left,
    }
    highlightCardDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: currentOffset.top,
      originLeft: currentOffset.left,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleHighlightCardPointerMove(event) {
    if (!highlightCardDragRef.current) return
    highlightCardDragRef.current.lastX = event.clientX
    highlightCardDragRef.current.lastY = event.clientY
    if (highlightCardDragRafRef.current != null) return
    highlightCardDragRafRef.current = requestAnimationFrame(() => {
      highlightCardDragRafRef.current = null
      const drag = highlightCardDragRef.current
      if (!drag) return
      setHighlightCardOffset({
        top: drag.originTop + (drag.lastY - drag.startY),
        left: drag.originLeft + (drag.lastX - drag.startX),
      })
    })
  }

  function handleHighlightCardPointerUp(event) {
    highlightCardDragRef.current = null
    if (highlightCardDragRafRef.current != null) {
      cancelAnimationFrame(highlightCardDragRafRef.current)
      highlightCardDragRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setHighlightCardOffset((offset) => {
      saveState(HIGHLIGHT_BACKLOG_CARD_POSITION_KEY, offset)
      return offset
    })
  }

  // Spotlight WEB-5 wherever it currently sits (Backlog panel before the
  // drag, the sprint panel after it) and the sprint panel's drop zone, while
  // she's on the "drag" step. Both rects together become the click-blocking
  // hole below (ticket ∪ drop zone) — only the drag itself (source ticket to
  // drop target) stays possible; every other real control elsewhere is
  // blocked, same as the rest of this tour.
  useEffect(() => {
    if (step !== 'drag' && step !== 'drag-note') return

    // Unlike every other stop, this one never scrolled to its target before
    // measuring — it used to work by accident because the page was usually
    // already positioned near the ticket from an earlier step, but now that
    // several stops sit in between (create-sprint, sprint-intro,
    // sprint-dates, sprint-actions on WEB-3, which live elsewhere on the
    // page), the Backlog list can be left scrolled somewhere else entirely.
    const el = document.querySelector(TICKET_ROW_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const ticketEl = document.querySelector(TICKET_ROW_SELECTOR)
      const dropZoneEl = document.querySelector(SPRINT_DROPZONE_SELECTOR)
      setTicketRect(ticketEl ? ticketEl.getBoundingClientRect() : null)
      setDropZoneRect(dropZoneEl ? dropZoneEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    // The scrollIntoView above is smooth (animated), so its position keeps
    // changing for a few hundred ms after this effect runs — keep
    // remeasuring for a moment so the spotlight glides along with it instead
    // of being drawn at the pre-scroll position.
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // Tracks the real sticky header's bottom edge (everything above the
  // scrollable ticket list — search bar, tabs, toolbar) for the whole
  // duration of the tour, not just one step, since every step's overlay
  // needs to clip against it. Also re-measures on scroll — an overscroll/
  // rubber-band bounce can shift a sticky/fixed header a few px without
  // firing resize, and without this the cached value lags behind, opening a
  // visible gap between the header and the clip-path boundary during the
  // bounce.
  useEffect(() => {
    function measure() {
      const el = document.querySelector('[data-tour="backlog-scroll-area"]')
      setHeaderBottom(el ? el.getBoundingClientRect().top : 0)
    }
    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step, panelCollapsed])

  // "highlight-backlog" — spotlight the whole Backlog list (all seven
  // tickets Karthik broke the project into) while the narrative message
  // explains where they came from. The Backlog panel sits below the Sprint
  // panel and the page scrolls internally, so without bringing it into view
  // first it can sit entirely below the fold — scroll it in the same way
  // Module 3 already does for its comment box, rather than leaving her to
  // find it herself.
  useEffect(() => {
    if (step !== 'highlight-backlog') return

    // block: 'start' (not 'center') — the Backlog panel is taller than the
    // viewport, so centering it would push its own top edge above y=0,
    // making the highlight ring render off-screen and look like it starts
    // from the very top of the page instead of right below the toolbar.
    const el = document.querySelector(BACKLOG_LIST_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    function measure() {
      const listEl = document.querySelector(BACKLOG_LIST_SELECTOR)
      setBacklogListRect(listEl ? listEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    // The scrollIntoView above is smooth (animated), so its position keeps
    // changing for a few hundred ms after this effect runs — keep remeasuring
    // for a moment so the spotlight glides along with it instead of being
    // drawn at the pre-scroll position.
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // "sprint-intro" — recognition of what a sprint actually is, spotlighting
  // the whole active sprint panel (its dates sit right there in the header,
  // so no separate step is needed just to point those out).
  useEffect(() => {
    if (step !== 'sprint-intro') return

    const el = document.querySelector(SPRINT_PANEL_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    function measure() {
      const panelEl = document.querySelector(SPRINT_PANEL_SELECTOR)
      setSprintPanelRect(panelEl ? panelEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // "sprint-dates" — follows "sprint-intro", zooming in on just the date
  // range it gestured at, so the duration/progress math below has a real
  // element to anchor its spotlight to instead of re-measuring the whole
  // panel again.
  useEffect(() => {
    if (step !== 'sprint-dates') return

    const el = document.querySelector(SPRINT_DATES_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const dateEl = document.querySelector(SPRINT_DATES_SELECTOR)
      setSprintDatesRect(dateEl ? dateEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // "create-sprint" — recognition only, same treatment as Complete Sprint in
  // Module 4: sprint planning/running isn't a practiced skill here, so this
  // just points at the real button without letting a real click through
  // (which would otherwise create a genuine new empty sprint).
  useEffect(() => {
    if (step !== 'create-sprint') return

    const el = document.querySelector(CREATE_SPRINT_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const buttonEl = document.querySelector(CREATE_SPRINT_SELECTOR)
      setCreateSprintRect(buttonEl ? buttonEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // Defensive backstop for the mount-time reset above: if WEB-5 is somehow
  // still sitting in the active sprint from a prior run by the time she
  // reaches this step (the reset hadn't landed yet, raced with something
  // else, whatever) — skip straight past both the "try dragging it" note and
  // the drag step itself rather than show an instruction that no longer
  // matches what's on screen. Goes to "moved", the same step the real drag
  // hands off to right after a genuine drop.
  useEffect(() => {
    if (step !== 'drag-note' || !demoTicket) return
    if (demoTicket.sprint === activeSprintNumber) {
      setStep('moved')
    }
  }, [step, demoTicket, activeSprintNumber])

  // Advance the instant she actually drops WEB-5 into the active sprint —
  // detected off the real ticket data, not a fake click handler, since the
  // drop itself is native HTML5 drag-and-drop handled by Backlog.jsx already.
  // Goes to "moved" first, not straight to "ripple" — the drag instruction
  // card needs to disappear the moment the drop happens, not linger while
  // the ripple message is still being set up.
  useEffect(() => {
    if (step !== 'drag' || !demoTicket) return
    if (demoTicket.sprint === activeSprintNumber) {
      setStep('moved')
    }
  }, [step, demoTicket, activeSprintNumber])

  // "moved" — brief pause right after the drop: only the ticket (now sitting
  // in the sprint) stays highlighted, with no message box, so the old "drag
  // it in" instruction doesn't linger on screen for even a moment after
  // she's already done it. After ~1s, hands off to "ripple"'s
  // "see it on the board" message.
  useEffect(() => {
    if (step !== 'moved') return

    const el = document.querySelector(TICKET_ROW_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const ticketEl = document.querySelector(TICKET_ROW_SELECTOR)
      setTicketRect(ticketEl ? ticketEl.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    const settleTimer = setTimeout(measure, 300)
    const advanceTimer = setTimeout(() => setStep('ripple'), 2000)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      clearTimeout(advanceTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // "sprint-actions" — walks through the real per-ticket controls sitting on
  // a sprint row: Subtask, Epic, Story points, Priority, Assignee. Anchored
  // on WEB-3 (already sitting in the sprint from the start) rather than
  // WEB-5, so this tour doesn't require WEB-5 to have been dragged in yet —
  // it stays visible in the Backlog until the "drag" step right after this
  // one. One stop at a time, advanced by the arrow — reuses the exact same
  // real elements a teammate would actually use.
  const [sprintActionIndex, setSprintActionIndex] = useState(0)
  const [sprintActionRect, setSprintActionRect] = useState(null)

  // TEMPORARY, for calibrating each sprint-action stop's own message card
  // position — drag it wherever it should sit; each stop gets its own saved
  // spot (keyed by the stop's key, not its index, so it stays attached to
  // the right stop even if these get reordered later). Stored as an OFFSET
  // from the highlighted field's own position — same reasoning as the
  // highlight-backlog card: the field can scroll, an absolute screen
  // position wouldn't follow it. Once every stop's position is settled, tell
  // Claude to "fix" them: it'll bake the final offsets into the JSX below as
  // fixed values and remove this whole drag setup.
  const [sprintActionCardOffsets, setSprintActionCardOffsets] = useState(() =>
    loadState(SPRINT_ACTION_CARD_POSITIONS_KEY, {}),
  )
  const sprintActionDragRef = useRef(null)
  const sprintActionDragRafRef = useRef(null)

  function handleSprintActionCardPointerDown(event) {
    if (!sprintActionRect) return
    const stopKey = SPRINT_ACTION_STOPS[sprintActionIndex].key
    const rect = event.currentTarget.getBoundingClientRect()
    const currentOffset = sprintActionCardOffsets[stopKey] ?? {
      top: rect.top - sprintActionRect.top,
      left: rect.left - sprintActionRect.left,
    }
    sprintActionDragRef.current = {
      stopKey,
      startX: event.clientX,
      startY: event.clientY,
      originTop: currentOffset.top,
      originLeft: currentOffset.left,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleSprintActionCardPointerMove(event) {
    if (!sprintActionDragRef.current) return
    sprintActionDragRef.current.lastX = event.clientX
    sprintActionDragRef.current.lastY = event.clientY
    if (sprintActionDragRafRef.current != null) return
    sprintActionDragRafRef.current = requestAnimationFrame(() => {
      sprintActionDragRafRef.current = null
      const drag = sprintActionDragRef.current
      if (!drag) return
      setSprintActionCardOffsets((offsets) => ({
        ...offsets,
        [drag.stopKey]: {
          top: drag.originTop + (drag.lastY - drag.startY),
          left: drag.originLeft + (drag.lastX - drag.startX),
        },
      }))
    })
  }

  function handleSprintActionCardPointerUp(event) {
    sprintActionDragRef.current = null
    if (sprintActionDragRafRef.current != null) {
      cancelAnimationFrame(sprintActionDragRafRef.current)
      sprintActionDragRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setSprintActionCardOffsets((offsets) => {
      saveState(SPRINT_ACTION_CARD_POSITIONS_KEY, offsets)
      return offsets
    })
  }

  // Same drag-to-calibrate pattern as the position offsets above, but for
  // each stop's own card WIDTH — keyed by stop key so each field keeps its
  // own saved width. Falls back to the stop's default cardWidth until she
  // resizes it herself.
  const [sprintActionCardWidths, setSprintActionCardWidths] = useState(() =>
    loadState(SPRINT_ACTION_CARD_WIDTHS_KEY, {}),
  )
  const sprintActionResizeRef = useRef(null)
  const sprintActionResizeRafRef = useRef(null)

  function handleSprintActionResizePointerDown(event) {
    event.stopPropagation()
    const stopKey = SPRINT_ACTION_STOPS[sprintActionIndex].key
    const currentWidth = sprintActionCardWidths[stopKey] ?? SPRINT_ACTION_STOPS[sprintActionIndex].cardWidth
    sprintActionResizeRef.current = { stopKey, startX: event.clientX, originWidth: currentWidth }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleSprintActionResizePointerMove(event) {
    if (!sprintActionResizeRef.current) return
    sprintActionResizeRef.current.lastX = event.clientX
    if (sprintActionResizeRafRef.current != null) return
    sprintActionResizeRafRef.current = requestAnimationFrame(() => {
      sprintActionResizeRafRef.current = null
      const drag = sprintActionResizeRef.current
      if (!drag) return
      const nextWidth = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, drag.originWidth + (drag.lastX - drag.startX)))
      setSprintActionCardWidths((widths) => ({ ...widths, [drag.stopKey]: nextWidth }))
    })
  }

  function handleSprintActionResizePointerUp(event) {
    sprintActionResizeRef.current = null
    if (sprintActionResizeRafRef.current != null) {
      cancelAnimationFrame(sprintActionResizeRafRef.current)
      sprintActionResizeRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setSprintActionCardWidths((widths) => {
      saveState(SPRINT_ACTION_CARD_WIDTHS_KEY, widths)
      return widths
    })
  }

  useEffect(() => {
    if (step !== 'sprint-actions') return

    const selector = SPRINT_ACTION_STOPS[sprintActionIndex].selector
    // Bring each stop's real control into view before measuring it — the
    // ticket row can easily be scrolled out of frame (e.g. the previous
    // stop's own tall message card pushed things around, or the page never
    // scrolled back to the sprint panel after the drag), and without this
    // the next highlight can end up measuring an element that's off-screen.
    const targetEl = document.querySelector(selector)
    targetEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const el = document.querySelector(selector)
      setSprintActionRect(el ? el.getBoundingClientRect() : null)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    // The scrollIntoView above is smooth (animated), so its position keeps
    // changing for a few hundred ms after this effect runs — keep
    // remeasuring for a moment so the spotlight glides along instead of
    // being drawn at the pre-scroll position.
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    // Opening the Subtask side panel (from the "subtask" stop) narrows the
    // ticket list's available width without firing a window resize event —
    // a plain resize listener misses that shift entirely, leaving the
    // highlight ring and card stuck at their pre-panel position instead of
    // tracking the ticket row to its new spot. Watch the DOM directly and
    // remeasure on any change instead.
    let mutationRaf = null
    const observer = new MutationObserver(() => {
      if (mutationRaf != null) return
      mutationRaf = requestAnimationFrame(() => {
        mutationRaf = null
        measure()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      observer.disconnect()
      if (mutationRaf != null) cancelAnimationFrame(mutationRaf)
    }
  }, [step, sprintActionIndex])

  function advanceSprintAction() {
    if (sprintActionIndex < SPRINT_ACTION_STOPS.length - 1) {
      setSprintActionIndex((index) => index + 1)
    } else {
      setStep('drag-note')
    }
  }

  function previousSprintAction() {
    if (sprintActionIndex > 0) {
      setSprintActionIndex((index) => index - 1)
    } else {
      setStep('sprint-dates')
    }
  }

  useEffect(() => {
    if (step !== 'board') return

    // The Board tab only actually mounts once JiraWorkspace's own
    // forceBoardViewKey effect flips its internal activeView state — a
    // separate render that happens after this effect's first run, so
    // querying for the ticket up front (before that re-render lands) always
    // found nothing and silently skipped the scroll. Scrolling it into view
    // the first time it's actually found (whichever measure() pass that
    // ends up being) instead of once up front fixes that.
    let hasScrolledIntoView = false

    function measure() {
      const ticketEl = document.querySelector(BOARD_TICKET_SELECTOR)
      setBoardTicketRect(ticketEl ? ticketEl.getBoundingClientRect() : null)
      if (ticketEl && !hasScrolledIntoView) {
        hasScrolledIntoView = true
        ticketEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      }
    }

    measure()
    const raf = requestAnimationFrame(measure)
    // scrollIntoView above is smooth (animated), so the rect keeps changing
    // for a few hundred ms after this effect runs — keep remeasuring for a
    // moment so the spotlight glides along with it instead of being drawn at
    // the pre-scroll position.
    const settleTimer = setTimeout(measure, 500)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    // The Board tab mounting is itself a cascade (forceBoardViewKey flips
    // activeView, THEN Board renders, THEN its ticket cards render) — if
    // that takes even slightly longer than the raf + 500ms window above,
    // the ticket is never found and the highlight silently never appears.
    // Watch the DOM directly so it's caught no matter how long the mount
    // actually takes.
    let mutationRaf = null
    const observer = new MutationObserver(() => {
      if (mutationRaf != null) return
      mutationRaf = requestAnimationFrame(() => {
        mutationRaf = null
        measure()
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      observer.disconnect()
      if (mutationRaf != null) cancelAnimationFrame(mutationRaf)
    }
  }, [step])

  const workspace = useMemo(
    () => (
      <JiraWorkspace
        learnerId={learnerId}
        learner={learner}
        showSidebar={false}
        showTabs={true}
        highlightTicketKey={step === 'sprint-actions' ? FIELD_TOUR_TICKET_KEY : DEMO_TICKET_KEY}
        // During "drag", the interactive hole covers WEB-5's whole row (it
        // has to, for the drag gesture itself to work) — without this, that
        // also left its inner buttons (Epic, Status, Story Points, Priority,
        // the Subtask icon) genuinely clickable, when only the drag itself
        // should do anything here.
        disableActionsForKey={step === 'drag' ? DEMO_TICKET_KEY : null}
        onLogout={onLogout}
        onExposeActions={setExposedActions}
        initialView="backlog"
        dropZoneSprintNumber={step === 'drag' ? activeSprintNumber : null}
        sprintPanelDataTourNumber={step === 'sprint-intro' || step === 'sprint-dates' ? activeSprintNumber : null}
        // Lets the "sprint-actions" step force the real Priority dropdown
        // open on WEB-3's row while it's the one being explained, closing
        // back to normal the moment she moves to the next stop.
        activeSprintActionStop={step === 'sprint-actions' ? SPRINT_ACTION_STOPS[sprintActionIndex].key : null}
        // Closes the Subtask side panel whenever she leaves the "subtask"
        // stop — forward to the next field stop, OR back out to sprint-dates
        // (the Back arrow on the first field stop changes `step`, not
        // sprintActionIndex, which sprintActionIndex alone wouldn't catch,
        // leaving the panel stuck open even though the demo's moved on).
        closeSubtaskPanelKey={`${step}-${sprintActionIndex}`}
        // The workspace stays on one mounted instance for the whole demo, so
        // its own tab-click state would otherwise leave it sitting on
        // Backlog forever — this forces it over to Board right when the
        // "board" step needs to spotlight the ticket sitting there.
        forceBoardViewKey={step === 'board' ? 'board' : null}
        disableCompleteSprint
        disableSearchAndFilter
        disableTopBarActions
      />
    ),
    [learnerId, learner, onLogout, activeSprintNumber, step, sprintActionIndex, panelCollapsed],
  )

  const highlightBacklogCardPos = backlogListRect
    ? highlightCardOffset
      ? { top: backlogListRect.top + highlightCardOffset.top, left: backlogListRect.left + highlightCardOffset.left }
      : (IS_DEPLOYED_BUILD ? positionAtTop : positionBelow)(backlogListRect, highlightBacklogCardWidth.width)
    : null
  const dropZoneCardPos =
    dropZoneRect && dragCardDrag.offset
      ? { top: dropZoneRect.top + dragCardDrag.offset.top, left: dropZoneRect.left + dragCardDrag.offset.left }
      : positionBelow(dropZoneRect, dragCardWidth.width)
  const currentSprintActionStop = SPRINT_ACTION_STOPS[sprintActionIndex]
  const currentSprintActionCardWidth = sprintActionCardWidths[currentSprintActionStop.key] ?? currentSprintActionStop.cardWidth
  const sprintActionCardOffset = sprintActionCardOffsets[currentSprintActionStop.key]
  const sprintActionCardPosRaw =
    sprintActionRect && sprintActionCardOffset
      ? { top: sprintActionRect.top + sprintActionCardOffset.top, left: sprintActionRect.left + sprintActionCardOffset.left }
      : positionLeftOf(sprintActionRect, currentSprintActionCardWidth)
  // Shifted 50px below the computed position, by request, for all six
  // Subtask-through-Assignee field-tour stops — deployed build only.
  const sprintActionCardPos =
    sprintActionCardPosRaw && (IS_DEPLOYED_BUILD ? { ...sprintActionCardPosRaw, top: sprintActionCardPosRaw.top + 50 } : sprintActionCardPosRaw)
  const boardCardPos =
    boardTicketRect && boardCardDrag.offset
      ? { top: boardTicketRect.top + boardCardDrag.offset.top, left: boardTicketRect.left + boardCardDrag.offset.left }
      : positionBelow(boardTicketRect, boardCardWidth.width)
  const createSprintCardPosRaw =
    createSprintRect && createSprintCardDrag.offset
      ? { top: createSprintRect.top + createSprintCardDrag.offset.top, left: createSprintRect.left + createSprintCardDrag.offset.left }
      // The real Create Sprint button sits near the right edge of the toolbar,
      // so the clamp needs to reserve room for the SplitStepButton (32px) plus
      // its gap-3 (12px) that sits beside the card — otherwise the arrow spills
      // past the screen edge and becomes unreachable.
      : positionBelow(createSprintRect, createSprintCardWidth.width + 44)
  // Shifted 100px further left than the computed position, by request —
  // deployed build only.
  const createSprintCardPos =
    createSprintCardPosRaw && (IS_DEPLOYED_BUILD ? { ...createSprintCardPosRaw, left: createSprintCardPosRaw.left - 100 } : createSprintCardPosRaw)
  const sprintIntroCardPos =
    sprintPanelRect && sprintIntroCardDrag.offset
      ? { top: sprintPanelRect.top + sprintIntroCardDrag.offset.top, left: sprintPanelRect.left + sprintIntroCardDrag.offset.left }
      : (IS_DEPLOYED_BUILD ? positionAtTop : positionBelow)(sprintPanelRect, sprintIntroCardWidth.width)
  const sprintDatesCardPos =
    sprintDatesRect && sprintDatesCardDrag.offset
      ? { top: sprintDatesRect.top + sprintDatesCardDrag.offset.top, left: sprintDatesRect.left + sprintDatesCardDrag.offset.left }
      : positionBelow(sprintDatesRect, sprintDatesCardWidth.width)
  const dragNoteCardPos =
    ticketRect && dragNoteCardDrag.offset
      ? { top: ticketRect.top + dragNoteCardDrag.offset.top, left: ticketRect.left + dragNoteCardDrag.offset.left }
      : positionBelow(ticketRect, dragNoteCardWidth.width)

  // "Sprint 2 runs 14 days, from Sep 2 to Sep 16 — today is day 4." Computed
  // live off the real sprintDates rather than hardcoded, since the seed data
  // anchors every sprint's dates to the learner's own first-visit date.
  const activeSprintDateRange = ticketStore.sprintDates?.[activeSprintNumber]
  let sprintDurationText = `A sprint runs for a set number of days — usually two to four weeks — and doesn't change once it starts.\nSprint ${activeSprintNumber}'s dates aren't set yet.`
  if (activeSprintDateRange?.start && activeSprintDateRange?.end) {
    const start = new Date(activeSprintDateRange.start)
    const end = new Date(activeSprintDateRange.end)
    const totalDays = Math.round((end - start) / DAY_MS)
    const dayOfSprint = Math.min(totalDays, Math.max(1, Math.floor((Date.now() - start) / DAY_MS) + 1))
    const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    sprintDurationText = `A sprint runs for a set number of days — usually two to four weeks — and doesn't change once it starts.\nSprint ${activeSprintNumber} runs ${totalDays} days, from ${startLabel} to ${endLabel} — today is day ${dayOfSprint}.`
  }

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
        .tour-help-glow { box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.7); }
      `}</style>

      <ModuleProgressBar
        moduleNumber={5}
        title="Before Your Ticket Reached You"
        onLogout={onLogout}
        collapsed={panelCollapsed}
        onToggleCollapsed={togglePanelCollapsed}
        hideEarlierProgress={isReplay}
        onSelectModule={onSelectModule}
        onBackToWorkspace={onBackToWorkspace}
        onChooseModule={onChooseModule}
      />

      {workspace}

      {HEADER_CLIPPED_STEPS.includes(step) && <HeaderClickBlocker headerBottom={headerBottom} />}

      {step === 'intro' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${VIDEO_CARD_CLASSNAME} dark:bg-gray-800`}>
            <video
              ref={(el) => {
                introVideoPan.elRef.current = el
                setupSilentVideo(el)
              }}
              src={introVideo}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(event) => event.preventDefault()}
              style={{ objectPosition: `${introVideoPan.pan.x}% ${introVideoPan.pan.y}%` }}
              className="h-48 w-full flex-shrink-0 select-none object-cover sm:h-full sm:w-96"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 text-left sm:px-8 sm:py-10">
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Where your ticket came from
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ever wonder how your ticket ended up assigned to you? Here's what happened before
                it ever reached you.
              </p>
              <button
                type="button"
                onClick={() => setStep('highlight-backlog')}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'highlight-backlog' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Full block, not a hole around backlogListRect — that rect IS
              the whole ticket list, so a hole there would leave every real
              row (its Epic dropdown, status, etc.) just as clickable as
              before. Nothing here needs a real click; only the Back/Next
              arrow moves this step forward. This does mean wheel/trackpad
              scrolling on the list is blocked too while this step is up —
              a prior attempt at this reverted for exactly that reason, but
              was worse: it left every row's real controls live. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {backlogListRect && (
            <>
              {/* Two stacked elements — combining a constant ring with
                  tour-glow's own pulsing animation on one element doesn't
                  work, since the animation's keyframes override the static
                  box-shadow for its whole duration, so the ring would
                  disappear except at the brief mid-pulse moment. */}
              <div
                className="tour-help-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: backlogListRect.top - 4,
                  left: backlogListRect.left - 4,
                  width: backlogListRect.width + 8,
                  height: backlogListRect.height + 8,
                }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: backlogListRect.top - 4,
                  left: backlogListRect.left - 4,
                  width: backlogListRect.width + 8,
                  height: backlogListRect.height + 8,
                }}
              />
            </>
          )}

          {highlightBacklogCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: highlightBacklogCardPos.top, left: highlightBacklogCardPos.left }}
            >
              {/* Position frozen at whatever was last calibrated; no longer
                  draggable. */}
              <div
                style={{ width: highlightBacklogCardWidth.width }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Tickets get created and added here first — the Backlog holds work that hasn't
                  started yet, waiting to be picked for a sprint.
                </p>
              </div>
              <SplitStepButton
                onBack={() => {}}
                onNext={() => setStep('create-sprint')}
                canGoBack={false}
              />
            </div>
          )}
        </div>
      )}

      {step === 'create-sprint' && (
        // Recognition only — same treatment as Complete Sprint in Module 4:
        // a real click here would create a genuine new empty sprint, so the
        // arrow advances the demo instead of letting the button do anything.
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Real click-blocker — the wrapper above is pointer-events-none
              (so only the card/button below opt back in), which on its own
              left the real Create Sprint button underneath fully clickable,
              contradicting the comment above. This actually blocks it. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {createSprintRect && (
            <>
              <div
                className="tour-help-glow pointer-events-none absolute rounded-md"
                style={{
                  top: createSprintRect.top - 4,
                  left: createSprintRect.left - 4,
                  width: createSprintRect.width + 8,
                  height: createSprintRect.height + 8,
                }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-md"
                style={{
                  top: createSprintRect.top - 4,
                  left: createSprintRect.left - 4,
                  width: createSprintRect.width + 8,
                  height: createSprintRect.height + 8,
                }}
              />
            </>
          )}

          {createSprintCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: createSprintCardPos.top, left: createSprintCardPos.left }}
            >
              <div
                style={{ width: createSprintCardWidth.width }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This button turns backlog tickets into a new sprint. Your team already did this
                  for Sprint {activeSprintNumber} — you won't need to click it today.
                </p>
              </div>
              <SplitStepButton
                onBack={() => setStep('highlight-backlog')}
                onNext={() => setStep('sprint-intro')}
                canGoBack={true}
              />
            </div>
          )}
        </div>
      )}

      {step === 'sprint-intro' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Full block, not a hole around sprintPanelRect — same reasoning
              as highlight-backlog: that rect is the whole sprint container,
              so a hole there would leave every ticket inside it (their
              Epic/Status/Priority buttons) just as clickable as before. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {sprintPanelRect && (
            <>
              <div
                className="tour-help-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: sprintPanelRect.top - 4,
                  left: sprintPanelRect.left - 4,
                  width: sprintPanelRect.width + 8,
                  height: sprintPanelRect.height + 8,
                }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: sprintPanelRect.top - 4,
                  left: sprintPanelRect.left - 4,
                  width: sprintPanelRect.width + 8,
                  height: sprintPanelRect.height + 8,
                }}
              />
            </>
          )}

          {sprintIntroCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: sprintIntroCardPos.top, left: sprintIntroCardPos.left }}
            >
              <div
                style={{ width: sprintIntroCardWidth.width }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This is Sprint {activeSprintNumber} — the batch of work your team is actively doing
                  right now.
                </p>
              </div>
              <SplitStepButton
                onBack={() => setStep('create-sprint')}
                onNext={() => setStep('sprint-dates')}
                canGoBack={true}
              />
            </div>
          )}
        </div>
      )}

      {step === 'sprint-dates' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Full block — pure explanation stop, nothing here (including
              the highlighted date badge itself) needs a real click. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {sprintDatesRect && (
            <>
              <div
                className="tour-help-glow pointer-events-none absolute rounded-md"
                style={{
                  top: sprintDatesRect.top - 4,
                  left: sprintDatesRect.left - 4,
                  width: sprintDatesRect.width + 8,
                  height: sprintDatesRect.height + 8,
                }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-md"
                style={{
                  top: sprintDatesRect.top - 4,
                  left: sprintDatesRect.left - 4,
                  width: sprintDatesRect.width + 8,
                  height: sprintDatesRect.height + 8,
                }}
              />
            </>
          )}

          {sprintDatesCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: sprintDatesCardPos.top, left: sprintDatesCardPos.left }}
            >
              <div
                style={{ width: sprintDatesCardWidth.width }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                {sprintDurationText.split('\n').map((line, index) => (
                  <p
                    key={index}
                    className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${index > 0 ? 'mt-2' : ''}`}
                  >
                    {line}
                  </p>
                ))}
              </div>
              <SplitStepButton
                onBack={() => setStep('sprint-intro')}
                onNext={() => {
                  setSprintActionIndex(0)
                  setStep('sprint-actions')
                }}
                canGoBack={true}
              />
            </div>
          )}
        </div>
      )}

      {step === 'drag-note' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Full block — this is just the instruction before the real drag
              (which happens on the next step), so the ticket itself doesn't
              need to be interactive yet either. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {ticketRect && (
            <div
              className="tour-glow pointer-events-none absolute rounded-lg"
              style={{ top: ticketRect.top - 2, left: ticketRect.left - 2, width: ticketRect.width + 4, height: ticketRect.height + 4 }}
            />
          )}

          {dragNoteCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: dragNoteCardPos.top, left: dragNoteCardPos.left }}
            >
              <div
                style={{ width: dragNoteCardWidth.width }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {DEMO_TICKET_KEY} isn't assigned to anyone — it's just here for you to practice.
                  Try dragging it from the Backlog into the Sprint.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('drag')}
                aria-label="Next"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'drag' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          <TourClickBlocker
            hole={unionOf([ticketRect, dropZoneRect].filter(Boolean))}
          />
          {ticketRect && (
            <div
              className="tour-glow pointer-events-none absolute rounded-lg"
              style={{ top: ticketRect.top - 2, left: ticketRect.left - 2, width: ticketRect.width + 4, height: ticketRect.height + 4 }}
            />
          )}
          {dropZoneCardPos && demoTicket?.sprint !== activeSprintNumber ? (
            <div
              className="pointer-events-auto absolute select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              style={{ top: dropZoneCardPos.top, left: dropZoneCardPos.left, width: dragCardWidth.width }}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Drag {DEMO_TICKET_KEY} from the Backlog into the sprint above.
              </p>
            </div>
          ) : (
            !ticketRect && <div className="absolute inset-0 bg-black/10" />
          )}
        </div>
      )}

      {step === 'moved' && ticketRect && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          <div
            className="tour-glow pointer-events-none absolute rounded-lg"
            style={{ top: ticketRect.top - 2, left: ticketRect.left - 2, width: ticketRect.width + 4, height: ticketRect.height + 4 }}
          />
        </div>
      )}

      {step === 'ripple' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-gray-100 dark:bg-gray-800`}>
            <div
              className="relative flex-shrink-0"
              style={{
                width: rippleImageSize.width,
                height: rippleImageSize.width,
                // Position is fixed at whatever was last calibrated — no
                // longer draggable, just still applying the saved offset.
                transform: rippleImageDrag.offset
                  ? `translate(${rippleImageDrag.offset.left}px, ${rippleImageDrag.offset.top}px)`
                  : undefined,
              }}
            >
              <img src={seeItOnBoardImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Notice — this ticket now shows up differently elsewhere too.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Everything in Jira is connected.
              </p>
              <button
                type="button"
                onClick={() => setStep('board')}
                className="mt-6 rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                See it on the board
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'sprint-actions' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Every field except Subtask is recognition-only — the field
              itself (Epic/Status/Story Points/Priority/Assignee) doesn't
              need to be clickable; Priority's own dropdown preview already
              opens programmatically via its forceOpen prop, not a real
              click here. Subtask is the one exception: its own text says
              "click the icon to see it", so it needs a real hole to
              actually open the real subtask panel — everything else on the
              page still stays blocked either way. */}
          {SPRINT_ACTION_STOPS[sprintActionIndex].key === 'subtask' ? (
            <TourClickBlocker hole={sprintActionRect} />
          ) : (
            <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          )}
          {sprintActionRect && (
            <div
              className="tour-help-glow pointer-events-none absolute rounded-md"
              style={{
                top: sprintActionRect.top - 4,
                left: sprintActionRect.left - 4,
                width: sprintActionRect.width + 8,
                height: sprintActionRect.height + 8,
              }}
            />
          )}
          {sprintActionCardPos && (
            <div
              className="pointer-events-auto absolute flex items-center gap-3"
              style={{ top: sprintActionCardPos.top, left: sprintActionCardPos.left }}
            >
              <div
                style={{ width: currentSprintActionCardWidth }}
                className="relative select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              >
                <p className="whitespace-pre-line text-sm font-medium text-gray-900 dark:text-gray-100">
                  {SPRINT_ACTION_STOPS[sprintActionIndex].text}
                </p>
              </div>
              <SplitStepButton
                onBack={previousSprintAction}
                onNext={advanceSprintAction}
                canGoBack={true}
                isLast={sprintActionIndex === SPRINT_ACTION_STOPS.length - 1}
              />
            </div>
          )}
        </div>
      )}

      {step === 'board' && (
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{ clipPath: `inset(${headerBottom}px 0 0 0)` }}
        >
          {/* Full block — final "there it is" recognition moment, only the
              Done button (already pointer-events-auto below) advances it. */}
          <div
            className="pointer-events-auto fixed inset-0"
            onWheel={forwardWheelToBacklogScroll}
            onTouchStart={forwardTouchStartToBacklogScroll}
            onTouchMove={forwardTouchMoveToBacklogScroll}
          />
          {boardTicketRect && (
            <>
              <div
                className="pointer-events-none absolute rounded-lg"
                style={{
                  top: boardTicketRect.top - 2,
                  left: boardTicketRect.left - 2,
                  width: boardTicketRect.width + 4,
                  height: boardTicketRect.height + 4,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.25)',
                }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: boardTicketRect.top - 2,
                  left: boardTicketRect.left - 2,
                  width: boardTicketRect.width + 4,
                  height: boardTicketRect.height + 4,
                }}
              />
              {boardCardPos && (
                <div
                  className="pointer-events-auto absolute select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                  style={{ top: boardCardPos.top, left: boardCardPos.left, width: boardCardWidth.width }}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    There it is — {DEMO_TICKET_KEY} is on the board now, right alongside your own ticket.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep('complete')}
                    onPointerDown={(event) => event.stopPropagation()}
                    className="mt-3 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 'complete' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-white dark:bg-gray-800`}>
            <div
              className="relative flex-shrink-0 select-none"
              style={{
                width: completeImageSize.width,
                height: completeImageSize.width,
                transform: completeImageDrag.offset
                  ? `translate(${completeImageDrag.offset.left}px, ${completeImageDrag.offset.top}px)`
                  : undefined,
              }}
            >
              <img src={backlogToSprintImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                That's the whole journey — Backlog, into a sprint, onto the board.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Every ticket takes this same path before it ever reaches you.
              </p>
              <button
                type="button"
                onClick={() => setStep('explore')}
                className="mt-6 rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'explore' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={`${INTRO_CARD_CLASSNAME} bg-white dark:bg-gray-800`}>
            <div
              className="relative flex-shrink-0 select-none"
              style={{
                width: exploreImageSize.width,
                height: exploreImageSize.width,
                transform: exploreImageDrag.offset
                  ? `translate(${exploreImageDrag.offset.left}px, ${exploreImageDrag.offset.top}px)`
                  : undefined,
              }}
            >
              <img src={finalImage} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-2xl font-bold uppercase tracking-wide text-green-600 dark:text-green-400">
                Congratulations, {learner.name}!
              </p>
              <p className="mt-1 text-lg font-medium text-gray-700 dark:text-gray-300">
                You've finished every guided step.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Now go explore the workspace on your own — click around, nothing here will break.
              </p>
              <button
                type="button"
                onClick={onComplete}
                className="mt-6 rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Start exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
