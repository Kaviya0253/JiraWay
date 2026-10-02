// Logs in as a normal learner (never use the admin name/email pair from
// Landing.jsx) and skips straight past the guided tutorial into the real
// workspace, since a brand-new login always lands on Module 1 otherwise.
Cypress.Commands.add('login', (name = 'Test Learner', email = 'test.learner@example.com') => {
  cy.clearLocalStorage()
  cy.visit('/')
  cy.get('[data-cy="landing-get-started"]').click()
  cy.get('[data-cy="login-name"]').type(name)
  cy.get('[data-cy="login-email"]').type(email)
  cy.get('[data-cy="login-continue"]').click()

  cy.window().then((win) => {
    const learner = JSON.parse(win.localStorage.getItem('jiraway-current-learner'))
    win.localStorage.setItem(`jiraway:${learner.id}:curriculum-completed`, 'true')
    win.localStorage.setItem(`jiraway:${learner.id}:screen`, '"workspace"')
  })
  cy.reload()
})

// Creates a ticket via the Create modal. Must be logged in first.
// Always assigns to the logged-in learner and Sprint 2 — the app blocks
// creation unless both are set, and the only valid assignee for a new
// ticket is yourself (handleCreate in CreateIssueModal.jsx).
Cypress.Commands.add('createTicket', (title, description) => {
  cy.get('[data-cy="create-button"]').click()
  cy.get('[data-cy="create-help"]').click()
  cy.get('[data-cy="create-title"]').type(title)
  if (description) {
    cy.get('[data-cy="create-description"]').type(description)
  }
  cy.get('[data-cy="create-assignee"]').click()
  cy.get('[data-cy="assignee-option-priya"]').click()
  cy.get('[data-cy="create-sprint"]').click()
  cy.get('[data-cy="sprint-option-2"]').click()
  cy.get('[data-cy="create-submit"]').click()
})
