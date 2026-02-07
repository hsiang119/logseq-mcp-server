/**
 * Block-related MCP tool registrations.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LogseqClient } from "../services/logseq-client.js";
import {
  GetBlockSchema,
  InsertBlockSchema,
  AppendBlockSchema,
  UpdateBlockSchema,
  RemoveBlockSchema,
  MoveBlockSchema,
  InsertBatchBlockSchema,
  BlockPropertySchema,
} from "../schemas/index.js";
import {
  textResponse,
  errorResponse,
  renderBlockTree,
  extractErrorMessage,
} from "../services/formatters.js";

export function registerBlockTools(
  server: McpServer,
  client: LogseqClient,
): void {
  // ─── logseq_get_block ────────────────────────────────────────

  server.registerTool(
    "logseq_get_block",
    {
      title: "Get Logseq Block",
      description: `Retrieve a specific block by UUID, optionally including its children.

Args:
  - id (string): Block UUID
  - include_children (boolean): Include child blocks (default: false)

Returns:
  Block entity with content, uuid, properties, and optional children.`,
      inputSchema: GetBlockSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const block = await client.getBlock(params.id, {
          includeChildren: params.include_children,
        });
        if (!block) {
          return errorResponse(
            `Block '${params.id}' not found. Verify the UUID is correct.`,
          );
        }

        if (params.include_children && block.children?.length) {
          const tree = renderBlockTree([block]);
          return textResponse(
            `**Block ${block.uuid}**\n\n${tree}\n\n---\nRaw:\n${JSON.stringify(block, null, 2)}`,
          );
        }

        return textResponse(JSON.stringify(block, null, 2));
      } catch (error) {
        return errorResponse(
          `Failed to get block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_insert_block ─────────────────────────────────────

  server.registerTool(
    "logseq_insert_block",
    {
      title: "Insert Logseq Block",
      description: `Insert a new block relative to an existing page or block.

Args:
  - page_or_block (string): Target page name or block UUID
  - content (string): Markdown content for the new block
  - sibling (boolean): Insert as sibling (default: false, inserts as child)
  - before (boolean): Insert before target (default: false)
  - properties (object, optional): Block properties

Returns:
  Created block entity.`,
      inputSchema: InsertBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const block = await client.insertBlock(
          params.page_or_block,
          params.content,
          {
            sibling: params.sibling,
            before: params.before,
            properties: params.properties,
          },
        );
        return textResponse(
          `Block inserted successfully.\n\n${JSON.stringify(block, null, 2)}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to insert block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_append_block ─────────────────────────────────────

  server.registerTool(
    "logseq_append_block",
    {
      title: "Append Block to Page",
      description: `Append a new block at the end of a page.

Args:
  - page (string): Page name
  - content (string): Markdown content
  - properties (object, optional): Block properties

Returns:
  Created block entity.`,
      inputSchema: AppendBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const block = await client.appendBlockInPage(
          params.page,
          params.content,
          { properties: params.properties },
        );
        return textResponse(
          `Block appended to '${params.page}'.\n\n${JSON.stringify(block, null, 2)}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to append block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_update_block ─────────────────────────────────────

  server.registerTool(
    "logseq_update_block",
    {
      title: "Update Logseq Block",
      description: `Update the content of an existing block.

Args:
  - id (string): Block UUID to update
  - content (string): New markdown content
  - properties (object, optional): Updated properties

Returns:
  Confirmation message.`,
      inputSchema: UpdateBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        await client.updateBlock(params.id, params.content, {
          properties: params.properties,
        });
        return textResponse(
          `Block '${params.id}' updated successfully.`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to update block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_remove_block ─────────────────────────────────────

  server.registerTool(
    "logseq_remove_block",
    {
      title: "Remove Logseq Block",
      description: `Permanently remove a block. This is irreversible.

Args:
  - id (string): Block UUID to remove`,
      inputSchema: RemoveBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        await client.removeBlock(params.id);
        return textResponse(`Block '${params.id}' removed successfully.`);
      } catch (error) {
        return errorResponse(
          `Failed to remove block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_move_block ───────────────────────────────────────

  server.registerTool(
    "logseq_move_block",
    {
      title: "Move Logseq Block",
      description: `Move a block to a new position relative to another block.

Args:
  - src_id (string): UUID of the block to move
  - target_id (string): UUID of the destination block
  - before (boolean): Place before target (default: false)
  - children (boolean): Move as child of target (default: false)`,
      inputSchema: MoveBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        await client.moveBlock(params.src_id, params.target_id, {
          before: params.before,
          children: params.children,
        });
        return textResponse(
          `Block '${params.src_id}' moved to '${params.target_id}'.`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to move block: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_insert_batch_blocks ──────────────────────────────

  server.registerTool(
    "logseq_insert_batch_blocks",
    {
      title: "Insert Batch Blocks",
      description: `Insert multiple blocks at once under a page or block. Supports nested children.

Args:
  - page_or_block (string): Target page name or block UUID
  - blocks (array): Array of { content, properties?, children? }
  - sibling (boolean): Insert as siblings (default: false)

Returns:
  Array of created block entities.`,
      inputSchema: InsertBatchBlockSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        const result = await client.insertBatchBlock(
          params.page_or_block,
          params.blocks,
          { sibling: params.sibling },
        );
        return textResponse(
          `${result.length} blocks inserted successfully.\n\n${JSON.stringify(result, null, 2)}`,
        );
      } catch (error) {
        return errorResponse(
          `Failed to insert batch blocks: ${extractErrorMessage(error)}`,
        );
      }
    },
  );

  // ─── logseq_block_property ───────────────────────────────────

  server.registerTool(
    "logseq_block_property",
    {
      title: "Get/Set Block Property",
      description: `Read or write a single property on a block.

When 'value' is provided, the property is set (upsert).
When 'value' is omitted, the current properties are returned.

Args:
  - id (string): Block UUID
  - key (string): Property key
  - value (any, optional): Property value to set

Returns:
  Current property value or confirmation of update.`,
      inputSchema: BlockPropertySchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params) => {
      try {
        if (params.value !== undefined) {
          await client.upsertBlockProperty(
            params.id,
            params.key,
            params.value,
          );
          return textResponse(
            `Property '${params.key}' set on block '${params.id}'.`,
          );
        }

        const properties = await client.getBlockProperties(params.id);
        return textResponse(JSON.stringify(properties, null, 2));
      } catch (error) {
        return errorResponse(
          `Failed to access block property: ${extractErrorMessage(error)}`,
        );
      }
    },
  );
}
