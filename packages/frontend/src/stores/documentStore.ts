import { create } from 'zustand';
import type { Document, DocumentListItem } from '@homechat/shared';
import { socketService } from '../services/socket';

interface DocumentStore {
  documents: DocumentListItem[];
  activeDocument: Document | null;
  activeDocumentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (documents: DocumentListItem[]) => void;
  setActiveDocument: (document: Document | null) => void;
  selectDocument: (documentId: string) => void;
  createDocument: (title: string, isPublic: boolean) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
  loadDocuments: () => Promise<void>;
  joinDocument: (documentId: string) => Promise<void>;
  leaveDocument: (documentId: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocument: null,
  activeDocumentId: null,
  isLoading: false,
  error: null,

  setDocuments: (documents) => set({ documents }),

  setActiveDocument: (document) => set({ 
    activeDocument: document, 
    activeDocumentId: document?.id || null 
  }),

  selectDocument: async (documentId) => {
    const state = get();
    
    // Leave current document if different
    if (state.activeDocumentId && state.activeDocumentId !== documentId) {
      state.leaveDocument(state.activeDocumentId);
    }

    // Join new document
    await state.joinDocument(documentId);
  },

  createDocument: async (title, isPublic) => {
    set({ isLoading: true, error: null });
    
    try {
      // Wait for the document to be created
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socketService.off('document:created', handleCreated);
          reject(new Error('Document creation timed out'));
        }, 5000);
        
        const handleCreated = (document: Document): void => {
          clearTimeout(timeout);
          
          const newDocListItem: DocumentListItem = {
            id: document.id,
            title: document.title,
            preview: '',
            ownerId: document.ownerId,
            ownerName: 'You',
            collaboratorCount: document.collaborators.length,
            updatedAt: document.updatedAt,
            isPublic: document.isPublic,
            tags: document.tags
          };
          
          set((state) => ({
            documents: [...state.documents, newDocListItem],
            activeDocument: document,
            activeDocumentId: document.id,
            isLoading: false
          }));
          
          socketService.off('document:created', handleCreated);
          resolve();
        };
        
        socketService.on('document:created', handleCreated);
        socketService.emit('document:create', { title, isPublic });
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create document',
        isLoading: false 
      });
    }
  },

  deleteDocument: async (documentId) => {
    set({ isLoading: true, error: null });
    
    try {
      socketService.emit('document:delete', { documentId });
      
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== documentId),
        activeDocument: state.activeDocumentId === documentId ? null : state.activeDocument,
        activeDocumentId: state.activeDocumentId === documentId ? null : state.activeDocumentId,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete document',
        isLoading: false 
      });
    }
  },

  updateDocument: (documentId, updates) => {
    set((state) => ({
      documents: state.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, ...updates, updatedAt: new Date() }
          : doc
      ),
      activeDocument: state.activeDocument?.id === documentId
        ? { ...state.activeDocument, ...updates, updatedAt: new Date() }
        : state.activeDocument
    }));
  },

  loadDocuments: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Wait for socket connection if not connected
      if (!socketService.isConnected()) {
        console.log('Waiting for socket connection...');
        await new Promise<void>((resolve) => {
          const checkConnection = setInterval(() => {
            if (socketService.isConnected()) {
              clearInterval(checkConnection);
              resolve();
            }
          }, 100);
          
          // Timeout after 2 seconds
          setTimeout(() => {
            clearInterval(checkConnection);
            resolve();
          }, 2000);
        });
      }
      
      console.log('Loading documents, socket connected:', socketService.isConnected());
      socketService.emit('document:list');
      
      // Wait for the documents list with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('Document list timeout - no response from backend');
          socketService.off('document:list', handleDocumentList);
          // Set empty documents and resolve if backend doesn't respond
          set({ documents: [], isLoading: false });
          resolve();
        }, 3000); // 3 second timeout
        
        const handleDocumentList = (documents: DocumentListItem[]): void => {
          clearTimeout(timeout);
          set({ documents, isLoading: false });
          socketService.off('document:list', handleDocumentList);
          resolve();
        };
        
        socketService.on('document:list', handleDocumentList);
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load documents',
        isLoading: false 
      });
    }
  },

  joinDocument: async (documentId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Wait for the document data
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socketService.off('document:joined', handleJoined);
          reject(new Error('Failed to join document'));
        }, 5000);
        
        const handleJoined = (data: { documentId: string; document: Document }): void => {
          clearTimeout(timeout);
          set({ 
            activeDocument: data.document, 
            activeDocumentId: documentId,
            isLoading: false 
          });
          socketService.off('document:joined', handleJoined);
          resolve();
        };
        
        socketService.on('document:joined', handleJoined);
        socketService.emit('document:join', { documentId });
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to join document',
        isLoading: false 
      });
    }
  },

  leaveDocument: (documentId) => {
    socketService.emit('document:leave', { documentId });
  },

  setError: (error) => set({ error }),

  reset: () => set({
    documents: [],
    activeDocument: null,
    activeDocumentId: null,
    isLoading: false,
    error: null
  })
}));

// Subscribe to socket events
socketService.on('document:update', (update) => {
  const state = useDocumentStore.getState();
  if (state.activeDocumentId === update.documentId) {
    // Document content will be synced via Y.js
    state.updateDocument(update.documentId, { 
      updatedAt: new Date(),
      lastEditedBy: update.userId 
    });
  }
});

socketService.on('error', ({ message }) => {
  useDocumentStore.getState().setError(message);
});