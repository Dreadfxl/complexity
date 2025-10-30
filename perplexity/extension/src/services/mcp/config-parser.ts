import { z } from "zod";
import { MCPServersConfig, MCPServersConfigSchema } from "./types";

/**
 * Configuration sources for MCP servers
 */
export enum ConfigSource {
  ENVIRONMENT = "environment",
  FILE = "file",
  STORAGE = "storage",
}

/**
 * Configuration parser for MCP servers
 */
export class MCPConfigParser {
  private static readonly ENV_PREFIX = "CPLX_MCP_";
  private static readonly STORAGE_KEY = "cplx_mcp_config";

  /**
   * Parse MCP configuration from various sources
   */
  static async parse(source: ConfigSource = ConfigSource.ENVIRONMENT): Promise<MCPServersConfig> {
    let rawConfig: unknown;

    switch (source) {
      case ConfigSource.ENVIRONMENT:
        rawConfig = this.parseFromEnvironment();
        break;
      case ConfigSource.FILE:
        rawConfig = await this.parseFromFile();
        break;
      case ConfigSource.STORAGE:
        rawConfig = await this.parseFromStorage();
        break;
      default:
        throw new Error(`Unsupported configuration source: ${source}`);
    }

    return this.validateConfig(rawConfig);
  }

  /**
   * Parse configuration from environment variables
   * Expected format: CPLX_MCP_SERVERS='{"server1":{"url":"...","headers":{...}}}'
   */
  private static parseFromEnvironment(): unknown {
    const env = typeof process === "undefined" ? import.meta.env : process.env;
    const configStr = env[`${this.ENV_PREFIX}SERVERS`];
    
    if (!configStr) {
      return {};
    }

    try {
      return JSON.parse(configStr);
    } catch (error) {
      throw new Error(`Invalid MCP configuration in environment: ${error}`);
    }
  }

  /**
   * Parse configuration from external file
   * This would typically be a config.json or similar
   */
  private static async parseFromFile(): Promise<unknown> {
    // In browser extension context, we might load from extension storage
    // or a bundled configuration file
    try {
      const response = await fetch(chrome.runtime.getURL("config/mcp-servers.json"));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn("Failed to load MCP config from file:", error);
      return {};
    }
  }

  /**
   * Parse configuration from browser storage
   */
  private static async parseFromStorage(): Promise<unknown> {
    if (typeof chrome !== "undefined" && chrome.storage) {
      try {
        const result = await chrome.storage.local.get(this.STORAGE_KEY);
        return result[this.STORAGE_KEY] || {};
      } catch (error) {
        console.warn("Failed to load MCP config from storage:", error);
        return {};
      }
    }
    return {};
  }

  /**
   * Validate and transform raw configuration
   */
  private static validateConfig(rawConfig: unknown): MCPServersConfig {
    try {
      return MCPServersConfigSchema.parse(rawConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`MCP configuration validation failed: ${issues}`);
      }
      throw new Error(`MCP configuration validation failed: ${error}`);
    }
  }

  /**
   * Save configuration to storage
   */
  static async saveConfig(config: MCPServersConfig, target: ConfigSource = ConfigSource.STORAGE): Promise<void> {
    // Validate before saving
    this.validateConfig(config);

    switch (target) {
      case ConfigSource.STORAGE:
        if (typeof chrome !== "undefined" && chrome.storage) {
          await chrome.storage.local.set({ [this.STORAGE_KEY]: config });
        }
        break;
      case ConfigSource.ENVIRONMENT:
      case ConfigSource.FILE:
        throw new Error(`Saving to ${target} is not supported in browser extension context`);
      default:
        throw new Error(`Unsupported save target: ${target}`);
    }
  }

  /**
   * Merge multiple configuration sources with priority
   * Higher priority sources override lower priority ones
   */
  static async parseMultiple(sources: ConfigSource[]): Promise<MCPServersConfig> {
    let mergedConfig: MCPServersConfig = {};

    for (const source of sources) {
      try {
        const config = await this.parse(source);
        mergedConfig = { ...mergedConfig, ...config };
      } catch (error) {
        console.warn(`Failed to parse MCP config from ${source}:`, error);
      }
    }

    return mergedConfig;
  }

  /**
   * Get default configuration example
   */
  static getDefaultConfig(): MCPServersConfig {
    return {
      context7: {
        url: "https://mcp.context7.com/mcp",
        headers: {
          "CONTEXT7_API_KEY": "YOUR_API_KEY"
        },
        description: "Context7 MCP Server",
        timeout: 30000,
        retries: 3,
        enabled: true
      }
    };
  }
}