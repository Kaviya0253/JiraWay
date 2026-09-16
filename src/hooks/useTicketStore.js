import { useState, useEffect, useMemo } from 'react'
import { tickets, project, getLearnerName } from '../data/sampleProject'
import { loadState, saveState, scopedKey } from '../utils/localStorage'

const SPRINT_ASSIGNMENTS = [
  // Sprint 2 — the active sprint
  { key: 'WEB-1', sprint: 2, onBoard: true, column: 'To Do', assignee: null },
  { key: 'WEB-6', sprint: 2, onBoard: true, column: 'To Do', assignee: 'Yavika' },
  { key: 'WEB-2', sprint: 2, onBoard: true, column: 'In Progress', assignee: 'Yavika' },
  { key: 'WEB-11', sprint: 2, onBoard: true, column: 'In Progress', assignee: 'Arun Kumar' },
  { key: 'WEB-3', sprint: 2, onBoard: true, column: 'Done', assignee: 'Arun Kumar' },
]

// Purely historical filler for the two already-completed sprints — these
// keys don't exist in sampleProject.js's tickets list at all, so they don't
// eat into the real backlog the learner actually works with. They just need
// to exist and be Done, to make "2 sprints already happened" feel real in
// the numbers; nothing in the curriculum ever points the learner at them.
const PAST_SPRINT_SEEDS = [
  { key: 'WEB-20', title: 'Set up project repository and CI pipeline', type: 'Task', sprint: 0, assignee: 'Yavika' },
  { key: 'WEB-21', title: 'Draft initial site architecture', type: 'Story', sprint: 0, assignee: 'Arun Kumar' },
  { key: 'WEB-22', title: 'Configure staging environment', type: 'Task', sprint: 0, assignee: 'Yavika' },
  { key: 'WEB-23', title: 'Fix broken navigation links on old site', type: 'Bug', sprint: 0, assignee: 'Arun Kumar' },
  { key: 'WEB-24', title: 'Conduct competitor analysis', type: 'Story', sprint: 0, assignee: 'Yavika' },
  { key: 'WEB-25', title: 'Build reusable button component library', type: 'Task', sprint: 1, assignee: 'Arun Kumar' },
  { key: 'WEB-26', title: 'Migrate legacy CSS to Tailwind', type: 'Task', sprint: 1, assignee: 'Yavika' },
  { key: 'WEB-27', title: 'Fix accessibility contrast issues', type: 'Bug', sprint: 1, assignee: 'Arun Kumar' },
  { key: 'WEB-28', title: 'Write onboarding documentation', type: 'Story', sprint: 1, assignee: 'Yavika' },
  { key: 'WEB-29', title: 'Set up analytics tracking', type: 'Task', sprint: 1, assignee: 'Arun Kumar' },
]

// Every seed ticket's priority — spread across all 5 levels instead of
// defaulting everything to Medium, so Summary's Priority breakdown chart
// shows a real distribution for anyone logging in fresh.
const PRIORITY_SEEDS = {
  'WEB-1': 'Highest',
  'WEB-15': 'Highest',
  'WEB-23': 'Highest',
  'WEB-3': 'High',
  'WEB-11': 'High',
  'WEB-14': 'High',
  'WEB-21': 'High',
  'WEB-27': 'High',
  'WEB-2': 'Medium',
  'WEB-6': 'Medium',
  'WEB-9': 'Medium',
  'WEB-12': 'Medium',
  'WEB-16': 'Medium',
  'WEB-17': 'Medium',
  'WEB-19': 'Medium',
  'WEB-25': 'Medium',
  'WEB-5': 'Low',
  'WEB-7': 'Low',
  'WEB-10': 'Low',
  'WEB-18': 'Low',
  'WEB-20': 'Low',
  'WEB-22': 'Low',
  'WEB-24': 'Low',
  'WEB-26': 'Low',
  'WEB-8': 'Lowest',
  'WEB-13': 'Lowest',
  'WEB-28': 'Lowest',
  'WEB-29': 'Lowest',
}

function priorityFor(ticketKey) {
  return PRIORITY_SEEDS[ticketKey] ?? 'Medium'
}

// Every seed ticket's story points — sized off scope (bug fixes small,
// site-wide/foundational work large) so Backlog and Board show real
// estimates instead of every ticket sitting at "-". Learner-created tickets
// (WEB-4, and whatever she names in her own Backlog Demo practice ticket)
// are intentionally left unestimated, same as a freshly created ticket would
// be in real Jira before planning gives it a size.
const STORY_POINT_SEEDS = {
  'WEB-1': 2,
  'WEB-2': 3,
  'WEB-3': 5,
  'WEB-6': 5,
  'WEB-11': 5,
  'WEB-16': 1,
  'WEB-17': 1,
  'WEB-19': 2,
  'WEB-5': 3,
  'WEB-7': 8,
  'WEB-8': 3,
  'WEB-9': 8,
  'WEB-10': 8,
  'WEB-12': 3,
  'WEB-13': 5,
  'WEB-14': 2,
  'WEB-15': 3,
  'WEB-18': 1,
  'WEB-20': 5,
  'WEB-21': 8,
  'WEB-22': 3,
  'WEB-23': 2,
  'WEB-24': 5,
  'WEB-25': 5,
  'WEB-26': 8,
  'WEB-27': 3,
  'WEB-28': 3,
  'WEB-29': 2,
}

function storyPointsFor(ticketKey) {
  return STORY_POINT_SEEDS[ticketKey] ?? null
}

// Epics are just a grouping/theme, not board work — kept off Board (via
// onBoard: false) and Backlog (Backlog.jsx explicitly excludes type
// 'Epic'), but they show up wherever something reads allTickets directly,
// like Timeline's Epic list.
const EPIC_SEEDS = [
  { key: 'WEB-30', title: 'Homepage Revamp', assignee: 'Yavika' },
  { key: 'WEB-31', title: 'Dark Mode Rollout', assignee: 'Arun Kumar' },
  { key: 'WEB-32', title: 'Site Reliability & Bug Fixes', assignee: 'Arun Kumar' },
]

// Which epic each ticket belongs to — content only for now; nothing in the
// UI lets a learner change this yet, that's the next step.
const EPIC_LINKS = {
  'WEB-2': 'WEB-30',
  'WEB-8': 'WEB-30',
  'WEB-9': 'WEB-30',
  'WEB-3': 'WEB-31',
  'WEB-19': 'WEB-31',
  'WEB-1': 'WEB-32',
  'WEB-14': 'WEB-32',
  'WEB-15': 'WEB-32',
  'WEB-23': 'WEB-32',
}

function epicFor(ticketKey) {
  return EPIC_LINKS[ticketKey] ?? null
}

const SUBTASK_SEEDS = [
  {
    key: 'WEB-16',
    title: 'Export banner assets at 2x resolution',
    parentKey: 'WEB-2',
    sprint: 2,
    onBoard: true,
    column: 'Done',
  },
  {
    key: 'WEB-17',
    title: 'Get banner copy approved by marketing',
    parentKey: 'WEB-2',
    sprint: 2,
    onBoard: true,
    column: 'To Do',
  },
  {
    key: 'WEB-18',
    title: 'Collect email field validation rules',
    parentKey: 'WEB-5',
    sprint: null,
    onBoard: false,
    column: null,
  },
  {
    key: 'WEB-19',
    title: 'Persist theme preference in localStorage',
    parentKey: 'WEB-3',
    sprint: 2,
    onBoard: true,
    column: 'Done',
  },
]

// Kept inside the last ~20 hours (not spread over days) — a small team of 3
// feels more "live" when their handful of updates all landed today, rather
// than trickling in one every day or two.
const ACTIVITY_SEEDS = [
  {
    actor: 'Arun Kumar',
    action: 'updated field "status"',
    ticketKey: 'WEB-3',
    ticketTitle: 'Add dark mode toggle',
    ticketType: 'Story',
    status: 'Done',
    daysAgo: 1 / 24,
  },
  {
    actor: 'Yavika',
    action: 'updated field "status"',
    ticketKey: 'WEB-2',
    ticketTitle: 'Update homepage banner image',
    ticketType: 'Task',
    status: 'In Progress',
    daysAgo: 3 / 24,
  },
  {
    actor: 'Arun Kumar',
    action: 'updated field "status"',
    ticketKey: 'WEB-11',
    ticketTitle: 'Implement responsive navigation menu',
    ticketType: 'Task',
    status: 'In Progress',
    daysAgo: 6 / 24,
  },
  {
    actor: 'Karthik Subramaniam',
    action: 'updated field "Priority"',
    ticketKey: 'WEB-6',
    ticketTitle: 'Redesign footer navigation',
    ticketType: 'Task',
    status: 'To Do',
    daysAgo: 10 / 24,
  },
  {
    actor: 'Karthik Subramaniam',
    action: 'created this work item',
    ticketKey: 'WEB-2',
    ticketTitle: 'Update homepage banner image',
    ticketType: 'Task',
    status: 'To Do',
    daysAgo: 20 / 24,
  },
]

const DAY_MS = 24 * 60 * 60 * 1000
const SPRINT_LENGTH_DAYS = 14

function offsetFromAnchor(anchor, days) {
  return new Date(anchor.getTime() + days * DAY_MS).toISOString()
}

// Anchored to this learner's first visit (not a fixed calendar date) so the
// seed sprint/activity timeline always reads as "currently in progress," no
// matter how much real-world time has passed since they started. Each
// learner gets their own anchor, tickets, sprints, and activity feed —
// namespaced under their id — so separate people sharing a browser never
// see each other's progress.
function buildSeedData(learnerId) {
  const anchorKey = scopedKey(learnerId, 'first-visited')
  const stored = loadState(anchorKey, null)
  const anchor = stored ? new Date(stored) : new Date()
  if (!stored) saveState(anchorKey, anchor.toISOString())

  const seedTimestamp = offsetFromAnchor(anchor, -3)

  const sprintDates = {
    0: { start: offsetFromAnchor(anchor, -31), end: offsetFromAnchor(anchor, -17) },
    1: { start: offsetFromAnchor(anchor, -17), end: offsetFromAnchor(anchor, -3) },
    2: { start: offsetFromAnchor(anchor, -3), end: offsetFromAnchor(anchor, 11) },
  }

  function timestampsFor(assignment) {
    if (assignment?.sprint === 0) {
      return { createdAt: offsetFromAnchor(anchor, -31), updatedAt: offsetFromAnchor(anchor, -17) }
    }
    if (assignment?.sprint === 1) {
      return { createdAt: offsetFromAnchor(anchor, -17), updatedAt: offsetFromAnchor(anchor, -3) }
    }
    if (!assignment) {
      // Untouched backlog ticket — sat there quietly for a while, so it
      // shouldn't count as "recently created/updated" on Summary's stat tiles.
      const old = offsetFromAnchor(anchor, -45)
      return { createdAt: old, updatedAt: old }
    }
    return { createdAt: seedTimestamp, updatedAt: seedTimestamp }
  }

  // Derived from ACTIVITY_SEEDS itself (not hand-copied) so a ticket's
  // updatedAt can never drift out of sync with what its own activity log says.
  function latestActivityDaysAgo(ticketKey) {
    const entries = ACTIVITY_SEEDS.filter((entry) => entry.ticketKey === ticketKey)
    return entries.length ? Math.min(...entries.map((entry) => entry.daysAgo)) : null
  }

  const initialTickets = tickets
    .map((ticket) => {
      const assignment = SPRINT_ASSIGNMENTS.find((entry) => entry.key === ticket.key)
      const timestamps = timestampsFor(assignment)
      const latestActivity = latestActivityDaysAgo(ticket.key)
      return {
        ...ticket,
        assignee: assignment?.assignee ?? null,
        dueDate: ticket.key === 'WEB-6' ? offsetFromAnchor(anchor, 4) : null,
        sprint: assignment?.sprint ?? null,
        onBoard: assignment?.onBoard ?? false,
        column: assignment?.column ?? null,
        priority: priorityFor(ticket.key),
        storyPoints: storyPointsFor(ticket.key),
        parentKey: null,
        epicKey: epicFor(ticket.key),
        ...timestamps,
        updatedAt: latestActivity != null ? offsetFromAnchor(anchor, -latestActivity) : timestamps.updatedAt,
        isSeed: true,
      }
    })
    .concat(
      SUBTASK_SEEDS.map((seed) => ({
        key: seed.key,
        title: seed.title,
        type: 'Subtask',
        // A subtask with no assignee of its own reads as "unassigned" on
        // every fresh login — defaulting it to the parent ticket's assignee
        // matches what actually creating a subtask under an assigned ticket does.
        assignee: SPRINT_ASSIGNMENTS.find((entry) => entry.key === seed.parentKey)?.assignee ?? null,
        dueDate: null,
        sprint: seed.sprint,
        onBoard: seed.onBoard,
        column: seed.column,
        priority: priorityFor(seed.key),
        storyPoints: storyPointsFor(seed.key),
        parentKey: seed.parentKey,
        epicKey: epicFor(seed.key),
        ...timestampsFor(seed.sprint === 2 ? { sprint: 2 } : null),
        isSeed: true,
      })),
    )
    .concat(
      PAST_SPRINT_SEEDS.map((seed) => ({
        key: seed.key,
        title: seed.title,
        type: seed.type,
        assignee: seed.assignee,
        dueDate: null,
        sprint: seed.sprint,
        onBoard: false,
        column: 'Done',
        priority: priorityFor(seed.key),
        storyPoints: storyPointsFor(seed.key),
        parentKey: null,
        epicKey: epicFor(seed.key),
        ...timestampsFor(seed),
        isSeed: true,
      })),
    )
    .concat(
      EPIC_SEEDS.map((seed) => ({
        key: seed.key,
        title: seed.title,
        type: 'Epic',
        assignee: seed.assignee,
        dueDate: null,
        sprint: null,
        onBoard: false,
        column: 'To Do',
        priority: 'High',
        storyPoints: null,
        parentKey: null,
        epicKey: null,
        ...timestampsFor(null),
        isSeed: true,
      })),
    )

  const activity = ACTIVITY_SEEDS.map((entry, index) => ({
    id: `seed-${index}`,
    actor: entry.actor,
    action: entry.action,
    ticketKey: entry.ticketKey,
    ticketTitle: entry.ticketTitle,
    ticketType: entry.ticketType,
    status: entry.status,
    timestamp: offsetFromAnchor(anchor, -entry.daysAgo),
  }))

  return { initialTickets, sprintDates, activity }
}

function withSeedTickets(loadedTickets, initialTickets) {
  const seedByKey = new Map(initialTickets.map((seed) => [seed.key, seed]))

  const merged = loadedTickets.map((ticket) => {
    const seed = seedByKey.get(ticket.key)
    if (!seed) return ticket
    // A plain { ...seed, ...ticket } spread doesn't actually backfill
    // anything once a field already exists on the persisted ticket, even
    // sitting at an old null default — the persisted null just wins outright,
    // which is exactly what happened when storyPoints seeds were added here:
    // every already-persisted ticket kept showing "-" since its stored
    // (pre-seed) storyPoints of null overrode the new value every time.
    // Only fall back to the seed's value when the persisted one is still
    // null, so a real (non-null) learner edit still isn't clobbered.
    const combined = { ...seed, ...ticket }
    for (const field of ['storyPoints', 'priority', 'epicKey']) {
      if (ticket[field] == null && seed[field] != null) combined[field] = seed[field]
    }
    return combined
  })

  const missingSeeds = initialTickets.filter(
    (seed) => !loadedTickets.some((ticket) => ticket.key === seed.key),
  )

  return [...merged, ...missingSeeds]
}

export default function useTicketStore(learnerId) {
  const seed = useMemo(() => buildSeedData(learnerId), [learnerId])
  const key = (name) => scopedKey(learnerId, name)

  const [allTickets, setAllTickets] = useState(() =>
    withSeedTickets(loadState(key('tickets'), seed.initialTickets), seed.initialTickets),
  )
  const [sprintNumbers, setSprintNumbers] = useState(() => loadState(key('sprints'), [2]))
  const [nextSprintNumber, setNextSprintNumber] = useState(() =>
    loadState(key('next-sprint'), 3),
  )
  const [activity, setActivity] = useState(() => loadState(key('activity'), seed.activity))
  const [sprintDates, setSprintDates] = useState(() => {
    const loaded = loadState(key('sprint-dates'), seed.sprintDates)
    // Backfill any seed sprint dates (e.g. a previous sprint added later)
    // that a returning session's saved state predates, without touching
    // dates the user's own sprints have already been given.
    return { ...seed.sprintDates, ...loaded }
  })

  useEffect(() => saveState(key('tickets'), allTickets), [allTickets])
  useEffect(() => saveState(key('sprints'), sprintNumbers), [sprintNumbers])
  useEffect(() => saveState(key('next-sprint'), nextSprintNumber), [nextSprintNumber])
  useEffect(() => saveState(key('activity'), activity), [activity])
  useEffect(() => saveState(key('sprint-dates'), sprintDates), [sprintDates])

  function addActivity(action, ticket) {
    setActivity((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          actor: getLearnerName(),
          action,
          ticketKey: ticket.key,
          ticketTitle: ticket.title,
          ticketType: ticket.type,
          status: ticket.column ?? 'To Do',
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 30),
    )
  }

  function nextTicketKey() {
    const numbers = allTickets
      .map((ticket) => parseInt(ticket.key.split('-')[1], 10))
      .filter((n) => !Number.isNaN(n))
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1
    return `${project.key}-${nextNumber}`
  }

  function createTicket({
    title,
    type = 'Task',
    description = null,
    assignee = null,
    dueDate = null,
    sprint = null,
    onBoard = false,
    column = null,
    parentKey = null,
    epicKey = null,
  }) {
    const now = new Date().toISOString()
    const newTicket = {
      key: nextTicketKey(),
      title,
      type,
      description,
      assignee,
      dueDate,
      sprint,
      onBoard,
      column,
      priority: 'Medium',
      storyPoints: null,
      parentKey,
      epicKey,
      createdAt: now,
      updatedAt: now,
      isSeed: false,
    }
    setAllTickets((current) => [...current, newTicket])
    addActivity('created this work item', newTicket)
    return newTicket
  }

  function deleteTicket(ticketKey) {
    setAllTickets((current) => current.filter((ticket) => ticket.key !== ticketKey || ticket.isSeed))
  }

  function moveToSprint(ticketKey, sprint) {
    const now = new Date().toISOString()
    // Dropping into a sprint that's already running should land the ticket
    // straight onto the board, same as creating a new ticket inside that
    // sprint panel already does — only dropping into a not-yet-started
    // sprint (or back to the Backlog) leaves it off-board.
    const sprintStarted = sprint !== null && allTickets.some((t) => t.sprint === sprint && t.onBoard)
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey
          ? {
              ...ticket,
              sprint,
              onBoard: sprintStarted,
              column: sprintStarted ? ticket.column ?? 'To Do' : ticket.column,
              updatedAt: now,
            }
          : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      const destination = sprint === null ? 'Backlog' : `Sprint ${sprint}`
      addActivity(`moved this work item to ${destination}`, { ...ticket, column: null })
    }
  }

  function moveBoardColumn(ticketKey, column) {
    const now = new Date().toISOString()
    setAllTickets((current) => {
      const moved = current.find((ticket) => ticket.key === ticketKey)
      if (!moved) return current
      const rest = current.filter((ticket) => ticket.key !== ticketKey)
      return [...rest, { ...moved, column, updatedAt: now }]
    })
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('updated field "status"', { ...ticket, column })
    }
  }

  function changeEpic(ticketKey, epicKey) {
    const now = new Date().toISOString()
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey ? { ...ticket, epicKey, updatedAt: now } : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('updated field "Parent"', ticket)
    }
  }

  function changePriority(ticketKey, priority) {
    const now = new Date().toISOString()
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey ? { ...ticket, priority, updatedAt: now } : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('updated field "Priority"', ticket)
    }
  }

  function changeAssignee(ticketKey, assignee) {
    const now = new Date().toISOString()
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey ? { ...ticket, assignee, updatedAt: now } : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('updated field "Assignee"', ticket)
    }
  }

  function addComment(ticketKey, text) {
    const trimmed = text.trim()
    if (!trimmed) return
    const now = new Date().toISOString()
    const comment = {
      id: `${ticketKey}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      author: getLearnerName(),
      text: trimmed,
      timestamp: now,
    }
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey
          ? { ...ticket, comments: [...(ticket.comments ?? []), comment], updatedAt: now }
          : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('commented on this work item', ticket)
    }
  }

  // TEMPORARY, for testing Module 3 — resets a ticket's status/comments back
  // to a fresh state so the update-progress flow can be re-tested without
  // the ticket already sitting "In Progress" with old test comments on it.
  // Remove once Module 3 no longer needs this.
  function clearComments(ticketKey) {
    setAllTickets((current) =>
      current.map((ticket) => (ticket.key === ticketKey ? { ...ticket, comments: [] } : ticket)),
    )
  }

  function changeStoryPoints(ticketKey, storyPoints) {
    const now = new Date().toISOString()
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.key === ticketKey ? { ...ticket, storyPoints, updatedAt: now } : ticket,
      ),
    )
    const ticket = allTickets.find((entry) => entry.key === ticketKey)
    if (ticket) {
      addActivity('updated field "Story point estimate"', ticket)
    }
  }

  function changeSprintDates(sprintNumber, start, end) {
    setSprintDates((current) => ({
      ...current,
      [sprintNumber]: { start, end },
    }))
  }

  function startSprint(sprintNumber) {
    const now = new Date().toISOString()
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.sprint === sprintNumber
          ? { ...ticket, onBoard: true, column: ticket.column ?? 'To Do', updatedAt: now }
          : ticket,
      ),
    )
    setSprintDates((current) => {
      if (current[sprintNumber]) return current
      const start = new Date()
      const end = new Date(start.getTime() + SPRINT_LENGTH_DAYS * 24 * 60 * 60 * 1000)
      return { ...current, [sprintNumber]: { start: start.toISOString(), end: end.toISOString() } }
    })
  }

  function completeSprint(sprintNumber, destination = 'backlog') {
    const now = new Date().toISOString()
    // Done items leave the board (so it goes empty), but stay tagged with
    // the sprint that finished them instead of moving to the backlog — same
    // as real Jira keeping completed work tied to its closed sprint, not
    // dumping it into the open backlog. They never carry into a new sprint.
    if (destination === 'new-sprint') {
      const newSprintNumber = nextSprintNumber
      setAllTickets((current) =>
        current.map((ticket) => {
          if (ticket.sprint !== sprintNumber) return ticket
          if (ticket.column === 'Done') {
            return { ...ticket, onBoard: false, updatedAt: now }
          }
          return { ...ticket, sprint: newSprintNumber, onBoard: false, updatedAt: now }
        }),
      )
      setSprintNumbers((current) => [...current.filter((number) => number !== sprintNumber), newSprintNumber])
      setNextSprintNumber((number) => number + 1)
    } else {
      setAllTickets((current) =>
        current.map((ticket) => {
          if (ticket.sprint !== sprintNumber) return ticket
          if (ticket.column === 'Done') {
            return { ...ticket, onBoard: false, updatedAt: now }
          }
          return { ...ticket, sprint: null, onBoard: false, updatedAt: now }
        }),
      )
      setSprintNumbers((current) => current.filter((number) => number !== sprintNumber))
    }
  }

  // Admin-only testing aid — lets Complete Sprint be undone so the flow can
  // be re-tested without a full "Reset sprint data" reload.
  function restoreSprintSnapshot(snapshot) {
    setAllTickets(snapshot.allTickets)
    setSprintNumbers(snapshot.sprintNumbers)
    setNextSprintNumber(snapshot.nextSprintNumber)
  }

  function createSprint() {
    setSprintNumbers((current) => [...current, nextSprintNumber])
    setNextSprintNumber((number) => number + 1)
  }

  function deleteSprint(sprintNumber) {
    setAllTickets((current) =>
      current.map((ticket) =>
        ticket.sprint === sprintNumber
          ? { ...ticket, sprint: null, onBoard: false, column: null }
          : ticket,
      ),
    )
    setSprintNumbers((current) => current.filter((number) => number !== sprintNumber))
    setSprintDates((current) => {
      const { [sprintNumber]: _removed, ...rest } = current
      return rest
    })
  }

  return {
    allTickets,
    sprintNumbers,
    nextSprintNumber,
    sprintDates,
    activity,
    createTicket,
    deleteTicket,
    moveToSprint,
    moveBoardColumn,
    changePriority,
    changeAssignee,
    addComment,
    clearComments,
    changeStoryPoints,
    changeSprintDates,
    changeEpic,
    startSprint,
    completeSprint,
    restoreSprintSnapshot,
    createSprint,
    deleteSprint,
  }
}
