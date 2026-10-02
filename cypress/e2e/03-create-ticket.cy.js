describe('Create ticket', () => {
  it('creates a ticket with a title and description, and it appears on the board', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.createTicket('My first ticket', 'This is a test description')
    cy.contains('My first ticket').should('be.visible')
  })
})
