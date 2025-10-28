/**
 * Custom Connectors Auto-Loader
 * Automatically initializes the MCP interceptor when content script loads
 */

import { mcpInterceptor } from './services/interceptor';

export default async function customConnectorsLoader() {
  try {
    console.log('[CustomConnectors] Auto-loader starting...');
    
    // Only run on Perplexity domains
    if (!window.location.hostname.includes('perplexity.ai')) {
      console.log('[CustomConnectors] Not on Perplexity domain, skipping');
      return;
    }
    
    // Initialize the interceptor
    await mcpInterceptor.init();
    console.log('[CustomConnectors] Auto-loader completed successfully');
    
  } catch (error) {
    console.error('[CustomConnectors] Auto-loader failed:', error);
  }
}