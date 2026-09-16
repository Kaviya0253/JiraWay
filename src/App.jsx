import { useState, useEffect, useRef } from 'react'
import JiraWorkspace from './components/JiraWorkspace'
import ModuleBrowserPanel from './components/ModuleBrowserPanel'
import { MODULE_PANEL_WIDTH, MODULE_PANEL_WIDTH_COLLAPSED, useModulePanelCollapsed } from './components/ModuleProgressBar'
import Landing from './screens/Landing'
import Module1 from './screens/Module1'
import Module2 from './screens/Module2'
import Module3 from './screens/Module3'
import Module4 from './screens/Module4'
import BacklogDemo from './screens/BacklogDemo'
import {
  getCurrentLearner,
  logoutLearner,
  loadState,
  saveState,
  scopedKey,
  recordScreenVisit,
} from './utils/localStorage'
import { setLearnerName } from './data/sampleProject'

const SCREEN_PROGRESS_KEY = 'screen'
const DEFAULT_START_SCREEN = 'module1'
const LOGIN_WELCOMED_KEY = 'login-welcomed'
const CURRICULUM_COMPLETED_KEY = 'curriculum-completed'

function App() {
  const [learner, setLearner] = useState(() => {
    const existing = getCurrentLearner()
    if (existing) setLearnerName(existing.name)
    return existing
  })
  // Each learner's own current screen persists under their own scoped key —
  // without this, EVERY reload (regardless of who's logged in) fell back to
  // this bare useState's hardcoded initial value, so reloading mid-Module-3
  // would silently dump her back at a fixed default instead of resuming
  // where she actually was. Re-entering the same name+email later on
  // Landing resumes the same saved spot too, rather than restarting at
  // DEFAULT_START_SCREEN every time — a brand new learner (no saved key
  // yet) still starts fresh there.
  const [screen, setScreen] = useState(() => {
    const existing = getCurrentLearner()
    if (!existing) return DEFAULT_START_SCREEN
    return loadState(scopedKey(existing.id, SCREEN_PROGRESS_KEY), DEFAULT_START_SCREEN)
  })

  useEffect(() => {
    if (!learner) return
    saveState(scopedKey(learner.id, SCREEN_PROGRESS_KEY), screen)
    // Timestamped log the admin Learners list reads back (via
    // getLearnerModuleTimings) to show how long she spent on each module and
    // on the product overall.
    recordScreenVisit(learner.id, screen)
  }, [learner, screen])

  // Every screen swap here mounts a fully different top-level component
  // (Module1 vs Module2 vs ...), but the browser's own scroll position is
  // separate from React's tree and doesn't reset on its own — without this,
  // arriving at a new module could inherit whatever scroll position the
  // previous one was left at.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  // Shown right after an actual login action — first time ever for this
  // learner it's a proper welcome, every time after that it's a lighter
  // "welcome back". justLoggedInRef is set only inside Landing's onContinue
  // below, so resuming an existing session on a page reload (learner comes
  // back non-null straight from the initial useState, not from a login
  // action) never shows this — otherwise the same "welcome back" would
  // reappear on every refresh, not just the moment she actually logs in.
  //
  // The moment of login itself (learner.isNew, straight from
  // setCurrentLearner) is the authoritative answer to "have we seen this
  // person before" — it comes directly from the known-learners list, so it
  // can't drift out of sync the way a separately-tracked flag could. A page
  // reload doesn't carry isNew (getCurrentLearner doesn't persist it), so
  // that case falls back to the persisted flag below.
  const justLoggedInRef = useRef(false)
  const [welcomeMessage, setWelcomeMessage] = useState(null)
  useEffect(() => {
    if (!learner) {
      setWelcomeMessage(null)
      return
    }
    if (!justLoggedInRef.current) return
    justLoggedInRef.current = false
    const key = scopedKey(learner.id, LOGIN_WELCOMED_KEY)
    const welcomedBefore = typeof learner.isNew === 'boolean' ? !learner.isNew : loadState(key, false)
    setWelcomeMessage(
      welcomedBefore
        ? `Welcome back, ${learner.name}!`
        : `Welcome to JiraWay, ${learner.name}!`,
    )
    saveState(key, true)
    // No auto-dismiss timer — it now stays up until she closes it herself
    // via the banner's own ✕ (onDismiss below), instead of vanishing after
    // a fixed 3s that competed with Module 1's own intro card for attention.
  }, [learner])

  // Starts open — landing on the workspace (fresh login, or reload while
  // there) should show the module list right away, not require an extra
  // click on "Practice again" first just to see which module to start.
  const [showModules, setShowModules] = useState(true)
  // Same collapse-to-a-slim-edge-tab behavior ModuleProgressBar already
  // gives every in-module panel — this is the same panel shown on the plain
  // workspace screen instead ("Learn again / Pick a module"), so it gets the
  // same shrink/expand option rather than only a full close.
  const [modulesPanelCollapsed, toggleModulesPanelCollapsed] = useModulePanelCollapsed()
  // Whether this learner has ever finished the whole curriculum once —
  // "Practice again" and the module panel's own close button only make
  // sense once there's an actual finished pass to replay; before that,
  // she's still on her one real first run through it, sequential and
  // un-skippable, so both stay hidden.
  const [hasCompletedCurriculum, setHasCompletedCurriculum] = useState(() => {
    const existing = getCurrentLearner()
    return existing ? loadState(scopedKey(existing.id, CURRICULUM_COMPLETED_KEY), false) : false
  })
  // True only when the current screen was reached by picking a module from
  // "Learn a module again" rather than progressing there naturally — lets
  // that module's own ModuleProgressBar know not to show earlier modules as
  // checked off, since jumping in isn't the same as having just finished them.
  const [isReplay, setIsReplay] = useState(false)
  // True while JiraWorkspace has Team or Learners open — both already have
  // their own "Back" link, so a second floating button hovering over the
  // same corner is just clutter, not a real second way back.
  const [subViewActive, setSubViewActive] = useState(false)
  // Live position of the real expand-toggle button (JiraWorkspace reports
  // it, re-measured whenever its own layout could shift it) — "Practice
  // again" anchors here instead of an independently calibrated page
  // position, so it moves with the icon across sidebar/expand-mode changes
  // instead of drifting out of place next to it.
  const [expandButtonRect, setExpandButtonRect] = useState(null)

  function handleLogout() {
    logoutLearner()
    setLearner(null)
  }

  // Shared by the "Learn a module again" browser panel and, once inside a
  // replayed module, its own ModuleProgressBar rows — same jump-to-any-module
  // behavior either way, so there's no need to close back out to the panel
  // just to hop from one module to another. Deliberately does NOT close
  // showModules — picking a module shouldn't hide the panel behind it; it
  // stays open (just not visible until "Back to workspace") so choosing
  // another module afterward doesn't need "Practice again" clicked again.
  //
  // isReplay only becomes true here if she's already finished the whole
  // curriculum once — this same panel also auto-shows on a genuine first
  // login (before hasCompletedCurriculum is ever true), and picking Module 1
  // from THAT one isn't a replay of anything; it's her one real first pass,
  // sequential and un-skippable, so it must stay isReplay=false the same as
  // reaching it any other way.
  function handleSelectModule(moduleKey) {
    // An admin picking a module (via "Choose a module") before ever
    // finishing the curriculum once must still count as a replay-style
    // jump, not her real sequential first pass — otherwise row-click
    // jumping, done-checkmarks, and onComplete's back-to-workspace branch
    // all silently break for that case (see isAdmin above).
    setIsReplay(hasCompletedCurriculum || isAdmin)
    setScreen(moduleKey)
  }

  // Only offered while replaying — a learner working through the curriculum
  // for the real first time has nowhere to "go back to" yet (the workspace
  // itself isn't unlocked until BacklogDemo finishes), so this exits back to
  // it only when she jumped in from "Practice again" in the first place.
  //
  // isReplay tells the two callers of this apart, and each wants a different
  // showModules outcome: coming back from a module picked via "Practice
  // again" (isReplay still true here) should land back on that same open
  // panel, not force her to click "Practice again" again — so this leaves
  // showModules alone. Finishing the real curriculum for the first time
  // (isReplay already false — BacklogDemo's own "Start exploring" calls this
  // unconditionally) is a different moment entirely: she's done, and should
  // see the actual full workspace, not the module picker still sitting open
  // from login — so that panel closes here instead.
  function handleBackToWorkspace() {
    if (!isReplay) {
      setShowModules(false)
      // Reaching here with isReplay still false only happens once: the real
      // first pass through the whole curriculum just finished (BacklogDemo's
      // "Start exploring" is the only unconditional caller of this). From
      // now on she has an actual finished run to replay, so "Practice again"
      // and the module panel's own close button can start showing.
      if (!hasCompletedCurriculum) {
        setHasCompletedCurriculum(true)
        saveState(scopedKey(learner.id, CURRICULUM_COMPLETED_KEY), true)
      }
    }
    setIsReplay(false)
    setScreen('workspace')
  }

  // Admin-only sibling of the above: exits the current module straight into
  // the module picker instead of the plain workspace, so she can jump to a
  // different module in one click rather than landing on the workspace and
  // clicking "Practice again" separately.
  function handleChooseModule() {
    setShowModules(true)
    setIsReplay(false)
    setScreen('workspace')
  }

  if (!learner) {
    return (
      <Landing
        onContinue={(newLearner) => {
          setLearnerName(newLearner.name)
          justLoggedInRef.current = true
          setLearner(newLearner)
          setIsReplay(false)
          // Explicitly re-armed on every fresh login, not just relied on as
          // a one-time mount default — this is App's own top-level state, so
          // it doesn't reset itself just because a different (or the same)
          // learner logs back in within the same tab; without this, whatever
          // she'd left it at in an earlier session (e.g. closed via the X)
          // would silently carry over and the panel just wouldn't show.
          setShowModules(true)
          // Same reasoning as showModules above — re-read fresh for
          // whichever learner just logged in, rather than trusting whatever
          // the PREVIOUS learner's value happened to be during this tab
          // session (this is also only seeded once at mount otherwise).
          setHasCompletedCurriculum(loadState(scopedKey(newLearner.id, CURRICULUM_COMPLETED_KEY), false))
          // A genuinely new learner (no saved progress under their own id
          // yet) starts fresh at DEFAULT_START_SCREEN; someone re-entering
          // their own name+email later resumes their own saved spot instead
          // of restarting — never another learner's, since this is scoped
          // to newLearner.id specifically.
          setScreen(loadState(scopedKey(newLearner.id, SCREEN_PROGRESS_KEY), DEFAULT_START_SCREEN))
        }}
      />
    )
  }

  // Admin can exit any module at any point, first-time sequential flow or
  // not — she's checking things, not working through a real one-time
  // curriculum, so the "no way out mid-sequence" rule that applies to an
  // actual learner's first pass doesn't apply to her.
  //
  // Admin-only now, not isReplay || isAdmin — a real learner picking a
  // module from "Practice again" no longer gets "Back to workspace"/"Exit
  // module" either; that exit is reserved for admin's own checking-things
  // use, not something a regular learner sees at all.
  const isAdmin = learner.role === 'admin'
  const canExitModule = isAdmin
  // "Choose a module" is stricter than the above — admin-only, not extended
  // to a regular learner just because she's replaying. Replaying already
  // gets her "Back to workspace" (which reaches the module picker in one
  // more click, via "Practice again"); this shortcut straight from inside a
  // module is an admin-only convenience, not a feature every learner sees.
  const canChooseModule = isAdmin

  let content

  if (screen === 'module1') {
    content = (
      <Module1
        key={learner.id}
        learnerId={learner.id}
        learner={learner}
        welcomeMessage={isReplay ? null : welcomeMessage}
        onComplete={isReplay ? handleBackToWorkspace : () => setScreen('module2')}
        onLogout={handleLogout}
        isReplay={isReplay}
        onSelectModule={handleSelectModule}
        onBackToWorkspace={canExitModule ? handleBackToWorkspace : undefined}
        onChooseModule={canChooseModule ? handleChooseModule : undefined}
      />
    )
  } else if (screen === 'module2') {
    content = (
      <Module2
        key={learner.id}
        learnerId={learner.id}
        learner={learner}
        onComplete={isReplay ? handleBackToWorkspace : () => setScreen('module3')}
        onLogout={handleLogout}
        isReplay={isReplay}
        onSelectModule={handleSelectModule}
        onBackToWorkspace={canExitModule ? handleBackToWorkspace : undefined}
        onChooseModule={canChooseModule ? handleChooseModule : undefined}
      />
    )
  } else if (screen === 'module3') {
    content = (
      <Module3
        key={learner.id}
        learnerId={learner.id}
        learner={learner}
        onComplete={isReplay ? handleBackToWorkspace : () => setScreen('module4')}
        onLogout={handleLogout}
        isReplay={isReplay}
        onSelectModule={handleSelectModule}
        onBackToWorkspace={canExitModule ? handleBackToWorkspace : undefined}
        onChooseModule={canChooseModule ? handleChooseModule : undefined}
      />
    )
  } else if (screen === 'module4') {
    content = (
      <Module4
        key={learner.id}
        learnerId={learner.id}
        learner={learner}
        onComplete={isReplay ? handleBackToWorkspace : () => setScreen('backlog-demo')}
        onLogout={handleLogout}
        isReplay={isReplay}
        onSelectModule={handleSelectModule}
        onBackToWorkspace={canExitModule ? handleBackToWorkspace : undefined}
        onChooseModule={canChooseModule ? handleChooseModule : undefined}
      />
    )
  } else if (screen === 'backlog-demo') {
    content = (
      <BacklogDemo
        key={learner.id}
        learnerId={learner.id}
        learner={learner}
        onComplete={handleBackToWorkspace}
        onLogout={handleLogout}
        isReplay={isReplay}
        onSelectModule={handleSelectModule}
        onBackToWorkspace={canExitModule ? handleBackToWorkspace : undefined}
        onChooseModule={canChooseModule ? handleChooseModule : undefined}
      />
    )
  } else {
    content = (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-950"
        // Reserves the same left space Module 1-4 and BacklogDemo push
        // their own content over for the module panel, so the workspace
        // shifts out of the way instead of sitting full-width underneath
        // it — matches how it looks the moment a module is actually
        // picked, rather than jumping from "covered" to "shifted".
        style={{
          paddingLeft: showModules ? (modulesPanelCollapsed ? MODULE_PANEL_WIDTH_COLLAPSED : MODULE_PANEL_WIDTH) : 0,
        }}
      >
        <JiraWorkspace
          key={learner.id}
          learnerId={learner.id}
          learner={learner}
          onLogout={handleLogout}
          // Off while the module panel covers this same left edge — two
          // navigation sidebars side by side is clutter for a real learner
          // choosing between them. Admin is different: she wants both
          // showing together (the module picker AND the real workspace
          // nav), since she's checking things across both, not choosing one.
          showSidebar={isAdmin || !showModules}
          showTabs={true}
          enableSummary={false}
          enableCalendar={false}
          onSubViewChange={setSubViewActive}
          onCheckModules={() => handleSelectModule('module1')}
          onExpandButtonRectChange={setExpandButtonRect}
          trackTabVisits={true}
        />

        {/* Only once there's an actual finished run to replay — before that
            she's still on her one real first pass, and this button has
            nothing meaningful to reopen yet — and never while Team or
            Learners is open, both of which already have their own way back
            (and hide the real expand-toggle button this anchors to anyway).
            Admin bypasses hasCompletedCurriculum here too, same as
            canExitModule above — her account can be brand new (never gone
            through the real curriculum once) and she'd otherwise have no way
            to reopen the module picker at all. */}
        {(hasCompletedCurriculum || isAdmin) && !subViewActive && expandButtonRect && (
          <button
            type="button"
            onClick={() => setShowModules(true)}
            style={{
              top: expandButtonRect.top + expandButtonRect.height / 2,
              right: window.innerWidth - expandButtonRect.left + 8,
              transform: 'translateY(-50%)',
            }}
            // z-[6]: below TopBar's z-10 (so it still never covers TopBar's
            // own profile dropdown — z-20 used to), but above the project
            // header's sticky wrapper (z-[5], opaque background), since this
            // button sits right next to the expand-toggle icon that lives
            // INSIDE that header row — at z-0 it was rendering, just hidden
            // behind that opaque bar rather than actually missing.
            className="fixed z-[6] rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-lg hover:bg-blue-100"
          >
            Practice again
          </button>
        )}

        {showModules && (
          <ModuleBrowserPanel
            // Same reasoning as the button above — closable only once she's
            // actually finished the curriculum once; on the real first pass
            // there's no dismissing this back out to "nothing" since nothing
            // else is unlocked yet, so picking a module is the only way
            // forward.
            onClose={hasCompletedCurriculum || isAdmin ? () => setShowModules(false) : undefined}
            onSelectModule={handleSelectModule}
            isAdmin={isAdmin}
            onChooseModule={canChooseModule ? handleChooseModule : undefined}
            onLogout={handleLogout}
            collapsed={modulesPanelCollapsed}
            onToggleCollapsed={toggleModulesPanelCollapsed}
          />
        )}
      </div>
    )
  }

  return content
}

export default App
