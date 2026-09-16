// Every intro/completion card shares one fixed container size (see
// src/constants/introCard.js — h-80, p-10 padding), which leaves exactly this
// much room for an image. Each module's resizable image is capped at this
// same value (its own INTRO_IMAGE_MAX_SIZE / max size argument), so dragging
// can never make the card itself grow — this indicator is the live readout
// while she's dragging toward that ceiling, not a warning after the fact.
export const INTRO_IMAGE_FIT_SIZE = 240

export default function ImageSizeIndicator({ size, active }) {
  if (!active) return null
  const diff = size - INTRO_IMAGE_FIT_SIZE
  if (Math.abs(diff) <= 6) {
    return (
      <span className="pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 shadow-sm dark:bg-green-950/60 dark:text-green-400">
        Matches card size
      </span>
    )
  }
  const tooBig = diff > 0
  return (
    <span
      className={[
        'pointer-events-none absolute -bottom-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium shadow-sm',
        tooBig
          ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
      ].join(' ')}
    >
      {tooBig ? `+${Math.round(diff)}px — larger than the card` : `${Math.round(diff)}px — smaller than the card`}
    </span>
  )
}
