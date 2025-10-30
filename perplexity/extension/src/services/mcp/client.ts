import type {
  MCPClient,
  MCPServerConfig,
  MCPClientStatus,
  MCPTool,
  MCPResource,
  MCPCapabilities,
  MCPRequest,
  MCPResponse,
} from "./types";
+import { MCPClientStatus as _MCPClientStatus } from "./types";

/**
 * HTTP-based MCP Client Implementation
 * Handles communication with external MCP servers over HTTP/HTTPS
 */
 export class HTTPMCPClient implements MCPClient {
-  private _status: MCPClientStatus = MCPClientStatus.DISCONNECTED;
+  private _status: MCPClientStatus = _MCPClientStatus.DISCONNECTED;
   private _lastError?: string;
   private requestId = 0;
   private abortController?: AbortController;
