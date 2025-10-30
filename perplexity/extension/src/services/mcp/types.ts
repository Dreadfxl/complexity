import { z } from "zod";

/**
 * MCP Server Configuration Schema
 */
export const MCPServerConfigSchema = z.object({
  url: z.string().url("MCP server URL must be a valid URL"),
  headers: z.record(z.string(), z.string()).optional(),
  timeout: z.number().positive().optional().default(30000),
  retries: z.number().nonnegative().optional().default(3),
  retryDelay: z.number().nonnegative().optional().default(1000),
  enabled: z.boolean().optional().default(true),
  description: z.string().optional(),
});

/**
 * MCP Servers Configuration Schema
 */
export const MCPServersConfigSchema = z.record(
  z.string().min(1, "Server name cannot be empty"),
  MCPServerConfigSchema
);

/**
 * Type definitions derived from schemas
 */
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export type MCPServersConfig = z.infer<typeof MCPServersConfigSchema>;

/**
 * MCP Protocol Message Types
 */
export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPNotification {
  method: string;
  params?: Record<string, unknown>;
}

/**
 * MCP Capability Types
 */
export interface MCPCapabilities {
  tools?: {
    list_changed?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    list_changed?: boolean;
  };
  prompts?: {
    list_changed?: boolean;
  };
  logging?: Record<string, unknown>;
  sampling?: Record<string, unknown>;
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * MCP Resource Definition
 */
export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP Client Status
 */
export enum MCPClientStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

/**
 * MCP Client Interface
 */
export interface MCPClient {
  readonly name: string;
  readonly config: MCPServerConfig;
  readonly status: MCPClientStatus;
  readonly lastError?: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  call(method: string, params?: Record<string, unknown>): Promise<unknown>;
  listTools(): Promise<MCPTool[]>;
  listResources(): Promise<MCPResource[]>;
  getCapabilities(): Promise<MCPCapabilities>;
  healthCheck(): Promise<boolean>;
}

/**
 * MCP Client Factory Interface
 */
export interface MCPClientFactory {
  create(name: string, config: MCPServerConfig): MCPClient;
  createFromConfig(serversConfig: MCPServersConfig): Map<string, MCPClient>;
}

/**
 * MCP Event Types
 */
export interface MCPEvents {
  connected: { client: MCPClient };
  disconnected: { client: MCPClient; reason?: string };
  error: { client: MCPClient; error: Error };
  tool_called: { client: MCPClient; tool: string; params: unknown; result: unknown };
  resource_accessed: { client: MCPClient; resource: string };
}

export type MCPEventType = keyof MCPEvents;
export type MCPEventHandler<T extends MCPEventType> = (event: MCPEvents[T]) => void;
