import { useLayoutEffect, useRef, useState } from 'react'
import { project } from '../../data/sampleProject'
import {
  HomeIcon,
  ClockIcon,
  StarIcon,
  GridIcon,
  LayersIcon,
  SpacesIcon,
  PlusIcon,
  EllipsisIcon,
  ChevronRightIcon,
  FilterIcon,
  DashboardIcon,
  PeopleIcon,
  TargetIcon,
  RocketIcon,
  ExternalLinkIcon,
  PersonIcon,
  ChecklistIcon,
  RefreshIcon,
} from './icons'

const TOP_ITEMS = [
  { label: 'For you', icon: HomeIcon },
  { label: 'Recent', icon: ClockIcon, chevron: true },
  { label: 'Starred', icon: StarIcon, chevron: true },
  { label: 'Apps', icon: GridIcon },
  { label: 'Plans', icon: LayersIcon },
]

const BOTTOM_ITEMS = [
  { label: 'Filters', icon: FilterIcon },
  { label: 'Dashboards', icon: DashboardIcon },
]

const EXTERNAL_ITEMS = [
  { label: 'Teams', icon: PeopleIcon },
  { label: 'Goals', icon: TargetIcon },
  { label: 'Projects', icon: RocketIcon },
]

function NavRow({ label, Icon, chevron, external, onClick, onTrackClick, active, dataTour }) {
  const Tag = onClick ? 'button' : 'span'

  // Not every row here actually does anything yet — only the ones with a
  // real onClick are interactive. Background (not text color) is what marks
  // that: a clickable row gets a faint fill at rest so it reads as a real
  // control, non-clickable rows stay flat/transparent like plain list text.
  // onTrackClick is separate from onClick on purpose — it's admin-only click
  // *counting* on a row with no real feature behind it, and must never make
  // that row look interactive just because something is now listening.
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick ?? onTrackClick}
      data-tour={dataTour}
      className={[
        'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left font-sans text-sm leading-5 font-medium text-gray-700 dark:text-gray-100',
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : onClick
            ? 'bg-blue-50 dark:bg-blue-950/50'
            : '',
        onClick ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900' : 'cursor-default',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 flex-shrink-0 text-gray-600 dark:text-gray-300" />
      <span className="flex-1">{label}</span>
      {chevron && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
      {external && <ExternalLinkIcon className="h-4 w-4 text-gray-400" />}
    </Tag>
  )
}

export default function Sidebar({
  onProjectClick,
  onTeamsClick,
  isTeamActive,
  isAdmin = false,
  onLearnersClick,
  isLearnersActive,
  onCheckModules,
  onResetDemoData,
  onDecorativeClick,
}) {
  // Own scroll region, bounded to the viewport — without this the sidebar's
  // nav list just keeps growing past the viewport and drags the whole page
  // into a document-level scroll along with it, so a long list (Learners,
  // once admin-only rows are added) scrolls the sidebar itself out of view
  // instead of scrolling internally. Same pattern Summary/CalendarPage/
  // Timeline already use, since nothing here sets a global page height for
  // plain CSS flex-height to work against.
  //
  // That bounded height alone still isn't enough on its own: if something
  // ELSE on the page ends up taller than the viewport (Summary/Calendar's
  // own content, say), the whole document scrolls, and a plain flex-row
  // sibling like this one scrolls away with it — its own overflow-y-auto
  // only contains ITS OWN content, it doesn't anchor the sidebar itself in
  // place. `sticky` (self-start below) is what actually keeps it pinned
  // through that outer scroll, at the same top offset it started at
  // (measured here, right below the sticky TopBar).
  const containerRef = useRef(null)
  const [containerTop, setContainerTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(null)
  useLayoutEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const top = containerRef.current.getBoundingClientRect().top
      setContainerTop(top)
      setContainerHeight(Math.floor(window.innerHeight - top))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <aside
      ref={containerRef}
      className="sticky hidden w-56 flex-shrink-0 flex-col gap-0.5 self-start overflow-y-auto border-r border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 md:flex"
      style={{
        top: containerTop,
        height: containerHeight != null ? `${containerHeight}px` : undefined,
      }}
    >
      <nav className="flex flex-col gap-0.5">
        {TOP_ITEMS.map(({ label, icon, chevron }) => (
          <NavRow
            key={label}
            label={label}
            Icon={icon}
            chevron={chevron}
            onTrackClick={() => onDecorativeClick?.(label)}
          />
        ))}
      </nav>

      <div className="mt-3">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="flex items-center gap-2 font-sans text-xs font-medium text-gray-500 dark:text-gray-400">
            <SpacesIcon className="h-4 w-4" />
            Spaces
          </span>
          <div className="flex items-center gap-2 text-gray-400">
            <PlusIcon className="h-4 w-4" />
            <EllipsisIcon className="h-4 w-4" />
          </div>
        </div>

        <p className="px-2 pt-1 pb-0.5 text-sm font-medium text-gray-400 dark:text-gray-500">Recent</p>

        <button
          type="button"
          onClick={() => onProjectClick?.(project)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-md border-l-2 border-blue-600 bg-blue-50 px-2 py-1.5 text-left text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-blue-600 text-[10px] font-semibold text-white">
            W
          </span>
          {project.name}
        </button>

        <span className="flex cursor-default items-center gap-1 px-2 py-1.5 font-sans text-sm leading-5 font-medium text-gray-700 dark:text-gray-300">
          More spaces
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      </div>

      <nav className="mt-3 flex flex-col gap-0.5">
        {BOTTOM_ITEMS.map(({ label, icon }) => (
          <NavRow key={label} label={label} Icon={icon} onTrackClick={() => onDecorativeClick?.(label)} />
        ))}
        {EXTERNAL_ITEMS.map(({ label, icon }) => (
          <NavRow
            key={label}
            label={label}
            Icon={icon}
            external
            onClick={label === 'Teams' ? onTeamsClick : undefined}
            onTrackClick={label === 'Teams' ? undefined : () => onDecorativeClick?.(label)}
            active={label === 'Teams' && isTeamActive}
            dataTour={label === 'Teams' ? 'teams-nav' : undefined}
          />
        ))}
        {isAdmin && (
          <>
            <NavRow label="Learners" Icon={PersonIcon} onClick={onLearnersClick} active={isLearnersActive} />
            <p className="px-2 pt-2 pb-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">Admin</p>
            <NavRow label="Check workspace" Icon={HomeIcon} onClick={() => onProjectClick?.(project)} />
            <NavRow label="Check module flow" Icon={ChecklistIcon} onClick={onCheckModules} />
            <NavRow label="Reset sprint data" Icon={RefreshIcon} onClick={onResetDemoData} />
          </>
        )}
      </nav>
    </aside>
  )
}
