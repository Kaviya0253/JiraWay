export function distributePercentages(counts) {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (total === 0) return counts.map(() => 0)

  const raw = counts.map((count) => (count / total) * 100)
  const base = raw.map((value) => Math.floor(value))
  const remainder = 100 - base.reduce((sum, value) => sum + value, 0)

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  const result = [...base]
  for (let i = 0; i < remainder; i++) {
    result[order[i % order.length].index] += 1
  }
  return result
}
