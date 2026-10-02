describe('Filter by assignee', () => {
  it('shows only tickets assigned to the logged-in user', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.createTicket('Ticket for Test User', 'assigned to me')

    cy.get('[data-cy="filter-button"]').click()
    cy.get('[data-cy="filter-field-assignee"]').click()
    cy.get('[data-cy="filter-assignee-Test User"]').click()

    cy.get('[data-cy^="ticket-card-"]').should('have.length', 1)
    cy.contains('Ticket for Test User').should('be.visible')
  })
})
