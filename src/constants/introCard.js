// Every module's intro/completion card (image + text side by side) shares
// this one container size, so moving between modules never feels like the
// layout is resizing itself — but "one size" now means one size PER
// breakpoint, not one absolute pixel box: below sm, image/text stack
// vertically with an auto height and the card just fills the available
// width (minus the overlay's own p-6), since forcing the desktop 672x320
// box onto a phone screen pushed the card (and the whole page) into
// horizontal overflow. At sm and up it's the fixed h-80 side-by-side box
// as before. Only the image and text inside adjust per screen — the card's
// own size never does, at a given breakpoint — which is also why every
// resizable intro image is capped at INTRO_IMAGE_FIT_SIZE (see
// ImageSizeIndicator.jsx): past that size the image would have to grow the
// card to keep fitting it. Background isn't baked in here since intro cards
// are white and completion cards are gray-100 — append those at the call site.
export const INTRO_CARD_CLASSNAME =
  'flex w-full max-w-2xl flex-col items-center gap-6 rounded-xl p-6 text-left sm:h-80 sm:flex-row sm:gap-12 sm:p-10'

// Same responsive box as INTRO_CARD_CLASSNAME, for the video-based intro/
// completion cards (Module 2, Module 3, BacklogDemo). Kept as its own
// className instead of reusing the one above because the video sits
// edge-to-edge against the card (no padding, no gap) — its own p-10/gap-12
// would put an unwanted border of whitespace around the video.
export const VIDEO_CARD_CLASSNAME =
  'flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white sm:h-80 sm:flex-row sm:items-stretch'
