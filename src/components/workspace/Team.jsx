import { team } from '../../data/sampleProject'
import { PersonIcon, ChevronLeftIcon } from './icons'

const CURRENT_USER_ID = 'priya'

export default function Team({ onBack }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          People you work with
        </h1>
      </div>

      <div data-tour="team-list" className="flex flex-wrap gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="flex w-56 flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white p-6 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700">
              <PersonIcon className="h-8 w-8" />
            </span>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {member.id === CURRENT_USER_ID ? 'You' : member.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
