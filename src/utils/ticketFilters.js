export const UNASSIGNED = '__unassigned__'

export function matchesFilters(ticket, filters) {
  if (filters?.assignee?.length && !filters.assignee.includes(ticket.assignee ?? UNASSIGNED)) {
    return false
  }
  if (filters?.status?.length && !filters.status.includes(ticket.column)) return false
  if (filters?.workType?.length && !filters.workType.includes(ticket.type)) return false
  return true
}

export function matchesSearch(ticket, searchTerm) {
  if (!searchTerm) return true
  const term = searchTerm.trim().toLowerCase()
  if (!term) return true
  return ticket.title.toLowerCase().includes(term) || ticket.key.toLowerCase().includes(term)
}

export function activeFilterCount(filters) {
  return Object.values(filters ?? {}).reduce((sum, values) => sum + (values?.length ?? 0), 0)
}

export function hasActiveSearch(filters, searchTerm) {
  return activeFilterCount(filters) > 0 || searchTerm.trim().length > 0
}

export function toggleAssigneeFilter(filters, value) {
  const current = filters.assignee ?? []
  const next = current.includes(value)
    ? current.filter((entry) => entry !== value)
    : [...current, value]
  return { ...filters, assignee: next }
}
