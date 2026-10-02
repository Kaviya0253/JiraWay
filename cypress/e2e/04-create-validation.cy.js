describe('Create button validation', () => {
  it('stays disabled while the title is empty', () => {
    cy.login('Test User', 'testuser@example.com')
    cy.get('[data-cy="create-button"]').click()
    cy.get('[data-cy="create-help"]').click()
    cy.get('[data-cy="create-submit"]').should('be.disabled')
    cy.get('[data-cy="create-title"]').type('Now it has a title')
    cy.get('[data-cy="create-submit"]').should('not.be.disabled')
  })
})
