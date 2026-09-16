import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from './workspace/icons'

const MODULE_KEYS = ['module1', 'module2', 'module3', 'module4', 'backlog-demo']
const CIRCLE_SIZE = 28
const ROW_GAP = 28

// Same fixed left panel and stepper visual as ModuleProgressBar (the one
// shown while she's working through a module), reused here in "pick any
// module" mode once she's finished the whole curriculum — every circle is
// clickable. Numbered, not checked off — a tick here would read as "already
// done, no need to open this," which fights the whole point of the button.
export default function ModuleBrowserPanel({
  onClose,
  onSelectModule,
  isAdmin = false,
  onChooseModule,
  onLogout,
  collapsed,
  onToggleCollapsed,
}) {
  // Same collapse-to-a-slim-edge-tab behavior as ModuleProgressBar (the
  // in-module panel) — shrinks to a thin tab instead of only offering a full
  // close, and can be reopened the same way.
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Show module list"
        className="fixed left-0 top-1/2 z-[60] flex h-10 w-6 -translate-y-1/2 items-center justify-center rounded-r-md bg-gray-900 text-blue-400 hover:bg-gray-800 hover:text-blue-300"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div
      className="fixed inset-y-0 left-0 z-[60] flex flex-col bg-gray-900 px-5 py-6 text-white"
      style={{ width: 208 }}
    >
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Learn again</p>
          <p className="mt-1 text-sm font-medium text-gray-100">Pick a module</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Hide module list"
            className="rounded p-1 text-blue-400 hover:bg-gray-800 hover:text-blue-300"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {/* Only shown once there's an actual finished run to go back to
              closing this into — on a real first pass through the curriculum,
              picking a module is the only way forward, so there's nothing to
              dismiss this back out to. */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex flex-col" style={{ gap: ROW_GAP }}>
        <div
          className="absolute w-0.5 bg-blue-400"
          style={{
            left: CIRCLE_SIZE / 2 - 1,
            top: CIRCLE_SIZE / 2,
            height: (MODULE_KEYS.length - 1) * (CIRCLE_SIZE + ROW_GAP),
          }}
        />

        {MODULE_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectModule(key)}
            className="relative flex items-center gap-3 text-left hover:opacity-80"
          >
            <span
              className="flex flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-400 bg-gray-900 text-xs font-semibold text-blue-400"
              style={{ height: CIRCLE_SIZE, width: CIRCLE_SIZE }}
            >
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-white">Module {index + 1}</span>
          </button>
        ))}
      </div>

      {/* Admin-only, matching ModuleProgressBar's own bottom section
          (the one shown once inside a module) — same buttons, same style,
          so navigating between "on the workspace with this picker open"
          and "inside a module" feels like the same admin panel throughout. */}
      {isAdmin && (
        <div className="mt-auto flex flex-col items-start gap-2 border-t border-gray-800 pt-4">
          {onChooseModule && (
            <button
              type="button"
              onClick={onChooseModule}
              className="flex items-center gap-1 rounded-md border border-blue-500 bg-blue-950 px-2.5 py-1 text-xs font-medium text-blue-300 hover:bg-blue-900"
            >
              Choose a module
            </button>
          )}
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="flex items-center gap-1 rounded-md border border-gray-600 px-2.5 py-1 text-xs font-medium text-gray-300 hover:bg-gray-800"
          >
            Exit module
          </button>
        </div>
      )}
    </div>
  )
}
