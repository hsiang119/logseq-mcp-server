/**
 * Default Logseq HTTP API server URL.
 * Configurable via LOGSEQ_API_URL environment variable.
 */
export const DEFAULT_API_URL = "http://127.0.0.1:12315";

/**
 * Maximum character limit for a single tool response to prevent context overflow.
 */
export const CHARACTER_LIMIT = 100_000;

/**
 * Default pagination limit when listing pages.
 */
export const DEFAULT_PAGE_LIMIT = 50;

/**
 * HTTP request timeout in milliseconds.
 */
export const REQUEST_TIMEOUT_MS = 30_000;
