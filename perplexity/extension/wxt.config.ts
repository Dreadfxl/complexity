import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Complexity',
    description: 'Supercharge your favourite AI Chat web apps. Currently supports Perplexity AI.',
    host_permissions: [
      'http://localhost:8080/*',
      'https://mcp.andybrandt.net/*'
    ]
  }
});