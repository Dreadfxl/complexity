import { describe, expect, it } from "vitest";
import { MCPConfigParser, ConfigSource } from "@mcp/config-parser";
import { MCPServersConfigSchema } from "@mcp/types";

// Note: we mock chrome APIs for extension env
// @ts-ignore
global.chrome = {
  runtime: { getURL: (p: string) => p },
  storage: { local: { get: async () => ({}), set: async () => {} } },
};

describe("MCP Config Parser", () => {
  it("validates a well-formed config", async () => {
    const cfg = {
      context7: {
        url: "https://mcp.context7.com/mcp",
        headers: { CONTEXT7_API_KEY: "abc" },
        timeout: 1000,
        retries: 1,
      },
    };

    const parsed = MCPServersConfigSchema.parse(cfg);
    expect(parsed.context7.url).toBe("https://mcp.context7.com/mcp");
  });

  it("merges multiple sources with priority", async () => {
    const envBackup = process.env.CPLX_MCP_SERVERS;
    process.env.CPLX_MCP_SERVERS = JSON.stringify({
      envOnly: { url: "https://env.example/mcp" },
      overrideMe: { url: "https://env.example/mcp" },
    });

    // mock storage to return a different config
    // @ts-ignore
    global.chrome.storage.local.get = async () => ({
      cplx_mcp_config: {
        storageOnly: { url: "https://storage.example/mcp" },
        overrideMe: { url: "https://storage.example/mcp" },
      },
    });

    const merged = await MCPConfigParser.parseMultiple([
      ConfigSource.STORAGE,
      ConfigSource.ENVIRONMENT,
    ]);

    expect(Object.keys(merged).sort()).toEqual([
      "envOnly",
      "overrideMe",
      "storageOnly",
    ].sort());

    expect(merged.overrideMe.url).toBe("https://env.example/mcp");

    process.env.CPLX_MCP_SERVERS = envBackup;
  });

  it("throws on invalid JSON in environment", async () => {
    const envBackup = process.env.CPLX_MCP_SERVERS;
    process.env.CPLX_MCP_SERVERS = "{bad json}" as any;
    await expect(() => MCPConfigParser.parse(ConfigSource.ENVIRONMENT)).rejects.toThrow();
    process.env.CPLX_MCP_SERVERS = envBackup;
  });
});
