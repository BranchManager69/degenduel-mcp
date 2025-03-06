# HTTP Mode

HTTP mode allows the DegenDuel MCP Server to be accessed remotely via a REST API interface.

## Overview

While stdio mode is ideal for direct integration with tools like Claude Code and Cursor, HTTP mode enables:

- Remote access from any location
- Integration with custom applications and tools
- Automated workflows and CI/CD pipelines
- Multiple clients connecting to a single server instance

HTTP mode uses Server-Sent Events (SSE) for real-time communication and standard HTTP POST requests for sending commands.

## Enabling HTTP Mode

HTTP mode is enabled by default for convenience. If you need to disable it:

1. Edit `src/env/config.ts`:
   ```typescript
   const HTTP_MODE_ENABLED = false;
   ```

2. Specify the desired port (default is 3333):
   ```typescript
   const PORT = 3333;
   ```

3. Run the server with the HTTP flag:
   ```bash
   npm run start:http
   ```

## API Endpoints

When running in HTTP mode, the following endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint that returns status "ok" |
| `/mcp` | GET | Establishes an SSE connection for receiving messages |
| `/mcp/message` | POST | Sends commands to the MCP server |

## Authentication

Authentication is implemented using API keys. All requests must include an `x-api-key` header.

The current implementation requires an API key but doesn't validate against a specific value. In production, you should modify `apiKeyMiddleware` in `httpServer.ts` to validate against a secure key.

```javascript
// Example authenticated request
fetch('http://your-server:3333/mcp/message?sessionId=12345', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'callTool',
    params: {
      name: 'screenshot',
      arguments: {
        url: 'https://example.com',
        fullPathToScreenshot: '/tmp/example.png'
      }
    },
    id: '1'
  })
});
```

## Connection Flow

1. **Establish SSE Connection**:
   ```javascript
   const eventSource = new EventSource('http://your-server:3333/mcp', {
     headers: { 'x-api-key': 'your-api-key' }
   });
   
   eventSource.addEventListener('endpoint', (event) => {
     const endpoint = decodeURI(event.data);
     // Store endpoint for sending messages
   });
   
   eventSource.addEventListener('message', (event) => {
     const message = JSON.parse(event.data);
     // Handle the message from the server
   });
   ```

2. **Send Commands**:
   ```javascript
   // Using the endpoint and sessionId from the SSE connection
   fetch(`${endpoint}?sessionId=${sessionId}`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-api-key': 'your-api-key'
     },
     body: JSON.stringify({
       jsonrpc: '2.0',
       method: 'listTools',
       id: '1'
     })
   });
   ```

## JSON-RPC Methods

The API follows the JSON-RPC 2.0 specification. Available methods:

| Method | Description |
|--------|-------------|
| `listTools` | Gets available tools and their schemas |
| `callTool` | Executes a specific tool with provided arguments |

Example request body:

```json
{
  "jsonrpc": "2.0",
  "method": "callTool",
  "params": {
    "name": "screenshot",
    "arguments": {
      "url": "https://example.com",
      "fullPathToScreenshot": "/tmp/example.png"
    }
  },
  "id": "1"
}
```

## Error Handling

HTTP errors:

| Status Code | Description |
|-------------|-------------|
| 202 | Request accepted |
| 400 | Invalid request or message |
| 401 | Missing or invalid API key |
| 404 | Session not found |
| 500 | Server error |

JSON-RPC errors follow the standard error object format with code, message, and data.

## Security Considerations

When deploying HTTP mode in production:

1. **Use HTTPS**: Set up TLS/SSL encryption with a reverse proxy like Nginx
2. **Strong Authentication**: Implement robust API key validation
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Access Control**: Restrict access by IP or network
5. **Input Validation**: Validate all incoming requests

## Example: Custom Web Interface

The HTTP mode enables creating custom interfaces. Here's a simple example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>DegenDuel MCP Client</title>
</head>
<body>
  <h1>MCP Client</h1>
  
  <div>
    <h2>Screenshot Tool</h2>
    <input id="url" placeholder="URL to screenshot">
    <input id="path" placeholder="Save path">
    <button onclick="takeScreenshot()">Take Screenshot</button>
  </div>
  
  <div id="output"></div>
  
  <script>
    let sessionId = null;
    const apiKey = 'your-api-key';
    
    // Connect to the server
    const eventSource = new EventSource('http://localhost:3333/mcp', {
      headers: { 'x-api-key': apiKey }
    });
    
    eventSource.addEventListener('endpoint', (event) => {
      const endpointWithSession = decodeURI(event.data);
      sessionId = new URL(endpointWithSession).searchParams.get('sessionId');
      console.log('Connected, session ID:', sessionId);
    });
    
    eventSource.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      document.getElementById('output').innerHTML += 
        `<pre>${JSON.stringify(message, null, 2)}</pre>`;
    });
    
    // Take a screenshot
    async function takeScreenshot() {
      const url = document.getElementById('url').value;
      const path = document.getElementById('path').value;
      
      const response = await fetch(`http://localhost:3333/mcp/message?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'callTool',
          params: {
            name: 'screenshot',
            arguments: {
              url: url,
              fullPathToScreenshot: path
            }
          },
          id: '1'
        })
      });
      
      if (response.status === 202) {
        document.getElementById('output').innerHTML += 
          '<div>Request accepted, waiting for result...</div>';
      } else {
        document.getElementById('output').innerHTML += 
          `<div>Error: ${response.status}</div>`;
      }
    }
  </script>
</body>
</html>
```