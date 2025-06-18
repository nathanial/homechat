import { WebSocketServer } from 'ws';
import http from 'http';
import jwt from 'jsonwebtoken';
import { checkDocumentAccess } from '../controllers/documents.js';

// We'll implement a basic Y.js WebSocket handler since y-websocket/bin/utils might not be available
// In production, you should use the full y-websocket server implementation

export function setupYjsServer() {
  // Create a separate WebSocket server for Y.js on port 1234
  const yjsPort = process.env.YJS_PORT ? parseInt(process.env.YJS_PORT) : 1234;
  const yjsServer = http.createServer();
  const wss = new WebSocketServer({ server: yjsServer });

  wss.on('connection', async (ws, req) => {
    try {
      // Extract document ID from URL
      const match = req.url?.match(/\/(document-[^?]+)/);
      if (!match) {
        ws.close(1008, 'Invalid document ID');
        return;
      }
      
      const documentId = match[1].replace('document-', '');
      
      // Extract auth token from query params
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }
      
      // Verify JWT token
      let userId: string;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        userId = decoded.userId;
      } catch (error) {
        ws.close(1008, 'Invalid token');
        return;
      }
      
      // Check document access
      const hasAccess = await checkDocumentAccess(documentId, userId, 'write');
      if (!hasAccess) {
        ws.close(1008, 'Access denied');
        return;
      }
      
      // For now, just relay messages between clients
      // In production, use the full y-websocket implementation
      const documentRoom = `document-${documentId}`;
      (ws as any).documentRoom = documentRoom;
      (ws as any).userId = userId;
      
      // Join the document room
      if (!documentRooms.has(documentRoom)) {
        documentRooms.set(documentRoom, new Set());
      }
      documentRooms.get(documentRoom)!.add(ws);
      
      ws.on('message', (message) => {
        // Broadcast to all other clients in the same document
        const room = documentRooms.get(documentRoom);
        if (room) {
          room.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              client.send(message);
            }
          });
        }
      });
      
      ws.on('close', () => {
        // Remove from document room
        const room = documentRooms.get(documentRoom);
        if (room) {
          room.delete(ws);
          if (room.size === 0) {
            documentRooms.delete(documentRoom);
          }
        }
      });
      
      console.log(`Y.js connection established for document ${documentId} by user ${userId}`);
      
    } catch (error) {
      console.error('Error in Y.js WebSocket connection:', error);
      ws.close(1011, 'Server error');
    }
  });

  yjsServer.listen(yjsPort, () => {
    console.log(`Y.js WebSocket server running on port ${yjsPort}`);
  });

  return wss;
}

// Track document rooms
const documentRooms = new Map<string, Set<any>>();