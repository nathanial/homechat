import { create } from 'zustand';
import type { Document, DocumentListItem } from '@homechat/shared';
import { socketService } from '../services/SocketService';

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
      socketService.emit('document:create', { title, isPublic });
      
      // Wait for the document to be created
      await new Promise<void>((resolve) => {
        const handleDocumentJoined = ({ document }: { document: Document }) => {
          set((state) => ({
            documents: [...state.documents, {
              id: document.id,
              title: document.title,
              preview: '',
              ownerId: document.ownerId,
              ownerName: 'You', // This should come from user store
              collaboratorCount: document.collaborators.length,
              updatedAt: document.updatedAt,
              isPublic: document.isPublic,
              tags: document.tags
            }],
            activeDocument: document,
            activeDocumentId: document.id,
            isLoading: false
          }));
          
          socketService.off('document:joined', handleDocumentJoined);
          resolve();
        };
        
        socketService.on('document:joined', handleDocumentJoined);
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
      socketService.emit('document:list');
      
      // Wait for the documents list
      await new Promise<void>((resolve) => {
        const handleDocumentList = (documents: Document[]) => {
          const documentItems: DocumentListItem[] = documents.map(doc => ({
            id: doc.id,
            title: doc.title,
            preview: doc.content ? 'Document preview...' : 'Empty document',
            ownerId: doc.ownerId,
            ownerName: 'User', // This should be fetched from user data
            collaboratorCount: doc.collaborators.length,
            updatedAt: doc.updatedAt,
            isPublic: doc.isPublic,
            tags: doc.tags
          }));
          
          set({ documents: documentItems, isLoading: false });
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
      socketService.emit('document:join', { documentId });
      
      // Wait for join confirmation
      await new Promise<void>((resolve) => {
        const handleDocumentJoined = ({ document }: { documentId: string; document: Document }) => {
          if (document.id === documentId) {
            set({ 
              activeDocument: document, 
              activeDocumentId: documentId,
              isLoading: false 
            });
            socketService.off('document:joined', handleDocumentJoined);
            resolve();
          }
        };
        
        socketService.on('document:joined', handleDocumentJoined);
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