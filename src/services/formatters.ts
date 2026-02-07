/**
 * Shared formatting and response helpers for MCP tool handlers.
 */

import { CHARACTER_LIMIT } from "../constants.js";
import type { BlockEntity, PageEntity } from "../types.js";

/** Build a successful text response for MCP. */
export function textResponse(text: string) {
  return {
    content: [{ type: "text" as const, text: truncate(text) }],
  };
}

/** Build an error response for MCP. */
export function errorResponse(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

/** Truncate text that exceeds CHARACTER_LIMIT. */
function truncate(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;
  return (
    text.slice(0, CHARACTER_LIMIT) +
    `\n\n[Response truncated — ${text.length - CHARACTER_LIMIT} characters omitted]`
  );
}

/** Render a block tree as indented Markdown. */
export function renderBlockTree(
  blocks: BlockEntity[],
  depth = 0,
): string {
  const lines: string[] = [];
  for (const block of blocks) {
    const indent = "  ".repeat(depth);
    const content = block.content?.trim();
    if (content) {
      lines.push(`${indent}- ${content}`);
    }
    if (block.children && block.children.length > 0) {
      lines.push(renderBlockTree(block.children, depth + 1));
    }
  }
  return lines.join("\n");
}

/** Format a page entity into a concise summary line. */
export function formatPageSummary(page: PageEntity): string {
  const journal = page["journal?"] ? " 📅" : "";
  const ns = page.namespace ? ` (ns: ${page.namespace.id})` : "";
  return `- **${page.originalName || page.name}** (uuid: ${page.uuid})${journal}${ns}`;
}

/** Safely extract an error message from an unknown thrown value. */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
