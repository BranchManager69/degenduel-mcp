# DegenDuel MCP Server Documentation

A Model Context Protocol (MCP) server providing powerful AI tools for development workflows. This server implements three core tools to enhance coding and design processes through AI-assisted capabilities.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tools](#tools)
  - [Screenshot Tool](#screenshot-tool)
  - [Architect Tool](#architect-tool)
  - [Code Review Tool](#code-review-tool)
- [Running the Server](#running-the-server)
  - [Stdio Mode](#stdio-mode)
  - [HTTP Mode](#http-mode)
- [Integration](#integration)
  - [With Claude Code](#with-claude-code)
  - [With Cursor](#with-cursor)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

DegenDuel MCP Server is a specialized AI tool provider that implements the Model Context Protocol. It enables AI assistants like Claude to perform complex operations through three powerful tools:

1. **Screenshot Tool** - Capture web pages or local UI
2. **Architect Tool** - Generate code architecture plans with OpenAI
3. **Code Review Tool** - Analyze git differences for code reviews

The server can run in two modes:
- **Stdio Mode**: Used for direct integration with Claude Code or Cursor
- **HTTP Mode**: For remote access, automations, and custom integrations

## Installation

### Prerequisites

- Node.js (v18+)
- npm (v8+)
- A working OpenAI API key (for Architect tool)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/degenduel-mcp.git
   cd degenduel-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment:
   - Review `/src/env/config.ts` for server settings
   - Add your OpenAI API key to `/src/env/keys.ts`

4. Build the server:
   ```bash
   npm run build-only
   ```

## Configuration

### Core Configuration

All configuration is stored in the `src/env` directory:

- **config.ts**: Server configuration (port, HTTP mode, etc.)
- **keys.ts**: API keys for external services
- **ai.ts**: AI model configuration for tools

### Key Settings

In `src/env/config.ts`:

```typescript
// Enable/disable HTTP mode
const HTTP_MODE_ENABLED = true/false;

// Server port (used for both HTTP mode and relative URLs in tools)
const PORT = 3333;
```

In `src/env/keys.ts`:

```typescript
// Your OpenAI API key for the Architect tool
export const OPENAI_API_KEY = "your-key-here";
```

In `src/env/ai.ts`:

```typescript
// Models used by each tool
const MODEL_FOR_TOOL_SCREENSHOT = "o3-mini-2025-01-31";
const MODEL_FOR_TOOL_ARCHITECT = "o3-mini-2025-01-31";
const MODEL_FOR_TOOL_CODE_REVIEW = "o3-mini-2025-01-31";
```

## Tools

### Screenshot Tool

The Screenshot tool captures visual content from web pages or local applications.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | No* | Full URL to screenshot (e.g., https://example.com) |
| relativePath | string | No* | Relative path appended to http://localhost:PORT (e.g., 'dashboard') |
| fullPathToScreenshot | string | Yes | Path where the screenshot will be saved (e.g., /tmp/screenshot.png) |

\* Either `url` or `relativePath` must be provided

#### Example Usage

```javascript
// Taking a screenshot of a website
{
  "name": "screenshot",
  "arguments": {
    "url": "https://github.com",
    "fullPathToScreenshot": "/tmp/github-screenshot.png"
  }
}

// Taking a screenshot of a local application
{
  "name": "screenshot",
  "arguments": {
    "relativePath": "dashboard",
    "fullPathToScreenshot": "/tmp/local-dashboard.png"
  }
}
```

#### Response

The tool returns:
1. A text confirmation with the file path
2. The base64-encoded image for direct display

### Architect Tool

The Architect tool uses OpenAI to generate coding plans and architecture designs.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| task | string | Yes | Description of the development task or problem |
| code | string | Yes | Concatenated code from one or more files for context |

#### Example Usage

```javascript
{
  "name": "architect",
  "arguments": {
    "task": "Create a responsive navbar component with dropdown menus",
    "code": "// Existing component code...\nfunction App() {\n  return <div>...</div>;\n}"
  }
}
```

#### Response

The tool returns a structured architecture plan with:
- High-level overview
- Component breakdown
- Implementation steps
- Code examples
- Considerations and best practices

### Code Review Tool

The Code Review tool analyzes git differences to provide code review feedback.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| folderPath | string | Yes | Path to the repository root directory |

#### Example Usage

```javascript
{
  "name": "codeReview",
  "arguments": {
    "folderPath": "/home/user/projects/my-repo"
  }
}
```

#### Response

The tool returns a comprehensive code review with:
- Summary of changes
- Code quality analysis
- Potential issues
- Best practice recommendations
- Performance considerations

## Running the Server

### Stdio Mode

Stdio mode is used for direct integration with Claude Code and Cursor.

```bash
# Start in development mode (watches for changes)
npm run dev

# Start in production mode
npm run start

# Run with PM2 for production deployment
npm run pm2
```

### HTTP Mode

HTTP mode enables remote access and API-based integration.

To enable HTTP mode:
1. Set `HTTP_MODE_ENABLED = true` in `src/env/config.ts`
2. Use one of the HTTP-specific commands:

```bash
# Start in development mode with HTTP
npm run dev:http

# Start in production mode with HTTP
npm run start:http

# Run with PM2 for production deployment
npm run pm2:http
```

When running in HTTP mode, the server is accessible at:
```
http://your-server-address:PORT/mcp
```

Authentication is required via the `x-api-key` header.

## Integration

### With Claude Code

To add this MCP server to Claude Code:

1. Install Claude Code CLI
2. Add the server:
   ```bash
   claude mcp add
   ```
3. Follow the prompts:
   - Name: degenduel-mcp (or any name you prefer)
   - Type: stdio
   - Command: /full/path/to/degenduel-mcp/build/index.js
   - Args: (leave empty)
   - Environment: (leave empty or add OPENAI_API_KEY if needed)

4. Verify with:
   ```bash
   claude mcp get degenduel-mcp
   ```

### With Cursor

To add this MCP server to Cursor:

1. Open Cursor
2. Go to `Settings > Features > MCP`
3. Click `+ Add New MCP Server`
4. Fill out the form:
   - Name: DegenDuel MCP
   - Type: stdio
   - Command: /full/path/to/degenduel-mcp/build/index.js

## Development

### Directory Structure

```
degenduel-mcp/
├── build/             # Compiled JavaScript
├── docs/              # Documentation
├── src/
│   ├── env/           # Environment and configuration
│   │   ├── ai.ts      # AI model configuration
│   │   ├── config.ts  # Server configuration
│   │   └── keys.ts    # API keys
│   ├── tools/         # Tool implementations
│   │   ├── architect.ts
│   │   ├── codeReview.ts
│   │   └── screenshot.ts
│   ├── httpServer.ts  # HTTP mode implementation
│   └── index.ts       # Main entry point
├── CLAUDE.md          # Development guide for AI assistants
├── package.json
└── tsconfig.json
```

### Development Commands

```bash
# Watch mode for development
npm run dev

# Build only
npm run build-only

# Start the server
npm run start

# PM2 commands
npm run pm2         # Start with PM2
npm run stop        # Stop PM2 server
npm run restart     # Restart PM2 server
npm run logs        # View PM2 logs
npm run status      # Check PM2 status
```

## Troubleshooting

### Common Issues

#### Server Won't Start

1. Check if port is already in use:
   ```bash
   lsof -i :3333
   ```

2. Verify the built files exist:
   ```bash
   ls -la build/
   ```

3. Check for runtime errors:
   ```bash
   npm run logs
   ```

#### Tool Execution Errors

1. For Screenshot tool issues:
   - Ensure Puppeteer can run (may need additional dependencies on Linux)
   - Verify URLs are accessible
   - Check if the path for saving screenshots is writable

2. For Architect tool issues:
   - Verify your OpenAI API key in keys.ts
   - Check your OpenAI account balance
   - Ensure the model specified in ai.ts is available

3. For Code Review tool issues:
   - Ensure the repository path is valid
   - Check if git is installed and accessible
   - Verify there are changes to analyze