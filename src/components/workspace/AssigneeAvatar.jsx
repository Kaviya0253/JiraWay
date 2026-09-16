import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PersonIcon } from './icons'

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
]

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function AssigneeAvatar({ name, className = 'h-6 w-6', tooltip, onClick, selected, dataTour, disableTooltip = false }) {
  const label = tooltip ?? `Assignee: ${name ?? 'None'}`
  const Tag = onClick ? 'button' : 'div'
  const ringClass = selected ? 'ring-2' : 'ring-0 group-hover/avatar:ring-2'
  const anchorRef = useRef(null)
  const [tooltipPos, setTooltipPos] = useState(null)

  // A plain CSS z-index on the tooltip can't win here, no matter how high —
  // this avatar usually sits inside TopBar, which is `sticky` with its own
  // z-10, making it a self-contained stacking context. A z-index nested
  // inside only ever gets compared against TopBar's OTHER children, never
  // against a sibling outside TopBar entirely, like a guided-tour overlay at
  // z-50 — that overlay always wins regardless of what the tooltip's own
  // z-index says. Portaling straight to <body> escapes that stacking
  // context, so the tooltip's z-index finally competes at the top level
  // instead of losing before the comparison even starts.
  function showTooltip() {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect) setTooltipPos({ top: rect.bottom, left: rect.right })
  }

  function hideTooltip() {
    setTooltipPos(null)
  }

  return (
    <Tag
      ref={anchorRef}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      onMouseEnter={disableTooltip ? undefined : showTooltip}
      onMouseLeave={disableTooltip ? undefined : hideTooltip}
      onFocus={disableTooltip ? undefined : showTooltip}
      onBlur={disableTooltip ? undefined : hideTooltip}
      className="group/avatar relative z-0 flex-shrink-0 border-0 bg-transparent p-0 leading-none hover:z-40"
    >
      {name ? (
        <span
          data-tour={dataTour}
          className={`flex ${className} items-center justify-center rounded-full text-xs font-medium ring-blue-400 transition ${ringClass} ${colorForName(name)}`}
        >
          {initials(name)}
        </span>
      ) : (
        <span
          data-tour={dataTour}
          className={`flex ${className} items-center justify-center rounded-full bg-gray-200 text-gray-500 ring-blue-400 transition ${ringClass} dark:bg-gray-700`}
        >
          <PersonIcon className="h-3.5 w-3.5" />
        </span>
      )}

      {tooltipPos &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[100] -translate-x-full whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
            style={{ top: tooltipPos.top + 4, left: tooltipPos.left }}
          >
            {label}
          </span>,
          document.body,
        )}
    </Tag>
  )
}
