# logseq-mcp-server

A TypeScript [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects AI assistants to your [Logseq](https://logseq.com/) knowledge graph. Read, write, search, and manage pages, blocks, journals, and tags through the MCP protocol.

## Features

- **17 tools** covering Pages, Blocks, Search, Journals, and Graph operations
- Full CRUD for pages and blocks
- Full-text search across the graph
- Batch block insertion with nested children
- Block property management
- Backlink (linked references) retrieval
- Journal page creation and tag listing
- **Dual transport**: stdio (local) and HTTP ([Hono](https://hono.dev/)-based, portable across runtimes)

## Prerequisites

1. **Logseq** installed and running
2. **HTTP APIs server** enabled in Logseq:
   - Settings > Features > Enable "HTTP APIs server"
   - Click the API button > "Start server"
   - Generate a token: API panel > Authorization tokens
3. **Node.js** >= 18

## Quick Start

### Claude Desktop

Add to `Settings > Developer > Edit Config`:

```json
{
  "mcpServers": {
    "logseq": {
      "command": "npx",
      "args": ["logseq-mcp-server"],
      "env": {
        "LOGSEQ_API_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add logseq-mcp-server \
  --env LOGSEQ_API_TOKEN=your_token_here \
  -- npx logseq-mcp-server
```

### From Source

```bash
git clone https://github.com/user/logseq-mcp-server.git
cd logseq-mcp-server
npm install
npm run build
LOGSEQ_API_TOKEN=your_token npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOGSEQ_API_TOKEN` | Yes | - | Bearer token from Logseq HTTP API |
| `LOGSEQ_API_URL` | No | `http://127.0.0.1:12315` | Logseq HTTP API URL |
| `TRANSPORT` | No | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | No | `3000` | HTTP port (when `TRANSPORT=http`) |

## HTTP Transport

When running with `TRANSPORT=http`, the server uses [Hono](https://hono.dev/) with `WebStandardStreamableHTTPServerTransport` from the MCP SDK.

```bash
LOGSEQ_API_TOKEN=your_token TRANSPORT=http PORT=3000 npm start
```

Endpoints:

- `POST|GET|DELETE /mcp` - MCP Streamable HTTP protocol
- `GET /health` - Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","server":"logseq-mcp-server"}
```

## Available Tools

### Pages

| Tool | Description |
|---|---|
| `logseq_list_pages` | List pages with filtering (journal, namespace) and pagination |
| `logseq_get_page` | Get page metadata by name or UUID |
| `logseq_get_page_content` | Get full block tree rendered as indented Markdown |
| `logseq_create_page` | Create a new page with optional initial content and properties |
| `logseq_delete_page` | Permanently delete a page |
| `logseq_rename_page` | Rename a page (updates all references) |
| `logseq_get_page_linked_references` | Get backlinks - pages and blocks that reference a page |

### Blocks

| Tool | Description |
|---|---|
| `logseq_get_block` | Get a block by UUID with optional children |
| `logseq_insert_block` | Insert a block relative to a page or block |
| `logseq_append_block` | Append a block at the end of a page |
| `logseq_update_block` | Update block content and properties |
| `logseq_remove_block` | Permanently remove a block |
| `logseq_move_block` | Move a block to a new position |
| `logseq_insert_batch_blocks` | Insert multiple blocks at once (supports nesting) |
| `logseq_block_property` | Read or write a single block property |

### Search & Graph

| Tool | Description |
|---|---|
| `logseq_search` | Full-text search across pages and blocks |
| `logseq_create_journal` | Create a journal page for a specific date |
| `logseq_get_graph_info` | Get current graph name and path |
| `logseq_get_all_tags` | List all tags in the graph |

## Architecture

```
src/
├── index.ts              # Entry point, server init, transport selection
├── constants.ts          # Shared constants
├── types.ts              # TypeScript type definitions
├── schemas/
│   └── index.ts          # Zod input validation schemas
├── services/
│   ├── logseq-client.ts  # Logseq HTTP API client
│   └── formatters.ts     # Response formatting helpers
└── tools/
    ├── page-tools.ts     # Page CRUD tools
    ├── block-tools.ts    # Block CRUD tools
    └── search-graph-tools.ts  # Search, journal, graph tools
```

```
MCP Client (Claude, etc.)
    ↓ stdio or HTTP
MCP Server (index.ts, Hono)
    ↓ registers tool groups
Tools (page-tools, block-tools, search-graph-tools)
    ↓ calls service methods
LogseqClient (logseq-client.ts)
    ↓ POST /api { method, args }
Logseq HTTP API (local instance)
```

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm run dev        # Watch mode (tsc --watch)
npm run inspect    # Test with MCP Inspector
```

## License

Apache-2.0
