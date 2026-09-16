import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import JiraWorkspace from '../components/JiraWorkspace'
import ModuleProgressBar, {
  useModulePanelCollapsed,
  MODULE_PANEL_WIDTH,
  MODULE_PANEL_WIDTH_COLLAPSED,
} from '../components/ModuleProgressBar'
import updateTicketVideo from '../assets/update page.mp4'
import completeModule3Video from '../assets/complete_Module_3.mp4'
import { loadState, saveState, recordFirstAction } from '../utils/localStorage'
import { VIDEO_CARD_CLASSNAME } from '../constants/introCard'

const VIDEO_INTRO_POSITION_KEY = 'jiraway-module3-video-intro-position'
const COMPLETE_VIDEO_POSITION_KEY = 'jiraway-module3-complete-video-position'

const TICKET_CARD_SELECTOR = '[data-tour="created-ticket"]'
const BOARD_COLUMNS_SELECTOR = '[data-tour="board-columns-area"]'
const BOARD_TOOLBAR_SELECTOR = '[data-tour="board-toolbar"]'
const COMMENT_INPUT_SELECTOR = '[data-tour="comment-input"]'
const COMMENT_SUBMIT_SELECTOR = '[data-tour="comment-submit"]'

// This video has no narration worth hearing — unlike Module 2's videos, it
// plays silently on loop, so it just needs the Chrome cast/PiP hover overlay
// turned off (disableRemotePlaybackApi is JS-only, can't be set as a JSX prop).
function setupSilentVideo(el) {
  if (!el) return
  el.disableRemotePlaybackApi = true
}

// A fixed "drag it into In Progress" instruction only makes sense the very
// first time — replaying this module later (via "Practice again") can find
// the ticket already sitting in In Progress or Done from her real first
// pass, where that same instruction would be wrong or already satisfied.
// Basing the suggested column on wherever the ticket actually is right now
// keeps this correct either way, instead of hardcoding an assumption about
// her starting point.
function dragStepMessage(ticket) {
  if (ticket?.column === 'To Do') {
    return "Drag your ticket into In Progress — you've started working on it."
  }
  if (ticket?.column === 'In Progress') {
    return "Drag your ticket into Done — you've finished it."
  }
  if (ticket?.column === 'Done') {
    // Already exactly where a finished ticket belongs — nothing further to
    // move it TO, but the practice check below still needs an actual column
    // change to detect the drag, so this is honest about why rather than
    // implying there's a "right" column left to find.
    return "Your ticket's already Done — drag it to a different column, just to practice moving it."
  }
  return 'Drag your ticket into whichever column matches where it actually stands right now.'
}

const CARD_WIDTH = 240
const CARD_MARGIN = 16

// Rough height of the comment explanation card (3 lines of text + padding)
// — used to decide whether it fits below the textarea or needs to flip above.
const COMMENT_CARD_HEIGHT_ESTIMATE = 100

function positionBelow(rect) {
  if (!rect) return null
  const viewportWidth = window.innerWidth
  let left = rect.left + rect.width / 2 - CARD_WIDTH / 2
  left = Math.max(CARD_MARGIN, Math.min(left, viewportWidth - CARD_WIDTH - CARD_MARGIN))
  return { top: rect.bottom + 12, left }
}

// Message card sits to the right of the ticket by default (max-w-xs, 320px)
// — but when the ticket is in a column near the right edge (Done, most
// commonly), that overflows past the viewport and gets clipped. Flip to the
// left of the ticket instead whenever there isn't room on the right.
const STATUS_CARD_WIDTH = 320

function leftOfCard(rect, width = STATUS_CARD_WIDTH, gap = 12) {
  if (!rect) return 0
  const viewportWidth = window.innerWidth
  const fitsRight = rect.right + gap + width <= viewportWidth - CARD_MARGIN
  return fitsRight ? rect.right + gap : Math.max(CARD_MARGIN, rect.left - width - gap)
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

// Drag-to-calibrate which part of a video shows through its object-cover
// crop — only the video's own internal framing moves, never the container
// around it. Saved to localStorage immediately on release so it survives
// reloads. Shared by every video on this screen that needs this (each gets
// its own storageKey, so their positions don't collide).
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

export default function Module3({ learnerId, learner, onComplete, onLogout, isReplay = false, onSelectModule, onBackToWorkspace, onChooseModule }) {
  const [panelCollapsed, togglePanelCollapsed] = useModulePanelCollapsed()
  const [step, setStep] = useState('intro')
  // Time-to-first-action tracking for the admin Learners list — see
  // Module1.jsx's identical hook for the full reasoning.
  const moduleMountTimeRef = useRef(Date.now())
  const firstActionRecordedRef = useRef(false)
  useEffect(() => {
    if (step === 'intro' || firstActionRecordedRef.current) return
    firstActionRecordedRef.current = true
    recordFirstAction(learnerId, 'module3', Date.now() - moduleMountTimeRef.current)
  }, [step, learnerId])
  const [ticketActions, setTicketActions] = useState(null)
  const [cardRect, setCardRect] = useState(null)
  const [boardRect, setBoardRect] = useState(null)
  const [toolbarRect, setToolbarRect] = useState(null)
  const [commentRects, setCommentRects] = useState([])
  const [commentSubmitRect, setCommentSubmitRect] = useState(null)
  const [statusAtEntry, setStatusAtEntry] = useState(null)
  const [commentCountAtEntry, setCommentCountAtEntry] = useState(null)
  // .at(-1), not .find() — tickets are appended on creation (see
  // useTicketStore's createTicket), so the last non-seed entry is the one
  // she most recently made. Matters once more than one exists (e.g. testing
  // Module 2 more than once leaves earlier tickets sitting on the board) —
  // .find() would silently keep tracking the oldest one instead of the
  // current one, and this `ticket` drives both the spotlight highlight and
  // every status/comment action below, so a stale pick here breaks both.
  const ticket = ticketActions?.allTickets?.filter((entry) => !entry.isSeed).at(-1) ?? null

  const introVideoPan = useVideoPan(VIDEO_INTRO_POSITION_KEY)
  const completeVideoPan = useVideoPan(COMPLETE_VIDEO_POSITION_KEY)

  // This module works on the ticket Module 2 creates — normally that already
  // exists by the time she gets here. Entering directly via "Practice again"
  // skips Module 2 entirely though, so there'd be no ticket at all and this
  // screen would sit on "intro" forever waiting for one. Falls back to
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

  // Straight to the video-intro screen the moment the ticket exists — no
  // artificial pause first.
  useEffect(() => {
    if (step !== 'intro' || !ticket) return
    setStep('video-intro')
  }, [step, ticket])

  // "status" — spotlight her ticket's real card on the board and have her
  // drag it into a different column, exactly like real Jira: the board is
  // where status actually lives, not a dropdown buried in a panel. Shares
  // the same measure logic as "open-ticket" below since both just track
  // that one card's position.
  useEffect(() => {
    if (step !== 'status' && step !== 'open-ticket') return

    // The board can easily have her ticket scrolled out of frame (any column
    // taller than the viewport, or the card just sitting further down) —
    // bring it into view before measuring instead of leaving her to find it
    // herself, same as every other spotlighted step in this app.
    const el = document.querySelector(TICKET_CARD_SELECTOR)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    function measure() {
      const el = document.querySelector(TICKET_CARD_SELECTOR)
      setCardRect(el ? el.getBoundingClientRect() : null)
      // Only "status" needs the whole board interactive — dragging has to be
      // able to drop on any column, not just the one the card started in.
      // "open-ticket" only needs a click on the card itself, so it keeps the
      // tight hole.
      if (step === 'status') {
        const boardEl = document.querySelector(BOARD_COLUMNS_SELECTOR)
        setBoardRect(boardEl ? boardEl.getBoundingClientRect() : null)
        // The whole-board hole above is for dropping the drag anywhere on
        // the board — it doesn't cover the toolbar row above it (search,
        // avatar filter, Filter, Complete sprint, Group, etc.), but that row
        // still needs its own explicit block, same reasoning BacklogDemo's
        // HeaderClickBlocker already uses for its own sticky header.
        const toolbarEl = document.querySelector(BOARD_TOOLBAR_SELECTOR)
        setToolbarRect(toolbarEl ? toolbarEl.getBoundingClientRect() : null)
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
    // capture: true — scrolling inside a nested container (e.g. a board
    // column) doesn't bubble a 'scroll' event up to window, but it does fire
    // during the capture phase, so this still catches it and keeps the
    // highlight box glued to the ticket instead of drifting away on scroll.
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settleTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  // Remember her status the moment she reaches this step, so we can tell
  // once she's actually changed it (to whichever column she drags it into).
  useEffect(() => {
    if (step !== 'status') return
    setStatusAtEntry(ticket?.column ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    if (step !== 'status' || statusAtEntry == null || !ticket) return
    if (ticket.column !== statusAtEntry) {
      setStep('open-ticket')
    }
  }, [step, statusAtEntry, ticket])

  // "open-ticket" — now that status is updated, she has to actually click
  // her ticket to open it for real before "comment" can spotlight anything
  // inside it (the panel doesn't exist until she opens it). Delegated on
  // document rather than grabbing the card element once — the drag that just
  // happened re-mounts the card in a different column's DOM, so a single
  // querySelector taken when this step starts can easily miss it or hold a
  // stale reference, leaving clicks silently do nothing.
  useEffect(() => {
    if (step !== 'open-ticket') return
    function onDocClick(event) {
      if (event.target.closest(TICKET_CARD_SELECTOR)) {
        setStep('comment')
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [step])

  // "comment" — spotlight only the real comment textarea inside the same
  // real ticket panel. The Comment button is deliberately left unhighlighted
  // now that it's always visible (just disabled until she types).
  //
  // useLayoutEffect, not useEffect: useEffect runs after the browser has
  // already painted, so on the render where `step` first becomes 'comment',
  // it could paint one frame with the stale (empty) commentRects from
  // before — showing the "open your ticket again" fallback below — and only
  // fix it a moment later. Measuring before paint closes that gap.
  useLayoutEffect(() => {
    if (step !== 'comment') return

    function measure() {
      const el = document.querySelector(COMMENT_INPUT_SELECTOR)
      if (!el) {
        setCommentRects([])
        setCommentSubmitRect(null)
        return
      }
      setCommentRects([el.getBoundingClientRect()])
      // Measured separately from the highlight above — the button itself
      // isn't spotlighted, but the message card still needs to sit below it
      // (not below the textarea alone), or it overlaps the button.
      const submitEl = document.querySelector(COMMENT_SUBMIT_SELECTOR)
      setCommentSubmitRect(submitEl ? submitEl.getBoundingClientRect() : null)
    }

    // Deferred a frame: the native 'input' event fires before React has
    // re-rendered, so measuring synchronously here can still see the old
    // Comment button in the DOM the instant she clears the textarea back to
    // empty (it hasn't unmounted yet) — leaving a stale highlight box behind
    // once React actually removes it. Waiting a frame lets that render land
    // first, so the measurement matches what's really on screen.
    function measureOnInput() {
      requestAnimationFrame(measure)
    }
    const inputEl = document.querySelector(COMMENT_INPUT_SELECTOR)
    inputEl?.addEventListener('input', measureOnInput)
    // The panel scrolls internally, and the comment box can sit below the
    // fold — bring it into view automatically instead of leaving her to
    // scroll the panel herself to find it. Instant, not smooth — a smooth
    // scroll here is the one remaining thing that happens "in between"
    // opening the ticket and the comment box actually being visible.
    inputEl?.scrollIntoView({ behavior: 'instant', block: 'center' })

    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      inputEl?.removeEventListener('input', measureOnInput)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [step])

  useEffect(() => {
    if (step !== 'comment') return
    setCommentCountAtEntry(ticket?.comments?.length ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  useEffect(() => {
    // commentCountAtEntry == null (not just falsy) — on the very render
    // where `step` first becomes 'comment', this effect and the capture
    // effect above both fire in the same commit; this one still closes
    // over the OLD commentCountAtEntry from before that render's
    // setCommentCountAtEntry call takes effect. Defaulting the state to 0
    // made that stale read indistinguishable from "genuinely zero
    // comments" — harmless the first time (both really are 0), but on a
    // replay where the ticket already has a comment from her first pass,
    // the stale 0 made any pre-existing comment look like a brand new one,
    // skipping straight to "complete" without her adding anything. null as
    // the "not captured yet" sentinel (same pattern statusAtEntry already
    // uses above) closes that gap.
    if (step !== 'comment' || commentCountAtEntry == null || !ticket) return
    if ((ticket.comments?.length ?? 0) > commentCountAtEntry) {
      setStep('complete')
    }
  }, [step, commentCountAtEntry, ticket])

  const workspace = useMemo(
    () => (
      <JiraWorkspace
        learnerId={learnerId}
        learner={learner}
        showSidebar={false}
        showTabs={true}
        // This module's whole flow is a Board-only tutorial — no step ever
        // legitimately needs another tab or Complete Sprint. The tour's own
        // pixel-based click-blocking overlay covers the same ground, but a
        // real prop-level disable here is what actually stops the click,
        // instead of relying solely on an overlay hole never having a gap.
        restrictTabsToView="board"
        disableCompleteSprint
        disableSearchAndFilter
        disableTopBarActions
        highlightTicketKey={ticket?.key ?? null}
        // During the drag-to-column step, clicking the ticket should do
        // nothing — only the drag matters here. Detail-panel opening is
        // taught explicitly one step later ("Click your ticket to open
        // it."), so this only suppresses the click for this one step.
        disableClickTicketKey={step === 'status' ? ticket?.key ?? null : null}
        // The whole board (every column) is left interactive during this
        // step so she can actually drop the ticket in any column — but that
        // also left every ticket's own inner buttons (assignee, epic,
        // ellipsis menu, subtasks) clickable, on her ticket AND everyone
        // else's, which could fire unrelated real mutations mid-tutorial.
        // Only the drag gesture itself should do anything here.
        disableCardActions={step === 'status'}
        // Only her own ticket should actually be draggable during this
        // step — everyone else's tickets can still sit in the interactive
        // board area (needed so she can drop onto any column), but they
        // shouldn't be pick-up-able themselves. Normal workspace use
        // (outside a module) passes null here, so every ticket stays
        // draggable as usual.
        // '__none__' (not null) while the real ticket hasn't resolved yet —
        // Board reads null as "no restriction, everything draggable," so
        // falling back to null here during that brief gap (right as this
        // step starts, before ticketActions has populated) let any ticket
        // be dragged instead of just hers. A sentinel that matches nothing
        // keeps every ticket locked until the real key is known.
        restrictDragToKey={step === 'status' ? ticket?.key ?? '__none__' : null}
        onExposeActions={setTicketActions}
        onLogout={onLogout}
      />
    ),
    [learnerId, learner, ticket?.key, onLogout, step === 'comment', step === 'status', panelCollapsed],
  )

  const commentUnion = unionOf(commentRects)
  // Textarea + button together — used for dimming/click-through so the
  // button reads at full color and stays clickable, even though only the
  // textarea (commentRects) gets the blue glow ring drawn around it below.
  const commentInteractiveHole = unionOf(commentSubmitRect ? [...commentRects, commentSubmitRect] : commentRects)
  // Left-aligned to the textarea's own left edge (not centered under the
  // button) — the card should start from the same left edge as the comment
  // box, not drift right just because the button happens to sit at the
  // textarea's right end. Still positioned below the button when it's on
  // screen, not just the textarea, so the card never overlaps it.
  //
  // On a replay with several existing comments, the textarea sits further
  // down the panel and there may be no room below it at all — clamping the
  // card's top in that case (as before) just slid it up onto the textarea
  // itself, hiding the very thing it's meant to explain. Flip above the
  // textarea instead whenever it wouldn't fully fit below.
  const commentCardPos = commentUnion
    ? (() => {
        const preferredTop = (commentSubmitRect ?? commentUnion).bottom + 12
        const fitsBelow = preferredTop + COMMENT_CARD_HEIGHT_ESTIMATE <= window.innerHeight - CARD_MARGIN
        const top = fitsBelow
          ? preferredTop
          : Math.max(CARD_MARGIN, commentUnion.top - COMMENT_CARD_HEIGHT_ESTIMATE - 12)
        return {
          top,
          left: Math.max(CARD_MARGIN, Math.min(commentUnion.left, window.innerWidth - CARD_WIDTH - CARD_MARGIN)),
        }
      })()
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
        .tour-help-glow { box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.6); }
      `}</style>

      <ModuleProgressBar
        moduleNumber={3}
        title="Updating Progress"
        onLogout={onLogout}
        collapsed={panelCollapsed}
        onToggleCollapsed={togglePanelCollapsed}
        hideEarlierProgress={isReplay}
        onSelectModule={onSelectModule}
        onBackToWorkspace={onBackToWorkspace}
        onChooseModule={onChooseModule}
      />

      {workspace}

      {step === 'intro' && <div className="pointer-events-auto fixed inset-0 z-50" />}

      {step === 'video-intro' && (
        <div
          className="fixed inset-y-0 right-0 z-50 flex items-center justify-center bg-black/40 p-6"
          style={{ left: panelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH }}
        >
          <div className={VIDEO_CARD_CLASSNAME}>
            <video
              ref={(el) => {
                introVideoPan.elRef.current = el
                setupSilentVideo(el)
              }}
              src={updateTicketVideo}
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
              <p className="text-2xl font-semibold text-gray-900">Update your ticket</p>
              <p className="mt-2 text-sm text-gray-500">
                Each column is a stage of work — To Do, In Progress, Done. Drag your ticket to
                the column that matches where it actually stands, then leave a quick comment.
              </p>
              <button
                type="button"
                onClick={() => setStep('status')}
                className="mt-6 w-max rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'status' && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {/* Hole covers the whole board, not just the card — dragging has
              to be able to drop on any column, so only the card's own visual
              spotlight below is scoped to just her ticket. */}
          <InteractiveHoleBackdrop hole={boardRect} />
          {cardRect ? (
            <>
              {/* Split into two stacked elements — combining tour-spotlight
                  (the constant 9999px dark backdrop) with tour-glow on one
                  element doesn't work, since the glow's own animated
                  box-shadow keyframes override the static one for the whole
                  animation, silently cancelling the backdrop the entire time. */}
              <div
                className="tour-spotlight pointer-events-none absolute rounded-lg"
                style={{ top: cardRect.top - 2, left: cardRect.left - 2, width: cardRect.width + 4, height: cardRect.height + 4 }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-lg"
                style={{ top: cardRect.top - 2, left: cardRect.left - 2, width: cardRect.width + 4, height: cardRect.height + 4 }}
              />
              <div
                className="absolute w-max max-w-xs rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                style={{ top: cardRect.top, left: leftOfCard(cardRect) }}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{dragStepMessage(ticket)}</p>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}
        </div>
      )}

      {step === 'open-ticket' && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <InteractiveHoleBackdrop hole={cardRect} />
          {cardRect ? (
            <>
              <div
                className="tour-spotlight pointer-events-none absolute rounded-lg"
                style={{ top: cardRect.top - 2, left: cardRect.left - 2, width: cardRect.width + 4, height: cardRect.height + 4 }}
              />
              <div
                className="tour-glow pointer-events-none absolute rounded-lg"
                style={{ top: cardRect.top - 2, left: cardRect.left - 2, width: cardRect.width + 4, height: cardRect.height + 4 }}
              />
              <div
                className="absolute w-max max-w-xs rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                style={{ top: cardRect.top, left: leftOfCard(cardRect, 240, 5) }}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Click your ticket to open it.
                </p>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-black/25" />
          )}
        </div>
      )}

      {step === 'comment' && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <InteractiveHoleBackdrop hole={commentInteractiveHole} />
          {commentRects.length > 0 ? (
            <>
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <mask id="module3-mask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    {commentRects.map((r, index) => (
                      <rect key={index} x={r.left - 4} y={r.top - 4} width={r.width + 8} height={r.height + 8} rx="6" fill="black" />
                    ))}
                    {commentSubmitRect && (
                      <rect
                        x={commentSubmitRect.left - 4}
                        y={commentSubmitRect.top - 4}
                        width={commentSubmitRect.width + 8}
                        height={commentSubmitRect.height + 8}
                        rx="6"
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" fill="black" fillOpacity="0.3" mask="url(#module3-mask)" />
              </svg>

              {commentRects.map((r, index) => (
                <div
                  key={index}
                  className="tour-help-glow pointer-events-none absolute rounded-md"
                  style={{ top: r.top - 4, left: r.left - 4, width: r.width + 8, height: r.height + 8 }}
                />
              ))}

              {commentCardPos && (
                <div
                  className="pointer-events-auto absolute flex w-max max-w-[240px] items-start gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 p-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
                  style={{ top: commentCardPos.top, left: commentCardPos.left }}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Add a quick comment — like "Started this today." — so your team can follow along.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <div className="pointer-events-auto rounded-lg border border-gray-200 bg-white p-4 text-center shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Open your ticket again to continue.</p>
                <button
                  type="button"
                  onClick={() => setStep('open-ticket')}
                  className="mt-3 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Back to board
                </button>
              </div>
            </div>
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
              ref={(el) => {
                completeVideoPan.elRef.current = el
                setupSilentVideo(el)
              }}
              src={completeModule3Video}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(event) => event.preventDefault()}
              style={{ objectPosition: `${completeVideoPan.pan.x}% ${completeVideoPan.pan.y}%` }}
              className="h-48 w-full flex-shrink-0 select-none object-cover sm:h-full sm:w-96"
            />
            <div className="flex min-w-0 flex-1 flex-col justify-center px-6 py-6 text-left sm:px-8 sm:py-10">
              <p className="text-2xl font-semibold text-gray-900">Nice work — your ticket's updated.</p>
              <button
                type="button"
                onClick={onComplete}
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
