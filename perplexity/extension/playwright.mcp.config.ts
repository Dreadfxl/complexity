import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Match the actual filename used for the MCP E2E
  testMatch: /.*mcp\.e2e\.spec\.ts/,
  timeout: 120000,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
