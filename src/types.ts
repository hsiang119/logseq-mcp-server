/**
 * Logseq entity and API type definitions.
 * Based on the Logseq Plugin SDK IEditorProxy interface.
 */

/** Logseq page entity returned by the HTTP API. */
export interface PageEntity {
  id: number;
  uuid: string;
  name: string;
  originalName: string;
  "journal?": boolean;
  file?: { id: number; path: string };
  namespace?: { id: number };
  properties?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
  format?: "markdown" | "org";
}

/** Logseq block entity returned by the HTTP API. */
export interface BlockEntity {
  id: number;
  uuid: string;
  content: string;
  left: { id: number };
  parent: { id: number };
  page: { id: number };
  properties?: Record<string, unknown>;
  children?: BlockEntity[];
  format?: "markdown" | "org";
  "pre-block?"?: boolean;
}

/** Shape of a POST request body to the Logseq HTTP API. */
export interface LogseqApiRequest {
  method: string;
  args?: unknown[];
}

/** Batch block input for insertBatchBlock. */
export interface BatchBlockInput {
  content: string;
  properties?: Record<string, unknown>;
  children?: BatchBlockInput[];
}

/** Linked-reference tuple: [page, blocks[]]. */
export type LinkedReference = [PageEntity, BlockEntity[]];
