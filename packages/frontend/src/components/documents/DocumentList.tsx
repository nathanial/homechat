import { css } from '@emotion/css';
import type { DocumentListItem } from '@homechat/shared';

interface DocumentListProps {
  documents: DocumentListItem[];
  activeDocumentId: string | null;
  onDocumentSelect: (documentId: string) => void;
  onNewDocument: () => void;
}

export function DocumentList({ 
  documents, 
  activeDocumentId, 
  onDocumentSelect, 
  onNewDocument 
}: DocumentListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Documents</h2>
        <button 
          className={styles.newDocButton} 
          aria-label="New document" 
          onClick={onNewDocument}
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>
      
      <div className={styles.documentList}>
        {documents.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa-regular fa-file-lines fa-3x" />
            <p>No documents yet</p>
            <p className={styles.emptyStateHint}>Create your first document to get started</p>
          </div>
        ) : (
          documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => onDocumentSelect(doc.id)}
              className={`${styles.documentItem} ${activeDocumentId === doc.id ? styles.active : ''}`}
            >
              <div className={styles.documentIcon}>
                <i className="fa-solid fa-file-lines" />
              </div>
              
              <div className={styles.documentInfo}>
                <h3 className={styles.documentTitle}>{doc.title}</h3>
                <p className={styles.documentPreview}>{doc.preview}</p>
                <div className={styles.documentMeta}>
                  <span className={styles.author}>
                    <i className="fa-solid fa-user" />
                    {doc.ownerName}
                  </span>
                  {doc.collaboratorCount > 0 && (
                    <span className={styles.collaborators}>
                      <i className="fa-solid fa-users" />
                      {doc.collaboratorCount}
                    </span>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <span className={styles.tags}>
                      {doc.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className={styles.tag}>#{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
              
              <div className={styles.documentActions}>
                <span className={styles.timestamp}>
                  {formatTimestamp(doc.updatedAt)}
                </span>
                {doc.isPublic && (
                  <span className={styles.publicBadge}>
                    <i className="fa-solid fa-globe" />
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function formatTimestamp(date: Date | string): string {
  const docDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - docDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return docDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: docDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

const styles = {
  container: css`
    width: 360px;
    height: 100%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.98));
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
  `,
  
  header: css`
    padding: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: white;
  `,
  
  title: css`
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 10px;
    
    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 24px;
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      border-radius: 2px;
    }
  `,
  
  newDocButton: css`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 123, 255, 0.35);
    }
    
    &:active {
      transform: translateY(0);
    }
  `,
  
  documentList: css`
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 3px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.25);
      }
    }
  `,
  
  emptyState: css`
    padding: 48px 32px;
    text-align: center;
    color: #9ca3af;
    
    i {
      margin-bottom: 20px;
      opacity: 0.5;
    }
    
    p {
      margin: 0 0 8px 0;
      font-size: 16px;
    }
  `,
  
  emptyStateHint: css`
    font-size: 14px;
    color: #b3b8bf;
  `,
  
  documentItem: css`
    width: 100%;
    padding: 16px;
    margin-bottom: 8px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: white;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    
    &:hover {
      background: rgba(255, 255, 255, 0.8);
      border-color: rgba(0, 123, 255, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
  `,
  
  active: css`
    background: linear-gradient(135deg, rgba(0, 123, 255, 0.05) 0%, rgba(0, 86, 179, 0.03) 100%) !important;
    border-color: rgba(0, 123, 255, 0.2) !important;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  `,
  
  documentIcon: css`
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(0, 123, 255, 0.1) 0%, rgba(0, 86, 179, 0.05) 100%);
    color: #007bff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  `,
  
  documentInfo: css`
    flex: 1;
    min-width: 0;
  `,
  
  documentTitle: css`
    margin: 0 0 6px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  
  documentPreview: css`
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  `,
  
  documentMeta: css`
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #9ca3af;
  `,
  
  author: css`
    display: flex;
    align-items: center;
    gap: 4px;
    
    i {
      font-size: 10px;
    }
  `,
  
  collaborators: css`
    display: flex;
    align-items: center;
    gap: 4px;
    
    i {
      font-size: 10px;
    }
  `,
  
  tags: css`
    display: flex;
    gap: 6px;
  `,
  
  tag: css`
    font-size: 11px;
    color: #007bff;
    background: rgba(0, 123, 255, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
  `,
  
  documentActions: css`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  `,
  
  timestamp: css`
    font-size: 12px;
    color: #9ca3af;
  `,
  
  publicBadge: css`
    color: #10b981;
    font-size: 14px;
  `
};