export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (disabled, full, private mode) — fail silently
  }
}

const CURRENT_LEARNER_KEY = 'jiraway-current-learner'
const KNOWN_LEARNERS_KEY = 'jiraway-known-learners'

function slugify(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return slug || 'learner'
}

function capitalizeName(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

// { id, name, email } for whoever is currently logged in, or null before login.
// Re-capitalizes on every read so names saved before this normalization
// existed (or typed lowercase some other way) still display correctly.
export function getCurrentLearner() {
  const learner = loadState(CURRENT_LEARNER_KEY, null)
  return learner ? { ...learner, name: capitalizeName(learner.name) } : null
}

export function getCurrentLearnerId() {
  return getCurrentLearner()?.id ?? null
}

export function getKnownLearners() {
  return loadState(KNOWN_LEARNERS_KEY, []).map((entry) => ({
    ...entry,
    name: capitalizeName(entry.name),
  }))
}

// Every learner gets their own namespaced slice of localStorage (keyed by
// their email, the one stable identifier here), so separate people using
// the same browser never see each other's progress. `role` is 'learner' by
// default; 'admin' is just a local flag (no real auth backs it) that unlocks
// the in-app learners list — not a security boundary.
export function setCurrentLearner(name, email, role = 'learner') {
  const id = slugify(email)
  const now = new Date().toISOString()

  const existingLearners = getKnownLearners()
  const existing = existingLearners.find((entry) => entry.id === id)
  const isNew = !existing

  const learner = {
    id,
    name: capitalizeName(name),
    email: email.trim().toLowerCase(),
    role,
    firstLoginAt: existing?.firstLoginAt ?? now,
    lastLoginAt: now,
  }
  saveState(CURRENT_LEARNER_KEY, learner)

  const known = existingLearners.filter((entry) => entry.id !== id)
  saveState(KNOWN_LEARNERS_KEY, [...known, learner])

  // isNew reflects the one source of truth for "have we seen this person
  // before" (the known-learners list itself) — a separate "already welcomed"
  // flag could in principle drift out of sync with it; this can't.
  return { ...learner, isNew }
}

// Deletes one learner's entire namespaced slice of localStorage (every
// `jiraway:<id>:*` key) — shared by removeLearner and
// removeAllLearnersExceptAdmin below, so both fully clean up instead of just
// dropping the known-learners row and leaving progress data orphaned.
function deleteLearnerData(learnerId) {
  const prefix = scopedKey(learnerId, '')
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) {
      try {
        localStorage.removeItem(key)
      } catch {
        // storage unavailable — fail silently
      }
    }
  }
}

// Admin-only per-row cleanup for the Learners list — removes exactly one
// entry (any role, including a stray admin-flagged test account), not just
// its row but its whole namespaced slice of localStorage too.
export function removeLearner(learnerId) {
  const known = getKnownLearners()
  deleteLearnerData(learnerId)
  saveState(KNOWN_LEARNERS_KEY, known.filter((entry) => entry.id !== learnerId))
}

// Admin-only bulk cleanup for the Learners list — this device accumulates a
// real entry per name+email typed in during testing, so the list grows fast.
// Never touches admin entries or the currently active session.
export function removeAllLearnersExceptAdmin() {
  const known = getKnownLearners()
  const toRemove = known.filter((entry) => entry.role !== 'admin')
  const toKeep = known.filter((entry) => entry.role === 'admin')

  for (const learner of toRemove) {
    deleteLearnerData(learner.id)
  }

  saveState(KNOWN_LEARNERS_KEY, toKeep)
  return toRemove.length
}

export function scopedKey(learnerId, key) {
  return `jiraway:${learnerId}:${key}`
}

// Module 1-4 plus BacklogDemo (counted as "Module 5"), same order/count as
// ModuleProgressBar's own stepper — kept as a separate copy here rather than
// importing from a screen component, matching how ModuleBrowserPanel already
// keeps its own copy of this same list.
const MODULE_SCREEN_KEYS = ['module1', 'module2', 'module3', 'module4', 'backlog-demo']

// Reads how far a learner has gotten, for the admin Learners list — off the
// same 'screen' and 'curriculum-completed' scoped keys App.jsx itself
// persists progress under (see SCREEN_PROGRESS_KEY / CURRICULUM_COMPLETED_KEY
// there), just read back here instead of driving navigation.
export function getLearnerModuleProgress(learnerId) {
  const totalModules = MODULE_SCREEN_KEYS.length
  const screen = loadState(scopedKey(learnerId, 'screen'), null)
  const curriculumCompleted = loadState(scopedKey(learnerId, 'curriculum-completed'), false)

  if (curriculumCompleted) {
    return { completedModules: totalModules, totalModules, status: 'completed' }
  }

  const index = MODULE_SCREEN_KEYS.indexOf(screen)
  if (index !== -1) {
    return { completedModules: index, totalModules, status: 'in-progress' }
  }

  // Reachable without curriculumCompleted only via the admin "check the
  // workspace" shortcut — a real learner never lands on 'workspace' any
  // other way, so this isn't "finished all modules," just not module
  // progress in the normal sense.
  if (screen === 'workspace') {
    return { completedModules: null, totalModules, status: 'workspace' }
  }

  return { completedModules: 0, totalModules, status: 'not-started' }
}

// Appends a timestamped entry every time a learner's screen actually changes
// (App.jsx calls this alongside its own screen-persisting effect) — this is
// the raw log getLearnerModuleTimings below turns into a per-module duration
// for the admin Learners list. Skips re-recording the same screen so a
// re-render mid-module doesn't pad its own duration with a string of
// identical, back-to-back entries.
export function recordScreenVisit(learnerId, screen) {
  const key = scopedKey(learnerId, 'screen-history')
  const history = loadState(key, [])
  if (history.length > 0 && history[history.length - 1].screen === screen) return
  saveState(key, [...history, { screen, at: new Date().toISOString() }])
}

export function formatDuration(ms) {
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 1) return '<1m'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

// Shared by every "how long on each X" reading below — turns a raw
// {key, at}[] log into per-key total time + visit count. Duration for entry
// i is measured up to entry i+1's timestamp (or up to right now, for
// whichever key is still current) — the same "time between landing on it and
// landing on whatever came next" logic every caller needs, just generalized
// over whatever field name that log uses (`screen` or `tab`).
function computeKeyedDurations(history, keyField) {
  const perKey = {}
  for (let i = 0; i < history.length; i++) {
    const key = history[i][keyField]
    const at = history[i].at
    const next = history[i + 1]
    const endTime = next ? new Date(next.at).getTime() : Date.now()
    const durationMs = endTime - new Date(at).getTime()
    // A learner can revisit the same module/tab (replay, or just tabbing
    // back and forth) — track every visit separately (not just a running
    // total) so the admin list can show "visited 3 times" instead of
    // silently hiding repeat visits inside one summed number.
    const existing = perKey[key] ?? { totalMs: 0, visits: [] }
    perKey[key] = { totalMs: existing.totalMs + durationMs, visits: [...existing.visits, durationMs] }
  }
  return Object.fromEntries(
    Object.entries(perKey).map(([key, { totalMs, visits }]) => [
      key,
      { totalMs, label: formatDuration(totalMs), visitCount: visits.length },
    ]),
  )
}

// Turns the raw screen-visit log into what the admin Learners list actually
// wants to show: how long she spent on each module, how long she's spent in
// the plain post-curriculum workspace specifically, and total time on the
// product overall (first visit ever to the most recent one recorded).
export function getLearnerModuleTimings(learnerId) {
  const history = loadState(scopedKey(learnerId, 'screen-history'), [])
  if (history.length === 0) return { perModule: {}, workspaceLabel: null, totalLabel: null }

  const perScreen = computeKeyedDurations(history, 'screen')
  const perModule = Object.fromEntries(
    Object.entries(perScreen).filter(([screen]) => MODULE_SCREEN_KEYS.includes(screen)),
  )

  const firstVisit = new Date(history[0].at).getTime()
  const lastActivity = new Date(history[history.length - 1].at).getTime()
  const totalMs = lastActivity - firstVisit

  return {
    perModule,
    workspaceLabel: perScreen.workspace?.label ?? null,
    totalLabel: formatDuration(totalMs),
  }
}

// Same idea as getLearnerModuleTimings, but for which tabs (Summary, Backlog,
// Board, Calendar, Timeline) she's actually clicked into while in the plain
// workspace — App.jsx/JiraWorkspace only logs a tab visit while `screen` is
// 'workspace' (see recordTabVisit's caller), so this is specifically
// "what she explored on her own," not tab switches a guided module forced.
export function getLearnerTabTimings(learnerId) {
  const history = loadState(scopedKey(learnerId, 'tab-history'), [])
  if (history.length === 0) return {}
  return computeKeyedDurations(history, 'tab')
}

// Appends a timestamped entry every time the active tab changes while she's
// in the plain workspace (JiraWorkspace calls this) — the raw log
// getLearnerTabTimings above turns into a per-tab duration + visit count.
export function recordTabVisit(learnerId, tab) {
  const key = scopedKey(learnerId, 'tab-history')
  const history = loadState(key, [])
  if (history.length > 0 && history[history.length - 1].tab === tab) return
  saveState(key, [...history, { tab, at: new Date().toISOString() }])
}

const MODULE_LABELS_BY_KEY = {
  module1: 'Module 1',
  module2: 'Module 2',
  module3: 'Module 3',
  module4: 'Module 4',
  'backlog-demo': 'Module 5',
  workspace: 'the workspace',
}

function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

// Where she was last seen — the last entry in the same screen-history log
// everything else here reads, so "drop-off point" costs nothing extra to
// track. Doesn't see which step *inside* a module she stopped on (only
// App.jsx's top-level screen is logged, not each module's own internal step
// state) — just which module/screen.
export function getLearnerLastSeen(learnerId) {
  const history = loadState(scopedKey(learnerId, 'screen-history'), [])
  if (history.length === 0) return null
  const last = history[history.length - 1]
  return {
    screenLabel: MODULE_LABELS_BY_KEY[last.screen] ?? last.screen,
    relativeLabel: formatRelativeTime(last.at),
  }
}

// Which modules she's gone back and replayed, off the same visitCount
// getLearnerModuleTimings already computes per module — pulled out on its
// own since "which modules get replayed most" is a distinct question from
// "how long did each one take."
export function getLearnerReplayedModules(learnerId) {
  const { perModule } = getLearnerModuleTimings(learnerId)
  return Object.entries(perModule)
    .filter(([, entry]) => entry.visitCount > 1)
    .map(([screen, entry]) => ({
      label: MODULE_LABELS_BY_KEY[screen] ?? screen,
      visitCount: entry.visitCount,
    }))
}

// Sidebar rows with no real feature behind them yet (Filters, Dashboards,
// Goals, Projects, For you, Recent, Starred, Apps, Plans) — a click here
// does nothing, but counting it tells you what a learner *expects* to be
// real. Sidebar calls this from a click handler that exists purely for this
// counting, kept deliberately separate from the rows' actual (nonexistent)
// onClick so they don't start looking interactive just because something is
// now listening.
export function recordDecorativeClick(learnerId, label) {
  const key = scopedKey(learnerId, 'decorative-clicks')
  const counts = loadState(key, {})
  saveState(key, { ...counts, [label]: (counts[label] ?? 0) + 1 })
}

export function getLearnerDecorativeClicks(learnerId) {
  return loadState(scopedKey(learnerId, 'decorative-clicks'), {})
}

// Real engagement in the free workspace, as opposed to just clicking
// through — a ticket she created, a status she changed, a comment she left,
// none of which a guided module walked her through. JiraWorkspace only
// calls this while trackTabVisits is on (same "what she did on her own"
// gate as the tab-visit log above), so guided-module actions never count.
export function recordActivityEvent(learnerId, type) {
  const key = scopedKey(learnerId, 'activity-counts')
  const counts = loadState(key, {})
  saveState(key, { ...counts, [type]: (counts[type] ?? 0) + 1 })
}

export function getLearnerActivityCounts(learnerId) {
  return loadState(scopedKey(learnerId, 'activity-counts'), {})
}

export function formatShortDuration(ms) {
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

// How long between a module's intro screen appearing and her first real
// action past it (e.g. Module 1's "Let's go", Module 4's "Start") — a proxy
// for hesitation/confusion vs. confidence. Each module calls this itself,
// right when its own step first moves past 'intro', passing how many ms
// that took since it mounted. Overwrites on replay rather than averaging —
// the most recent attempt is the one worth looking at.
export function recordFirstAction(learnerId, moduleKey, ms) {
  const key = scopedKey(learnerId, 'first-action')
  const timings = loadState(key, {})
  saveState(key, { ...timings, [moduleKey]: ms })
}

export function getLearnerFirstActionTimings(learnerId) {
  const timings = loadState(scopedKey(learnerId, 'first-action'), {})
  return Object.fromEntries(
    Object.entries(timings).map(([moduleKey, ms]) => [moduleKey, formatShortDuration(ms)]),
  )
}

// Rolls every per-learner reading above up across every known account on this
// device, admin included — on a single-device test setup the admin account is
// often the only one generating any data at all, and excluding it made the
// dashboard look empty/broken during exactly that kind of solo testing. Kept
// as raw numbers (ms, counts), not formatted labels — the dashboard decides
// how to display each one; this is just the one place that reads every
// learner's log once and adds it up.
export function getAggregateAnalytics() {
  const learners = getKnownLearners()

  const moduleTotals = {} // { [moduleKey]: { totalMs, learnerCount, replayCount } }
  const tabTotals = {} // { [tab]: { totalMs, learnerCount } }
  const activityTotals = {} // { ticketsCreated, statusChanges, commentsAdded }
  const decorativeTotals = {} // { [label]: count }
  const firstActionTotals = {} // { [moduleKey]: { totalMs, count } }
  let reachedWorkspaceCount = 0

  for (const learner of learners) {
    const { perModule, workspaceLabel } = getLearnerModuleTimings(learner.id)
    for (const [moduleKey, entry] of Object.entries(perModule)) {
      const bucket = moduleTotals[moduleKey] ?? { totalMs: 0, learnerCount: 0, replayCount: 0 }
      moduleTotals[moduleKey] = {
        totalMs: bucket.totalMs + entry.totalMs,
        learnerCount: bucket.learnerCount + 1,
        replayCount: bucket.replayCount + (entry.visitCount > 1 ? 1 : 0),
      }
    }
    if (workspaceLabel) reachedWorkspaceCount += 1

    const perTab = getLearnerTabTimings(learner.id)
    for (const [tab, entry] of Object.entries(perTab)) {
      const bucket = tabTotals[tab] ?? { totalMs: 0, learnerCount: 0 }
      tabTotals[tab] = { totalMs: bucket.totalMs + entry.totalMs, learnerCount: bucket.learnerCount + 1 }
    }

    const activity = getLearnerActivityCounts(learner.id)
    for (const [type, count] of Object.entries(activity)) {
      activityTotals[type] = (activityTotals[type] ?? 0) + count
    }

    const decorative = getLearnerDecorativeClicks(learner.id)
    for (const [label, count] of Object.entries(decorative)) {
      decorativeTotals[label] = (decorativeTotals[label] ?? 0) + count
    }

    const firstActions = loadState(scopedKey(learner.id, 'first-action'), {})
    for (const [moduleKey, ms] of Object.entries(firstActions)) {
      const bucket = firstActionTotals[moduleKey] ?? { totalMs: 0, count: 0 }
      firstActionTotals[moduleKey] = { totalMs: bucket.totalMs + ms, count: bucket.count + 1 }
    }
  }

  return {
    totalLearners: learners.length,
    reachedWorkspaceCount,
    // Average, not total — total time would just track headcount, not
    // actually say anything about how long any one module takes.
    moduleAverages: Object.fromEntries(
      Object.entries(moduleTotals).map(([key, { totalMs, learnerCount, replayCount }]) => [
        key,
        { avgMs: totalMs / learnerCount, learnerCount, replayCount },
      ]),
    ),
    tabAverages: Object.fromEntries(
      Object.entries(tabTotals).map(([key, { totalMs, learnerCount }]) => [
        key,
        { avgMs: totalMs / learnerCount, learnerCount },
      ]),
    ),
    firstActionAverages: Object.fromEntries(
      Object.entries(firstActionTotals).map(([key, { totalMs, count }]) => [key, totalMs / count]),
    ),
    activityTotals,
    decorativeTotals,
  }
}

// TEMPORARY, for testing — every date in the demo (sprint dates, due dates,
// "updated in the last 7 days" stats) is computed relative to the learner's
// very first visit, frozen in the 'first-visited' key on that first login and
// never touched again. Reusing the same test account across many real days
// leaves that anchor stuck in the past, so seeded due dates silently expire
// and Summary's stats stop matching a "Sprint 2 is happening right now"
// story. This re-anchors everything to today, same as a brand new learner
// signing in for the first time. Remove once there's a real reason learners
// would need this themselves.
export function resetLearnerDemoData(learnerId) {
  // Only drop the FIXED seed tickets so they get rebuilt with fresh dates —
  // a learner-created ticket (her own Module 2 ticket, anything else she's
  // made while testing) has no seed counterpart and would otherwise vanish
  // entirely, since a plain "clear the whole tickets key" doesn't distinguish
  // real work from seed content.
  const ticketsKey = scopedKey(learnerId, 'tickets')
  const learnerCreatedTickets = loadState(ticketsKey, []).filter((ticket) => !ticket.isSeed)
  if (learnerCreatedTickets.length > 0) {
    saveState(ticketsKey, learnerCreatedTickets)
  } else {
    try {
      localStorage.removeItem(ticketsKey)
    } catch {
      // storage unavailable — fail silently
    }
  }

  for (const name of ['sprints', 'next-sprint', 'activity', 'sprint-dates', 'first-visited']) {
    try {
      localStorage.removeItem(scopedKey(learnerId, name))
    } catch {
      // storage unavailable — fail silently
    }
  }
}

// Clears whose session is active but keeps their namespaced data and their
// spot in the "Continue as" list, so logging back in picks up where they left off.
export function logoutLearner() {
  try {
    localStorage.removeItem(CURRENT_LEARNER_KEY)
  } catch {
    // storage unavailable — fail silently
  }
}
