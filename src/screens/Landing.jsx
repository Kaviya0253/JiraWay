import { useState, useRef } from 'react'
import { setCurrentLearner, loadState, saveState } from '../utils/localStorage'
import landingVideo from '../assets/landingpage.mp4'
import problemImage from '../assets/new problem image.png'
import solutionImage from '../assets/solution.png'

const LANDING_VIDEO_PAN_KEY = 'jiraway-landing-video-pan'
// Fixed width for the Learn/Practice/Apply block — no longer resizable.
const LPA_DEFAULT_WIDTH = 384

// Calibrated once by dragging in the browser, then locked in here — the
// video no longer moves or resizes interactively.
const LANDING_VIDEO_POSITION = { top: -30, left: -116.125 }
const LANDING_VIDEO_SIZE = { width: 881, height: 557 }

// Drag-to-calibrate which part of the video shows through its object-cover
// crop — only the video's own internal framing moves, never the box around
// it. Saved to localStorage immediately on release so it survives reloads.
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

// No sound, so this just needs to stop Chrome's hover overlay (cast /
// picture-in-picture icon) — disablePictureInPicture is a real HTML
// attribute, but disableRemotePlaybackApi is JS-only, so it has to be set
// here rather than as a JSX prop.
function setupSilentVideo(el) {
  if (!el) return
  el.disableRemotePlaybackApi = true
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function BriefcaseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
      <path d="M3 12h18" />
    </svg>
  )
}

function MicIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    </svg>
  )
}

function GraduationCapIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m2 8 10-5 10 5-10 5-10-5Z" strokeLinejoin="round" />
      <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 8v6" strokeLinecap="round" />
    </svg>
  )
}

function PersonOutlineIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  )
}

function CursorClickIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6 3 10.5 15 12 10l5-1.5L6 3Z" strokeLinejoin="round" />
      <path d="M13 13 17.5 17.5" strokeLinecap="round" />
    </svg>
  )
}

function TicketIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.25a1.25 1.25 0 0 0 0 2.5V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.25a1.25 1.25 0 0 0 0-2.5V9Z"
        strokeLinejoin="round"
      />
      <path d="M9 7.5v9" strokeDasharray="1.8 2.2" strokeLinecap="round" />
    </svg>
  )
}

function TeamBoardIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M9 4v16M14 9h4M14 13.5h4" strokeLinecap="round" />
    </svg>
  )
}

function BoltIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function CompassIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.2 8.8-2 6-6 2 2-6 6-2Z" strokeLinejoin="round" />
    </svg>
  )
}

// A stack of two clipped hexagons — a slightly larger light-blue one behind,
// a slightly smaller deep-blue one in front — reads as a hexagon with a thin
// blue border without fighting the browser's `border` + `clip-path`
// interaction (real borders on a clipped shape often render with soft/
// uneven corners; two solid shapes stacked don't have that problem).
const HEX_CLIP = 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)'

function HexIcon({ icon: Icon }) {
  return (
    <div className="relative h-20 w-20 flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400 to-orange-600" style={{ clipPath: HEX_CLIP }} />
      <div className="absolute inset-[2.5px] bg-gray-900" style={{ clipPath: HEX_CLIP }} />
      <div className="absolute inset-0 flex items-center justify-center text-amber-400">
        <Icon className="h-8 w-8" />
      </div>
    </div>
  )
}

const DIFFERENTIATORS = [
  { icon: CursorClickIcon, title: "You Do It, Not Watch It" },
  { icon: TicketIcon, title: 'One Ticket, One Story' },
  { icon: TeamBoardIcon, title: 'Realistic Team & Backlog' },
  { icon: BoltIcon, title: 'Zero Friction Signup' },
  { icon: CompassIcon, title: 'Guided by Action' },
]

// Full class strings, not composed fragments — Tailwind's JIT scanner only
// generates classes it can see written out literally in source, so
// `bg-${color}-50` would silently produce nothing.
// Frosted-glass panels, one shared neutral look for every card — same white
// glass fill, same blue (the app's own primary color) for every icon and
// accent, rather than a different hue per card. backdrop-blur is what makes
// it read as "glass" (blurring the soft color blobs the section paints
// behind it), not the fill's own color.
const CARD_THEME = {
  cardBg: 'bg-white/40 hover:bg-white/60 dark:bg-white/5 dark:hover:bg-white/10',
  iconBg: 'bg-white/70 backdrop-blur-sm group-hover:bg-white/90 dark:bg-white/10 dark:group-hover:bg-white/20',
  iconText: 'text-blue-600 dark:text-blue-400',
  accent: 'bg-blue-600',
  hoverBorder: 'hover:border-blue-300/70 dark:hover:border-blue-400/40',
}

// Water-drop ripple on click/tap — each card tracks its own tiny set of
// active ripples (usually 0 or 1) since a fast double-click can start a
// second one before the first finishes. A ripple removes itself from state
// once its own animation ends, via a timeout matched to the CSS duration
// below, rather than lingering in the DOM forever.
function AudienceCard({ icon: Icon, text, index }) {
  const theme = CARD_THEME
  const [ripples, setRipples] = useState([])

  function addRipple(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const id = `${Date.now()}-${Math.random()}`
    const ripple = { id, x: event.clientX - rect.left, y: event.clientY - rect.top }
    setRipples((current) => [...current, ripple])
    setTimeout(() => {
      setRipples((current) => current.filter((r) => r.id !== id))
    }, 700)
  }

  return (
    <div
      onPointerDown={addRipple}
      style={{ animation: 'audienceCardIn 0.5s ease-out both', animationDelay: `${index * 90}ms` }}
      className={`group relative flex min-h-[220px] flex-col items-center gap-4 overflow-hidden rounded-2xl border border-white/70 p-8 text-center shadow-lg shadow-black/5 backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl dark:border-white/10 ${theme.cardBg} ${theme.hoverBorder}`}
    >
      {/* Permanent glass sheen — a fixed soft highlight across the top
          third, like light glancing off a curved glass surface, so the
          "frozen glass" read doesn't depend on hovering to notice it. */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/50 to-transparent dark:from-white/10" />
      {/* Mirror/shine sweep — a second, moving highlight that sweeps the
          full card on hover, like a glint traveling across glass. */}
      <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[300%] dark:via-white/20" />
      {/* Water-drop ripple(s) — expands from wherever she actually clicked,
          like a drop landing on the glass, then fades. */}
      {ripples.map((ripple) => (
        <span key={ripple.id} className="pointer-events-none absolute" style={{ left: ripple.x, top: ripple.y }}>
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute text-blue-400/80 dark:text-blue-200/60"
            style={{ width: 22, height: 22, marginLeft: -11, marginTop: -18, animation: 'waterDropFall 550ms ease-in forwards' }}
          >
            <path d="M12 2C12 2 5 11 5 15.5A7 7 0 0 0 19 15.5C19 11 12 2 12 2Z" />
            <ellipse cx="9.5" cy="13" rx="1.4" ry="2" fill="white" opacity="0.5" />
          </svg>
          <span
            className="absolute rounded-full border-2 border-blue-300/60 dark:border-blue-200/40"
            style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5, opacity: 0, animation: 'waterDropRing 650ms 380ms ease-out forwards' }}
          />
        </span>
      ))}
      <span
        className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 ${theme.accent}`}
      />
      <span
        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all duration-300 ease-out group-hover:scale-110 ${theme.iconBg} ${theme.iconText}`}
      >
        <Icon className="h-7 w-7" />
      </span>
      <p className="relative text-base font-medium leading-snug text-gray-700 dark:text-gray-200">{text}</p>
    </div>
  )
}

function PracticeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M9 2h6M10 2v5.5L4.5 18a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 7.5V2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 14.5h11" strokeLinecap="round" />
    </svg>
  )
}

function ApplyIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="m15.5 8.5-4.2 4.2-2-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const LEARN_PRACTICE_APPLY = [
  {
    icon: GraduationCapIcon,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    title: 'LEARN',
    text: 'Just enough explanation, right when you need it.',
  },
  {
    icon: PracticeIcon,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
    title: 'PRACTICE',
    text: 'Make a real ticket. Update it. Learn by doing.',
  },
  {
    icon: ApplyIcon,
    color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    title: 'APPLY',
    text: 'One more time, solo — no hints, just you and Jira.',
  },
]

const AUDIENCE_CARDS = [
  { icon: BriefcaseIcon, text: 'Starting a new job and need to hit the ground running' },
  { icon: MicIcon, text: 'Preparing for an interview where Jira knowledge matters' },
  { icon: GraduationCapIcon, text: 'Studying independently, without access to a real Jira account' },
  { icon: PersonOutlineIcon, text: "Anyone who's watched a tutorial and still felt lost" },
]

// No role picker — whoever logs in with this exact name+email lands as
// admin (unlocks the in-app Learners list), everyone else is a learner.
const ADMIN_NAME = 'kaviya'
const ADMIN_EMAIL = 'kaviyaramanathan587@gmail.com'

export default function Landing({ onContinue }) {
  const videoPan = useVideoPan(LANDING_VIDEO_PAN_KEY)
  // Two stages: a plain branding screen first (logo, name, one-line pitch,
  // the one-time-setup note), then the actual name+email form only once
  // she's chosen to continue — showing both at once crowded the login
  // fields in with everything else, especially once the video sat beside
  // them too.
  const [started, setStarted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const nameValid = name.trim().length > 0
  const emailValid = isValidEmail(email)
  const canContinue = nameValid && emailValid

  function start() {
    if (!nameValid || !emailValid) {
      setTouched(true)
      return
    }
    const isAdmin = name.trim().toLowerCase() === ADMIN_NAME && email.trim().toLowerCase() === ADMIN_EMAIL
    const learner = setCurrentLearner(name, email, isAdmin ? 'admin' : 'learner')
    onContinue(learner)
  }

  const header = (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-6 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
        J
      </span>
      <span className="text-lg font-bold text-gray-900 dark:text-white">JiraWay</span>
    </header>
  )

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white dark:bg-gray-950">
      {header}

      {/* The left-gray/right-white split only makes sense once the video and
          text actually sit side by side (md:flex-row) — on a narrow/stacked
          layout it just cut the page into unrelated-looking patches of
          color behind stacked content, instead of matching what's actually
          next to what. A single flat background below md: avoids that. */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-[20px] bg-white px-6 pt-16 dark:bg-gray-950 md:flex-row md:items-center md:justify-start md:bg-[linear-gradient(to_right,#f6f6f6_0%,#f6f6f6_calc(75%_+_100px),#ffffff_calc(75%_+_300px))] md:pb-6 md:pt-20 dark:md:bg-[linear-gradient(to_right,#030712_0%,#030712_calc(75%_+_100px),#111827_calc(75%_+_300px))]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-white/70 blur-3xl dark:bg-white/5" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-white blur-2xl dark:to-gray-900" />
        </div>
        <div
          className="relative w-full max-w-3xl flex-shrink-0 md:w-2/3 md:max-w-none lg:w-3/4"
          style={{ transform: `translate(${LANDING_VIDEO_POSITION.left}px, ${LANDING_VIDEO_POSITION.top}px)` }}
        >
          <video
            ref={(el) => {
              videoPan.elRef.current = el
              setupSilentVideo(el)
            }}
            src={landingVideo}
            autoPlay
            loop
            muted
            playsInline
            draggable={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={(event) => event.preventDefault()}
            style={{
              objectPosition: `${videoPan.pan.x}% ${videoPan.pan.y}%`,
              border: 'none',
              WebkitUserDrag: 'none',
              width: LANDING_VIDEO_SIZE.width,
              height: LANDING_VIDEO_SIZE.height,
            }}
            // A stray hairline was showing at the video's own edge, source
            // unclear — masking it with a background-colored outline
            // straddling the boundary (via a negative offset) instead of
            // chasing where it actually comes from. Pinned to the video's
            // own actual background color (#f6f6f6, sampled directly from
            // the file) rather than following the page's theme colors —
            // the video itself never gets darker in dark mode, so matching
            // its immediate edge to gray-950 there just traded the hairline
            // seam for a visible dark ring around a still-bright video.
            // Below md:, the page behind it is flat white (not the gray/white
            // split gradient), so this matches white there instead — #f6f6f6
            // on a white page read as a separate gray patch around the video.
            className="outline outline-4 -outline-offset-2 outline-white select-none rounded-xl object-cover bg-white md:outline-[#f6f6f6] md:bg-[#f6f6f6]"
          />
        </div>

        <div className="flex h-full w-full flex-1 items-center justify-start">
        <div className="relative w-full max-w-sm md:-translate-x-[140px]">
          <h1 className="w-max text-3xl font-bold text-gray-900 dark:text-white">JiraWay</h1>
          <p className="mt-3 text-4xl font-bold text-orange-600 dark:text-orange-400">Learn Jira by actually using it.</p>

          {started ? (
            <>
              <button
                type="button"
                onClick={() => setStarted(false)}
                className="mt-8 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4 6 10l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
              </button>

              <label className="mt-3 block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') start()
                }}
                placeholder="Your name"
                className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              {touched && !nameValid && <p className="mt-1 text-xs text-red-600">Enter your name.</p>}

              <label className="mt-3 block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') start()
                }}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              {touched && !emailValid && <p className="mt-1 text-xs text-red-600">Enter a valid email.</p>}

              <button
                type="button"
                onClick={start}
                disabled={!canContinue}
                className={[
                  'mt-4 w-full rounded-md px-3 py-2 text-sm font-medium',
                  canContinue
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
                ].join(' ')}
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm font-medium text-gray-600 dark:text-gray-300">
                A real, working Jira workspace — where you create, update, and move real tickets,
                not watch someone else do it.
              </p>

              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Get Started
              </button>

              {/* Same container as the title/subheading/button above — no
                  longer a separate full-width section, so there's no extra
                  section padding creating a gap between this and the CTA. */}
              <div className="mt-4" style={{ width: LPA_DEFAULT_WIDTH }}>
                <h3 className="mb-3 text-sm font-bold tracking-wide text-blue-600 dark:text-blue-400">
                  The 3-Step Method
                </h3>

                <div className="flex flex-col gap-5">
                  {LEARN_PRACTICE_APPLY.map(({ icon: Icon, color, title, text }) => (
                    <div key={title} className="flex flex-1 items-start gap-2.5">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[linear-gradient(to_bottom,#ffffff_0%,#dbeafe_35%,#ffffff_65%,#dbeafe_100%)] px-6 py-12 dark:bg-[linear-gradient(to_bottom,#111827_0%,#172554_35%,#111827_65%,#172554_100%)] md:px-16">
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400 md:text-3xl">
            Reading about Jira isn't the same as using it.
          </h2>

          <div className="mt-8 flex flex-col items-center gap-8 md:flex-row">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">The Problem</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                Every tutorial ends with <strong className="font-bold text-gray-900/80 dark:text-white/80">"now you understand."</strong> None
                end with <strong className="font-bold text-gray-900/80 dark:text-white/80">"now you can do it."</strong>
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
                You watch, you read, you know what a Board is, what a Sprint is. Then someone
                hands you a real ticket — and <strong className="font-bold text-gray-900/80 dark:text-white/80">you freeze</strong>.
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
                Not because you didn't learn. Because <strong className="font-bold text-gray-900/80 dark:text-white/80">nobody made you practice</strong>.
              </p>
            </div>
            <img
              src={problemImage}
              alt=""
              className="w-full max-w-xs flex-shrink-0 rounded-xl object-cover md:w-64"
            />
          </div>

          <div className="mx-auto mt-4 flex max-w-5xl flex-col items-center gap-8 md:flex-row">
            <img
              src={solutionImage}
              alt=""
              className="w-full max-w-xs flex-shrink-0 rounded-xl object-cover md:w-64"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">The Solution</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
                JiraWay closes the <span className="font-semibold text-blue-600 dark:text-blue-400">Practice Gap</span> — the space between knowing what Jira is and
                actually being able to use it.
              </p>
              <p className="mt-3 text-base text-gray-600 dark:text-gray-300">
                A real workspace from the start. One ticket, all the way through. Tested on
                something brand new.
              </p>
              <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                Every other resource ends with "now you know." JiraWay ends with "now you've done it."
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-100 px-6 py-8 dark:from-gray-900 dark:to-blue-950 md:px-16">
        <style>{`
          @keyframes audienceCardIn {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes waterDropFall {
            0% { transform: translateY(-14px) scale(0.4); opacity: 0; }
            40% { opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 0; }
          }
          @keyframes waterDropRing {
            0% { transform: scale(0); opacity: 0.6; }
            100% { transform: scale(16); opacity: 0; }
          }
        `}</style>

        {/* Soft neutral shapes behind the cards, purely so the glass panels
            have something to actually blur — glassmorphism only reads as
            "frosted glass" when there's texture underneath it to diffuse; a
            glass panel over a flat, untextured white section just looks
            like a plain translucent box. Grayscale on purpose, to keep the
            section itself reading as plain white, not tinted. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/70 blur-3xl dark:bg-white/10" />
          <div className="absolute -right-16 top-10 h-64 w-64 rounded-full bg-blue-200/60 blur-3xl dark:bg-white/[0.07]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl dark:bg-white/[0.06]" />
          <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-blue-200/70 blur-3xl dark:bg-white/10" />
        </div>

        <h2 className="relative z-10 text-center text-2xl font-bold text-blue-600 dark:text-blue-400 md:text-3xl">
          Built for people who've never touched Jira before.
        </h2>
        <div className="relative z-10 mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCE_CARDS.map(({ icon, text }, index) => (
            <AudienceCard key={text} icon={icon} text={text} index={index} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-blue-100 to-blue-50 px-6 py-14 dark:from-blue-950 dark:to-blue-950 md:px-16">
        <style>{`
          @keyframes hexIn {
            from { opacity: 0; transform: translateY(16px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        <h2 className="relative z-10 text-center text-lg font-bold tracking-wide text-blue-600 dark:text-blue-400 md:text-2xl">
          What Makes <span className="text-orange-600 dark:text-orange-400">JiraWay</span> Different
        </h2>

        <div className="relative z-10 mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-x-10 gap-y-10">
          {DIFFERENTIATORS.map(({ icon, title }, index) => (
            <div
              key={title}
              style={{ animation: 'hexIn 0.5s ease-out both', animationDelay: `${index * 100}ms` }}
              className="flex w-32 flex-col items-center gap-3 text-center"
            >
              <HexIcon icon={icon} />
              <p className="text-sm font-semibold leading-snug text-blue-950 dark:text-white">{title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-blue-50 to-blue-100 px-6 py-3 dark:from-blue-950 dark:to-gray-900">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <h2 className="text-base font-semibold tracking-wide text-blue-600 dark:text-blue-400 sm:text-lg">
            Ready to stop watching and start doing?
          </h2>
          <button
            type="button"
            onClick={() => {
              // Scrolling immediately after setStarted races React's own
              // re-render — the branding column swaps to the (differently
              // sized) name/email form a moment later, and that layout
              // shift while the smooth-scroll animation is still running is
              // what made content visibly jump partway through. Waiting a
              // frame lets the new layout land first, so the scroll starts
              // from its real final height instead of the old one.
              setStarted(true)
              requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              })
            }}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Get Started Free
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  )
}
