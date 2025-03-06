// src/httpServer.ts
import express from 'express';
import cors from 'cors';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { PORT } from './config/config.js';

export function startHttpServer(mcpServer: Server, port: number = PORT) {
  const app = express();
  const sessions = new Map<string, SSEServerTransport>();
  
  // Configure middleware
  app.use(cors());
  app.use(express.json());
  
  // Simple authentication middleware (basic example - enhance for production)
  const apiKeyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    
    // Add proper API key validation logic here
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }
    
    // In production, validate against stored keys
    next();
  };
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Handle SSE connections (GET)
  app.get('/mcp', apiKeyMiddleware, async (req, res) => {
    // Create SSE transport
    const transport = new SSEServerTransport('/mcp/message', res);
    
    // Store the transport by session ID for message routing
    sessions.set(transport.sessionId, transport);
    
    // Set up cleanup when connection closes
    res.on('close', () => {
      sessions.delete(transport.sessionId);
    });
    
    // Start the SSE connection
    await transport.start();
    
    // Return the transport so it can be connected to the MCP server
    return transport;
  });
  
  // Handle JSON-RPC messages (POST)
  app.post('/mcp/message', apiKeyMiddleware, async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).end('Missing sessionId');
    }
    
    const transport = sessions.get(sessionId);
    if (!transport) {
      return res.status(404).end('Session not found');
    }
    
    await transport.handlePostMessage(req, res);
  });
  
  // Start HTTP server
  app.listen(port, () => {
    console.log(`MCP Server running at http://localhost:${port}/mcp`);
  });
  
  // For this version, we'll create a transport and return it
  // This isn't a perfect implementation but will allow the HTTP mode to be toggled
  const dummyRes = {
    writeHead: () => dummyRes,
    write: () => true,
    end: () => true,
    on: () => true,
  } as any;
  
  const transport = new SSEServerTransport('/mcp/message', dummyRes);
  
  return transport;
}