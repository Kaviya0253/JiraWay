import 'cypress-mochawesome-reporter/register'
import './commands'

// Cypress only auto-captures a screenshot when a test fails. Taking one
// after every test (pass or fail) means the mochawesome report embeds a
// real screenshot for every single test case, not just the broken ones.
afterEach(function () {
  cy.screenshot(this.currentTest.fullTitle(), { capture: 'runner' })
})
