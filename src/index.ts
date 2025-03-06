#!/usr/bin/env node
// src/index.ts

// Suppress punycode deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && 
      warning.message && 
      warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});

/**
 * MCP Server
 *   - A minimal MCP server providing three Cursor Tools:
 *     1) Screenshot
 *     2) Architect
 *     3) CodeReview
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
// Tools
import { screenshotToolName, screenshotToolDescription, ScreenshotToolSchema, runScreenshotTool } from "./tools/screenshot.js";
import { architectToolName, architectToolDescription, ArchitectToolSchema, runArchitectTool } from "./tools/architect.js";
import { codeReviewToolName, codeReviewToolDescription, CodeReviewToolSchema, runCodeReviewTool } from "./tools/codeReview.js";
// Environment
import { HTTP_MODE_ENABLED, PORT } from "./env/config.js";
import { MODEL_FOR_TOOL_SCREENSHOT, MODEL_FOR_TOOL_ARCHITECT, MODEL_FOR_TOOL_CODE_REVIEW } from "./env/ai.js";


/*========== BRANCH MANAGER's MCP SERVER ==========*/

// 1. Create an MCP server instance
const server = new Server(
  {
    name: "mcp-server",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 2. Define the list of tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: screenshotToolName,
        description: screenshotToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full URL to screenshot (e.g., https://example.com)",
            },
            relativePath: {
              type: "string",
              description: `Relative path appended to http://localhost:${PORT} (e.g., 'dashboard' becomes http://localhost:${PORT}/dashboard)`,
            },
            fullPathToScreenshot: {
              type: "string",
              description: "Path where the screenshot will be saved (e.g., /tmp/screenshot.png)",
            },
          },
          required: [],
        },
      },
      {
        name: architectToolName,
        description: architectToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Description of the task",
            },
            code: {
              type: "string",
              description: "Concatenated code from one or more files",
            },
          },
          required: ["task", "code"],
        },
      },
      {
        name: codeReviewToolName,
        description: codeReviewToolDescription,
        inputSchema: {
          type: "object",
          properties: {
            folderPath: {
              type: "string",
              description:
                "Path to the full root directory of the repository to diff against main",
            },
          },
          required: ["folderPath"],
        },
      },
    ],
  };
});

// 3. Implement the tool call logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // Screenshot tool
    case screenshotToolName: {
      const validated = ScreenshotToolSchema.parse(args);
      return await runScreenshotTool(validated);
    }
    // Architect tool
    case architectToolName: {
      const validated = ArchitectToolSchema.parse(args);
      return await runArchitectTool(validated);
    }
    // Code Review tool
    case codeReviewToolName: {
      const validated = CodeReviewToolSchema.parse(args);
      return await runCodeReviewTool(validated);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Get HTTP mode flag to control external web server availability
const httpModeEnabled = HTTP_MODE_ENABLED;

// 4. Start the MCP server with the appropriate transport
async function main() {
  // Check if we should run in HTTP mode (requires both the flag to be enabled and the command line arg)
  const httpRequested = process.argv.includes('--http');
  const useHttp = httpModeEnabled && httpRequested;
  const port = PORT; // Get port from config.ts
  
  if (useHttp) {
    // Only import HTTP server if we're actually using it
    const { startHttpServer } = await import('./httpServer.js');
    
    // Start with HTTP/SSE transport
    const transport = startHttpServer(server, port);
    await server.connect(transport);
    console.error(`===== DegenDuel MCP Server running on HTTP at port ${port} =====`);
  } else {
    // If HTTP was requested but not enabled, show a message
    if (httpRequested && !httpModeEnabled) {
      console.error("HTTP mode is currently disabled. In env/config.ts, set HTTP_MODE_ENABLED to true to enable it.");
    }
    
    // Start with stdio transport (default for Cursor)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`\n===== DegenDuel MCP Server running ===== \n\tTransport: \tstdio \n\tPort: \t\t${port} \n========================================`);
  }
}

// Run the MCP server
main().catch((error) => {
  console.error(`\n\nFATAL ERROR:\n\t${error}\n\n`);
  process.exit(1);
});
