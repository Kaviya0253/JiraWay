import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Column from './Column'
import TicketCard from './TicketCard'
import BoardToolbar from './BoardToolbar'
import CompleteSprintModal from './CompleteSprintModal'
import SubtaskPanel from './SubtaskPanel'
import { PlusIcon, CheckIcon, CloseIcon, RefreshIcon } from './icons'
import { loadState, saveState, scopedKey } from '../../utils/localStorage'
import { project, getLearnerName } from '../../data/sampleProject'
import { matchesFilters, matchesSearch, hasActiveSearch } from '../../utils/ticketFilters'

const FIXED_COLUMNS = [
  { key: 'To Do', title: 'TO DO', showEllipsis: true },
  { key: 'In Progress', title: 'IN PROGRESS' },
  { key: 'Done', title: 'DONE', showChecklist: true },
]

export default function Board({
  learnerId,
  isAdmin = false,
  allTickets,
  moveBoardColumn,
  changeAssignee,
  createTicket,
  deleteTicket,
  completeSprint,
  restoreSprintSnapshot,
  nextSprintNumber,
  addComment,
  sprintNumbers,
  sprintDates,
  highlightTicketKey,
  disableClickTicketKey,
  disableCardActions = false,
  disableCompleteSprint = false,
  disableSearchAndFilter = false,
  restrictDragToKey = null,
  restrictAssigneeFilterTo,
  onGoToBacklog,
}) {
  const boardColumnsKey = scopedKey(learnerId, 'board-columns')
  const otherTicketWarningSeenKey = scopedKey(learnerId, 'other-ticket-warning-seen')
  const [otherTicketWarning, setOtherTicketWarning] = useState(false)

  function handleDropTicket(ticketKey, column) {
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (
      ticket?.assignee &&
      ticket.assignee !== getLearnerName() &&
      !loadState(otherTicketWarningSeenKey, false)
    ) {
      saveState(otherTicketWarningSeenKey, true)
      setOtherTicketWarning(true)
      setTimeout(() => setOtherTicketWarning(false), 5000)
    }
    moveBoardColumn(ticketKey, column)
  }

  const boardTickets = allTickets.filter((ticket) => ticket.onBoard)
  const epics = allTickets.filter((ticket) => ticket.type === 'Epic')
  const activeSprint = boardTickets.find((ticket) => ticket.sprint !== null)?.sprint ?? null
  const [extraColumns, setExtraColumns] = useState(() => loadState(boardColumnsKey, []))
  const [newColumnName, setNewColumnName] = useState('')
  const [activeAction, setActiveAction] = useState(null)
  const [completingSprint, setCompletingSprint] = useState(false)
  const [sprintSnapshot, setSprintSnapshot] = useState(null)
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [detailTicketKey, setDetailTicketKey] = useState(null)
  // Bounds Board to the real remaining viewport height, same technique
  // Backlog/Summary/Sidebar already use — without it, `min-h-screen` on the
  // page root lets the whole document grow past the viewport instead of
  // capping here, so Column's own `h-full` + internal `overflow-y-auto`
  // (its ticket list) never actually gets a finite height to scroll within,
  // and the toolbar above gets dragged off-screen by the document scroll.
  const containerRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(null)
  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const top = containerRef.current.getBoundingClientRect().top
      setContainerHeight(window.innerHeight - top)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  // Bounded height alone assumes nothing else on the page ever forces a
  // genuine document scroll — belt-and-suspenders in case something still
  // does: sticky the toolbar itself too, same as the project header/tab row.
  // The ref and the `sticky` class both live on this ONE div (not a wrapper
  // around a further child) and its real parent is this tall flex column
  // (toolbar + the whole columns area) — that's what gives it room to stay
  // pinned. Measuring once on mount, before any scrolling happens, avoids
  // the self-referential bug a later re-measure would hit (an already-stuck
  // element's own rect reports its stuck position, not its natural one).
  const toolbarRef = useRef(null)
  const [toolbarTop, setToolbarTop] = useState(0)
  useLayoutEffect(() => {
    if (!toolbarRef.current) return
    setToolbarTop(toolbarRef.current.getBoundingClientRect().top)
  }, [])
  const detailTicket = allTickets.find((ticket) => ticket.key === detailTicketKey) ?? null
  const isAdding = activeAction === 'new-column'
  const visibleTickets = boardTickets.filter(
    (ticket) => matchesFilters(ticket, filters) && matchesSearch(ticket, searchTerm),
  )
  const isSearching = hasActiveSearch(filters, searchTerm)
  // Prefer a card with a real assignee so the "who it's assigned to" tour
  // stop actually shows a colored avatar, not the grey unassigned placeholder.
  const firstCardKey =
    visibleTickets.find((ticket) => !ticket.parentKey && ticket.assignee)?.key ??
    visibleTickets.find((ticket) => !ticket.parentKey)?.key ??
    null

  function subtasksFor(ticketKey) {
    return boardTickets.filter((ticket) => ticket.parentKey === ticketKey)
  }

  function createSubtask(parentKey, title) {
    const parent = allTickets.find((ticket) => ticket.key === parentKey)
    if (!parent) return
    createTicket({
      title,
      type: 'Subtask',
      parentKey,
      assignee: parent.assignee,
      sprint: parent.sprint,
      onBoard: parent.onBoard,
      column: parent.column,
    })
  }

  function clearSearch() {
    setFilters({})
    setSearchTerm('')
  }

  useEffect(() => {
    saveState(boardColumnsKey, extraColumns)
  }, [boardColumnsKey, extraColumns])

  function confirmAddColumn() {
    const name = newColumnName.trim()
    if (name) {
      setExtraColumns((columns) => [...columns, name])
    }
    setNewColumnName('')
    setActiveAction(null)
  }

  function cancelAddColumn() {
    setNewColumnName('')
    setActiveAction(null)
  }

  function deleteColumn(index) {
    setExtraColumns((columns) => columns.filter((_, i) => i !== index))
  }

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 flex-1 min-h-0"
      style={{ height: containerHeight != null ? `${containerHeight}px` : undefined }}
    >
    <div className="flex min-w-0 flex-1 flex-col">
      <div ref={toolbarRef} data-tour="board-toolbar" className="sticky z-[5] bg-white dark:bg-gray-900" style={{ top: toolbarTop }}>
        <BoardToolbar
          onCompleteSprint={() => setCompletingSprint(true)}
          completeSprintDisabled={activeSprint === null}
          forceDisableCompleteSprint={disableCompleteSprint}
          disableSearchAndFilter={disableSearchAndFilter}
          filters={filters}
          onFilterChange={setFilters}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sprintNumbers={sprintNumbers}
          sprintDates={sprintDates}
          restrictAssigneeFilterTo={restrictAssigneeFilterTo}
        />
      </div>

      {boardTickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <RefreshIcon className="h-5 w-5" />
          </span>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Get started in the backlog</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Plan and start a sprint to see work items here.</p>
          {onGoToBacklog && (
            <button
              type="button"
              onClick={onGoToBacklog}
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Backlog
            </button>
          )}
        </div>
      ) : (
      <div
        data-tour="board-columns-area"
        className="scrollbar-hide flex flex-1 flex-nowrap items-stretch gap-2 overflow-x-auto overflow-y-hidden px-2 pb-4"
      >
        {FIXED_COLUMNS.map(({ key, title, showEllipsis, showChecklist }) => {
          const columnVisible = visibleTickets.filter(
            (ticket) => ticket.column === key && !ticket.parentKey,
          )
          const columnTotal = boardTickets.filter((ticket) => ticket.column === key).length
          const noResults = key === 'To Do' && isSearching && columnTotal > 0 && columnVisible.length === 0

          return (
            <Column
              key={key}
              title={title}
              showEllipsis={showEllipsis}
              showChecklist={showChecklist}
              // Real guard, not just draggable={false} on the card — a module
              // restricting drag to one ticket (Module 3's status step) needs
              // the DROP itself blocked for every other ticket too, in case a
              // drag ever starts despite the UI-level draggable flag.
              onDropTicket={(ticketKey) => {
                if (restrictDragToKey && ticketKey !== restrictDragToKey) return
                handleDropTicket(ticketKey, key)
              }}
              alwaysShowCreate={key === 'To Do'}
              onCreateTicket={(ticketTitle, dueDate) =>
                createTicket({ title: ticketTitle, dueDate, onBoard: true, column: key })
              }
              isCreating={activeAction === key}
              onOpenCreate={() => setActiveAction(key)}
              onCloseCreate={() => setActiveAction(null)}
              noResults={noResults}
              onClearFilters={clearSearch}
              dataTour={key === 'To Do' ? 'board-column' : undefined}
              actionsDisabled={disableCardActions}
            >
              {columnVisible.map((ticket) => (
                <div
                  key={ticket.key}
                  data-tour={
                    ticket.key === highlightTicketKey
                      ? 'created-ticket'
                      : ticket.key === firstCardKey
                        ? 'ticket-card'
                        : undefined
                  }
                >
                  <TicketCard
                    ticket={ticket}
                    subtasks={subtasksFor(ticket.key)}
                    onDragStart={(event) => event.dataTransfer.setData('text/plain', ticket.key)}
                    onDelete={ticket.isSeed ? undefined : () => deleteTicket(ticket.key)}
                    onDeleteSubtask={deleteTicket}
                    onAddSubtask={(subtaskTitle) => createSubtask(ticket.key, subtaskTitle)}
                    onChangeSubtaskStatus={moveBoardColumn}
                    onChangeAssignee={
                      changeAssignee ? (assignee) => changeAssignee(ticket.key, assignee) : undefined
                    }
                    onChangeSubtaskAssignee={changeAssignee}
                    epics={epics}
                    epicEditable={false}
                    onOpenDetail={ticket.key === disableClickTicketKey ? undefined : setDetailTicketKey}
                    actionsDisabled={disableCardActions}
                    dragEnabled={!restrictDragToKey || ticket.key === restrictDragToKey}
                  />
                </div>
              ))}
            </Column>
          )
        })}

        {extraColumns.map((name, index) => {
          const columnVisible = visibleTickets.filter(
            (ticket) => ticket.column === name && !ticket.parentKey,
          )

          return (
            <Column
              key={`${name}-${index}`}
              title={name.toUpperCase()}
              onDelete={() => deleteColumn(index)}
              onDropTicket={(ticketKey) => handleDropTicket(ticketKey, name)}
              onCreateTicket={(ticketTitle, dueDate) =>
                createTicket({ title: ticketTitle, dueDate, onBoard: true, column: name })
              }
              isCreating={activeAction === `${name}-${index}`}
              onOpenCreate={() => setActiveAction(`${name}-${index}`)}
              onCloseCreate={() => setActiveAction(null)}
              actionsDisabled={disableCardActions}
            >
              {columnVisible.map((ticket) => (
                <TicketCard
                  key={ticket.key}
                  ticket={ticket}
                  subtasks={subtasksFor(ticket.key)}
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', ticket.key)}
                  onDelete={ticket.isSeed ? undefined : () => deleteTicket(ticket.key)}
                  onDeleteSubtask={deleteTicket}
                  onAddSubtask={(subtaskTitle) => createSubtask(ticket.key, subtaskTitle)}
                  onChangeSubtaskStatus={moveBoardColumn}
                  onChangeAssignee={
                    changeAssignee ? (assignee) => changeAssignee(ticket.key, assignee) : undefined
                  }
                  onChangeSubtaskAssignee={changeAssignee}
                  epics={epics}
                  epicEditable={false}
                  onOpenDetail={setDetailTicketKey}
                  actionsDisabled={disableCardActions}
                  dragEnabled={!restrictDragToKey || ticket.key === restrictDragToKey}
                />
              ))}
            </Column>
          )
        })}

        <div className="flex-shrink-0">
          {isAdding ? (
            <>
              <div className="fixed inset-0 z-10" onClick={cancelAddColumn} />
              <div className="relative z-20 flex w-[268px] flex-col gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newColumnName}
                  onChange={(event) => setNewColumnName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmAddColumn()
                    if (event.key === 'Escape') cancelAddColumn()
                  }}
                  placeholder="Column name"
                  className="w-full rounded-md border-2 border-blue-500 px-2 py-1.5 text-sm text-gray-900 outline-none dark:bg-gray-800 dark:text-gray-100"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={confirmAddColumn}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-green-600 hover:bg-green-50 dark:border-gray-600"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelAddColumn}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveAction('new-column')}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:border-gray-600"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      )}

      {completingSprint && activeSprint !== null && (
        <CompleteSprintModal
          sprintTitle={`${project.key} Sprint ${activeSprint}`}
          completedCount={boardTickets.filter((ticket) => ticket.column === 'Done').length}
          openCount={boardTickets.filter((ticket) => ticket.column !== 'Done').length}
          onCancel={() => setCompletingSprint(false)}
          onConfirm={(destination) => {
            if (isAdmin) {
              setSprintSnapshot({ allTickets, sprintNumbers, nextSprintNumber })
            }
            completeSprint(activeSprint, destination)
            setCompletingSprint(false)
          }}
        />
      )}

      {isAdmin && sprintSnapshot && (
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => {
              restoreSprintSnapshot(sprintSnapshot)
              setSprintSnapshot(null)
            }}
            className="rounded-md border border-dashed border-orange-400 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950/40"
          >
            Reset last Complete Sprint (admin testing)
          </button>
        </div>
      )}
    </div>

      {detailTicket && (
        <SubtaskPanel
          key={detailTicket.key}
          ticket={detailTicket}
          onClose={() => setDetailTicketKey(null)}
          onChangeStatus={moveBoardColumn}
          comments={detailTicket.comments}
          onAddComment={(text) => addComment(detailTicket.key, text)}
          showSubtasks={false}
        />
      )}

      {otherTicketWarning && (
        <div className="fixed bottom-6 left-1/2 z-[70] w-max max-w-[90vw] -translate-x-1/2 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-lg dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            You're moving a ticket assigned to someone else on your team.
          </p>
        </div>
      )}
    </div>
  )
}
