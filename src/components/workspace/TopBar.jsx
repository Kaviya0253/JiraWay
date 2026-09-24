import { useState } from 'react'
import { PanelToggleIcon, PlusIcon, SunIcon, MoonIcon, LogoutIcon, Avatar } from './icons'
import CreateIssueModal from './CreateIssueModal'
import GlobalSearch from './GlobalSearch'
import { getLearnerName } from '../../data/sampleProject'

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TopBar({
  onToggleSidebar,
  createTicket,
  sprintNumbers,
  allTickets,
  onSelectView,
  onOpenTeam,
  learner,
  onLogout,
  disableCreateModalDismiss = false,
  createModalHelpActive = false,
  onExitCreateModalHelp,
  onOpenCreateModalHelp,
  // During a guided module, nothing here is her real task except whatever
  // the module itself is spotlighting — the sidebar toggle, search, and
  // profile menu are all genuinely disabled (not just visually blocked by
  // an overlay, which has proven unreliable elsewhere in this app). Dark
  // mode is left alone on purpose — it's harmless preference, not a
  // navigation/mutation action, and there's no reason to make her wait
  // until she's out of a module to use it. Create is left alone too: Module
  // 2's own tutorial needs it to stay genuinely clickable (its overlay
  // punches a real hole over it), so this can't blanket-disable it.
  disableTopBarActions = false,
}) {
  const [isDark, setIsDark] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const learnerName = getLearnerName()
  const initials = initialsFor(learnerName)

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return (
    <header className="sticky top-0 z-10 flex min-w-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label="Toggle sidebar"
          disabled={disableTopBarActions}
          onClick={() => onToggleSidebar?.()}
          className="text-gray-700 hover:text-blue-600 disabled:cursor-not-allowed dark:text-gray-200 dark:hover:text-blue-400"
        >
          <PanelToggleIcon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectView?.('board')}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">
            J
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">JiraWay</span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <GlobalSearch
          allTickets={allTickets}
          onSelectView={onSelectView}
          onOpenTeam={onOpenTeam}
          disabled={disableTopBarActions}
        />
        <button
          type="button"
          data-tour="create-button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Create
        </button>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
          className="text-gray-700 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400"
        >
          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <div className="relative">
          <button
            type="button"
            aria-label="Account menu"
            data-tour="profile-avatar"
            disabled={disableTopBarActions}
            onClick={() => setProfileOpen((open) => !open)}
            className="disabled:cursor-not-allowed"
          >
            <Avatar initials={initials} className="h-7 w-7" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <Avatar initials={initials} className="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                      {learnerName}
                    </p>
                    {learner?.email && (
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {learner.email}
                      </p>
                    )}
                  </div>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onLogout()
                    }}
                    className="mt-4 flex w-full items-center gap-2 rounded-md border-t border-gray-100 pt-3 text-left text-sm font-medium text-gray-600 hover:text-red-600 dark:border-gray-800 dark:text-gray-300 dark:hover:text-red-400"
                  >
                    <LogoutIcon className="h-4 w-4" />
                    Log out
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateIssueModal
          sprintNumbers={sprintNumbers}
          onClose={() => setShowCreate(false)}
          onCreate={createTicket}
          disableBackdropClose={disableCreateModalDismiss}
          isHelpActive={createModalHelpActive}
          onExitHelp={onExitCreateModalHelp}
          onOpenHelp={onOpenCreateModalHelp}
          learnerId={learner?.id}
        />
      )}
    </header>
  )
}
