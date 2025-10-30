# External MCP (Connector) Servers

This feature lets Complexity connect to external MCP servers (e.g., Notion, GitHub, custom) and call them like built‑in connectors.

## Quick Start

1. Open Complexity settings and add MCP config to storage, or set an environment variable before building:

   - Storage (preferred for browser extension):
     - Key: `cplx_mcp_config`
     - Value:
       ```json
       {
         "context7": {
           "url": "https://mcp.context7.com/mcp",
           "headers": { "CONTEXT7_API_KEY": "YOUR_API_KEY" },
           "timeout": 30000,
           "retries": 3
         }
       }
       ```

   - Environment (build-time):
     ```bash
     export CPLX_MCP_SERVERS='{"context7":{"url":"https://mcp.context7.com/mcp","headers":{"CONTEXT7_API_KEY":"YOUR_API_KEY"}}}'
     ```

2. Initialize on startup (example):
   ```ts
   import { mcpManager } from './src/services/mcp';
   await mcpManager.initialize();
   ```

3. List tools and call one:
   ```ts
   const tools = await mcpManager.getAllTools();
   const result = await mcpManager.callTool('context7', 'search', { query: 'hello' });
   ```

## Running Integration Test (Mock MCP)

- Install and launch a mock server such as MCP‑SuperAssistant locally (example):
  ```bash
  # one possible runner (adjust per repo instructions)
  npx mcp-superassistant --port 8787
  ```

- Run the E2E test:
  ```bash
  cd perplexity/extension
  pnpm test:e2e:mcp
  ```

  Where `test:e2e:mcp` is mapped to:
  ```json
  {
    "scripts": {
      "test:e2e:mcp": "playwright test -c playwright.mcp.config.ts"
    }
  }
  ```

## Security Notes

- Prefer storing secrets in browser storage or a secrets manager; avoid committing API keys.
- Headers are sanitized in logs (masking common secret fields).
- Support for rotation: update the storage config and reload the extension; the manager reconnects on next init.

## Troubleshooting

- "No MCP servers configured": the manager writes a default example to storage on first run.
- Network/timeout errors: increase `timeout` and `retries`; verify CORS if calling from the extension.
- Unsupported protocol: only `http/https` is supported in this prototype.
