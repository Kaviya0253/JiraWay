describe('Logout', () => {
  it('returns to the login screen', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.get('[data-cy="account-menu"]').click()
    cy.get('[data-cy="logout-button"]').click()
    cy.get('[data-cy="landing-get-started"]').should('be.visible')
  })
})
