export default function Tab({ label, Icon, active, onClick, dataTour, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      data-tour={dataTour}
      className={[
        'flex flex-shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[15px] leading-5 font-semibold',
        disabled
          ? 'cursor-not-allowed border-transparent text-gray-500 dark:text-gray-400'
          : active
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
