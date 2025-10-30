import { describe, expect, it } from "vitest";
import { DefaultMCPClientFactory } from "@mcp/factory";
import { HTTPMCPClient } from "@mcp/client";

const factory = new DefaultMCPClientFactory();

describe("MCP Client Factory", () => {
  it("creates HTTP client for https URLs", () => {
    const client = factory.create("demo", { url: "https://example.com/mcp" });
    expect(client).toBeInstanceOf(HTTPMCPClient);
  });

  it("rejects unsupported protocols", () => {
    expect(() => factory.create("demo", { url: "ws://example.com" } as any)).toThrow();
  });
});
