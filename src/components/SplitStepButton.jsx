import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from './workspace/icons'

// One circle, split into two independently-clickable halves — left half
// steps back (dimmed/disabled on the first stop, since there's nowhere to
// go), right half steps forward (or finishes, on the last stop). Replaces
// what used to be two separate buttons mirrored on either side of the
// message card in every step-by-step tour in this app (Module 1's
// orientation tour, Module 2's Help walkthrough, BacklogDemo's field tour) —
// one shared component since all three used the identical two-button
// pattern, just with different click handlers.
export default function SplitStepButton({ onBack, onNext, canGoBack, isLast = false }) {
  return (
    <div className="pointer-events-auto relative flex h-8 w-8 flex-shrink-0 overflow-hidden rounded-full shadow-lg">
      <button
        type="button"
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Back"
        className={[
          'flex h-full w-1/2 items-center justify-center',
          canGoBack
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'cursor-default bg-blue-300 text-blue-900 hover:bg-blue-300',
        ].join(' ')}
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={isLast ? 'Done' : 'Next'}
        className="flex h-full w-1/2 items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
      >
        {isLast ? <CheckIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}
