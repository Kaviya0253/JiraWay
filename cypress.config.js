import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'ixunnd',
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    charts: true,
    reportPageTitle: 'JiraWay Cypress Report',
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    async setupNodeEvents(on, config) {
      const { default: registerMochawesome } = await import('cypress-mochawesome-reporter/plugin')
      registerMochawesome(on)
      return config
    },
  },
})
