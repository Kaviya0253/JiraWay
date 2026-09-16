import { useState } from 'react'
import {
  CloseIcon,
  ChevronDownIcon,
  EllipsisIcon,
  CheckboxIcon,
  BugIcon,
  StoryIcon,
  SubtaskIcon,
  PlusIcon,
  EnterIcon,
  CommentIcon,
} from './icons'
import AssigneeAvatar from './AssigneeAvatar'
import { loadState } from '../../utils/localStorage'

const PANEL_WIDTH_KEY = 'jiraway-ticket-panel-width'
const PANEL_DEFAULT_WIDTH = 320

// Fixed at whatever was last calibrated while this was still
// drag-to-resize — no longer adjustable, just reading the same saved value
// so it stays exactly where it was left.
const PANEL_WIDTH = loadState(PANEL_WIDTH_KEY, PANEL_DEFAULT_WIDTH)

const TYPE_ICON = {
  Bug: { icon: BugIcon, color: 'text-red-600' },
  Task: { icon: CheckboxIcon, color: 'text-blue-600' },
  Story: { icon: StoryIcon, color: 'text-green-600' },
  Subtask: { icon: SubtaskIcon, color: 'text-blue-500' },
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Done']
const STATUS_COLOR = {
  'To Do': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  Done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
}

function formatCommentTime(value) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function SubtaskPanel({
  ticket,
  subtasks = [],
  onClose,
  onCreateSubtask,
  onDeleteSubtask,
  onChangeSubtaskStatus,
  onChangeStatus,
  epics,
  onChangeEpic,
  comments,
  onAddComment,
  showSubtasks = true,
}) {
  const [statusMenuKey, setStatusMenuKey] = useState(null)
  const [ticketStatusMenuOpen, setTicketStatusMenuOpen] = useState(false)
  const [epicMenuOpen, setEpicMenuOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [commentDraft, setCommentDraft] = useState('')

  const typeMeta = TYPE_ICON[ticket.type] ?? TYPE_ICON.Task
  const TypeIcon = typeMeta.icon
  const doneCount = subtasks.filter((subtask) => subtask.column === 'Done').length

  function confirmCreate() {
    const title = newTitle.trim()
    if (title) {
      onCreateSubtask?.(title)
    }
    setNewTitle('')
    setIsCreating(false)
  }

  function confirmComment() {
    const text = commentDraft.trim()
    if (text) {
      onAddComment?.(text)
      setCommentDraft('')
    }
  }

  return (
    <div
      data-tour="ticket-detail-panel"
      className="flex shrink-0 flex-col border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      style={{ width: PANEL_WIDTH }}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
          <TypeIcon className={`h-4 w-4 ${typeMeta.color}`} />
          {ticket.key}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{ticket.title}</h2>

        <div className="relative mt-2 inline-block">
          <button
            type="button"
            data-tour="ticket-status"
            onClick={() => setTicketStatusMenuOpen((open) => !open)}
            className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[ticket.column ?? 'To Do']}`}
          >
            {ticket.column ?? 'To Do'}
            <ChevronDownIcon className="h-3 w-3" />
          </button>

          {ticketStatusMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setTicketStatusMenuOpen(false)} />
              <div
                data-tour="ticket-status-dropdown"
                className="absolute left-0 top-full z-20 mt-1 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {STATUS_OPTIONS.filter((status) => status !== (ticket.column ?? 'To Do')).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onChangeStatus?.(ticket.key, status)
                      setTicketStatusMenuOpen(false)
                    }}
                    className={`block w-full px-3 py-2 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${STATUS_COLOR[status]}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {ticket.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {ticket.description}
          </p>
        )}

        {epics && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Parent</p>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setEpicMenuOpen((open) => !open)}
                className={[
                  'flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium',
                  ticket.epicKey
                    ? 'border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300'
                    : 'border-gray-300 text-gray-500 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400',
                ].join(' ')}
              >
                {ticket.epicKey
                  ? (epics.find((epic) => epic.key === ticket.epicKey)?.title ?? 'Epic')
                  : '+ Epic'}
                <ChevronDownIcon className="h-3 w-3" />
              </button>

              {epicMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setEpicMenuOpen(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {ticket.epicKey && (
                      <button
                        type="button"
                        onClick={() => {
                          onChangeEpic?.(ticket.key, null)
                          setEpicMenuOpen(false)
                        }}
                        className="block w-full px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                      >
                        No epic
                      </button>
                    )}
                    {epics.map((epic) => (
                      <button
                        key={epic.key}
                        type="button"
                        onClick={() => {
                          onChangeEpic?.(ticket.key, epic.key)
                          setEpicMenuOpen(false)
                        }}
                        className="block w-full truncate px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        {epic.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showSubtasks && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <SubtaskIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
              Subtasks
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {subtasks.length > 0
                ? `${Math.round((doneCount / subtasks.length) * 100)}% Done`
                : 'No subtasks yet'}
            </span>
          </div>

          {subtasks.length > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
              />
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {subtasks.map((subtask) => {
              const subtaskMeta = TYPE_ICON[subtask.type] ?? TYPE_ICON.Subtask
              const SubtaskTypeIcon = subtaskMeta.icon

              return (
                <div
                  key={subtask.key}
                  className="group flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm transition hover:border-blue-200 hover:shadow dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-blue-900"
                >
                  <div className="flex items-center gap-2">
                    <SubtaskTypeIcon className={`h-3.5 w-3.5 flex-shrink-0 ${subtaskMeta.color}`} />
                    <span className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {subtask.key}
                    </span>
                    <span className="flex-1 truncate text-xs text-gray-900 dark:text-gray-100">
                      {subtask.title}
                    </span>
                    {onDeleteSubtask && (
                      <button
                        type="button"
                        onClick={() => onDeleteSubtask(subtask.key)}
                        className="flex-shrink-0 text-gray-300 opacity-0 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600"
                      >
                        <EllipsisIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setStatusMenuKey((key) => (key === subtask.key ? null : subtask.key))
                        }
                        className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[subtask.column ?? 'To Do']}`}
                      >
                        {subtask.column ?? 'To Do'}
                        <ChevronDownIcon className="h-3 w-3" />
                      </button>

                      {statusMenuKey === subtask.key && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setStatusMenuKey(null)} />
                          <div className="absolute left-0 top-full z-20 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            {STATUS_OPTIONS.filter((status) => status !== (subtask.column ?? 'To Do')).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    onChangeSubtaskStatus?.(subtask.key, status)
                                    setStatusMenuKey(null)
                                  }}
                                  className={`block w-full px-2.5 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 ${STATUS_COLOR[status]}`}
                                >
                                  {status}
                                </button>
                              ),
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <AssigneeAvatar name={subtask.assignee} className="h-5 w-5 flex-shrink-0" />
                  </div>
                </div>
              )
            })}

            {isCreating ? (
              <div className="flex items-center gap-2 rounded-md border-2 border-blue-500 bg-white px-2 py-1.5 dark:bg-gray-800">
                <SubtaskIcon className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmCreate()
                    if (event.key === 'Escape') {
                      setNewTitle('')
                      setIsCreating(false)
                    }
                  }}
                  onBlur={confirmCreate}
                  placeholder="What needs to be done?"
                  className="min-w-0 flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
                />
                <EnterIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Create subtask
              </button>
            )}
          </div>
        </div>
        )}

        <div className="mt-6">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <CommentIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />
            Comments
          </span>

          <div className="mt-3 flex flex-col gap-3">
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <AssigneeAvatar name={comment.author} className="h-6 w-6 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {comment.author}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatCommentTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-300">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <textarea
              data-tour="comment-input"
              rows={2}
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  confirmComment()
                }
              }}
              placeholder="Add a comment..."
              className="w-full resize-none rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              type="button"
              data-tour="comment-submit"
              onClick={confirmComment}
              disabled={!commentDraft.trim()}
              className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600 disabled:opacity-50 dark:disabled:bg-blue-600"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
