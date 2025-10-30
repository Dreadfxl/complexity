/**
 * MCP (Model Context Protocol) Integration
 * 
 * This module provides first-class support for external MCP servers,
 * allowing Complexity to load and use external connectors through configuration.
 * 
 * Key Features:
 * - Configuration-driven MCP server registration
 * - HTTP/HTTPS client support with retry logic and timeouts
 * - Centralized management through MCPManager
 * - Event-based architecture for monitoring
 * - Robust error handling and logging
 * - Security-conscious header sanitization
 * 
 * Usage:
 * ```typescript
 * import { mcpManager } from './services/mcp';
 * 
 * // Initialize with configuration
 * await mcpManager.initialize();
 * 
 * // Get all available tools
 * const tools = await mcpManager.getAllTools();
 * 
 * // Call a tool
 * const result = await mcpManager.callTool('context7', 'search', { query: 'hello' });
 * ```
 */

export * from './types';
export * from './config-parser';
export * from './client';
export * from './factory';
export * from './manager';

// Re-export the singleton instances for convenience
export { mcpManager } from './manager';
export { mcpClientFactory } from './factory';
