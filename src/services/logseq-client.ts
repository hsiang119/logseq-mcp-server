/**
 * Logseq HTTP API client.
 *
 * Wraps the single POST /api endpoint that Logseq exposes.
 * Every plugin SDK method (logseq.Editor.*, logseq.App.*, etc.)
 * can be invoked by specifying the method name and arguments.
 */

import { DEFAULT_API_URL, REQUEST_TIMEOUT_MS } from "../constants.js";
import type {
  LogseqApiRequest,
  PageEntity,
  BlockEntity,
  BatchBlockInput,
  LinkedReference,
} from "../types.js";

export class LogseqClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = (baseUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
  }

  // ─── Low-level request ────────────────────────────────────────

  /**
   * Call any Logseq plugin SDK method via HTTP API.
   * @param method  Fully-qualified method name, e.g. "logseq.Editor.getPage"
   * @param args    Positional arguments for the method
   */
  async call<T>(method: string, args: unknown[] = []): Promise<T> {
    const body: LogseqApiRequest = { method, args };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(`${this.baseUrl}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Logseq API error ${response.status}: ${text || response.statusText}`,
        );
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(
          `Logseq API request timed out after ${REQUEST_TIMEOUT_MS}ms. ` +
            "Ensure Logseq is running and the HTTP API server is started.",
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Page operations ──────────────────────────────────────────

  async getAllPages(): Promise<PageEntity[]> {
    return this.call<PageEntity[]>("logseq.Editor.getAllPages");
  }

  async getPage(
    nameOrId: string | number,
    opts?: { includeChildren?: boolean },
  ): Promise<PageEntity | null> {
    return this.call<PageEntity | null>("logseq.Editor.getPage", [
      nameOrId,
      opts ?? {},
    ]);
  }

  async getPageBlocksTree(pageName: string): Promise<BlockEntity[]> {
    return this.call<BlockEntity[]>("logseq.Editor.getPageBlocksTree", [
      pageName,
    ]);
  }

  async getPageLinkedReferences(
    pageName: string,
  ): Promise<LinkedReference[]> {
    return this.call<LinkedReference[]>(
      "logseq.Editor.getPageLinkedReferences",
      [pageName],
    );
  }

  async createPage(
    name: string,
    properties?: Record<string, unknown>,
    opts?: {
      createFirstBlock?: boolean;
      format?: "markdown" | "org";
      journal?: boolean;
      redirect?: boolean;
    },
  ): Promise<PageEntity> {
    return this.call<PageEntity>("logseq.Editor.createPage", [
      name,
      properties ?? {},
      { redirect: false, ...opts },
    ]);
  }

  async deletePage(name: string): Promise<void> {
    await this.call<void>("logseq.Editor.deletePage", [name]);
  }

  async renamePage(oldName: string, newName: string): Promise<void> {
    await this.call<void>("logseq.Editor.renamePage", [oldName, newName]);
  }

  async getPageProperties(
    nameOrId: string | number,
  ): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>(
      "logseq.Editor.getPageProperties",
      [nameOrId],
    );
  }

  async getPagesFromNamespace(namespace: string): Promise<PageEntity[]> {
    return this.call<PageEntity[]>(
      "logseq.Editor.getPagesFromNamespace",
      [namespace],
    );
  }

  // ─── Block operations ─────────────────────────────────────────

  async getBlock(
    idOrUuid: string | number,
    opts?: { includeChildren?: boolean },
  ): Promise<BlockEntity | null> {
    return this.call<BlockEntity | null>("logseq.Editor.getBlock", [
      idOrUuid,
      opts ?? {},
    ]);
  }

  async insertBlock(
    srcBlock: string | number,
    content: string,
    opts?: {
      before?: boolean;
      sibling?: boolean;
      properties?: Record<string, unknown>;
    },
  ): Promise<BlockEntity> {
    return this.call<BlockEntity>("logseq.Editor.insertBlock", [
      srcBlock,
      content,
      opts ?? {},
    ]);
  }

  async insertBatchBlock(
    srcBlock: string | number,
    batch: BatchBlockInput[],
    opts?: { before?: boolean; sibling?: boolean },
  ): Promise<BlockEntity[]> {
    return this.call<BlockEntity[]>("logseq.Editor.insertBatchBlock", [
      srcBlock,
      batch,
      opts ?? {},
    ]);
  }

  async updateBlock(
    srcBlock: string | number,
    content: string,
    opts?: { properties?: Record<string, unknown> },
  ): Promise<void> {
    await this.call<void>("logseq.Editor.updateBlock", [
      srcBlock,
      content,
      opts ?? {},
    ]);
  }

  async removeBlock(srcBlock: string | number): Promise<void> {
    await this.call<void>("logseq.Editor.removeBlock", [srcBlock]);
  }

  async moveBlock(
    srcBlock: string,
    targetBlock: string,
    opts?: { before?: boolean; children?: boolean },
  ): Promise<void> {
    await this.call<void>("logseq.Editor.moveBlock", [
      srcBlock,
      targetBlock,
      opts ?? {},
    ]);
  }

  async appendBlockInPage(
    page: string,
    content: string,
    opts?: { properties?: Record<string, unknown> },
  ): Promise<BlockEntity> {
    return this.call<BlockEntity>("logseq.Editor.appendBlockInPage", [
      page,
      content,
      opts ?? {},
    ]);
  }

  async prependBlockInPage(
    page: string,
    content: string,
    opts?: { properties?: Record<string, unknown> },
  ): Promise<BlockEntity> {
    return this.call<BlockEntity>("logseq.Editor.prependBlockInPage", [
      page,
      content,
      opts ?? {},
    ]);
  }

  async getBlockProperties(
    blockIdOrUuid: string | number,
  ): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>(
      "logseq.Editor.getBlockProperties",
      [blockIdOrUuid],
    );
  }

  async upsertBlockProperty(
    blockIdOrUuid: string | number,
    key: string,
    value: unknown,
  ): Promise<void> {
    await this.call<void>("logseq.Editor.upsertBlockProperty", [
      blockIdOrUuid,
      key,
      value,
    ]);
  }

  async removeBlockProperty(
    blockIdOrUuid: string | number,
    key: string,
  ): Promise<void> {
    await this.call<void>("logseq.Editor.removeBlockProperty", [
      blockIdOrUuid,
      key,
    ]);
  }

  // ─── Journal operations ───────────────────────────────────────

  async createJournalPage(date: string): Promise<PageEntity> {
    return this.call<PageEntity>("logseq.Editor.createJournalPage", [date]);
  }

  // ─── Tag operations ───────────────────────────────────────────

  async getAllTags(): Promise<PageEntity[]> {
    return this.call<PageEntity[]>("logseq.Editor.getAllTags");
  }

  // ─── Search (via App proxy) ───────────────────────────────────

  async search(query: string): Promise<{ blocks: BlockEntity[]; pages: string[] }> {
    return this.call<{ blocks: BlockEntity[]; pages: string[] }>(
      "logseq.App.search",
      [query],
    );
  }

  // ─── Graph info ───────────────────────────────────────────────

  async getCurrentGraph(): Promise<{ name: string; path: string; url: string } | null> {
    return this.call<{ name: string; path: string; url: string } | null>(
      "logseq.App.getCurrentGraph",
    );
  }

  async showMsg(message: string): Promise<void> {
    await this.call<void>("logseq.UI.showMsg", [message]);
  }
}
