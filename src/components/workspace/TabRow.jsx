import Tab from './Tab'
import { SummaryIcon, BacklogIcon, BoardIcon, CalendarIcon, TimelineIcon, DocsIcon, FormsIcon } from './icons'

const TAB_ITEMS = [
  { key: 'summary', label: 'Summary', icon: SummaryIcon },
  { key: 'backlog', label: 'Backlog', icon: BacklogIcon },
  { key: 'board', label: 'Board', icon: BoardIcon },
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { key: 'timeline', label: 'Timeline', icon: TimelineIcon },
  { key: 'docs', label: 'Docs', icon: DocsIcon },
  { key: 'forms', label: 'Forms', icon: FormsIcon },
]

// restrictToKey: while a guided module needs her confined to one real tab
// (Board, during Module 3's drag/comment steps), every OTHER tab becomes
// genuinely disabled here — not just visually blocked by an overlay, which
// still left a real click able to slip through in some cases.
export default function TabRow({ activeView, onSelect, restrictToKey }) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900">
      {TAB_ITEMS.map(({ key, label, icon }) => (
        <Tab
          key={key}
          label={label}
          Icon={icon}
          active={activeView === key}
          onClick={() => onSelect(key)}
          dataTour={key === 'board' || key === 'backlog' ? `tab-${key}` : undefined}
          disabled={key === 'docs' || key === 'forms' || (restrictToKey != null && key !== restrictToKey)}
        />
      ))}
      <span className="flex flex-shrink-0 items-center border-b-2 border-transparent px-3 py-2 text-2xl leading-none text-gray-500 dark:text-gray-400">
        +
      </span>
    </nav>
  )
}
