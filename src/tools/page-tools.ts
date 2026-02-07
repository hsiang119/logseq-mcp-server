/**
 * Page-related MCP tool registrations.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LogseqClient } from "../services/logseq-client.js";
import {
  ListPagesSchema,
  GetPageSchema,
  GetPageContentSchema,
  CreatePageSchema,
  DeletePageSchema,
  RenamePageSchema,
  GetPageLinkedReferencesSchema,
} from "../schemas/index.js";
import {
  textResponse,
  errorResponse,
  formatPageSummary,
  renderBlockTree,
  extractErrorMessage,
} from "../services/formatters.js";

export function registerPageTools(
  server: McpServer,
  client: LogseqClient,
): void {
  // ─── logseq_list_pages ────────────────────────────────────────

  server.registerTool(
    "logseq_list_pages",
    {
      title: "List Logseq Pages",
      description: `List pages in the current Logseq graph with optional filtering.

Args:
  - limit (number): Maximum pages to return, 1-500 (default: 50)
  - offset (number): Skip N pages for pagination (default: 0)
  - journal_only (boolean): Only return journal pages (default: false)
  - namespace (string): Filter by namespace prefix

Returns:
  Markdown list of pages with uuid, journal flag, and namespace info.
  Includes pagination metadata (total, offset, has_more).`,
      inputSchema: ListPagesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        let pages = await client.getAllPages();

        // Filter journal pages
        if (params.journal_only) {
          pages = pages.filter((p) => p["journal?"]);
        }

        // Filter by namespace
        if (params.namespace) {
          const prefix = params.namespace.toLowerCase();
          pages = pages.filter((p) =>
            (p.name ?? "").toLowerCase().startsWith(prefix + "/"),
          );
        }

        const total = pages.length;
        const sliced = pages.slice(
          params.offset,
          params.offset + params.limit,
        );
        const hasMore = params.offset + params.limit < total;

        const lines = [
          `**Pages** (${sliced.length} of ${total})`,
          "",
          ...sliced.map(formatPageSummary),
        ];

        if (hasMore) {
          lines.push(
            "",
            `_More pages available. Use offset=${params.offset + params.limit} to see next batch._`,
          );
        }

        return textResponse(lines.join("\n"));
      } catch (error) {
        return errorResponse(
          `Failed to list pages: ${extractErrorMessage(error)}. ` +
            "Ensure Logseq is running with HTTP APIs enabled.",
        );
      }
    },
  );

  // ─── logseq_get_page ─────────────────────────────────────────

  server.registerTool(
    "logseq_get_page",
    {
      title: "Get Logseq Page",
      description: `Retrieve metadata for a specific page by name or UUID.

Args:
  - name (string): Page name or UUID
  - include_children (boolean): Include child blocks (default: false)

Returns:
  Page metadata including uuid, name, journal status, properties, and timestamps.`,
      inputSchema: GetPageSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const page = await client.getPage(params.name, {
          includeChildren: params.include_children,
        });
        if (!page) {
          return errorResponse(
            `Page '${params.name}' not found. Use logseq_list_pages to see available pages.`,
          );
        }
        return textResponse(JSON.stringify(page, null, 2));
      } catch (error) {
        return errorResponse(
          `Failed to get page: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_get_page_content ─────────────────────────────────

  server.registerTool(
    "logseq_get_page_content",
    {
      title: "Get Logseq Page Content",
      description: `Get the full block tree (content) of a Logseq page rendered as indented Markdown.

Args:
  - name (string): Page name

Returns:
  Indented Markdown representation of all blocks on the page.`,
      inputSchema: GetPageContentSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const blocks = await client.getPageBlocksTree(params.name);
        if (!blocks || blocks.length === 0) {
          return textResponse(
            `Page '${params.name}' is empty or has no blocks.`,
          );
        }
        const rendered = renderBlockTree(blocks);
        return textResponse(
          `# ${params.name}\n\n${rendered}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to get page content: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_create_page ──────────────────────────────────────

  server.registerTool(
    "logseq_create_page",
    {
      title: "Create Logseq Page",
      description: `Create a new page in the Logseq graph.

Args:
  - name (string): Page name
  - content (string, optional): Initial block content
  - properties (object, optional): Page-level properties
  - format ('markdown'|'org'): Page format (default: markdown)
  - journal (boolean): Create as journal page (default: false)

Returns:
  Created page entity with uuid and metadata.`,
      inputSchema: CreatePageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const page = await client.createPage(
          params.name,
          params.properties,
          {
            format: params.format,
            journal: params.journal,
            redirect: false,
          },
        );

        // Append initial content if provided
        if (params.content) {
          await client.appendBlockInPage(params.name, params.content);
        }

        return textResponse(
          `Page '${params.name}' created successfully.\n\n${JSON.stringify(page, null, 2)}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to create page: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_delete_page ──────────────────────────────────────

  server.registerTool(
    "logseq_delete_page",
    {
      title: "Delete Logseq Page",
      description: `Permanently delete a page from the Logseq graph. This is irreversible.

Args:
  - name (string): Name of the page to delete`,
      inputSchema: DeletePageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        await client.deletePage(params.name);
        return textResponse(`Page '${params.name}' deleted successfully.`);
      } catch (error) {
        return errorResponse(
          `Failed to delete page: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_rename_page ──────────────────────────────────────

  server.registerTool(
    "logseq_rename_page",
    {
      title: "Rename Logseq Page",
      description: `Rename an existing page. All references in the graph will be updated.

Args:
  - old_name (string): Current page name
  - new_name (string): New page name`,
      inputSchema: RenamePageSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        await client.renamePage(params.old_name, params.new_name);
        return textResponse(
          `Page renamed from '${params.old_name}' to '${params.new_name}'.`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to rename page: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_get_page_linked_references ───────────────────────

  server.registerTool(
    "logseq_get_page_linked_references",
    {
      title: "Get Page Linked References",
      description: `Get all pages and blocks that link to a specific page (backlinks).

Args:
  - name (string): Page name to find backlinks for

Returns:
  List of referencing pages with the blocks that contain the link.`,
      inputSchema: GetPageLinkedReferencesSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const refs = await client.getPageLinkedReferences(params.name);
        if (!refs || refs.length === 0) {
          return textResponse(
            `No linked references found for page '${params.name}'.`,
          );
        }

        const lines: string[] = [
          `**Linked references for '${params.name}'** (${refs.length} pages)\n`,
        ];
        for (const [page, blocks] of refs) {
          lines.push(`### ${page.originalName || page.name}`);
          for (const block of blocks) {
            lines.push(`  - ${block.content?.trim()}`);
          }
          lines.push("");
        }

        return textResponse(lines.join("\n"));
      } catch (error) {
        return errorResponse(
          `Failed to get linked references: ${extractErrorMessage(error)}`,
        );
      }
    },
  );
}
