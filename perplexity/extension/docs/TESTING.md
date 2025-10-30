# Testing

- Unit tests (Vitest): `pnpm test` — runs with Vitest and excludes Playwright e2e specs.
- E2E (Playwright): `pnpm test:e2e:mcp` — runs only the MCP e2e spec using `playwright.mcp.config.ts`.

If Vitest complains about `import.meta`, it’s already configured for ESM via `vitest.config.ts`.
