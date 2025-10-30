import type {
  MCPClient,
  MCPClientFactory,
  MCPServerConfig,
  MCPServersConfig,
} from "./types";
import { HTTPMCPClient } from "./client";

/**
 * Factory for creating MCP clients
 */
export class DefaultMCPClientFactory implements MCPClientFactory {
  /**
   * Create a single MCP client instance
   */
  create(name: string, config: MCPServerConfig): MCPClient {
    // For now, we only support HTTP/HTTPS clients
    // In the future, we could add WebSocket support or other protocols
    if (config.url.startsWith("http://") || config.url.startsWith("https://")) {
      return new HTTPMCPClient(name, config);
    }

    throw new Error(`Unsupported protocol for MCP server ${name}: ${config.url}`);
  }

  /**
   * Create multiple MCP clients from configuration
   */
  createFromConfig(serversConfig: MCPServersConfig): Map<string, MCPClient> {
    const clients = new Map<string, MCPClient>();

    for (const [name, config] of Object.entries(serversConfig)) {
      if (!config.enabled) {
        console.log(`MCP server ${name} is disabled, skipping`);
        continue;
      }

      try {
        const client = this.create(name, config);
        clients.set(name, client);
        console.log(`Created MCP client for ${name}`);
      } catch (error) {
        console.error(`Failed to create MCP client for ${name}:`, error);
      }
    }

    return clients;
  }
}

/**
 * Singleton instance of the MCP client factory
 */
export const mcpClientFactory = new DefaultMCPClientFactory();
