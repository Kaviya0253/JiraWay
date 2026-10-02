describe('Login', () => {
  it('shows the correct name and email after login', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.get('[data-cy="account-menu"]').click()
    cy.contains('Test User').should('be.visible')
    cy.contains('testuser@example.com').should('be.visible')
  })
})
