import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import BacklogToolbar from './BacklogToolbar'
import BacklogPanel from './BacklogPanel'
import SubtaskPanel from './SubtaskPanel'
import CompleteSprintModal from './CompleteSprintModal'
import { project } from '../../data/sampleProject'
import { matchesFilters, matchesSearch } from '../../utils/ticketFilters'

export default function Backlog({
  allTickets,
  sprintNumbers,
  sprintDates,
  createTicket,
  deleteTicket,
  moveToSprint,
  moveBoardColumn,
  changePriority,
  changeStoryPoints,
  changeSprintDates,
  changeEpic,
  changeAssignee,
  addComment,
  startSprint,
  completeSprint,
  createSprint,
  deleteSprint,
  highlightTicketKey,
  dropZoneSprintNumber,
  sprintPanelDataTourNumber,
  activeSprintActionStop,
  closeSubtaskPanelKey,
  disableActionsForKey,
  showSprintCarryoverNotice = false,
  onDismissSprintCarryoverNotice,
}) {
  const [completingSprint, setCompletingSprint] = useState(null)
  const [filters, setFilters] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [detailTicketKey, setDetailTicketKey] = useState(null)
  const containerRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(null)

  // Lets a caller (the sprint-actions field tour) close the Subtask side
  // panel from outside once it's done pointing at it — any change to this
  // key closes it, so the caller can just bump a counter on every advance
  // rather than needing to know whether the panel happens to be open.
  useEffect(() => {
    if (closeSubtaskPanelKey == null) return
    setDetailTicketKey(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSubtaskPanelKey])

  // Clicking the subtask icon on the ticket that's already open should
  // close it again, not just re-open the same panel — plain setDetailTicketKey
  // always opens, with no way to close it back by clicking the same icon.
  function toggleSubtasks(ticketKey) {
    setDetailTicketKey((current) => (current === ticketKey ? null : ticketKey))
  }

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

  function isVisible(ticket) {
    return matchesFilters(ticket, filters) && matchesSearch(ticket, searchTerm)
  }

  function ticketsForSprint(number) {
    return allTickets.filter((ticket) => ticket.sprint === number)
  }

  function isSprintStarted(number) {
    return ticketsForSprint(number).some((ticket) => ticket.onBoard)
  }

  // Epics aren't board work — they never belong in the Backlog list, no
  // matter what sprint value they happen to carry (seeded or newly created
  // from Timeline's "+ Create Epic").
  const backlogTickets = allTickets.filter(
    (ticket) => ticket.sprint === null && ticket.type !== 'Epic',
  )
  const epics = allTickets.filter((ticket) => ticket.type === 'Epic')

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
      column: parent.onBoard ? 'To Do' : null,
    })
  }

  const detailTicket = allTickets.find((ticket) => ticket.key === detailTicketKey) ?? null
  const detailSubtasks = detailTicket
    ? allTickets.filter((ticket) => ticket.parentKey === detailTicket.key)
    : []

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 min-h-0 flex-shrink"
      style={{ height: containerHeight != null ? `${containerHeight}px` : undefined }}
    >
      <div className="flex min-w-0 min-h-0 flex-1 flex-col">
      <BacklogToolbar
        filters={filters}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {showSprintCarryoverNotice && (
        <div className="mx-3 mt-3 mb-3 flex items-start justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-gray-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-gray-100">
          <p>
            Open work items from your previous sprint moved here. Add them to a sprint and start
            it to see them on the board again.
          </p>
          <button
            type="button"
            onClick={onDismissSprintCarryoverNotice}
            aria-label="Dismiss"
            className="shrink-0 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
          >
            ✕
          </button>
        </div>
      )}

      <div
        data-tour="backlog-scroll-area"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4 scroll-smooth"
      >
        {sprintNumbers.map((number) => {
          const started = isSprintStarted(number)

          return (
            <BacklogPanel
              key={number}
              title={`${project.key} Sprint ${number}`}
              tickets={ticketsForSprint(number).filter(isVisible)}
              totalCount={ticketsForSprint(number).length}
              showAddDates
              sprintDates={sprintDates?.[number]}
              onChangeSprintDates={(start, end) => changeSprintDates(number, start, end)}
              actionLabel={started ? 'Complete sprint' : 'Start sprint'}
              actionDisabled={started ? false : ticketsForSprint(number).length === 0}
              onAction={() => (started ? setCompletingSprint(number) : startSprint(number))}
              onDelete={() => deleteSprint(number)}
              onDeleteTicket={deleteTicket}
              onOpenSubtasks={toggleSubtasks}
              onDropTicket={(ticketKey) => moveToSprint(ticketKey, number)}
              onCreate={(title, dueDate) =>
                createTicket({ title, dueDate, sprint: number, onBoard: started, column: started ? 'To Do' : null })
              }
              onChangeStatus={moveBoardColumn}
              onChangePriority={changePriority}
              onChangeStoryPoints={changeStoryPoints}
              epics={epics}
              onChangeEpic={changeEpic}
              onChangeAssignee={changeAssignee}
              emptyMessage="Plan a sprint by dragging work items into it, or by dragging the sprint footer."
              dataTour={
                number === dropZoneSprintNumber
                  ? 'sprint-dropzone'
                  : number === sprintPanelDataTourNumber
                    ? 'sprint-panel'
                    : undefined
              }
              highlightTicketKey={highlightTicketKey}
              activeSprintActionStop={activeSprintActionStop}
              disableActionsForKey={disableActionsForKey}
            />
          )
        })}

        <BacklogPanel
          title="Backlog"
          dataTour="backlog-list"
          tickets={backlogTickets.filter(isVisible)}
          totalCount={backlogTickets.length}
          showSprintIcon
          actionLabel="Create sprint"
          actionDataTour="create-sprint-button"
          onAction={createSprint}
          onDeleteTicket={deleteTicket}
          onOpenSubtasks={setDetailTicketKey}
          onDropTicket={(ticketKey) => moveToSprint(ticketKey, null)}
          onCreate={(title, dueDate) => createTicket({ title, dueDate, sprint: null })}
          onChangeStatus={moveBoardColumn}
          onChangePriority={changePriority}
          onChangeStoryPoints={changeStoryPoints}
          epics={epics}
          onChangeEpic={changeEpic}
          onChangeAssignee={changeAssignee}
          highlightTicketKey={highlightTicketKey}
          activeSprintActionStop={activeSprintActionStop}
          disableActionsForKey={disableActionsForKey}
          emptyMessage="Your backlog is empty."
        />
      </div>

      {completingSprint !== null && (
        <CompleteSprintModal
          sprintTitle={`${project.key} Sprint ${completingSprint}`}
          completedCount={
            ticketsForSprint(completingSprint).filter((ticket) => ticket.column === 'Done').length
          }
          openCount={
            ticketsForSprint(completingSprint).filter((ticket) => ticket.column !== 'Done').length
          }
          onCancel={() => setCompletingSprint(null)}
          onConfirm={(destination) => {
            completeSprint(completingSprint, destination)
            setCompletingSprint(null)
          }}
        />
      )}
      </div>

      {detailTicket && (
        <SubtaskPanel
          key={detailTicket.key}
          ticket={detailTicket}
          subtasks={detailSubtasks}
          onClose={() => setDetailTicketKey(null)}
          onCreateSubtask={(subtaskTitle) => createSubtask(detailTicket.key, subtaskTitle)}
          onDeleteSubtask={deleteTicket}
          onChangeSubtaskStatus={moveBoardColumn}
          onChangeStatus={moveBoardColumn}
          epics={epics}
          onChangeEpic={changeEpic}
          comments={detailTicket.comments}
          onAddComment={(text) => addComment(detailTicket.key, text)}
        />
      )}
    </div>
  )
}
