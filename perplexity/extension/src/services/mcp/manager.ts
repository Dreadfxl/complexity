import type {
  MCPClient,
  MCPServersConfig,
  MCPTool,
  MCPResource,
  MCPEventType,
  MCPEventHandler,
  MCPEvents,
} from "./types";
import { MCPConfigParser, ConfigSource } from "./config-parser";
import { mcpClientFactory } from "./factory";
import { MCPClientStatus } from "./types";

/**
 * MCP Manager - Central coordinator for all MCP clients
 */
export class MCPManager {
  private clients = new Map<string, MCPClient>();
  private eventHandlers = new Map<MCPEventType, Set<MCPEventHandler<any>>>();
  private initialized = false;
  private healthCheckInterval?: number;

  /**
   * Initialize MCP manager with configuration
   */
  async initialize(configSources: ConfigSource[] = [ConfigSource.STORAGE, ConfigSource.ENVIRONMENT]): Promise<void> {
    if (this.initialized) {
      console.warn("MCP Manager is already initialized");
      return;
    }

    try {
      console.log("Initializing MCP Manager...");
      
      // Load configuration from multiple sources
      const config = await MCPConfigParser.parseMultiple(configSources);
      
      if (Object.keys(config).length === 0) {
        console.log("No MCP servers configured, using default example");
        // Optionally save default config for first-time users
        const defaultConfig = MCPConfigParser.getDefaultConfig();
        await MCPConfigParser.saveConfig(defaultConfig);
      } else {
        // Create clients from configuration
        this.clients = mcpClientFactory.createFromConfig(config);
        
        // Connect to all clients
        await this.connectAll();
      }
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.initialized = true;
      console.log(`MCP Manager initialized with ${this.clients.size} clients`);
    } catch (error) {
      console.error("Failed to initialize MCP Manager:", error);
      throw error;
    }
  }

  /**
   * Shutdown MCP manager
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log("Shutting down MCP Manager...");
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    // Disconnect all clients
    await this.disconnectAll();
    
    // Clear event handlers
    this.eventHandlers.clear();
    
    this.initialized = false;
  }

  /**
   * Get all connected clients
   */
  getClients(): Map<string, MCPClient> {
    return new Map(this.clients);
  }

  /**
   * Get a specific client by name
   */
  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  /**
   * Get all available tools from all connected clients
   */
  async getAllTools(): Promise<Map<string, MCPTool[]>> {
    const toolsMap = new Map<string, MCPTool[]>();

    for (const [name, client] of this.clients) {
      if (client.status === MCPClientStatus.CONNECTED) {
        try {
          const tools = await client.listTools();
          toolsMap.set(name, tools);
        } catch (error) {
          console.warn(`Failed to get tools from ${name}:`, error);
          this.emit('error', { client, error: error as Error });
        }
      }
    }

    return toolsMap;
  }

  /**
   * Get all available resources from all connected clients
   */
  async getAllResources(): Promise<Map<string, MCPResource[]>> {
    const resourcesMap = new Map<string, MCPResource[]>();

    for (const [name, client] of this.clients) {
      if (client.status === MCPClientStatus.CONNECTED) {
        try {
          const resources = await client.listResources();
          resourcesMap.set(name, resources);
        } catch (error) {
          console.warn(`Failed to get resources from ${name}:`, error);
          this.emit('error', { client, error: error as Error });
        }
      }
    }

    return resourcesMap;
  }

  /**
   * Call a tool on a specific client
   */
  async callTool(clientName: string, toolName: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const client = this.getClient(clientName);
    if (!client) {
      throw new Error(`MCP client '${clientName}' not found`);
    }

    if (client.status !== MCPClientStatus.CONNECTED) {
      throw new Error(`MCP client '${clientName}' is not connected`);
    }

    try {
      const result = await client.call(`tools/call`, { name: toolName, arguments: params });
      this.emit('tool_called', { client, tool: toolName, params, result });
      return result;
    } catch (error) {
      this.emit('error', { client, error: error as Error });
      throw error;
    }
  }

  /**
   * Access a resource from a specific client
   */
  async getResource(clientName: string, resourceUri: string): Promise<unknown> {
    const client = this.getClient(clientName);
    if (!client) {
      throw new Error(`MCP client '${clientName}' not found`);
    }

    if (client.status !== MCPClientStatus.CONNECTED) {
      throw new Error(`MCP client '${clientName}' is not connected`);
    }

    try {
      const result = await client.call(`resources/read`, { uri: resourceUri });
      this.emit('resource_accessed', { client, resource: resourceUri });
      return result;
    } catch (error) {
      this.emit('error', { client, error: error as Error });
      throw error;
    }
  }

  /**
   * Add event listener
   */
  on<T extends MCPEventType>(eventType: T, handler: MCPEventHandler<T>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Remove event listener
   */
  off<T extends MCPEventType>(eventType: T, handler: MCPEventHandler<T>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit<T extends MCPEventType>(eventType: T, event: MCPEvents[T]): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in MCP event handler for ${eventType}:`, error);
        }
      }
    }
  }

  /**
   * Connect to all clients
   */
  private async connectAll(): Promise<void> {
    const connectionPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.connect();
        this.emit('connected', { client });
      } catch (error) {
        console.error(`Failed to connect to ${client.name}:`, error);
        this.emit('error', { client, error: error as Error });
      }
    });

    await Promise.allSettled(connectionPromises);
  }

  /**
   * Disconnect from all clients
   */
  private async disconnectAll(): Promise<void> {
    const disconnectionPromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.disconnect();
        this.emit('disconnected', { client });
      } catch (error) {
        console.error(`Failed to disconnect from ${client.name}:`, error);
      }
    });

    await Promise.allSettled(disconnectionPromises);
    this.clients.clear();
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = window.setInterval(async () => {
      for (const [name, client] of this.clients) {
        if (client.status === MCPClientStatus.CONNECTED) {
          try {
            const isHealthy = await client.healthCheck();
            if (!isHealthy) {
              console.warn(`Health check failed for ${name}`);
              // Attempt to reconnect
              await client.connect();
            }
          } catch (error) {
            console.error(`Health check error for ${name}:`, error);
            this.emit('error', { client, error: error as Error });
          }
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Get manager status
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      totalClients: this.clients.size,
      connectedClients: 0,
      disconnectedClients: 0,
      errorClients: 0,
      clients: new Map<string, { status: MCPClientStatus; lastError?: string }>(),
    };

    for (const [name, client] of this.clients) {
      status.clients.set(name, {
        status: client.status,
        lastError: client.lastError,
      });

      switch (client.status) {
        case MCPClientStatus.CONNECTED:
          status.connectedClients++;
          break;
        case MCPClientStatus.DISCONNECTED:
          status.disconnectedClients++;
          break;
        case MCPClientStatus.ERROR:
          status.errorClients++;
          break;
      }
    }

    return status;
  }
}

/**
 * Singleton instance of the MCP manager
 */
export const mcpManager = new MCPManager();
