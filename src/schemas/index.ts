/**
 * Zod input schemas for all Logseq MCP tools.
 */

import { z } from "zod";

// ─── Page schemas ───────────────────────────────────────────────

export const ListPagesSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(500)
      .default(50)
      .describe("Maximum number of pages to return (1-500, default: 50)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of pages to skip for pagination (default: 0)"),
    journal_only: z
      .boolean()
      .default(false)
      .describe("If true, only return journal pages"),
    namespace: z
      .string()
      .optional()
      .describe("Filter pages by namespace prefix"),
  })
  .strict();

export const GetPageSchema = z
  .object({
    name: z.string().min(1).describe("Page name or UUID to retrieve"),
    include_children: z
      .boolean()
      .default(false)
      .describe("Include child blocks in the response"),
  })
  .strict();

export const GetPageContentSchema = z
  .object({
    name: z.string().min(1).describe("Page name to retrieve block tree for"),
  })
  .strict();

export const CreatePageSchema = z
  .object({
    name: z.string().min(1).describe("Name of the page to create"),
    content: z
      .string()
      .optional()
      .describe("Initial content to append as the first block"),
    properties: z
      .record(z.unknown())
      .optional()
      .describe("Page-level properties as key-value pairs"),
    format: z
      .enum(["markdown", "org"])
      .default("markdown")
      .describe("Page format (default: markdown)"),
    journal: z
      .boolean()
      .default(false)
      .describe("Whether this is a journal page"),
  })
  .strict();

export const DeletePageSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .describe("Name of the page to delete. This action is irreversible."),
  })
  .strict();

export const RenamePageSchema = z
  .object({
    old_name: z.string().min(1).describe("Current page name"),
    new_name: z.string().min(1).describe("New page name"),
  })
  .strict();

export const GetPageLinkedReferencesSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .describe("Page name to get linked references for"),
  })
  .strict();

// ─── Block schemas ──────────────────────────────────────────────

export const GetBlockSchema = z
  .object({
    id: z.string().min(1).describe("Block UUID to retrieve"),
    include_children: z
      .boolean()
      .default(false)
      .describe("Include child blocks in the response"),
  })
  .strict();

export const InsertBlockSchema = z
  .object({
    page_or_block: z
      .string()
      .min(1)
      .describe("Target page name or block UUID to insert after/under"),
    content: z.string().describe("Markdown content for the new block"),
    sibling: z
      .boolean()
      .default(false)
      .describe("Insert as a sibling (true) or child (false, default)"),
    before: z
      .boolean()
      .default(false)
      .describe("Insert before the target block instead of after"),
    properties: z
      .record(z.unknown())
      .optional()
      .describe("Block properties as key-value pairs"),
  })
  .strict();

export const AppendBlockSchema = z
  .object({
    page: z.string().min(1).describe("Page name to append block to"),
    content: z.string().describe("Markdown content for the new block"),
    properties: z
      .record(z.unknown())
      .optional()
      .describe("Block properties as key-value pairs"),
  })
  .strict();

export const UpdateBlockSchema = z
  .object({
    id: z.string().min(1).describe("Block UUID to update"),
    content: z.string().describe("New markdown content for the block"),
    properties: z
      .record(z.unknown())
      .optional()
      .describe("Updated block properties"),
  })
  .strict();

export const RemoveBlockSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .describe("Block UUID to remove. This action is irreversible."),
  })
  .strict();

export const MoveBlockSchema = z
  .object({
    src_id: z.string().min(1).describe("UUID of the block to move"),
    target_id: z.string().min(1).describe("UUID of the destination block"),
    before: z
      .boolean()
      .default(false)
      .describe("Place before target instead of after"),
    children: z
      .boolean()
      .default(false)
      .describe("Move as a child of target"),
  })
  .strict();

export const InsertBatchBlockSchema = z
  .object({
    page_or_block: z
      .string()
      .min(1)
      .describe("Target page name or block UUID"),
    blocks: z
      .array(
        z.object({
          content: z.string().describe("Block content"),
          properties: z.record(z.unknown()).optional(),
          children: z
            .array(
              z.object({
                content: z.string(),
                properties: z.record(z.unknown()).optional(),
              }),
            )
            .optional()
            .describe("Nested children blocks"),
        }),
      )
      .min(1)
      .describe("Array of blocks to insert"),
    sibling: z.boolean().default(false),
  })
  .strict();

export const BlockPropertySchema = z
  .object({
    id: z.string().min(1).describe("Block UUID"),
    key: z.string().min(1).describe("Property key"),
    value: z.unknown().optional().describe("Property value (omit to read)"),
  })
  .strict();

// ─── Search schema ──────────────────────────────────────────────

export const SearchSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .max(500)
      .describe("Search query string"),
  })
  .strict();

// ─── Journal schema ─────────────────────────────────────────────

export const CreateJournalSchema = z
  .object({
    date: z
      .string()
      .min(1)
      .describe(
        "Date for the journal page. Accepts 'YYYY-MM-DD' or a natural date string.",
      ),
  })
  .strict();

// ─── Graph schema ───────────────────────────────────────────────

export const GetGraphInfoSchema = z.object({}).strict();

export const GetAllTagsSchema = z.object({}).strict();
