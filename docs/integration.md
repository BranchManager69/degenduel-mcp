# Integration Guide

This guide covers how to integrate DegenDuel MCP Server with various AI assistants and development environments.

## Table of Contents

- [Claude Code Integration](#claude-code-integration)
- [Cursor Integration](#cursor-integration)
- [Custom Applications](#custom-applications)

## Claude Code Integration

Claude Code is Anthropic's CLI tool for interacting with Claude AI models. DegenDuel MCP Server can be integrated with Claude Code to extend its capabilities.

### Setup Steps

1. Install Claude Code if you haven't already:
   ```bash
   # Installation varies by platform - follow Anthropic's instructions
   ```

2. Add the MCP server to Claude Code:
   ```bash
   claude mcp add
   ```

3. When prompted, provide:
   - **Name**: degenduel-mcp (or any name you prefer)
   - **Type**: stdio
   - **Command**: /full/path/to/degenduel-mcp/build/index.js
   - **Arguments**: (leave empty)
   - **Environment Variables**: (leave empty or add specific vars if needed)

4. Verify the setup:
   ```bash
   claude mcp get degenduel-mcp
   ```

5. The output should look similar to:
   ```
   degenduel-mcp:
     Scope: project
     Type: stdio
     Command: /home/user/degenduel-mcp/build/index.js
     Args: 
     Environment:
   ```

### Usage with Claude Code

Once integrated, you can use the tools directly in conversation with Claude:

```
$ claude
Hi, I'm Claude. How can I help you today?

> Can you take a screenshot of example.com and analyze it?

I can help with that. I'll use the screenshot tool to capture example.com.

[Claude uses the screenshot tool and displays the captured image]

Here's the screenshot of example.com. I can see this is a simple website with...
```

## Cursor Integration

Cursor is an AI-powered code editor. DegenDuel MCP Server can provide additional tools to Cursor's AI capabilities.

### Setup Steps

1. Open Cursor

2. Navigate to Settings:
   - Click on the gear icon or use keyboard shortcut Ctrl+, (Windows/Linux) or Cmd+, (Mac)
   - Select "Features" tab
   - Find "MCP" section

3. Click "+ Add New MCP Server"

4. Fill out the form:
   - **Name**: DegenDuel MCP
   - **Type**: stdio
   - **Command**: /full/path/to/degenduel-mcp/build/index.js

5. Click "Save"

6. The tools should now appear in the MCP tools list

### Usage with Cursor

In Cursor's Composer:

1. Open Composer panel with Ctrl+K (Windows/Linux) or Cmd+K (Mac)
2. Ask for help using one of the tools:
   ```
   Can you analyze the code structure of this project and suggest improvements?
   ```
3. When Cursor suggests using the architect tool, approve the tool use

## Custom Applications

For integrating with custom applications, see below:

### Stdio Mode Integration

For CLI applications and tools that can spawn child processes:

```javascript
// Node.js example
const { spawn } = require('child_process');
const path = require('path');

// Path to the MCP server
const mcpServerPath = '/path/to/degenduel-mcp/build/index.js';

// Spawn the process
const mcpProcess = spawn('node', [mcpServerPath], {
  stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
});

// JSON-RPC communication
function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now().toString()
  };
  
  mcpProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Handle responses
let buffer = '';
mcpProcess.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Process complete JSON objects
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const message = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);
    
    try {
      const response = JSON.parse(message);
      console.log('Received response:', response);
      // Handle the response based on its id and content
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  }
});

// List available tools
sendRequest('listTools', {});

// Call a tool
sendRequest('callTool', {
  name: 'screenshot',
  arguments: {
    url: 'https://example.com',
    fullPathToScreenshot: '/tmp/example.png'
  }
});
```

### HTTP Mode Integration

For web applications and remote integrations, use the HTTP mode:

```javascript
// Browser example with JavaScript fetch API
async function connectToMCPServer() {
  const apiKey = 'your-api-key';
  const serverUrl = 'http://your-server:3333';
  
  // Establish SSE connection
  const eventSource = new EventSource(`${serverUrl}/mcp`, {
    headers: { 'x-api-key': apiKey }
  });
  
  let messagingEndpoint = null;
  let sessionId = null;
  
  return new Promise((resolve) => {
    eventSource.addEventListener('endpoint', (event) => {
      const endpointWithSession = decodeURI(event.data);
      const url = new URL(endpointWithSession);
      messagingEndpoint = `${serverUrl}${url.pathname}`;
      sessionId = url.searchParams.get('sessionId');
      
      resolve({
        eventSource,
        
        // Method to send requests to the MCP server
        async sendRequest(method, params) {
          const response = await fetch(`${messagingEndpoint}?sessionId=${sessionId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method,
              params,
              id: Date.now().toString()
            })
          });
          
          if (response.status !== 202) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          
          return true;
        },
        
        // Method to add a response handler
        onResponse(callback) {
          eventSource.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            callback(message);
          });
        },
        
        // Method to close the connection
        close() {
          eventSource.close();
        }
      });
    });
  });
}

// Usage example
async function main() {
  const client = await connectToMCPServer();
  
  // Add response handler
  client.onResponse((message) => {
    console.log('Received message:', message);
  });
  
  // List tools
  await client.sendRequest('listTools', {});
  
  // Call a tool
  await client.sendRequest('callTool', {
    name: 'screenshot',
    arguments: {
      url: 'https://example.com',
      fullPathToScreenshot: '/tmp/example.png'
    }
  });
}

main().catch(console.error);
```

## Advanced Integration

### Custom Tool Filters

When integrating with applications, you might want to restrict which tools are available:

```javascript
// Filter the tools response
function filterTools(toolsResponse) {
  const filtered = {...toolsResponse};
  filtered.tools = toolsResponse.tools.filter(tool => 
    ['screenshot', 'architect'].includes(tool.name)
  );
  return filtered;
}

// Use in your code
mcpProcess.stdout.on('data', (data) => {
  const response = JSON.parse(data);
  if (response.method === 'listTools') {
    // Filter tools before displaying to user
    const filteredResponse = filterTools(response.result);
    // Use filteredResponse
  }
});
```

### Tool Result Processing

Process and transform tool results before presenting to users:

```javascript
// Process screenshot tool results
function processScreenshotResult(result) {
  // Extract image from result
  const imageContent = result.content.find(item => item.type === 'image');
  
  if (imageContent && imageContent.image_url) {
    // Convert to an <img> tag, save to disk, or process further
    return {
      ...result,
      processed: {
        imageUrl: imageContent.image_url.url,
        // Add more processed data as needed
      }
    };
  }
  
  return result;
}

// Use in your application
client.onResponse((message) => {
  if (message.result && message.result.content) {
    // Check if this is a tool result
    if (message.id === 'screenshot-request-id') {
      const processedResult = processScreenshotResult(message.result);
      // Use processedResult
    }
  }
});
```