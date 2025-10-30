import { test, expect } from '@playwright/test';

// Use explicit env override if provided, otherwise default to localhost:8787
const DEFAULT_URL = 'http://127.0.0.1:8787/mcp';
const MCP_URL = process.env.MCP_URL || DEFAULT_URL;

async function call(method: string, params?: any) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: '1', method, params }),
  });
  expect(res.ok).toBeTruthy();
  return res.json();
}

test('end-to-end MCP handshake and list tools', async () => {
  const init = await call('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { sampling: {} },
    clientInfo: { name: 'complexity-e2e', version: '1.0.0' },
  });

  expect(init.error).toBeFalsy();

  const tools = await call('tools/list');
  expect(tools.error).toBeFalsy();
  expect(Array.isArray(tools.result?.tools ?? [])).toBeTruthy();
});
