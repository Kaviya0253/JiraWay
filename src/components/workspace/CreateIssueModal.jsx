import { useState } from 'react'
import { project, team, getLearnerName } from '../../data/sampleProject'
import { loadState, saveState, scopedKey } from '../../utils/localStorage'
import {
  CloseIcon,
  InfoIcon,
  ChevronDownIcon,
  PersonIcon,
  CalendarIcon,
  SprintIcon,
  LightningIcon,
  BugIcon,
  StoryIcon,
  CheckboxIcon,
} from './icons'
import AssigneeAvatar from './AssigneeAvatar'

const TYPE_OPTIONS = [
  { key: 'Epic', icon: LightningIcon, color: 'text-purple-600' },
  { key: 'Task', icon: CheckboxIcon, color: 'text-blue-600' },
  { key: 'Bug', icon: BugIcon, color: 'text-red-600' },
  { key: 'Story', icon: StoryIcon, color: 'text-green-600' },
]

const HELP_SEEN_KEY = 'create-help-seen'

export default function CreateIssueModal({
  sprintNumbers = [],
  onClose,
  onCreate,
  disableBackdropClose = false,
  isHelpActive = false,
  onExitHelp,
  onOpenHelp,
  learnerId,
}) {
  // First time she opens this modal, "Show me how" pulses to draw the eye —
  // once she's actually clicked it once, she knows it's there, so it settles
  // down to a plain button from then on. Scoped per learner so it comes back
  // the way it should for anyone starting completely fresh.
  const [helpSeen, setHelpSeen] = useState(() =>
    learnerId ? loadState(scopedKey(learnerId, HELP_SEEN_KEY), false) : false,
  )

  function markHelpSeen() {
    if (!learnerId || helpSeen) return
    setHelpSeen(true)
    saveState(scopedKey(learnerId, HELP_SEEN_KEY), true)
    setValidationMessage('')
  }

  const [type, setType] = useState('Task')
  const [typeMenuOpen, setTypeMenuOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState(null)
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false)
  const [sprint, setSprint] = useState(null)
  const [sprintMenuOpen, setSprintMenuOpen] = useState(false)
  const [onlyThisSpace, setOnlyThisSpace] = useState(true)
  const [validationMessage, setValidationMessage] = useState('')

  const activeType = TYPE_OPTIONS.find((option) => option.key === type)
  const assignableTeam = team.filter((member) => member.role !== 'Team Lead')

  function handleCreate() {
    const trimmed = title.trim()
    if (!trimmed) return

    // The very first ticket she ever creates requires having opened "Show
    // me how" at least once first — otherwise the app only ever checks that
    // a ticket exists, never that she was actually taught what any of these
    // fields mean, and she could fill the whole form in blind. Once
    // helpSeen is true (persisted per learner), this never blocks her
    // again, including on every ticket after this one.
    if (!helpSeen) {
      setValidationMessage('Click "Show me how" first — it only takes a minute.')
      return
    }

    // Practice constraints: she has to actually pick a sprint and assign it
    // to herself — clicking Create with either missing explains what's
    // wrong instead of just staying silently disabled.
    if (sprint == null) {
      setValidationMessage('Choose the active sprint before creating this ticket.')
      return
    }
    if (assignee !== getLearnerName()) {
      setValidationMessage('Assign this ticket to yourself before creating it.')
      return
    }
    setValidationMessage('')

    onCreate({
      title: trimmed,
      type,
      description: description.trim() || null,
      assignee,
      dueDate: null,
      sprint,
      onBoard: sprint != null,
      column: sprint != null ? 'To Do' : null,
    })

    onClose()
  }

  return (
    <>
      <style>{`
        @keyframes createHelpBump {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
          50% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
        }
        .create-help-bump { animation: createHelpBump 1.4s ease-in-out infinite; }
      `}</style>
      {/* Real Jira behavior is to close on an outside click — this stays true
          everywhere except while a guided module tutorial has her mid-flow
          creating this exact ticket, where dismissing the modal early would
          break the walkthrough before she's actually created anything. */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={disableBackdropClose ? undefined : onClose} />
      <div className="fixed left-1/2 top-16 z-50 w-full max-w-xl -translate-x-1/2 rounded-lg bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span data-tour="create-project-key" className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">
                W
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{project.key}</span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>

            <div className="relative">
              <button
                type="button"
                data-tour="create-type"
                onClick={() => setTypeMenuOpen((open) => !open)}
                className="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <activeType.icon className={`h-4 w-4 ${activeType.color}`} />
                {activeType.key}
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
              {typeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" data-tour="type-menu-backdrop" onClick={() => setTypeMenuOpen(false)} />
                  <div
                    data-tour="create-type-dropdown"
                    className="absolute left-0 top-full z-20 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        data-tour={`create-type-option-${option.key.toLowerCase()}`}
                        onClick={() => {
                          setType(option.key)
                          setTypeMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <option.icon className={`h-4 w-4 ${option.color}`} />
                        {option.key}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <button
              type="button"
              data-tour="create-help"
              onClick={() => {
                markHelpSeen()
                // Direct callback, not left to a caller inferring the click
                // from document-level bubbling or a pixel-perfect overlay
                // hole — Module 2's own "dim everything but this button"
                // block depends on knowing this fired, and a callback here
                // can't miss regardless of overlay measurement/animation
                // timing (this button pulses via CSS while unseen).
                onOpenHelp?.()
              }}
              className={[
                'flex items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-xs font-semibold',
                'border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40',
                !helpSeen && 'create-help-bump',
              ].join(' ')}
              title="What do these fields mean?"
            >
              <InfoIcon className="h-3.5 w-3.5" />
              Show me how
            </button>
            {/* While the field-by-field explanation is up, this exits THAT
                (not the whole ticket card) — one exit control near "Show me
                how" instead of a separate close button on every card. Outside
                the explanation, it follows disableBackdropClose: during a
                module's guided create flow she's meant to actually create the
                ticket, no way to bail out via the X either. Everywhere else
                (real workspace use), it's the normal close button. */}
            <button
              type="button"
              data-tour="create-close"
              onClick={isHelpActive ? undefined : disableBackdropClose ? undefined : onClose}
              disabled={isHelpActive || disableBackdropClose}
              title={
                isHelpActive
                  ? 'Finish the explanation to continue'
                  : disableBackdropClose
                    ? 'Create your ticket to continue'
                    : undefined
              }
              className={
                isHelpActive || disableBackdropClose
                  ? 'cursor-default opacity-30'
                  : 'hover:text-gray-700 dark:hover:text-gray-200'
              }
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Until she's opened "Show me how" at least once, the rest of the
            card is locked — a native fieldset disables every control inside
            in one shot (click AND keyboard). The dim itself is the same
            black tint the guided tours already lay over the workspace
            (Module 2's tour-spotlight bg-black/25), not a faded/opacity
            look on the content itself. */}
        <div className="relative">
        <fieldset disabled={!helpSeen} className="m-0 min-w-0 border-0 p-0">
        <div className="px-4 py-4">
          <input
            type="text"
            autoFocus
            data-tour="create-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Summary"
            className="w-full border-none bg-transparent text-base font-medium text-gray-900 placeholder-gray-900 outline-none dark:text-gray-100 dark:placeholder-gray-100"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a description or type / for actions and Rovo"
            rows={3}
            className="mt-2 w-full resize-none border-none bg-transparent text-sm text-gray-500 placeholder-gray-400 outline-none dark:text-gray-400"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                type="button"
                data-tour="create-assignee"
                onClick={() => setAssigneeMenuOpen((open) => !open)}
                className={[
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                  assigneeMenuOpen
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
                ].join(' ')}
              >
                {assignee ? (
                  <AssigneeAvatar name={assignee} className="h-4 w-4" />
                ) : (
                  <PersonIcon className="h-3.5 w-3.5 text-gray-400" />
                )}
                {assignee ?? 'Automatic'}
              </button>
              {assigneeMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" data-tour="assignee-menu-backdrop" onClick={() => setAssigneeMenuOpen(false)} />
                  <div
                    data-tour="create-assignee-dropdown"
                    className="absolute left-0 top-full z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between rounded-md border border-blue-500 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200">
                      {assignee ?? 'Automatic'}
                      <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssignee(null)
                        setAssigneeMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700">
                        <PersonIcon className="h-3.5 w-3.5" />
                      </span>
                      Unassigned
                    </button>

                    {assignableTeam.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setAssignee(member.name)
                          setAssigneeMenuOpen(false)
                          setValidationMessage('')
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <AssigneeAvatar name={member.name} className="h-6 w-6" />
                        <span className="truncate">
                          {member.name}
                          {member.id === 'priya' && (
                            <span className="text-gray-400 dark:text-gray-500"> (Assign to me)</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-600">
              Labels
            </span>

            <div className="relative">
              <button
                type="button"
                data-tour="create-sprint"
                onClick={() => setSprintMenuOpen((open) => !open)}
                className={[
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                  sprintMenuOpen
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200',
                ].join(' ')}
              >
                <SprintIcon className="h-3.5 w-3.5 text-gray-400" />
                {sprint === null ? 'Sprint' : `Sprint ${sprint}`}
              </button>
              {sprintMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" data-tour="sprint-menu-backdrop" onClick={() => setSprintMenuOpen(false)} />
                  <div
                    data-tour="create-sprint-dropdown"
                    className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="mb-2 flex items-center justify-between rounded-md border border-blue-500 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200">
                      <span className="flex items-center gap-1.5">
                        <SprintIcon className="h-3.5 w-3.5 text-gray-400" />
                        {sprint === null ? 'Sprint' : `Sprint ${sprint}`}
                      </span>
                      <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                    </div>

                    <label className="mb-2 flex cursor-pointer items-center gap-2 px-1 py-1 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={onlyThisSpace}
                        onChange={(event) => setOnlyThisSpace(event.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      Only show sprints in this space ({project.key})
                    </label>

                    {sprintNumbers.length > 0 && (
                      <p className="mb-1 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Active
                      </p>
                    )}
                    {sprintNumbers.map((number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() => {
                          setSprint(number)
                          setSprintMenuOpen(false)
                          setValidationMessage('')
                        }}
                        className={[
                          'block w-full rounded-md border-l-2 px-2 py-1.5 text-left text-sm',
                          sprint === number
                            ? 'border-blue-500 bg-gray-50 dark:bg-gray-700'
                            : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700',
                        ].join(' ')}
                      >
                        <span className="block text-gray-900 dark:text-gray-100">
                          {project.key} Sprint {number}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {project.key} board
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="flex items-center gap-1.5 rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-600">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
              dd-mm-yyyy
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-400 dark:border-gray-600">
              <LightningIcon className="h-3.5 w-3.5" />
              Parent
            </span>
          </div>
        </div>

        {validationMessage && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {validationMessage}
          </div>
        )}

        <div className="flex items-center justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            data-tour="create-submit"
            disabled={!title.trim()}
            onClick={handleCreate}
            className={[
              'rounded-md px-4 py-1.5 text-sm font-medium',
              title.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-blue-300 text-white',
            ].join(' ')}
          >
            Create
          </button>
        </div>
        </fieldset>
        {!helpSeen && <div className="pointer-events-none absolute inset-0 bg-black/25" />}
        </div>
      </div>
    </>
  )
}
