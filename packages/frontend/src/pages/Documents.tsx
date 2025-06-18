import { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { DocumentList, DocumentEditor, NewDocumentModal } from '../components/documents';
import { useDocumentStore } from '../stores/documentStore';
import { useAuthStore } from '../stores/authStore';
import { YjsService } from '../services/YjsService';

// Initialize Y.js service with WebSocket URL
const yjsService = new YjsService(
  import.meta.env.VITE_YJS_WS_URL || 'ws://localhost:1234'
);

export function Documents() {
  const { user } = useAuthStore();
  const { 
    documents, 
    activeDocument, 
    activeDocumentId,
    isLoading,
    error,
    loadDocuments,
    selectDocument,
    createDocument
  } = useDocumentStore();
  
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);

  useEffect(() => {
    // Load documents on mount
    loadDocuments();

    // Cleanup on unmount
    return () => {
      yjsService.disconnectAll();
    };
  }, []);

  const handleNewDocument = () => {
    setIsNewDocModalOpen(true);
  };

  const handleCreateDocument = async (title: string, isPublic: boolean) => {
    await createDocument(title, isPublic);
    setIsNewDocModalOpen(false);
  };

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <p>Please log in to access documents</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DocumentList
        documents={documents}
        activeDocumentId={activeDocumentId}
        onDocumentSelect={selectDocument}
        onNewDocument={handleNewDocument}
      />

      {activeDocument ? (
        <DocumentEditor
          document={activeDocument}
          currentUser={user}
          wsUrl={import.meta.env.VITE_YJS_WS_URL || 'ws://localhost:1234'}
        />
      ) : (
        <div className={styles.emptyEditor}>
          <div className={styles.emptyContent}>
            <i className="fa-regular fa-file-lines fa-4x" />
            <h2>No Document Selected</h2>
            <p>Select a document from the list or create a new one to get started</p>
            <button className={styles.createButton} onClick={handleNewDocument}>
              <i className="fa-solid fa-plus" />
              Create New Document
            </button>
          </div>
        </div>
      )}

      <NewDocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onCreate={handleCreateDocument}
      />

      {error && (
        <div className={styles.errorToast}>
          <i className="fa-solid fa-circle-exclamation" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className={styles.loadingOverlay}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: css`
    display: flex;
    height: 100%;
    background: #f5f6fa;
    position: relative;
  `,

  errorContainer: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 18px;
    color: #6b7280;
  `,

  emptyEditor: css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  `,

  emptyContent: css`
    text-align: center;
    max-width: 400px;
    
    i {
      color: #9ca3af;
      margin-bottom: 24px;
      opacity: 0.5;
    }
    
    h2 {
      margin: 0 0 12px 0;
      font-size: 28px;
      font-weight: 600;
      color: #374151;
    }
    
    p {
      margin: 0 0 32px 0;
      font-size: 16px;
      color: #6b7280;
      line-height: 1.6;
    }
  `,

  createButton: css`
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.35);
    }
    
    &:active {
      transform: translateY(0);
    }
  `,

  errorToast: css`
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #ef4444;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    animation: slideUp 0.3s ease;
    z-index: 1000;
    
    @keyframes slideUp {
      from {
        transform: translate(-50%, 100%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
  `,

  loadingOverlay: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    color: #007bff;
  `
};