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

/**
 * HTTP-based MCP Client Implementation
 * Handles communication with external MCP servers over HTTP/HTTPS
 */
export class HTTPMCPClient implements MCPClient {
  private _status: MCPClientStatus = MCPClientStatus.DISCONNECTED;
  private _lastError?: string;
  private requestId = 0;
  private abortController?: AbortController;

  constructor(
    public readonly name: string,
    public readonly config: MCPServerConfig
  ) {}

  get status(): MCPClientStatus {
    return this._status;
  }

  get lastError(): string | undefined {
    return this._lastError;
  }

  /**
   * Connect to the MCP server (perform initial handshake)
   */
  async connect(): Promise<void> {
    if (this._status === MCPClientStatus.CONNECTED) {
      return;
    }

    this._status = MCPClientStatus.CONNECTING;
    this._lastError = undefined;

    try {
      // Perform initial handshake
      const capabilities = await this.getCapabilities();
      if (capabilities) {
        this._status = MCPClientStatus.CONNECTED;
        console.log(`MCP client ${this.name} connected successfully`);
      } else {
        throw new Error("Failed to get server capabilities");
      }
    } catch (error) {
      this._status = MCPClientStatus.ERROR;
      this._lastError = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to MCP server ${this.name}: ${this._lastError}`);
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    this._status = MCPClientStatus.DISCONNECTED;
    this._lastError = undefined;
  }

  /**
   * Make an RPC call to the MCP server
   */
  async call(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (this._status !== MCPClientStatus.CONNECTED) {
      throw new Error(`MCP client ${this.name} is not connected`);
    }

    const request: MCPRequest = {
      id: (++this.requestId).toString(),
      method,
      params,
    };

    return this.sendRequest(request);
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await this.call("tools/list");
      return (response as { tools: MCPTool[] }).tools || [];
    } catch (error) {
      console.warn(`Failed to list tools from ${this.name}:`, error);
      return [];
    }
  }

  /**
   * List available resources from the MCP server
   */
  async listResources(): Promise<MCPResource[]> {
    try {
      const response = await this.call("resources/list");
      return (response as { resources: MCPResource[] }).resources || [];
    } catch (error) {
      console.warn(`Failed to list resources from ${this.name}:`, error);
      return [];
    }
  }

  /**
   * Get server capabilities
   */
  async getCapabilities(): Promise<MCPCapabilities> {
    try {
      const response = await this.call("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
        },
        clientInfo: {
          name: "complexity-mcp-client",
          version: "1.0.0",
        },
      });
      return (response as { capabilities: MCPCapabilities }).capabilities || {};
    } catch (error) {
      console.warn(`Failed to get capabilities from ${this.name}:`, error);
      return {};
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.call("ping");
      return true;
    } catch (error) {
      console.warn(`Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Send HTTP request to MCP server with retry logic
   */
  private async sendRequest(request: MCPRequest): Promise<unknown> {
    const maxRetries = this.config.retries || 3;
    const retryDelay = this.config.retryDelay || 1000;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          this.abortController?.abort();
        }, this.config.timeout || 30000);

        const response = await fetch(this.config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.sanitizeHeaders(this.config.headers),
          },
          body: JSON.stringify(request),
          signal: this.abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const mcpResponse: MCPResponse = await response.json();

        if (mcpResponse.error) {
          throw new Error(
            `MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message}`
          );
        }

        return mcpResponse.result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.warn(
            `MCP request attempt ${attempt + 1} failed for ${this.name}, retrying in ${retryDelay}ms:`,
            lastError.message
          );
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      } finally {
        this.abortController = undefined;
      }
    }

    this._status = MCPClientStatus.ERROR;
    this._lastError = lastError.message;
    throw lastError;
  }

  /**
   * Sanitize headers to remove sensitive information from logs
   */
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveKeys = ['api-key', 'authorization', 'token', 'secret'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitiveKey => 
        key.toLowerCase().includes(sensitiveKey)
      )) {
        // Keep first and last 4 characters, mask the middle
        const value = sanitized[key];
        if (value.length > 8) {
          sanitized[key] = `${value.slice(0, 4)}...${value.slice(-4)}`;
        } else {
          sanitized[key] = '***';
        }
      }
    });

    return sanitized;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}