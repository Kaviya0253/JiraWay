describe('Ticket persistence', () => {
  it('keeps the description after reload', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.createTicket('Persistent ticket', 'This description should survive a reload')
    cy.reload()
    cy.contains('Persistent ticket').click()
    cy.get('[data-cy="ticket-description"]').should('contain', 'This description should survive a reload')
  })
})
