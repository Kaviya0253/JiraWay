export const project = {
  name: 'Website Redesign',
  key: 'WEB',
}

export const sprint = {
  name: 'Sprint 4',
  endDate: '2026-07-28',
}

// The 'priya' entry represents whoever is currently learning with the app.
// 'Priya' is only the fallback name shown before login; setLearnerName()
// overwrites it with the real logged-in name, and everything that reads
// this array (assignee pickers, avatars, activity) picks it up on the next
// render. The id stays 'priya' regardless — that's the stable internal key,
// not something shown to the user. Karthik is Team Lead and is never an
// assignment target.
export const team = [
  { id: 'priya', name: 'Priya', role: 'Fresher Developer' },
  { id: 'karthik', name: 'Karthik Subramaniam', role: 'Team Lead' },
  { id: 'yavika', name: 'Yavika', role: 'Developer' },
  { id: 'arun', name: 'Arun Kumar', role: 'Developer' },
]

export function setLearnerName(name) {
  const learner = team.find((member) => member.id === 'priya')
  if (learner && name) learner.name = name
}

export function getLearnerName() {
  return team.find((member) => member.id === 'priya')?.name ?? 'Priya'
}

// WEB-4 is intentionally not listed here — it's created by the learner
// in Module 2 (her own title) and lives in TicketContext, not this fixed data.
export const tickets = [
  { key: 'WEB-1', title: 'Fix broken login button', type: 'Bug' },
  { key: 'WEB-2', title: 'Update homepage banner image', type: 'Task' },
  { key: 'WEB-3', title: 'Add dark mode toggle', type: 'Story' },
  { key: 'WEB-5', title: 'Add newsletter signup form', type: 'Task' },
  { key: 'WEB-6', title: 'Redesign footer navigation', type: 'Task' },
  { key: 'WEB-7', title: 'Improve page load speed', type: 'Task' },
  { key: 'WEB-8', title: 'Create new homepage wireframes', type: 'Story' },
  { key: 'WEB-9', title: 'Design updated color palette and typography system', type: 'Story' },
  { key: 'WEB-10', title: 'Redesign product listing page layout', type: 'Story' },
  { key: 'WEB-11', title: 'Implement responsive navigation menu', type: 'Task' },
  { key: 'WEB-12', title: 'Build new footer component', type: 'Task' },
  { key: 'WEB-13', title: 'Optimize image compression across all pages', type: 'Task' },
  { key: 'WEB-14', title: 'Fix mobile menu overlap bug', type: 'Bug' },
  { key: 'WEB-15', title: 'Fix broken checkout button on Safari', type: 'Bug' },
]
