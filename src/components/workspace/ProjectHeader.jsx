import { project } from '../../data/sampleProject'
import { ExpandIcon } from './icons'

export default function ProjectHeader({ onProjectClick, isExpanded, onExpandClick }) {
  return (
    <div className="flex items-center justify-between bg-white px-6 pt-3 pb-1 dark:bg-gray-900">
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Spaces</p>
        <button
          type="button"
          data-tour="project-header"
          onClick={() => onProjectClick?.(project)}
          className="mt-1 flex cursor-pointer items-center gap-2 text-left text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-blue-600 text-xs font-semibold text-white">
            W
          </span>
          <span className="text-lg font-bold">{project.name}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
        <button
          type="button"
          data-tour="expand-toggle"
          onClick={onExpandClick}
          className={[
            'flex h-8 w-8 items-center justify-center rounded-md border',
            isExpanded
              ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950'
              : 'border-gray-300 dark:border-gray-600',
          ].join(' ')}
        >
          <ExpandIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
