import { useState } from 'react'
import {
  getKnownLearners,
  getAggregateAnalytics,
  getLearnerModuleTimings,
  getLearnerTabTimings,
  getLearnerActivityCounts,
  getLearnerDecorativeClicks,
  formatDuration,
  formatShortDuration,
} from '../utils/localStorage'
import { MODULE_LABELS, TAB_LABELS, ACTIVITY_LABELS } from './LearnersList'
import {
  ChevronLeftIcon,
  DashboardIcon,
  ChecklistIcon,
  TrendingUpIcon,
  WarningIcon,
  PersonIcon,
} from '../components/workspace/icons'

// Fixed categorical order — never cycled, never reassigned when a filter
// changes which categories are present. Same hue steps for light and dark;
// picked for adjacent-pair (ring/stack) colorblind separation, not scatter/
// all-pairs use, which is exactly the shape a donut's neighboring wedges are.
const CATEGORICAL_HUES = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#4a3aa7', // violet
  '#e34948', // red
]

// Part-of-whole across a handful of categories — the one place in this
// dashboard identity (which category) matters more than raw magnitude
// ordering, so this is the one chart that earns a categorical palette
// instead of the single blue hue every bar chart above uses.
function Donut({ segments, size = 108, strokeWidth = 16 }) {
  const withColor = segments.map((s, i) => ({ ...s, color: CATEGORICAL_HUES[i % CATEGORICAL_HUES.length] }))
  const total = withColor.reduce((sum, s) => sum + s.value, 0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const gap = 3
  let cumulative = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {total > 0 &&
          withColor.map((s) => {
            if (s.value <= 0) return null
            const fraction = s.value / total
            const arcLength = Math.max(0, fraction * circumference - gap)
            const offset = circumference - cumulative
            cumulative += fraction * circumference
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                strokeDashoffset={offset}
              />
            )
          })}
      </svg>
      <div className="flex flex-col gap-1">
        {withColor.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600 dark:text-gray-300">{s.label}</span>
            <span className="text-gray-400 dark:text-gray-500">
              {total > 0 ? `${s.value} · ${Math.round((s.value / total) * 100)}%` : '0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// A single proportion (this many out of that many) — good vs. the rest,
// two segments, no legend needed since the caption already names both parts.
function ProgressRing({ value, total, label, size = 96, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = total > 0 ? value / total : 0
  const arcLength = fraction * circumference
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2a78d6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {total > 0 ? `${Math.round(fraction * 100)}%` : '—'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {label} ({value} of {total})
        </p>
      </div>
    </div>
  )
}

// Trend across an ORDERED sequence (curriculum stage, module number) — this
// is the one shape in the whole dashboard a line legitimately earns: the
// x-axis has a real order (Module 1 before Module 2, and so on), so
// connecting the points shows the climb/drop between steps at a glance,
// which separate bars can't. Never used for unordered categories (tabs,
// sidebar clicks) — those stay bars/donut, where connecting them would
// imply an order that doesn't exist.
function LineChart({ points, formatValue, height = 132 }) {
  // Fixed logical coordinate space, independent of point count or the
  // card's real pixel width — width="100%" stretches this to fill whatever
  // container it's in, so a 5-point chart in a narrow card and a 7-point
  // chart in a wide one both always show every point with no horizontal
  // scroll needed (the earlier version sized the SVG in fixed pixels-per-
  // point and let a scroll container hide whatever didn't fit).
  const viewWidth = 320
  const padding = { top: 26, right: 20, bottom: 24, left: 20 }
  const innerW = viewWidth - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const maxValue = Math.max(...points.map((p) => p.value), 1)
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0

  const coords = points.map((p, i) => ({
    ...p,
    x: padding.left + stepX * i,
    y: padding.top + innerH - (maxValue > 0 ? (p.value / maxValue) * innerH : 0),
  }))
  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${viewWidth} ${height}`} preserveAspectRatio="none">
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={viewWidth - padding.right}
          y2={padding.top + innerH}
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth="1"
        />
        <path d={pathD} fill="none" stroke="#2a78d6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c) => (
          <g key={c.label}>
            <circle
              cx={c.x}
              cy={c.y}
              r="4"
              fill={c.value > 0 ? '#2a78d6' : '#c3c2b7'}
              className="stroke-white dark:stroke-gray-900"
              strokeWidth="2"
            />
            <text
              x={c.x}
              y={c.y - 10}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              className="fill-gray-700 dark:fill-gray-200"
            >
              {formatValue(c.value)}
            </text>
            <text x={c.x} y={height - 6} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">
              {c.shortLabel ?? c.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// One consistent hue per chart — every bar in a given chart is the same
// metric measured across different categories (which module, which tab),
// not different identities, so a single sequential fill is the correct
// encoding here, not a rainbow of categorical colors.
function BarRow({ label, value, maxValue, displayValue, emptyLabel = 'no data' }) {
  const hasData = value != null && value > 0
  const pct = hasData && maxValue > 0 ? Math.max(4, (value / maxValue) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300" title={label}>
        {label}
      </span>
      <div className="h-2.5 w-12 min-w-[24px] flex-shrink overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        {hasData && <div className="h-full rounded-full bg-blue-600" style={{ width: `${pct}%` }} />}
      </div>
      <span className="flex-shrink-0 whitespace-nowrap text-right text-xs font-medium text-gray-700 dark:text-gray-200">
        {hasData ? displayValue : <span className="text-gray-300 dark:text-gray-600">{emptyLabel}</span>}
      </span>
    </div>
  )
}

function ChartCard({ title, subtitle, children, highlight = false, span = false }) {
  return (
    <div
      className={[
        'rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900',
        highlight
          ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20'
          : 'border-gray-200 dark:border-gray-700',
        span ? 'xl:col-span-2' : '',
      ].join(' ')}
    >
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
      <div className="mt-4 flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function SectionHeading({ icon: Icon, title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h2>
      </div>
      {action}
    </div>
  )
}

// Lets her flip the ordered-sequence charts between line and bar and see
// which one she reads faster — same underlying numbers either way, just two
// different shapes for the same data, since "which is easier for me" is a
// real per-person preference a fixed choice can't answer.
function ChartStyleToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5 dark:border-gray-600 dark:bg-gray-900">
      {['line', 'bar'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={[
            'rounded px-2.5 py-1 text-xs font-medium capitalize',
            value === option
              ? 'bg-blue-600 text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          ].join(' ')}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

// Same points, rendered as whichever of the two shapes ChartStyleToggle
// above is currently set to.
function TrendChart({ points, formatValue, style }) {
  if (style === 'bar') {
    const max = Math.max(...points.map((p) => p.value), 1)
    return (
      <>
        {points.map((p) => (
          <BarRow key={p.key} label={p.label} value={p.value} maxValue={max} displayValue={formatValue(p.value)} />
        ))}
      </>
    )
  }
  return <LineChart points={points} formatValue={formatValue} />
}

// Reusable per-category bar list, for both the aggregate charts above and the
// per-learner charts below — same mark spec everywhere (same hue, same
// track), only the rows and their max change.
function BarChart({ rows, maxValue, formatValue, emptyLabel }) {
  const max = maxValue ?? Math.max(...rows.map((r) => r.value), 1)
  return (
    <>
      {rows.map(({ key, label, value }) => (
        <BarRow
          key={key}
          label={label}
          value={value}
          maxValue={max}
          displayValue={formatValue(value)}
          emptyLabel={emptyLabel}
        />
      ))}
    </>
  )
}

export default function AnalyticsDashboard({ onBack }) {
  const data = getAggregateAnalytics()
  const [selectedLearnerId, setSelectedLearnerId] = useState(null)
  const [chartStyle, setChartStyle] = useState('line')
  const learners = getKnownLearners()

  // One funnel from "everyone" down through each module to the free
  // workspace — replaces separate stat tiles for the same headline counts,
  // since a bar chart with a shared baseline (all learners) tells the
  // drop-off story a bare number can't.
  const funnelCounts = [
    { key: 'all', label: 'All learners', shortLabel: 'All', value: data.totalLearners },
    ...MODULE_LABELS.map(({ key, label }, i) => ({
      key,
      label,
      shortLabel: `M${i + 1}`,
      value: data.moduleAverages[key]?.learnerCount ?? 0,
    })),
    { key: 'workspace', label: 'Reached workspace', shortLabel: 'Wksp', value: data.reachedWorkspaceCount },
  ]
  const maxLearnerCount = Math.max(data.totalLearners, 1)

  const activityRows = ACTIVITY_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: data.activityTotals[key] ?? 0,
  }))

  const moduleAvgMs = MODULE_LABELS.map(({ key, label }, i) => ({
    key,
    label,
    shortLabel: `M${i + 1}`,
    value: data.moduleAverages[key]?.avgMs ?? 0,
  }))

  const firstActionMs = MODULE_LABELS.map(({ key, label }, i) => ({
    key,
    label,
    shortLabel: `M${i + 1}`,
    value: data.firstActionAverages[key] ?? 0,
  }))

  const replayCounts = MODULE_LABELS.map(({ key, label }, i) => ({
    key,
    label,
    shortLabel: `M${i + 1}`,
    value: data.moduleAverages[key]?.replayCount ?? 0,
  }))

  const tabAvgMs = TAB_LABELS.map(({ key, label }) => ({
    key,
    label,
    value: data.tabAverages[key]?.avgMs ?? 0,
  }))
  const maxTabMs = Math.max(...tabAvgMs.map((t) => t.value), 1)

  const decorativeEntries = Object.entries(data.decorativeTotals).sort((a, b) => b[1] - a[1])
  const maxDecorativeCount = Math.max(...decorativeEntries.map(([, count]) => count), 1)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <DashboardIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Across {data.totalLearners} account{data.totalLearners === 1 ? '' : 's'} on this device.
          </p>
        </div>
      </div>

      {data.totalLearners === 0 ? (
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">No learner data recorded yet.</p>
      ) : (
        <>
          <section className="mt-7">
            <SectionHeading
              icon={ChecklistIcon}
              title="Curriculum progress"
              action={<ChartStyleToggle value={chartStyle} onChange={setChartStyle} />}
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ChartCard
                title="Reached the workspace"
                subtitle="Share of everyone who finished the curriculum"
                highlight
              >
                <ProgressRing value={data.reachedWorkspaceCount} total={data.totalLearners} label="Reached workspace" />
              </ChartCard>

              <ChartCard
                title="Curriculum funnel"
                subtitle={`Learners remaining at each step, out of ${data.totalLearners} total`}
                span
              >
                <TrendChart points={funnelCounts} formatValue={(v) => `${v}`} style={chartStyle} />
              </ChartCard>

              <ChartCard title="Average time per module" subtitle="Mean across everyone who reached it">
                <TrendChart points={moduleAvgMs} formatValue={formatDuration} style={chartStyle} />
              </ChartCard>

              <ChartCard
                title="Average time to first action"
                subtitle="From a module's intro screen to her first real step"
              >
                <TrendChart points={firstActionMs} formatValue={formatShortDuration} style={chartStyle} />
              </ChartCard>

              <ChartCard title="Modules replayed" subtitle="Learners who went back and did it again">
                <TrendChart points={replayCounts} formatValue={(v) => `${v}`} style={chartStyle} />
              </ChartCard>
            </div>
          </section>

          <section className="mt-8">
            <SectionHeading icon={TrendingUpIcon} title="Workspace engagement" />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ChartCard
                title="Activity composition"
                subtitle="What kind of real action learners took, as a share of the total"
              >
                <Donut segments={activityRows} />
              </ChartCard>

              <ChartCard title="Real activity in the free workspace" subtitle="Totals across every learner">
                <BarChart rows={activityRows} formatValue={(v) => `${v}`} emptyLabel="0" />
              </ChartCard>

              <ChartCard title="Time per tab in the free workspace" subtitle="Average, among learners who opened it">
                {tabAvgMs.map(({ key, label, value }) => (
                  <BarRow key={key} label={label} value={value} maxValue={maxTabMs} displayValue={formatDuration(value)} />
                ))}
              </ChartCard>
            </div>
          </section>

          {decorativeEntries.length > 0 && (
            <section className="mt-8">
              <SectionHeading icon={WarningIcon} title="Friction signals" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <ChartCard
                  title="What gets clicked that isn't real, by share"
                  subtitle="Same data as the bar chart, as a proportion"
                >
                  <Donut segments={decorativeEntries.map(([label, value]) => ({ label, value }))} />
                </ChartCard>

                <ChartCard title="Clicks on things that don't do anything yet" subtitle="Tells you what a learner expects to be real">
                  {decorativeEntries.map(([label, count]) => (
                    <BarRow key={label} label={label} value={count} maxValue={maxDecorativeCount} displayValue={`${count}`} />
                  ))}
                </ChartCard>
              </div>
            </section>
          )}

          <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <SectionHeading icon={PersonIcon} title="Per learner" />
            <select
              value={selectedLearnerId ?? ''}
              onChange={(event) => setSelectedLearnerId(event.target.value || null)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">Choose a learner…</option>
              {learners.map((learner) => (
                <option key={learner.id} value={learner.id}>
                  {learner.name} ({learner.email})
                </option>
              ))}
            </select>

            {selectedLearnerId && <LearnerCharts learnerId={selectedLearnerId} />}
          </section>
        </>
      )}
    </div>
  )
}

function LearnerCharts({ learnerId }) {
  const { perModule } = getLearnerModuleTimings(learnerId)
  const perTab = getLearnerTabTimings(learnerId)
  const activityCounts = getLearnerActivityCounts(learnerId)
  const decorativeClicks = getLearnerDecorativeClicks(learnerId)

  const moduleRows = MODULE_LABELS.map(({ key, label }) => ({ key, label, value: perModule[key]?.totalMs ?? 0 }))
  const tabRows = TAB_LABELS.map(({ key, label }) => ({ key, label, value: perTab[key]?.totalMs ?? 0 }))
  const activityRows = ACTIVITY_LABELS.map(({ key, label }) => ({ key, label, value: activityCounts[key] ?? 0 }))
  const decorativeRows = Object.entries(decorativeClicks).map(([label, value]) => ({ key: label, label, value }))

  const hasTabData = tabRows.some((r) => r.value > 0)
  const hasActivity = activityRows.some((r) => r.value > 0)
  const hasDecorative = decorativeRows.length > 0

  return (
    <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      <ChartCard title="Time per module">
        <BarChart rows={moduleRows} formatValue={formatDuration} emptyLabel="not reached" />
      </ChartCard>

      {hasTabData && (
        <ChartCard title="Time per tab in workspace">
          <BarChart rows={tabRows} formatValue={formatDuration} emptyLabel="never opened" />
        </ChartCard>
      )}

      {hasActivity && (
        <>
          <ChartCard title="Real activity">
            <BarChart rows={activityRows} formatValue={(v) => `${v}`} emptyLabel="0" />
          </ChartCard>
          <ChartCard title="Activity composition">
            <Donut segments={activityRows} />
          </ChartCard>
        </>
      )}

      {hasDecorative && (
        <>
          <ChartCard title="Clicked things that don't do anything yet">
            <BarChart rows={decorativeRows} formatValue={(v) => `${v}`} emptyLabel="0" />
          </ChartCard>
          <ChartCard title="Same, by share">
            <Donut segments={decorativeRows} />
          </ChartCard>
        </>
      )}
    </div>
  )
}
