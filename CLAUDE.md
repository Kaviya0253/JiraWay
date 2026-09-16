# JiraWay — Complete Project Reference

Read CLAUDE.md's Usage Efficiency Rules and follow them strictly —
this session must use as little as possible.

DO NOT:
- Read or scan files I haven't named
- Run npm run dev, build, or any test/compile check unless I
  explicitly say "run it" or "check it works"
- Rewrite, refactor, or "improve" anything beyond exactly what I
  ask
- Re-read the full CLAUDE.md more than once this session
- Explain what you're about to do at length — just do it

DO:
- Make ONLY the exact change I describe, in the exact file I name
- If I don't name a file, ask me which one instead of searching
- Keep responses short — confirm the change was made, nothing more
- If something seems ambiguous, ask ONE short question instead of
  reading around to guess

I will give you one small task at a time. Wait for my next
instruction after each one — do not proactively suggest additional
fixes, checks, or improvements.

Confirm you understand these rules, then wait for my first task.

## What This Is
JiraWay is a React web app teaching Jira to complete beginners through
Learn → Practice → Apply guided modules. Portfolio project targeting
Atlassian SDE-1 interviews. No backend — everything runs in the browser.
Login is name+email only (no password, no real auth) — it identifies a
learner so their progress persists in localStorage under their own id.

## Problem Statement
Jira beginners cannot use Jira confidently on their own, even after
watching tutorials or reading documentation, because most learning
resources explain Jira without providing guided, hands-on practice.
JiraWay fills this gap through guided practice and realistic scenarios.

## Tech Stack
- React + JavaScript (not TypeScript)
- Tailwind CSS
- State-based screen switching (NO React Router)
- Plain hooks + localStorage for state — NOT Context/useReducer.
  `useTicketStore.js` owns ticket data; screens read/write localStorage
  directly via `utils/localStorage.js` (scoped per learner id)
- No backend, no database, no real authentication (name+email only)

## Design Defaults
- Primary color: blue-600 (buttons, active states), blue-50/100 (light bg)
- Accent color (achievements/success ONLY): green-600, green-50
- Text: gray-900 primary, gray-500 secondary
- Borders: gray-200
- Rounded corners: rounded-lg on cards/buttons
- Padding: p-4 or p-6 inside cards
- Shadows: subtle only (shadow-sm)
- One focused card/panel per screen — no dense dashboards
- No decorative icons/illustrations unless requested
- Mobile-first responsive: sidebar collapses on mobile, board scrolls
  horizontally, tab row scrolls horizontally if needed

## Folder Structure (actual)
```
src/
  components/
    JiraWorkspace.jsx        → reusable sidebar+tabs+board, built ONCE,
                               reused everywhere via props
    ModuleProgressBar.jsx    → left-side module stepper + collapse toggle,
                               shown during Module 1-4 and Backlog Demo
    ModuleBrowserPanel.jsx   → module picker panel (workspace screen)
    WelcomeBanner.jsx        → post-login toast ("Welcome"/"Welcome back")
    SplitStepButton.jsx      → shared Back/Next circular control used by
                               every module's tour
    ImageSizeIndicator.jsx
    workspace/               → everything JiraWorkspace renders: Sidebar,
                               TopBar, TabRow/Tab, Board, Column, TicketCard,
                               Backlog, BacklogPanel, BacklogToolbar,
                               CreateIssueModal, SubtaskPanel, Summary,
                               CalendarPage, Timeline, Team, GlobalSearch,
                               FilterPanel, CompleteSprintModal,
                               PrioritySelector, StoryPointEstimate,
                               DueDatePicker, WorkTypeSelector,
                               AddWorkTypeModal, AssigneeAvatar, icons.jsx
  screens/
    Landing.jsx
    Module1.jsx / Module2.jsx / Module3.jsx / Module4.jsx
    BacklogDemo.jsx          → the real 5th/final module (see Curriculum)
    LearnersList.jsx         → admin-only learner management screen
  hooks/
    useTicketStore.js        → all ticket/subtask/comment state + mutators
  data/
    sampleProject.js         → project, team, base tickets, epics
  utils/
    localStorage.js          → per-learner scoped read/write helpers
    ticketFilters.js / percentages.js
  constants/
    introCard.js
  App.jsx                    → top-level screen switch, learner/session state
```
There is no `context/` folder, no `data/module*.js`, no `achievements.js`,
no `Hub.jsx`/`Completion.jsx`/`SummaryCalendar.jsx` as separate files —
those responsibilities are folded into `App.jsx` + `ModuleBrowserPanel.jsx`
+ inline curriculum content per module screen (see below).

## Sample Data (sampleProject.js + useTicketStore.js seeds)
**Project:** Website Redesign (key: WEB)

**Team:**
- Priya (id `priya`) — Fresher Developer. Display name is overwritten with
  whatever name the current learner actually typed at login — "Priya" is
  just the seed id/fallback, not a fixed character anymore.
- Karthik Subramaniam — Team Lead. Excluded from every assignee list
  (never an assignment target).
- Yavika — Developer (replaced Divya Rajendran at some point — if you see
  "Divya" anywhere it's stale).
- Arun Kumar — Developer.

**Tickets:** WEB-1 through WEB-15 exist as a real backlog (mixed
Bug/Task/Story), not just WEB-2/3/5/6/7. WEB-4 is intentionally never
seeded — it's the ticket the learner creates herself in Module 2. Plus:
WEB-16–19 are subtasks (parented to WEB-2/WEB-2/WEB-5/WEB-3). WEB-20–29
are "past sprint" filler (Sprint 0 & 1, all Done) that exist purely so
Summary's charts show a real distribution. WEB-30/31/32 are epics
("Homepage Revamp", "Dark Mode Rollout", "Site Reliability & Bug Fixes").
Every seed ticket carries a hardcoded Priority and Story Points value.

**Active sprint:** seed data (`useTicketStore.js`) treats **Sprint 2** as
current/active. `sampleProject.js` still has a leftover `name: 'Sprint 4'`
field that isn't what's actually active — known inconsistency, not yet
cleaned up.

**Activity feed:** 5 seeded entries (status/priority changes, ticket
creation by Karthik), timestamped relative to the learner's own first
login, not a fixed calendar date.

All of the above is namespaced per-learner-id in localStorage, so
multiple people on the same browser never see each other's mutations.

## JiraWorkspace Component — Reusable, Built Once
Actual props in use: `showSidebar`, `showTabs`, `highlightTicketKey` /
`disableClickTicketKey`, `forceBoardViewKey`, `onExposeActions`,
`initialView`, `disableCreateModalDismiss` / `createModalHelpActive` /
`onExitCreateModalHelp` (Module 2's create-ticket tutorial hooks),
`dropZoneSprintNumber` / `sprintPanelDataTourNumber` /
`activeSprintActionStop` / `closeSubtaskPanelKey` (Backlog Demo's tour
hooks into Backlog.jsx), `onCheckModules`, `onExpandButtonRectChange`.

- `enableSummary` / `enableCalendar` — **declared but dead code.** Passed
  as `false` from App.jsx, never read inside JiraWorkspace. Summary and
  Calendar are reachable via their tabs any time `showTabs` is true,
  regardless of these props. Fix or remove next time this file is touched.
- Tabs actually rendered: Summary, Backlog, Board, Calendar, Timeline,
  Docs, Forms (7 total, via TabRow). Docs and Forms are `disabled` —
  permanently non-interactive, no content exists for either.
- Backlog tab IS clickable through JiraWorkspace now (unlike the old
  plan) — real backlog interaction isn't confined to BacklogDemo.jsx
  anymore, though BacklogDemo still owns the guided backlog tour.
- Board, ticket cards, Project name: always clickable.
- Sidebar (`showSidebar`): "For you/Recent/Starred/Apps/Plans" and
  "Filters/Dashboards" rows are decorative (no onClick). Of
  "Teams/Goals/Projects", only Teams is wired to a real view; Goals and
  Projects are decorative. Admin-only rows (see Admin section) add
  "Learners", "Check workspace", "Check module flow".

Module usage: Module 1 and Module 4 show the module progress panel with
`showSidebar`/`showTabs` true (full workspace visible underneath their
tours); Module 2 and Module 3 keep the workspace narrowed to the board
only during their guided flow.

## Admin Role (not in the original plan — now real)
`learner.role === 'admin'`, set only when the Landing form's name+email
match a hardcoded pair in `Landing.jsx` (currently the project owner's
own name+email). No role picker exists — this is a personal debug/testing
backdoor, not a feature exposed to real learners.

What admin gets that a regular learner doesn't:
- Can exit any module at any point (a first-pass learner can't, until
  she's finished the whole curriculum once).
- "Choose a module" shortcut — jump straight to the module picker from
  inside any module.
- Sidebar: **Learners** (opens `LearnersList.jsx` — every learner who's
  ever logged in on this browser, with a progress badge, last-login time,
  and the ability to remove one or all non-admin learners), plus
  **Check workspace** / **Check module flow** shortcuts.

This is local-device-only data management with no real security boundary
— keep it that way; never let it affect a real learner's own experience.

## Curriculum — Actual Current Content

### Module 1 — Orientation
1. **Intro modal** — "Let's take a look at your team's workspace." → Let's go.
2. **Tap-to-reveal** — dark overlay, must click anywhere on the workspace
   (no skip) → reveal: "This is your team's Jira workspace — where all
   their work lives, gets tracked, and moves forward together."
3. **Guided tour, 9 stops** (Back/Next only — a real click on the
   highlighted element does NOT advance): Project header, Backlog tab,
   Board tab, a column, a ticket card, assignee avatar (auto-opens its
   dropdown), Team nav (auto-navigates to the real Team page), profile
   avatar, Create button. Each has a one-line explanation attached to
   the real element.
4. **Complete** — "You've learned to read a Jira screen with confidence.
   Everything from here builds on that."

Pure recognition/highlight — no hands-on task, no field input, no guess-
before-reveal (that pattern isn't used here anymore; every stop reveals
its explanation immediately on highlight).

### Module 2 — Creating Your First Issue
1. **Intro video** — "Create your own ticket" → Start.
2. **tap-create** — real Create button spotlighted, everything else
   blocked; must click it (opens the real CreateIssueModal).
3. **create** — the real modal, live. Optional **"Show me how"** button
   (pulses until clicked once) opens an 8-stop walkthrough: Project key,
   Type=Epic/Task/Bug/Story (4 stops), Summary, Assignee (opens real
   dropdown), Sprint (opens real dropdown) — each with a one-line
   explanation. Description, Labels, Due date, and Parent are visible in
   the modal but have no guided explanation at all.
4. **board** — spotlights the new ticket on the real board.
5. **complete video** — "Nice work — you created your first ticket."

**Hard gate (lives in CreateIssueModal.jsx, applies globally — not just
this module):** the very first ticket any learner ever creates cannot
submit unless "Show me how" was opened at least once (persisted per
learner). Every ticket also requires a sprint chosen and assignee = self.

### Module 3 — Updating Progress
1. Auto-creates a starter ticket if none exists yet, so this module
   still works standalone via "Practice again."
2. **Video intro** — explains column meaning + asks her to drag her
   ticket to match its real status, then comment.
3. **status** — whole board spotlighted; message adapts to the ticket's
   current column (To Do→drag to In Progress, In Progress→drag to Done,
   Done→drag anywhere just to practice). Requires an actual drag; only
   advances on a real column change.
4. **open-ticket** — must click the real card to open its detail panel.
5. **comment** — must submit a real comment (detected via an actual
   comment-count increase).
6. **Complete video** — "Nice work — your ticket's updated."

Hands-on/apply-only — no separate concept explanation for status or
comments; taught by direct instruction-to-do. Status changes via a real
board drag, not a dropdown.

### Module 4 — Boards & Sprints
1. Same starter-ticket fallback as Module 3.
2. **Intro** — "A few more things on this board worth knowing." → Start.
3. **Recognition-only tour, 4 stops** (Back/Next only):
   - Sprint badge — what it shows; real click opens the actual sprint
     popover (portaled to `<body>`, tracked so the explanation card moves
     below it instead of covering it).
   - My-work avatar — real click genuinely works (filters the board).
   - Search — real click works; no typing required to advance.
   - Complete Sprint button — real click deliberately blocked
     (`blockRealClicks`). Its explanation text is a real "this ends the
     sprint" explanation, distinct from the sprint-badge stop's copy.
4. **Complete** — "Nice work — you know your way around the board now."

Board itself and Filters/Dashboards remain dropped, as originally
decided — still true.

### Module 5 — Backlog Demo (`BacklogDemo.jsx`)
Labeled "Module 5" in its own progress bar. This is the real final
module — its completion is what flips `hasCompletedCurriculum` true, not
a separate "Completion" screen.

1. **Intro video** — "Where your ticket came from."
2. Backlog spotlighted — what it holds.
3. "Create sprint" button — recognition only, real click blocked.
4. Sprint intro + **sprint duration explanation** — "A sprint's duration
   is fixed — the same length every time, usually one to four weeks,"
   with live day-count math for the actual seeded sprint.
5. **6-stop field tour on a real ticket**: Subtask (opens the real
   panel), Epic, Status, Story Points, Priority, Assignee — each with a
   one-line explanation. This is the ONLY place Subtask/Epic/Story
   Points/Priority get taught at all.
6. Real drag task — drag one specific unassigned ticket from Backlog
   into the sprint; gated on the real sprint assignment actually
   changing.
7. "Ripple effect" screen — the same ticket now also appears on the
   Board — "Everything in Jira is connected."
8. Board spotlight of that ticket.
9. Wrap-up screen, then a **personalized final screen** —
   "Congratulations, {learner's real name}!" / "You've finished every
   guided step" / "Now go explore the workspace on your own."

## Achievement Model (C2) — DESIGNED, NOT YET BUILT
Intent (unchanged from original plan): one checkmark + one warm sentence
per module. NEVER scores, percentages, timelines, narrative replay, or
locked/upcoming achievements shown before earned.
**Status: zero code exists for this anywhere in the app right now** — no
AchievementContext, no AchievementBadge, no achievements.js, no
checkmark UI on any module's completion screen. This is a real gap, not
a documentation lag — decide whether to build it or formally drop it.

## Module Navigation (replaces the old "Hub" concept)
There is no separate Hub screen. Its job is split across:
- `ModuleProgressBar.jsx` — left-side stepper shown during Module 1-4
  and Backlog Demo (one circle per module, current/passed/upcoming state,
  collapsible, "Exit module" at the bottom for a replaying/admin learner).
- `ModuleBrowserPanel.jsx` — the module picker shown on the plain
  workspace screen (after login, or after "Practice again" / finishing
  the curriculum once).
Same guardrail as before: this navigation layer never replays module
content and never adds a second narrative system of its own.

## Deliberately Excluded (confirmed, not gaps)
JQL, Automation, Sprint Planning/Running (as a practiced learner skill —
"Create sprint" and "Complete Sprint" are recognition-only, real clicks
blocked), Reports, Versions, Docs content, Forms content, full Agile
theory (only the one sentence attached to Sprint's dates in Backlog
Demo), Project/Space creation as a practiced skill (Landing screen
mention only), general Sandbox/free exploration mode (the closest thing
is Backlog Demo's final "go explore on your own" screen, which is framed
explicitly as post-curriculum, not a taught mode).

Note: "Admin/Permissions" as a *taught Jira concept* is still excluded —
the app's own `admin` learner role (see above) is unrelated internal
tooling, not something any learner is ever taught about.

Subtask, Epic, Priority, and Story Points are NOT excluded — they're
real, taught fields (see Module 5 above). Timeline is a real, clickable,
untaught page, same spirit as Description/Labels/Due date/Parent in
Module 2 — present and functional, just not part of any guided flow.

## Landing Screen (actual)
Two-stage single screen: branding + "Get Started" (with the note: "On
your own Jira account, you'd start by creating a project — that's a
one-time setup. We've already done that for you here."), then a
Name+Email form (Enter submits, inline validation, Continue disabled
until both valid). No screen sits between Landing and Module 1 — a new
learner lands directly on Module 1's own intro step. A `WelcomeBanner`
shows for 3 seconds right after an actual login action ("Welcome to
JiraWay, {name}!" first time ever, "Welcome back, {name}!" after) — it
must never reappear on a plain page refresh of an already-logged-in
session, only on a genuine login action.

## Core Design Rules (never violate)
- Sequential unlock — no skipping ahead (Modules 1→2→3→4→5 in order;
  admin/replay are the only exceptions, and only for exiting early)
- Her ticket carries forward unchanged in identity, Module 2 → 3 → 4 → 5
- No score, no percentage, anywhere in the product
- Guess-before-reveal is NOT used anywhere currently — every module
  reveals its explanation directly on highlight
- Explanation text lives directly on/attached to the interface element
  it describes — never a separate page
- No explanation exceeds what's needed for the very next action —
  usually 1-2 sentences, occasionally more for genuinely complex
  concepts (like Sprint), but always tightly coupled to doing, never
  delivered as a standalone block before interaction
