import sprintActiveIcon from '../../assets/sprintactive icon.png'

export function PanelToggleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2.5" y="3" width="15" height="14" rx="2" />
      <path d="M7.5 3v14" />
    </svg>
  )
}

export function SunIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="10" r="3.5" />
      <path
        d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MoonIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M15.5 11.5A6.5 6.5 0 0 1 8 4a.6.6 0 0 0-.9-.5A7 7 0 1 0 16 12.4a.6.6 0 0 0-.5-.9Z" />
    </svg>
  )
}

export function GridIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="2" y="2" width="4" height="4" rx="1" />
      <rect x="8" y="2" width="4" height="4" rx="1" />
      <rect x="14" y="2" width="4" height="4" rx="1" />
      <rect x="2" y="8" width="4" height="4" rx="1" />
      <rect x="8" y="8" width="4" height="4" rx="1" />
      <rect x="14" y="8" width="4" height="4" rx="1" />
      <rect x="2" y="14" width="4" height="4" rx="1" />
      <rect x="8" y="14" width="4" height="4" rx="1" />
      <rect x="14" y="14" width="4" height="4" rx="1" />
    </svg>
  )
}

export function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M5 8a5 5 0 0 1 10 0v3l1.5 3h-13L5 11V8Z" strokeLinejoin="round" />
      <path d="M8 17a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="10" r="2.5" />
      <path
        d="M10 3v1.5M10 15.5V17M17 10h-1.5M4.5 10H3M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EllipsisIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  )
}

export function ShareIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="15" cy="5" r="2" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="15" cy="15" r="2" />
      <path d="M6.7 9 13.3 6M6.7 11l6.6 3" strokeLinecap="round" />
    </svg>
  )
}

export function LightningIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M11 2 4 12h5l-1 6 7-10h-5l1-6Z" strokeLinejoin="round" />
    </svg>
  )
}

export function SubtaskIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6 4v6a2 2 0 0 0 2 2h6" strokeLinecap="round" />
      <path d="m11 9 3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CommentIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 4h14v9H8l-4 3v-3H3V4Z" strokeLinejoin="round" />
    </svg>
  )
}

export function SummaryIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 13a7 7 0 0 1 14 0" strokeLinecap="round" />
      <path d="M10 13V8.5M10 13l2.8-1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13h14" strokeLinecap="round" />
    </svg>
  )
}

export function BacklogIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M3 8h14M3 13h14" />
    </svg>
  )
}

export function BoardIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M8 3v14M13 3v14" />
    </svg>
  )
}

export function TimelineIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 15V9M8 15V5M13 15V8M17 15v-3" strokeLinecap="round" />
    </svg>
  )
}

export function DocsIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6 2h6l3 3v13H6V2Z" strokeLinejoin="round" />
      <path d="M12 2v3h3M8 10h5M8 13h5" strokeLinecap="round" />
    </svg>
  )
}

export function FormsIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="4" y="3" width="12" height="15" rx="1.5" />
      <path d="M7 8h6M7 11h6M7 14h3" strokeLinecap="round" />
    </svg>
  )
}

export function ExpandIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path
        d="M7 3H3v4M13 3h4v4M7 17H3v-4M13 17h4v-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function FilterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 4h14M6 10h8M9 16h2" strokeLinecap="round" />
    </svg>
  )
}

export function RankIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 7h12M4 13h12" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronUpIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m5 12 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DoubleChevronUpIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m5 13 5-5 5 5M5 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DoubleChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m5 7 5 5 5-5M5 12l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m12 5-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChecklistIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m3 5 2 2 3-3M8 5h9M3 11l2 2 3-3M8 11h9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EmptyCheckboxIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="2.5" y="2.5" width="15" height="15" rx="3.5" />
    </svg>
  )
}

export function PencilIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m12.5 3.5 4 4L7 17l-4.5 1L3.5 13.5l9-10Z" strokeLinejoin="round" />
      <path d="m11 5 4 4" strokeLinecap="round" />
    </svg>
  )
}

export function CheckboxIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2" y="2" width="16" height="16" rx="4" className="fill-blue-600" />
      <path d="m6 10 3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PersonIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 17c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  )
}

export function WarningIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M10 3 2 17h16L10 3Z" strokeLinejoin="round" />
      <path d="M10 8.5v3.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CalendarIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M3 8h14M7 2v3M13 2v3" strokeLinecap="round" />
    </svg>
  )
}

export function ExternalLinkIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M8 5H4v11h11v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 3h6v6M17 3l-8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ClockIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2.5 12.4 8l6 .6-4.5 4 1.3 5.9-5.2-3.1-5.2 3.1 1.3-5.9-4.5-4 6-.6L10 2.5Z" />
    </svg>
  )
}

export function LayersIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m10 3 7 3.5-7 3.5-7-3.5L10 3Z" strokeLinejoin="round" />
      <path d="m3 10.5 7 3.5 7-3.5" strokeLinejoin="round" />
    </svg>
  )
}

export function SpacesIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" opacity="0.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" opacity="0.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function HomeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m3 9 7-6 7 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 8v9h10V8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DashboardIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <rect x="2" y="2" width="7" height="9" rx="1.5" />
      <rect x="11" y="2" width="7" height="5" rx="1.5" />
      <rect x="11" y="9" width="7" height="9" rx="1.5" />
      <rect x="2" y="13" width="7" height="5" rx="1.5" />
    </svg>
  )
}

export function SpinnerArrowsIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="m6 8 4-3.5L14 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m6 12 4 3.5 4-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PeopleIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <circle cx="7" cy="7" r="3" />
      <circle cx="14" cy="8" r="2.5" opacity="0.6" />
      <path d="M2 17c0-3 2.2-5 5-5s5 2 5 5" />
      <path d="M12 17c.3-2.2 1.7-3.8 3.5-3.8S18.7 14.8 19 17" opacity="0.6" />
    </svg>
  )
}

export function TargetIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="4" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  )
}

export function RocketIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 2c2.5 1.5 4 4.5 4 8 0 1.5-.4 2.8-1 4l-3-1-3 1c-.6-1.2-1-2.5-1-4 0-3.5 1.5-6.5 4-8Z" />
      <circle cx="10" cy="8" r="1.5" fill="white" />
      <path d="m7 14-2 3 3-1M13 14l2 3-3-1" strokeWidth="0" />
    </svg>
  )
}

export function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M16 10a6 6 0 1 1-1.8-4.3" strokeLinecap="round" />
      <path d="M16 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SprintIcon({ className = 'h-4 w-4' }) {
  return <img src={sprintActiveIcon} alt="" className={`${className} object-contain`} />
}

export function TrendingUpIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 3v14h14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 13 9 9.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 7.5H15V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="m4 10 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  )
}

export function EnterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M16 4v6a2 2 0 0 1-2 2H5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m8 9-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BugIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="7" y="7" width="6" height="8" rx="3" />
      <path d="M10 7V5M7 9H4M13 9h3M7 13H4M13 13h3M8 5l-1.5-1.5M12 5l1.5-1.5" strokeLinecap="round" />
    </svg>
  )
}

export function StoryIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M5 2h10v16l-5-3-5 3V2Z" />
    </svg>
  )
}

export function CustomTypeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M3 5h9M3 10h6M3 15h3" strokeLinecap="round" />
      <circle cx="15" cy="5" r="1.5" className="fill-current" stroke="none" />
      <circle cx="12" cy="10" r="1.5" className="fill-current" stroke="none" />
      <circle cx="9" cy="15" r="1.5" className="fill-current" stroke="none" />
    </svg>
  )
}

export function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4 6h12M8 6V4h4v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 6 6 16h8l.5-10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 9v4M11.5 9v4" strokeLinecap="round" />
    </svg>
  )
}

export function SlidersIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M4 5h12M4 10h12M4 15h12" strokeLinecap="round" />
      <circle cx="8" cy="5" r="1.5" className="fill-current" stroke="none" />
      <circle cx="13" cy="10" r="1.5" className="fill-current" stroke="none" />
      <circle cx="7" cy="15" r="1.5" className="fill-current" stroke="none" />
    </svg>
  )
}

export function ChartTrendIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="2.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <path d="M2.5 14.5 7 10l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6.5h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HierarchyIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M6 10h3M9 10V4h3M9 10v6h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="1" y="7.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="12" y="1.5" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="12" y="13.5" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  )
}

export function LogoutIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M8 4H4.5v12H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6.5 16.5 10 13 13.5M16 10H7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function InfoIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9v4.5" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Avatar({ initials, className = 'h-7 w-7' }) {
  return (
    <div
      className={`flex ${className} flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700`}
    >
      {initials}
    </div>
  )
}
