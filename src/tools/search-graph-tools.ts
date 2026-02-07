/**
 * Search, Journal, and Graph MCP tool registrations.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LogseqClient } from "../services/logseq-client.js";
import {
  SearchSchema,
  CreateJournalSchema,
  GetGraphInfoSchema,
  GetAllTagsSchema,
} from "../schemas/index.js";
import {
  textResponse,
  errorResponse,
  extractErrorMessage,
} from "../services/formatters.js";

export function registerSearchTools(
  server: McpServer,
  client: LogseqClient,
): void {
  // ─── logseq_search ───────────────────────────────────────────

  server.registerTool(
    "logseq_search",
    {
      title: "Search Logseq",
      description: `Full-text search across the entire Logseq graph. Returns matching pages and blocks.

Args:
  - query (string): Search query (1-500 chars)

Returns:
  Object with:
  - pages: list of matching page names
  - blocks: list of matching block snippets with page context`,
      inputSchema: SearchSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await client.search(params.query);

        const lines: string[] = [`**Search results for '${params.query}'**\n`];

        // Pages
        const pages = result.pages ?? [];
        if (pages.length > 0) {
          lines.push(`### Pages (${pages.length})`);
          for (const page of pages) {
            lines.push(`- ${page}`);
          }
          lines.push("");
        }

        // Blocks
        const blocks = result.blocks ?? [];
        if (blocks.length > 0) {
          lines.push(`### Blocks (${blocks.length})`);
          for (const block of blocks) {
            const content =
              typeof block === "object" && block !== null
                ? JSON.stringify(block)
                : String(block);
            lines.push(`- ${content}`);
          }
          lines.push("");
        }

        if (pages.length === 0 && blocks.length === 0) {
          lines.push(
            `No results found for '${params.query}'. Try broader search terms.`,
          );
        }

        return textResponse(lines.join("\n"));
      } catch (error) {
        return errorResponse(
          `Search failed: ${extractErrorMessage(error)}`,
        );
      }
    },
  );
}

export function registerJournalTools(
  server: McpServer,
  client: LogseqClient,
): void {
  // ─── logseq_create_journal ───────────────────────────────────

  server.registerTool(
    "logseq_create_journal",
    {
      title: "Create Journal Page",
      description: `Create a journal page for a specific date.

Args:
  - date (string): Date in 'YYYY-MM-DD' format or natural date string

Returns:
  Created journal page entity.`,
      inputSchema: CreateJournalSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const page = await client.createJournalPage(params.date);
        return textResponse(
          `Journal page created for '${params.date}'.\n\n${JSON.stringify(page, null, 2)}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to create journal page: ${extractErrorMessage(error)}`,
        );
      }
    },
  );
}

export function registerGraphTools(
  server: McpServer,
  client: LogseqClient,
): void {
  // ─── logseq_get_graph_info ───────────────────────────────────

  server.registerTool(
    "logseq_get_graph_info",
    {
      title: "Get Graph Info",
      description: `Get information about the currently open Logseq graph, including name and file path.

Returns:
  Object with graph name, path, and URL.`,
      inputSchema: GetGraphInfoSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const graph = await client.getCurrentGraph();
        if (!graph) {
          return errorResponse(
            "No graph is currently open in Logseq.",
          );
        }
        return textResponse(JSON.stringify(graph, null, 2));
      } catch (error) {
        return errorResponse(
          `Failed to get graph info: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_get_all_tags ─────────────────────────────────────

  server.registerTool(
    "logseq_get_all_tags",
    {
      title: "Get All Tags",
      description: `List all tags used across the Logseq graph.

Returns:
  Array of tag entities.`,
      inputSchema: GetAllTagsSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const tags = await client.getAllTags();
        if (!tags || tags.length === 0) {
          return textResponse("No tags found in the current graph.");
        }

        const lines = [
          `**Tags** (${tags.length})\n`,
          ...tags.map(
            (t) => `- ${t.originalName || t.name} (uuid: ${t.uuid})`,
          ),
        ];

        return textResponse(lines.join("\n"));
      } catch (error) {
        return errorResponse(
          `Failed to get tags: ${extractErrorMessage(error)}`,
        );
      }
    },
  );
}
