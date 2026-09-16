import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import JiraWorkspace from '../components/JiraWorkspace'
import ModuleProgressBar, {
  useModulePanelCollapsed,
  MODULE_PANEL_WIDTH,
  MODULE_PANEL_WIDTH_COLLAPSED,
} from '../components/ModuleProgressBar'
import createTicketVideo from '../assets/create-ticket.mp4'
import { loadState, saveState, scopedKey, recordFirstAction } from '../utils/localStorage'
import SplitStepButton from '../components/SplitStepButton'
import { VIDEO_CARD_CLASSNAME } from '../constants/introCard'

// Muted, same as every other video in the app — turns off Chrome's hover
// overlay (picture-in-picture / cast icons) too; disablePictureInPicture is
// a real HTML attribute, but disableRemotePlaybackApi is JS-only, so it has
// to be set here rather than as a JSX prop.
function setupSilentVideo(el) {
  if (!el) return
  el.disableRemotePlaybackApi = true
}

const TAP_MESSAGE_POSITION_KEY = 'jiraway-module2-tap-message-position'
const HELP_CARD_POSITIONS_KEY = 'jiraway-module2-help-card-positions'

const CREATE_BUTTON_SELECTOR = '[data-tour="create-button"]'
const HELP_BUTTON_SELECTOR = '[data-tour="create-help"]'
const CREATED_TICKET_SELECTOR = '[data-tour="created-ticket"]'
const CLOSE_BUTTON_SELECTOR = '[data-tour="create-close"]'

const HELP_STOPS = [
  {
    selector: '[data-tour="create-project-key"]',
    highlightPadding: 4,
    text: "WEB is your project's key — every ticket here starts with it.",
  },
  {
    selector: '[data-tour="create-type-option-epic"]',
    dropdownSelector: '[data-tour="create-type-option-epic"]',
    triggerSelector: '[data-tour="create-type"]',
    closeSelector: '[data-tour="type-menu-backdrop"]',
    highlightPadding: 2,
    highlightRadius: 4,
    text: 'Epic — a big goal, broken down into smaller tickets like tasks and bugs.',
  },
  {
    selector: '[data-tour="create-type-option-task"]',
    dropdownSelector: '[data-tour="create-type-option-task"]',
    triggerSelector: '[data-tour="create-type"]',
    closeSelector: '[data-tour="type-menu-backdrop"]',
    highlightPadding: 2,
    highlightRadius: 4,
    text: 'Task — general work that needs to get done.',
  },
  {
    selector: '[data-tour="create-type-option-bug"]',
    dropdownSelector: '[data-tour="create-type-option-bug"]',
    triggerSelector: '[data-tour="create-type"]',
    closeSelector: '[data-tour="type-menu-backdrop"]',
    highlightPadding: 2,
    highlightRadius: 4,
    text: 'Bug — something broken that needs fixing.',
  },
  {
    selector: '[data-tour="create-type-option-story"]',
    dropdownSelector: '[data-tour="create-type-option-story"]',
    triggerSelector: '[data-tour="create-type"]',
    closeSelector: '[data-tour="type-menu-backdrop"]',
    highlightPadding: 2,
    highlightRadius: 4,
    text: 'Story — anything a user notices in the app, new or improved.',
  },
  {
    selector: '[data-tour="create-title"]',
    highlightPadding: 4,
    text: "This is the summary — your ticket's name. Keep it short and clear.",
  },
  {
    selector: '[data-tour="create-assignee"]',
    dropdownSelector: '[data-tour="create-assignee-dropdown"]',
    triggerSelector: '[data-tour="create-assignee"]',
    closeSelector: '[data-tour="assignee-menu-backdrop"]',
    highlightPadding: -2,
    text: "This is the assignee — choose your own name from the list.",
  },
  {
    selector: '[data-tour="create-sprint"]',
    dropdownSelector: '[data-tour="create-sprint-dropdown"]',
    triggerSelector: '[data-tour="create-sprint"]',
    closeSelector: '[data-tour="sprint-menu-backdrop"]',
    highlightPadding: -2,
    text: "Sprint is when your team is working on this. Choose the one under \"Active\".",
  },
]

const CARD_WIDTH = 300
const CARD_MARGIN = 16

function positionBelow(rect) {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  let left = rect.left + rect.width / 2 - CARD_WIDTH / 2
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - CARD_WIDTH - CARD_MARGIN))
  return { top: rect.bottom + 12, left }
}

function unionOf(rects) {
  if (rects.length === 0) return null
  const top = Math.min(...rects.map((r) => r.top))
  const left = Math.min(...rects.map((r) => r.left))
  const right = Math.max(...rects.map((r) => r.right))
  const bottom = Math.max(...rects.map((r) => r.bottom))
  return { top, left, right, bottom, width: right - left, height: bottom - top }
}

// Blocks every click on screen except inside `hole` (the one real element
// this step needs her to actually interact with) — nesting a pointer-events-
// none child inside a pointer-events-auto wrapper does NOT let clicks reach
// the real page through it, since the wrapper still owns that screen area;
// four separate strips *around* the hole is what actually leaves it uncovered.
// With no hole (or before it's measured), the whole screen just blocks.
function InteractiveHoleBackdrop({ hole }) {
  if (!hole) {
    return <div className="pointer-events-auto absolute inset-0" />
  }
  return (
    <>
      <div className="pointer-events-auto absolute inset-x-0 top-0" style={{ height: hole.top }} />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0" style={{ top: hole.bottom }} />
      <div
        className="pointer-events-auto absolute left-0"
        style={{ top: hole.top, height: hole.height, width: hole.left }}
      />
      <div
        className="pointer-events-auto absolute right-0"
        style={{ top: hole.top, height: hole.height, left: hole.right }}
      />
    </>
  )
}

// Fills the real controlled input the same way a user typing would — setting
// .value directly wouldn't trigger React's onChange, since React tracks the
// input's value through its own listener, not the DOM property.
function setNativeInputValue(el, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export default function Module2({ learnerId, learner, onComplete, onLogout, isReplay = false, onSelectModule, onBackToWorkspace, onChooseModule }) {
  const [panelCollapsed, togglePanelCollapsed] = useModulePanelCollapsed()
  const [step, setStep] = useState('intro')
  // Time-to-first-action tracking for the admin Learners list — see
  // Module1.jsx's identical hook for the full reasoning.
  const moduleMountTimeRef = useRef(Date.now())
  const firstActionRecordedRef = useRef(false)
  useEffect(() => {
    if (step === 'intro' || firstActionRecordedRef.current) return
    firstActionRecordedRef.current = true
    recordFirstAction(learnerId, 'module2', Date.now() - moduleMountTimeRef.current)
  }, [step, learnerId])
  const [rect, setRect] = useState(null)
  const [boardCardRect, setBoardCardRect] = useState(null)
  const [createdKey, setCreatedKey] = useState(null)
  const [helpButtonRect, setHelpButtonRect] = useState(null)

  // Once she's already opened "Show me how" before (persisted per learner,
  // same flag CreateIssueModal itself checks), this module shouldn't
  // re-block the form on every future ticket — only a genuinely first-time
  // learner gets funneled into the walkthrough.
  const helpAlreadySeen = loadState(scopedKey(learnerId, 'create-help-seen'), false)
  const [helpIndex, setHelpIndex] = useState(null)
  const [helpRects, setHelpRects] = useState([])
  const [helpCloseRect, setHelpCloseRect] = useState(null)
  const [helpCardHeight, setHelpCardHeight] = useState(56)
  const [helpCardWidth, setHelpCardWidth] = useState(CARD_WIDTH)
  const [helpRevealed, setHelpRevealed] = useState(false)
  const helpCardRef = useRef(null)
  // Ground truth for which dropdown (if any) is actually open right now —
  // NOT inferred from array-adjacent stops. Comparing a stop's trigger to
  // HELP_STOPS[helpIndex + 1]/[helpIndex - 1] only gives the right answer
  // when navigating forward in array order; going backward, the "should I
  // close" check ended up asking about the wrong neighbor and could leave a
  // dropdown open (or fail to reopen one), which is what was making the
  // highlight silently vanish on some Back/Next presses.
  const openTriggerRef = useRef(null)
  // The dropdown's own dismiss-backdrop for whatever's open right now —
  // clicking this always sets that menu's open state to false outright.
  // Re-clicking the trigger button instead (the old approach) toggles it,
  // which silently re-opens the menu instead of closing it if anything ever
  // left the real open/closed state out of sync with this ref, and once
  // that happens neither gets corrected again — exactly what was leaving a
  // stray dropdown open under later stops' highlights.
  const openCloseSelectorRef = useRef(null)

  // Drag-to-calibrate the tap-create message card — same offset-from-anchor
  // pattern used throughout BacklogDemo.jsx: stores an OFFSET from the real
  // Create button's own position (not an absolute screen position), so the
  // card keeps following the button if the page scrolls or resizes instead
  // of drifting away from it. Saved to localStorage immediately on release.
  const [tapMessageOffset, setTapMessageOffset] = useState(() => loadState(TAP_MESSAGE_POSITION_KEY, null))
  const tapMessageDragRef = useRef(null)
  const tapMessageDragRafRef = useRef(null)

  function handleTapMessagePointerDown(event) {
    if (!rect) return
    const cardRect = event.currentTarget.getBoundingClientRect()
    const currentOffset = tapMessageOffset ?? { top: cardRect.top - rect.top, left: cardRect.left - rect.left }
    tapMessageDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: currentOffset.top,
      originLeft: currentOffset.left,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTapMessagePointerMove(event) {
    if (!tapMessageDragRef.current) return
    tapMessageDragRef.current.lastX = event.clientX
    tapMessageDragRef.current.lastY = event.clientY
    if (tapMessageDragRafRef.current != null) return
    tapMessageDragRafRef.current = requestAnimationFrame(() => {
      tapMessageDragRafRef.current = null
      const drag = tapMessageDragRef.current
      if (!drag) return
      setTapMessageOffset({
        top: drag.originTop + (drag.lastY - drag.startY),
        left: drag.originLeft + (drag.lastX - drag.startX),
      })
    })
  }

  function handleTapMessagePointerUp(event) {
    tapMessageDragRef.current = null
    if (tapMessageDragRafRef.current != null) {
      cancelAnimationFrame(tapMessageDragRafRef.current)
      tapMessageDragRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setTapMessageOffset((current) => {
      saveState(TAP_MESSAGE_POSITION_KEY, current)
      return current
    })
  }

  // Drag-to-calibrate the help card, keyed by each stop's own selector (not
  // its index) so the saved position stays attached to the right stop even
  // if HELP_STOPS gets reordered later. Saved to localStorage immediately —
  // "keep it forever" — the same pattern as the tap icon's earlier drag pass.
  const [helpCardPositions, setHelpCardPositions] = useState(() => loadState(HELP_CARD_POSITIONS_KEY, {}))
  const helpDragRef = useRef(null)
  const helpDragRafRef = useRef(null)

  function handleHelpCardPointerDown(event) {
    const stop = helpIndex != null ? HELP_STOPS[helpIndex] : null
    if (!stop || !effectiveHelpCardPos) return
    helpDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originTop: effectiveHelpCardPos.top,
      originLeft: effectiveHelpCardPos.left,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleHelpCardPointerMove(event) {
    if (!helpDragRef.current) return
    helpDragRef.current.lastX = event.clientX
    helpDragRef.current.lastY = event.clientY
    if (helpDragRafRef.current != null) return
    helpDragRafRef.current = requestAnimationFrame(() => {
      helpDragRafRef.current = null
      const drag = helpDragRef.current
      if (!drag) return
      const stop = helpIndex != null ? HELP_STOPS[helpIndex] : null
      if (!stop) return
      setHelpCardPositions((positions) => ({
        ...positions,
        [stop.selector]: {
          top: drag.originTop + (drag.lastY - drag.startY),
          left: drag.originLeft + (drag.lastX - drag.startX),
        },
      }))
    })
  }

  function handleHelpCardPointerUp(event) {
    helpDragRef.current = null
    if (helpDragRafRef.current != null) {
      cancelAnimationFrame(helpDragRafRef.current)
      helpDragRafRef.current = null
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // pointer capture may already be gone
    }
    setHelpCardPositions((positions) => {
      saveState(HELP_CARD_POSITIONS_KEY, positions)
      return positions
    })
  }

  // "tap-create" highlights the real +Create button until she clicks it herself.
  useEffect(() => {
    if (step !== 'tap-create') return

    function measure() {
      const el = document.querySelector(CREATE_BUTTON_SELECTOR)
      setRect(el ? el.getBoundingClientRect() : null)
    }

    const el = document.querySelector(CREATE_BUTTON_SELECTOR)
    function onClick() {
      setStep('create')
    }
    el?.addEventListener('click', onClick)

    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    // capture: true — scrolling inside a nested container (e.g. a column)
    // doesn't bubble a 'scroll' event up to window, but it does fire during
    // the capture phase, so this still catches it and keeps the highlight
    // box glued to the button instead of drifting away as the page scrolls.
    window.addEventListener('scroll', measure, true)
    return () => {
      el?.removeEventListener('click', onClick)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // "board" spotlights her new ticket sitting in its column, right where the
  // modal used to be — the DOM node only exists once the modal has closed
  // and the board underneath has re-rendered with the new card in it. The
  // card can easily be scrolled out of view (column's own vertical scroll,
  // or the board's horizontal scroll), so we scroll it into view first and
  // wait for that scroll to settle before measuring — otherwise the
  // highlight box gets drawn at the card's old, off-screen position.
  useEffect(() => {
    if (step !== 'board') return
    let settleTimer = null

    function measureNow() {
      const el = document.querySelector(CREATED_TICKET_SELECTOR)
      setBoardCardRect(el ? el.getBoundingClientRect() : null)
    }

    function scrollThenMeasure() {
      const el = document.querySelector(CREATED_TICKET_SELECTOR)
      if (!el) {
        setBoardCardRect(null)
        return
      }
      setBoardCardRect(null)
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      settleTimer = setTimeout(measureNow, 500)
    }

    const raf = requestAnimationFrame(scrollThenMeasure)
    window.addEventListener('resize', measureNow)
    // capture: true — see the tap-create step above for why this is needed
    // to track scrolling inside a nested container, not just the window.
    window.addEventListener('scroll', measureNow, true)
    return () => {
      cancelAnimationFrame(raf)
      if (settleTimer) clearTimeout(settleTimer)
      window.removeEventListener('resize', measureNow)
      window.removeEventListener('scroll', measureNow, true)
    }
  }, [step])

  function handleTicketCreated(newTicket) {
    setCreatedKey(newTicket.key)
    setStep('complete')
  }

  // The Help button inside the real modal is optional — only opens the
  // walkthrough if she asks for it, never forced. Listens on the document
  // and checks the clicked element at click-time (rather than grabbing the
  // button once when this step starts), since the modal — and the button
  // inside it — mounts asynchronously right as this step begins, and a
  // one-time querySelector can run before it exists.
  useEffect(() => {
    if (step !== 'create') return
    function onDocClick(event) {
      if (event.target.closest(HELP_BUTTON_SELECTOR)) {
        setHelpIndex(0)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [step])

  // Until she's clicked "Show me how" at least once, the rest of the modal
  // is dimmed and blocked — first-time ticket creation should funnel her
  // into the walkthrough rather than let her poke at fields she hasn't been
  // shown yet.
  useEffect(() => {
    if (step !== 'create' || helpIndex != null) {
      setHelpButtonRect(null)
      return
    }

    function measure() {
      const el = document.querySelector(HELP_BUTTON_SELECTOR)
      setHelpButtonRect(el ? el.getBoundingClientRect() : null)
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
  }, [step, helpIndex])

  // Stop the Help button's attention-grabbing bump once she's actually
  // inside the walkthrough — it did its job getting her to click it, and
  // pulsing away in the corner while she's reading is just distracting now.
  useEffect(() => {
    if (step !== 'create') return
    const el = document.querySelector(HELP_BUTTON_SELECTOR)
    if (!el) return
    el.style.animation = helpIndex != null ? 'none' : ''
    return () => {
      el.style.animation = ''
    }
  }, [step, helpIndex])

  useEffect(() => {
    if (helpIndex == null) return
    const stop = HELP_STOPS[helpIndex]
    // Several consecutive stops can share the same trigger (e.g. the four type
    // options) — only open it when it isn't already open for this same
    // trigger, and close whatever WAS open first if this stop needs a
    // different one (or none). Based on openTriggerRef (what's actually
    // open right now), not on array-adjacent stops — comparing against
    // HELP_STOPS[helpIndex ± 1] only gives the right answer when navigating
    // forward; going backward it was asking about the wrong neighbor and
    // could leave a dropdown open, or fail to reopen one, either way
    // leaving that stop's highlight measuring nothing.
    if (openTriggerRef.current && openTriggerRef.current !== stop.triggerSelector) {
      document.querySelector(openCloseSelectorRef.current)?.click()
      openTriggerRef.current = null
      openCloseSelectorRef.current = null
    }
    const justOpened = Boolean(stop.triggerSelector) && openTriggerRef.current !== stop.triggerSelector
    const selectors =
      stop.dropdownSelector && stop.dropdownSelector !== stop.selector
        ? [stop.selector, stop.dropdownSelector]
        : [stop.selector]

    function measure() {
      const rects = selectors
        .map((s) => document.querySelector(s))
        .filter(Boolean)
        .map((el) => {
          const rect = el.getBoundingClientRect()
          const radius = stop.highlightRadius ?? Math.min(parseFloat(getComputedStyle(el).borderRadius) || 0, 8)
          rect.radius = radius
          rect.padding = stop.highlightPadding ?? 0
          return rect
        })
      setHelpRects(rects)
      const closeEl = document.querySelector(CLOSE_BUTTON_SELECTOR)
      setHelpCloseRect(closeEl ? closeEl.getBoundingClientRect() : null)
    }

    // Opens the real dropdown so she sees the actual options, and fills in a
    // suggested example on the summary field — both optional demonstrations,
    // not required before she can move on.
    if (justOpened) {
      document.querySelector(stop.triggerSelector)?.click()
      openTriggerRef.current = stop.triggerSelector
      openCloseSelectorRef.current = stop.closeSelector
    }
    if (stop.suggestTitle) {
      const el = document.querySelector(stop.selector)
      if (el && !el.value) setNativeInputValue(el, stop.suggestTitle)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    // Opening the dropdown above triggers a React state update in
    // CreateIssueModal, which mounts the dropdown's real DOM asynchronously —
    // a single requestAnimationFrame isn't a guaranteed wait for that render
    // to land, so measure() could run before the dropdown option actually
    // exists and quietly come back with an empty highlight. Re-measuring
    // once more after a short settle catches it on the (intermittent) slow
    // renders instead of leaving the highlight missing for that stop.
    const settleTimer = setTimeout(measure, 300)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    setHelpRevealed(true)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      // The suggested example is just a demonstration — clear it back to an
      // empty Summary once she moves past this stop, so Practice still means
      // typing her own title, not accepting the placeholder we showed her.
      if (stop.suggestTitle) {
        const el = document.querySelector(stop.selector)
        if (el && el.value === stop.suggestTitle) setNativeInputValue(el, '')
      }
      // Deliberately NOT closing the dropdown here — that now happens at the
      // start of whichever stop's effect runs next (via the openTriggerRef
      // comparison above), which works correctly regardless of navigation
      // direction. Only exception is leaving the walkthrough entirely,
      // handled by the effect below.
    }
  }, [helpIndex])

  // Closes whatever dropdown is left open when the walkthrough itself ends
  // (Got it on the last stop, or the modal closing outright) — nothing
  // later runs to do this otherwise, since it's not tied to any stop.
  useEffect(() => {
    if (helpIndex != null) return
    if (openTriggerRef.current) {
      document.querySelector(openCloseSelectorRef.current)?.click()
      openTriggerRef.current = null
      openCloseSelectorRef.current = null
    }
  }, [helpIndex])

  // Real card height (text wraps differently per stop) so the button can be
  // truly vertically centered against it, not just offset by a guess.
  useLayoutEffect(() => {
    if (helpIndex == null || !helpCardRef.current) return
    const { width, height } = helpCardRef.current.getBoundingClientRect()
    if (height) setHelpCardHeight(height)
    if (width) setHelpCardWidth(width)
  })

  function nextHelpStop() {
    if (helpIndex < HELP_STOPS.length - 1) {
      setHelpIndex((i) => i + 1)
    } else {
      setHelpIndex(null)
    }
  }

  function previousHelpStop() {
    if (helpIndex > 0) {
      setHelpIndex((i) => i - 1)
    }
  }

  const workspace = useMemo(
    () => (
      <JiraWorkspace
        learnerId={learnerId}
        learner={learner}
        showSidebar={false}
        showTabs={true}
        onTicketCreated={handleTicketCreated}
        highlightTicketKey={createdKey}
        onLogout={onLogout}
        // Real Jira closes the create modal on an outside click — that's
        // fine everywhere else, but while she's mid-tutorial actually
        // creating this exact ticket, an accidental outside click shouldn't
        // silently dismiss it and strand the walkthrough.
        disableCreateModalDismiss={step === 'tap-create' || step === 'create'}
        // The modal's own X, separately: while the "Show me how" explanation
        // is up, it exits ONLY the explanation (not the whole ticket card) —
        // the rest of ticket creation keeps its normal close behavior.
        createModalHelpActive={helpIndex != null}
        onExitCreateModalHelp={() => setHelpIndex(null)}
        onOpenCreateModalHelp={() => setHelpIndex(0)}
        // Search and profile aren't needed anywhere in this module and get
        // genuinely disabled, same as the other modules — Create is
        // deliberately left alone (disableTopBarActions never touches it):
        // this module's own tap-create/"Show me how" overlays need the real
        // button to stay clickable.
        disableTopBarActions
      />
    ),
    [learnerId, learner, createdKey, onLogout, panelCollapsed, step, helpIndex],
  )

  const tapMessagePos =
    step === 'tap-create' && rect
      ? tapMessageOffset
        ? { top: rect.top + tapMessageOffset.top, left: rect.left + tapMessageOffset.left }
        : positionBelow(rect)
      : null

  // Where the help card would sit by default (based on the real field's
  // position), before any manual drag override is applied.
  const currentHelpStop = helpIndex != null ? HELP_STOPS[helpIndex] : null
  const helpFocusRect = unionOf(helpRects)
  const helpRightOfDropdown = Boolean(currentHelpStop?.dropdownSelector)
  const helpButtonGap = 12
  const computedHelpCardTop = helpFocusRect
    ? helpRightOfDropdown
      ? helpFocusRect.top
      : helpFocusRect.bottom + 12
    : 120
  const computedHelpCardLeft = helpFocusRect
    ? helpRightOfDropdown
      ? helpFocusRect.right + 28
      : Math.max(CARD_MARGIN, helpFocusRect.left)
    : Math.max(CARD_MARGIN, window.innerWidth / 2 - CARD_WIDTH / 2)
  const effectiveHelpCardPos = currentHelpStop
    ? helpCardPositions[currentHelpStop.selector] ?? { top: computedHelpCardTop, left: computedHelpCardLeft }
    : null

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

        @keyframes tourFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.06); }
        }
        .tour-float { animation: tourFloat 3s ease-in-out infinite; }

        .tour-help-glow { box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.6); }
      `}</style>

      <ModuleProgressBar
        moduleNumber={2}
        title="Creating Your First Issue"
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
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={VIDEO_CARD_CLASSNAME}>
            <video
              ref={setupSilentVideo}
              src={createTicketVideo}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(event) => event.preventDefault()}
              className="h-48 w-full flex-shrink-0 object-cover sm:h-full sm:w-96"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 text-left sm:px-12 sm:py-10">
              <p className="text-2xl font-semibold text-gray-900">Create your own ticket</p>
              <button
                type="button"
                onClick={() => setStep('tap-create')}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'tap-create' && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <InteractiveHoleBackdrop hole={rect} />
          {rect ? (
            <div
              className="tour-spotlight pointer-events-none absolute rounded-lg"
              style={{ top: rect.top - 2, left: rect.left - 2, width: rect.width + 4, height: rect.height + 4 }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}

          {tapMessagePos && (
            <div
              className="pointer-events-auto absolute w-max max-w-xs select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
              style={{ top: tapMessagePos.top, left: tapMessagePos.left }}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Click this button to create a ticket.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Before she's opened "Show me how" once, the rest of the real modal
          is dimmed and blocked — only that button stays clickable, so the
          very first ticket funnels her into the walkthrough instead of
          leaving every field open to poke at unguided. */}
      {step === 'create' && helpIndex == null && !helpAlreadySeen && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <InteractiveHoleBackdrop hole={helpButtonRect} />
          {helpButtonRect ? (
            <div
              className="tour-spotlight create-help-bump pointer-events-none absolute rounded-lg"
              style={{
                top: helpButtonRect.top - 2,
                left: helpButtonRect.left - 2,
                width: helpButtonRect.width + 4,
                height: helpButtonRect.height + 4,
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}
        </div>
      )}

      {/* Optional help walkthrough — only appears if she clicks the "?" in the
          real modal, walking through WEB key → Type → Summary → Assignee → Sprint. */}
      {step === 'create' && helpIndex != null && helpRevealed && (
        // pointer-events-none at this level (like the tap-create overlay
        // above), with a full-screen pointer-events-auto blocker beneath —
        // no hole anywhere. The modal's own X used to get a punched hole so
        // it stayed clickable, but a disabled <button> gets pointer-events:
        // none from the browser itself, so a click there doesn't just get
        // ignored — it falls straight through the hole to whatever real
        // element sits underneath (a dropdown option, a dropdown's own
        // outside-click backdrop), silently selecting/closing it. That real
        // DOM node then vanished out from under the highlight's measurement,
        // leaving the highlight box empty on the next stop. Now that the X
        // is always disabled during this phase, nothing here needs to stay
        // clickable — Back/Next (SplitStepButton) sets its own
        // pointer-events-auto and is unaffected by this blocker.
        <div className="pointer-events-none fixed inset-0 z-50">
          <div className="pointer-events-auto absolute inset-0" />
          {helpRects.length > 0 ? (
            <>
              {/* One SVG mask dims the whole screen except a hole per real
                  element being explained — the trigger button and its open
                  dropdown are highlighted as two independent shapes, so
                  nothing sitting between them (like Date, Parent) gets
                  swept up by a single oversized bounding box. */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <mask id="module2-help-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {helpRects.map((r, index) => (
                      <rect
                        key={index}
                        x={r.left - r.padding}
                        y={r.top - r.padding}
                        width={r.width + r.padding * 2}
                        height={r.height + r.padding * 2}
                        rx={r.radius + r.padding}
                        fill="black"
                      />
                    ))}
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="black" fillOpacity="0.3" mask="url(#module2-help-mask)" />
              </svg>

              {helpRects.map((r, index) => (
                <div
                  key={index}
                  className="tour-help-glow pointer-events-none absolute"
                  style={{
                    top: r.top - r.padding,
                    left: r.left - r.padding,
                    width: r.width + r.padding * 2,
                    height: r.height + r.padding * 2,
                    borderRadius: r.radius + r.padding,
                  }}
                />
              ))}
            </>
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}

          {effectiveHelpCardPos && (
            <>
              {/* Position frozen at whatever was last calibrated per stop;
                  no longer draggable. */}
              <div
                ref={helpCardRef}
                className="pointer-events-auto absolute w-max max-w-[220px] select-none rounded-lg border-2 border-blue-200 bg-blue-50 p-2.5 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                style={{ top: effectiveHelpCardPos.top, left: effectiveHelpCardPos.left }}
              >
                {/* Exiting the walkthrough happens via the modal's own X
                    next to "Show me how" now — one exit control, not a
                    second one floating on every individual card. */}
                <p className="text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">{currentHelpStop.text}</p>
              </div>

              {/* Split circle — left half Back, right half Next/Got it. Sits
                  outside the card, with a clear gap, vertically centered on
                  its real (measured) height. */}
              <div
                className="absolute"
                style={{
                  top: effectiveHelpCardPos.top + helpCardHeight / 2 - 16,
                  left: effectiveHelpCardPos.left + helpCardWidth + helpButtonGap,
                }}
              >
                <SplitStepButton
                  onBack={previousHelpStop}
                  onNext={nextHelpStop}
                  canGoBack={helpIndex > 0}
                  isLast={helpIndex === HELP_STOPS.length - 1}
                />
              </div>
            </>
          )}
        </div>
      )}

      {step === 'board' && (
        // pointer-events-auto (not -none, like the other overlay steps) —
        // this whole phase is meant to be frozen: just show the message and
        // wait for her to click Continue, not let her click around on the
        // real board underneath while it's up.
        <div className="pointer-events-auto fixed inset-0 z-50">
          {boardCardRect && (
            <>
              <div
                className="tour-help-glow tour-glow pointer-events-none absolute rounded-lg"
                style={{
                  top: boardCardRect.top - 4,
                  left: boardCardRect.left - 4,
                  width: boardCardRect.width + 8,
                  height: boardCardRect.height + 8,
                }}
              />

              <div
                className="absolute w-max max-w-xs rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                style={{ top: boardCardRect.top, left: boardCardRect.right + 16 }}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Here's {createdKey} — your ticket, now on the board.
                </p>
                <button
                  type="button"
                  onClick={onComplete}
                  className="mt-3 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 'complete' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={VIDEO_CARD_CLASSNAME}>
            <video
              ref={setupSilentVideo}
              src={createTicketVideo}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(event) => event.preventDefault()}
              className="h-48 w-full flex-shrink-0 object-cover sm:h-full sm:w-96"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 text-left sm:px-12 sm:py-10">
              <p className="text-2xl font-semibold text-gray-900">
                Nice work — you created your first ticket.
              </p>
              <button
                type="button"
                onClick={() => setStep('board')}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
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
