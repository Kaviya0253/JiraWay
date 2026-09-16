import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import TopBar from './workspace/TopBar'
import ProjectHeader from './workspace/ProjectHeader'
import Sidebar from './workspace/Sidebar'
import TabRow from './workspace/TabRow'
import Board from './workspace/Board'
import Backlog from './workspace/Backlog'
import Summary from './workspace/Summary'
import CalendarPage from './workspace/CalendarPage'
import Timeline from './workspace/Timeline'
import Team from './workspace/Team'
import LearnersList from '../screens/LearnersList'
import AnalyticsDashboard from '../screens/AnalyticsDashboard'
import useTicketStore from '../hooks/useTicketStore'
import { resetLearnerDemoData, recordTabVisit, recordDecorativeClick, recordActivityEvent } from '../utils/localStorage'

export default function JiraWorkspace({
  learnerId,
  learner,
  onLogout,
  showSidebar = false,
  showTabs = false,
  enableSummary = false,
  enableCalendar = false,
  onProjectClick,
  onTicketCreated,
  highlightTicketKey,
  disableClickTicketKey,
  disableCardActions,
  restrictDragToKey,
  restrictAssigneeFilterTo,
  restrictTabsToView,
  disableCompleteSprint = false,
  disableSearchAndFilter = false,
  forceBoardViewKey,
  onExposeActions,
  initialView = 'board',
  dropZoneSprintNumber,
  sprintPanelDataTourNumber,
  activeSprintActionStop,
  closeSubtaskPanelKey,
  disableActionsForKey,
  onSubViewChange,
  disableCreateModalDismiss = false,
  createModalHelpActive = false,
  onExitCreateModalHelp,
  onOpenCreateModalHelp,
  disableTopBarActions = false,
  onCheckModules,
  onExpandButtonRectChange,
  trackTabVisits = false,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(showSidebar)

  // showSidebar only sets the initial state above — this syncs it when a
  // caller changes the prop later (e.g. Module 3 hiding the sidebar for the
  // comment step), which a bare useState initializer wouldn't otherwise pick
  // up after the first render.
  useEffect(() => {
    setSidebarOpen(showSidebar)
  }, [showSidebar])
  const [activeView, setActiveView] = useState(initialView)

  // Only logged from the plain post-curriculum workspace (App.jsx is the
  // only caller passing trackTabVisits) — a guided module forcing the view
  // to a specific tab as part of its own tour isn't "what she explored on
  // her own," so those switches shouldn't count.
  useEffect(() => {
    if (!trackTabVisits) return
    recordTabVisit(learnerId, activeView)
  }, [trackTabVisits, learnerId, activeView])
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  const [showLearners, setShowLearners] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [sprintCarryoverNotice, setSprintCarryoverNotice] = useState(false)
  const isAdmin = learner?.role === 'admin'
  const ticketStore = useTicketStore(learnerId)

  // Project header + tab row scroll away with the rest of the page whenever
  // a view's own content (a tall column, say) grows past the viewport and
  // the whole document scrolls — same underlying issue Sidebar already
  // solves. `sticky` alone isn't enough since TopBar above it isn't a fixed
  // height across every state (hidden entirely while isExpanded), so its
  // real rendered top has to be measured, not assumed.
  //
  // Measuring the sticky wrapper's OWN getBoundingClientRect (instead of
  // TopBar's height directly) doesn't work here: once it's actually stuck
  // from a prior scroll, its rect reports the stuck position we already
  // gave it, not its natural flow position — so toggling isExpanded (which
  // removes TopBar) just fed the same stale offset back in, leaving a gap
  // the height of the now-gone TopBar above it. Measuring TopBar's own
  // height directly avoids that feedback loop entirely.
  //
  // Queried via `document.querySelector('header')` rather than a ref on a
  // wrapping div: TopBar is the only <header> on screen, and a wrapping div
  // around it would silently break its own `sticky` — a sticky element can
  // only stay pinned while its immediate parent box is still on screen, and
  // a wrapper sized exactly to TopBar's own height (the default) gives it
  // zero extra room to do that, so it would scroll away with the page
  // instead of sticking.
  const [topBarHeight, setTopBarHeight] = useState(0)
  const projectHeaderTop = isExpanded ? 0 : topBarHeight
  useLayoutEffect(() => {
    function measure() {
      const el = document.querySelector('header')
      setTopBarHeight(el ? el.getBoundingClientRect().height : 0)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isExpanded])

  // Lets a caller (Module 2's test-only "replay" button) force this back to
  // the board tab, in case she'd wandered to Summary/Calendar/etc. while
  // poking around — otherwise the ticket-card selector it's looking for
  // simply isn't in the DOM and the spotlight silently finds nothing.
  useEffect(() => {
    if (forceBoardViewKey == null) return
    setActiveView('board')
    setShowTeam(false)
    setShowLearners(false)
    setIsExpanded(false)
  }, [forceBoardViewKey])

  // Reports the real expand-toggle button's own live position (App.jsx
  // anchors its floating "Practice again" button to it) — re-measured
  // whenever anything here could shift that button horizontally (sidebar
  // opening/closing, expand mode itself), the viewport resizes, or the page
  // scrolls (the expand-toggle sits in ProjectHeader, not the sticky TopBar,
  // so it moves under scroll even though TopBar doesn't), so the floating
  // button tracks it instead of sitting at some independently calibrated
  // page position that drifts out of place once the layout actually changes.
  useLayoutEffect(() => {
    if (!onExpandButtonRectChange) return
    function measure() {
      const el = document.querySelector('[data-tour="expand-toggle"]')
      onExpandButtonRectChange(el ? el.getBoundingClientRect() : null)
    }
    measure()
    window.addEventListener('resize', measure)
    // capture: true also catches scrolling inside a nested overflow
    // container (the board's own horizontal scroll, Summary/Calendar's
    // overflow-auto), not just the window itself.
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [sidebarOpen, isExpanded, showTeam, showLearners, showAnalytics, onExpandButtonRectChange])

  // Counts real engagement in the free workspace — a ticket she created, a
  // status she changed, a comment she left on her own — as opposed to a
  // guided module walking her through the same action. Only counts while
  // trackTabVisits is on, same gate as the tab-visit log above; the raw
  // ticketStore functions (used by onExposeActions' test tools and every
  // guided module's own props below) stay untouched.
  function withActivityCount(fn, type) {
    return (...args) => {
      if (trackTabVisits) recordActivityEvent(learnerId, type)
      return fn(...args)
    }
  }
  const trackedCreateTicket = withActivityCount(ticketStore.createTicket, 'ticketsCreated')
  const trackedMoveBoardColumn = withActivityCount(ticketStore.moveBoardColumn, 'statusChanges')
  const trackedAddComment = withActivityCount(ticketStore.addComment, 'commentsAdded')

  function createTicketFromTopBar(args) {
    const newTicket = trackedCreateTicket(args)
    onTicketCreated?.(newTicket)
    return newTicket
  }

  // Lets a caller (Module 2's test tools) reach real store mutations —
  // like deleting a ticket it created last run — without threading every
  // ticketStore function through as its own prop.
  useEffect(() => {
    onExposeActions?.({
      deleteTicket: ticketStore.deleteTicket,
      createTicket: ticketStore.createTicket,
      moveBoardColumn: ticketStore.moveBoardColumn,
      moveToSprint: ticketStore.moveToSprint,
      addComment: ticketStore.addComment,
      clearComments: ticketStore.clearComments,
      allTickets: ticketStore.allTickets,
    })
  }, [
    onExposeActions,
    ticketStore.deleteTicket,
    ticketStore.createTicket,
    ticketStore.moveBoardColumn,
    ticketStore.moveToSprint,
    ticketStore.addComment,
    ticketStore.clearComments,
    ticketStore.allTickets,
  ])

  function handleProjectClick(project) {
    setShowTeam(false)
    setShowLearners(false)
    onProjectClick?.(project)
  }

  // Admin-only testing shortcut — restores this learner's tickets/sprints
  // back to the fresh seeded state (keeping any real progress/tickets she
  // made herself), so an action like Complete Sprint can be tested
  // repeatedly without it staying permanently changed.
  function handleResetDemoData() {
    resetLearnerDemoData(learnerId)
    window.location.reload()
  }

  // Lets a caller outside this component (App.jsx's floating "Practice
  // again" button) know whether Team/Learners/Analytics is currently
  // showing, so it can hide itself there — that panel already has its own
  // "Back" link, and a second floating button on top of it just clutters
  // the same corner.
  useEffect(() => {
    onSubViewChange?.(showTeam || showLearners || showAnalytics)
  }, [showTeam, showLearners, showAnalytics, onSubViewChange])

  return (
    <div className="flex h-full min-h-screen flex-col bg-white dark:bg-gray-900">
      {!isExpanded && (
        <TopBar
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          createTicket={createTicketFromTopBar}
          sprintNumbers={ticketStore.sprintNumbers}
          allTickets={ticketStore.allTickets}
          onSelectView={(view) => {
            setShowTeam(false)
            setShowLearners(false)
            setActiveView(view)
          }}
          onOpenTeam={() => {
            setShowLearners(false)
            setShowTeam(true)
          }}
          learner={learner}
          onLogout={onLogout}
          disableCreateModalDismiss={disableCreateModalDismiss}
          createModalHelpActive={createModalHelpActive}
          onExitCreateModalHelp={onExitCreateModalHelp}
          onOpenCreateModalHelp={onOpenCreateModalHelp}
          disableTopBarActions={disableTopBarActions}
        />
      )}

      <div className="flex flex-1">
        {sidebarOpen && !isExpanded && (
          <Sidebar
            onProjectClick={handleProjectClick}
            onTeamsClick={() => {
              setShowLearners(false)
              setShowAnalytics(false)
              setShowTeam((show) => !show)
            }}
            isTeamActive={showTeam}
            isAdmin={isAdmin}
            onLearnersClick={() => {
              setShowTeam(false)
              setShowAnalytics(false)
              setShowLearners((show) => !show)
            }}
            isLearnersActive={showLearners}
            onCheckModules={onCheckModules}
            onResetDemoData={handleResetDemoData}
            onDecorativeClick={(label) => trackTabVisits && recordDecorativeClick(learnerId, label)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {showTeam ? (
            <Team onBack={() => setShowTeam(false)} />
          ) : showLearners ? (
            <LearnersList
              onBack={() => setShowLearners(false)}
              onViewAnalytics={() => {
                setShowLearners(false)
                setShowAnalytics(true)
              }}
            />
          ) : showAnalytics ? (
            <AnalyticsDashboard
              onBack={() => {
                setShowAnalytics(false)
                setShowLearners(true)
              }}
            />
          ) : (
            <>
              {/* z-[5], not z-10+ — TopBar is `sticky z-10`, and its own
                  Search/Create dropdowns (GlobalSearch, CreateIssueModal)
                  render as descendants inside that stacking context, so
                  they're capped at TopBar's own rank no matter what z-index
                  they use internally. A z-index here at or above 10 would
                  sit as a sibling stacking context ABOVE that whole context,
                  cutting those dropdowns off right where they overlap this
                  bar. It still needs to be ABOVE 0/auto though — a ticket
                  card's own `relative` elements (assignee dropdown, etc.)
                  are also positioned at the default z-index:auto, and being
                  later in DOM order than this bar, a tie at z-0 let them
                  paint over it during scroll instead of staying underneath. */}
              <div className="sticky z-[5] bg-white dark:bg-gray-900" style={{ top: projectHeaderTop }}>
                <ProjectHeader
                  onProjectClick={handleProjectClick}
                  isExpanded={isExpanded}
                  onExpandClick={() => setIsExpanded((expanded) => !expanded)}
                />

                {showTabs && (
                  <TabRow activeView={activeView} onSelect={setActiveView} restrictToKey={restrictTabsToView} />
                )}
              </div>

              {activeView === 'summary' && (
                <Summary
                  learnerId={learnerId}
                  allTickets={ticketStore.allTickets}
                  activity={ticketStore.activity}
                  sprintDates={ticketStore.sprintDates}
                />
              )}
              {activeView === 'calendar' && (
                <CalendarPage
                  learnerId={learnerId}
                  allTickets={ticketStore.allTickets}
                  sprintDates={ticketStore.sprintDates}
                />
              )}
              {activeView === 'timeline' && (
                <Timeline
                  learnerId={learnerId}
                  allTickets={ticketStore.allTickets}
                  sprintDates={ticketStore.sprintDates}
                  createTicket={trackedCreateTicket}
                />
              )}
              {activeView === 'board' && (
                <Board
                  learnerId={learnerId}
                  isAdmin={isAdmin}
                  allTickets={ticketStore.allTickets}
                  moveBoardColumn={trackedMoveBoardColumn}
                  changeAssignee={ticketStore.changeAssignee}
                  createTicket={trackedCreateTicket}
                  deleteTicket={ticketStore.deleteTicket}
                  completeSprint={ticketStore.completeSprint}
                  restoreSprintSnapshot={ticketStore.restoreSprintSnapshot}
                  nextSprintNumber={ticketStore.nextSprintNumber}
                  addComment={trackedAddComment}
                  sprintNumbers={ticketStore.sprintNumbers}
                  sprintDates={ticketStore.sprintDates}
                  highlightTicketKey={highlightTicketKey}
                  disableClickTicketKey={disableClickTicketKey}
                  disableCardActions={disableCardActions}
                  disableCompleteSprint={disableCompleteSprint}
                  disableSearchAndFilter={disableSearchAndFilter}
                  restrictDragToKey={restrictDragToKey}
                  restrictAssigneeFilterTo={restrictAssigneeFilterTo}
                  onGoToBacklog={() => {
                    setActiveView('backlog')
                    setSprintCarryoverNotice(true)
                  }}
                />
              )}
              {activeView === 'backlog' && (
                <Backlog
                  showSprintCarryoverNotice={sprintCarryoverNotice}
                  onDismissSprintCarryoverNotice={() => setSprintCarryoverNotice(false)}
                  allTickets={ticketStore.allTickets}
                  sprintNumbers={ticketStore.sprintNumbers}
                  sprintDates={ticketStore.sprintDates}
                  createTicket={trackedCreateTicket}
                  deleteTicket={ticketStore.deleteTicket}
                  moveToSprint={ticketStore.moveToSprint}
                  moveBoardColumn={trackedMoveBoardColumn}
                  changePriority={ticketStore.changePriority}
                  changeStoryPoints={ticketStore.changeStoryPoints}
                  changeSprintDates={ticketStore.changeSprintDates}
                  changeEpic={ticketStore.changeEpic}
                  changeAssignee={ticketStore.changeAssignee}
                  addComment={trackedAddComment}
                  startSprint={ticketStore.startSprint}
                  completeSprint={ticketStore.completeSprint}
                  createSprint={ticketStore.createSprint}
                  deleteSprint={ticketStore.deleteSprint}
                  highlightTicketKey={highlightTicketKey}
                  dropZoneSprintNumber={dropZoneSprintNumber}
                  sprintPanelDataTourNumber={sprintPanelDataTourNumber}
                  activeSprintActionStop={activeSprintActionStop}
                  closeSubtaskPanelKey={closeSubtaskPanelKey}
                  disableActionsForKey={disableActionsForKey}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
