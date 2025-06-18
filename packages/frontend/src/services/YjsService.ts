import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import type { Document } from '@homechat/shared';

export class YjsService {
  private providers: Map<string, WebsocketProvider> = new Map();
  private docs: Map<string, Y.Doc> = new Map();
  private wsUrl: string;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  async connectToDocument(
    document: Document,
    userId: string,
    onSync?: (doc: Y.Doc) => void,
    onAwarenessUpdate?: (awareness: any) => void
  ): Promise<{ doc: Y.Doc; provider: WebsocketProvider }> {
    const docId = document.id;

    // Check if already connected
    if (this.providers.has(docId)) {
      const provider = this.providers.get(docId)!;
      const doc = this.docs.get(docId)!;
      return { doc, provider };
    }

    // Create new Y.Doc
    const doc = new Y.Doc();
    
    // Create WebSocket provider
    const provider = new WebsocketProvider(
      this.wsUrl,
      `doc-${docId}`,
      doc,
      {
        params: {
          documentId: docId,
          userId,
        },
      }
    );

    // Handle sync
    if (onSync) {
      provider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          onSync(doc);
        }
      });
    }

    // Handle awareness updates
    if (onAwarenessUpdate) {
      provider.awareness.on('update', () => {
        onAwarenessUpdate(provider.awareness);
      });
    }

    // Store references
    this.providers.set(docId, provider);
    this.docs.set(docId, doc);

    return { doc, provider };
  }

  disconnectFromDocument(documentId: string): void {
    const provider = this.providers.get(documentId);
    const doc = this.docs.get(documentId);

    if (provider) {
      provider.destroy();
      this.providers.delete(documentId);
    }

    if (doc) {
      doc.destroy();
      this.docs.delete(documentId);
    }
  }

  disconnectAll(): void {
    this.providers.forEach((provider) => provider.destroy());
    this.docs.forEach((doc) => doc.destroy());
    this.providers.clear();
    this.docs.clear();
  }

  getProvider(documentId: string): WebsocketProvider | undefined {
    return this.providers.get(documentId);
  }

  getDoc(documentId: string): Y.Doc | undefined {
    return this.docs.get(documentId);
  }

  updateAwareness(documentId: string, field: string, value: any): void {
    const provider = this.providers.get(documentId);
    if (provider) {
      provider.awareness.setLocalStateField(field, value);
    }
  }

  getAwarenessStates(documentId: string): Map<number, any> | undefined {
    const provider = this.providers.get(documentId);
    if (provider) {
      return provider.awareness.getStates();
    }
    return undefined;
  }
}