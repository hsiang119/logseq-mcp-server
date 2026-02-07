#!/usr/bin/env node

/**
 * logseq-mcp-server
 *
 * MCP server that bridges Claude (or any MCP client) to a running Logseq
 * instance via its local HTTP API. Supports reading, writing, searching,
 * and managing pages, blocks, journals, and tags.
 *
 * Environment variables:
 *   LOGSEQ_API_TOKEN  (required) – Bearer token configured in Logseq
 *   LOGSEQ_API_URL    (optional) – Logseq HTTP API base URL (default: http://127.0.0.1:12315)
 *   TRANSPORT         (optional) – "stdio" (default) or "http"
 *   PORT              (optional) – HTTP port when TRANSPORT=http (default: 3000)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LogseqClient } from "./services/logseq-client.js";
import { registerPageTools } from "./tools/page-tools.js";
import { registerBlockTools } from "./tools/block-tools.js";
import {
  registerSearchTools,
  registerJournalTools,
  registerGraphTools,
} from "./tools/search-graph-tools.js";

// ─── Configuration ──────────────────────────────────────────────

const LOGSEQ_API_TOKEN = process.env.LOGSEQ_API_TOKEN;
const LOGSEQ_API_URL = process.env.LOGSEQ_API_URL;

if (!LOGSEQ_API_TOKEN) {
  console.error(
    "Error: LOGSEQ_API_TOKEN environment variable is required.\n\n" +
      "Setup steps:\n" +
      "  1. Open Logseq → Settings → Features → Enable 'HTTP APIs server'\n" +
      "  2. Click the API button (🔌) → Start server\n" +
      "  3. Generate a token in the API panel → Authorization tokens\n" +
      "  4. Set LOGSEQ_API_TOKEN=<your-token>\n",
  );
  process.exit(1);
}

// ─── Server initialisation ──────────────────────────────────────

const server = new McpServer({
  name: "logseq-mcp-server",
  version: "1.0.0",
});

const client = new LogseqClient(LOGSEQ_API_TOKEN, LOGSEQ_API_URL);

// Register all tool groups
registerPageTools(server, client);
registerBlockTools(server, client);
registerSearchTools(server, client);
registerJournalTools(server, client);
registerGraphTools(server, client);

// ─── Transport ──────────────────────────────────────────────────

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("logseq-mcp-server running on stdio");
}

async function runHTTP(): Promise<void> {
  // Dynamic imports to keep http transport optional for stdio-only usage
  const { Hono } = await import("hono");
  const { serve } = await import("@hono/node-server");
  const { WebStandardStreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);

  const app = new Hono();

  app.all("/mcp", async (c) => {
    return transport.handleRequest(c.req.raw);
  });

  app.get("/health", (c) => {
    return c.json({ status: "ok", server: "logseq-mcp-server" });
  });

  const port = parseInt(process.env.PORT || "3000", 10);
  serve({ fetch: app.fetch, port }, () => {
    console.error(`logseq-mcp-server running on http://localhost:${port}/mcp`);
  });
}

// ─── Entrypoint ─────────────────────────────────────────────────

const transport = process.env.TRANSPORT || "stdio";

if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
