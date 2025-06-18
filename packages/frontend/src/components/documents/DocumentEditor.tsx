import { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { WebsocketProvider } from 'y-websocket';
import type { Document, User } from '@homechat/shared';
import 'quill/dist/quill.snow.css';
import 'quill-cursors/dist/quill-cursors.css';

interface DocumentEditorProps {
  document: Document;
  currentUser: User;
  wsUrl: string;
}

Quill.register('modules/cursors', QuillCursors);

export function DocumentEditor({ document, currentUser, wsUrl }: DocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<Map<string, any>>(new Map());
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Quill editor
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['clean']
        ],
        cursors: {
          transformOnTextChange: true,
        }
      },
      placeholder: 'Start writing...',
    });

    quillRef.current = quill;

    // Initialize Y.js
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');

    // Create WebSocket provider
    const provider = new WebsocketProvider(
      wsUrl,
      `document-${document.id}`,
      ydoc,
      {
        params: {
          userId: currentUser.id,
          documentId: document.id,
        }
      }
    );

    providerRef.current = provider;

    // Set user color for cursors
    const userColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#48DBFB'
    ];
    const userColor = userColors[Math.floor(Math.random() * userColors.length)];

    // Bind Y.js to Quill
    const binding = new QuillBinding(ytext, quill, provider.awareness);

    // Set awareness state
    provider.awareness.setLocalStateField('user', {
      name: currentUser.username,
      color: userColor,
    });

    // Handle connection status
    provider.on('status', (event: any) => {
      setIsConnected(event.status === 'connected');
    });

    // Handle awareness updates
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();
      const collabs = new Map();
      
      states.forEach((state, clientId) => {
        if (clientId !== provider.awareness.clientID && state.user) {
          collabs.set(clientId, state.user);
          
          // Update cursor for this user
          const cursors = quill.getModule('cursors');
          if (state.cursor) {
            cursors.createCursor(
              clientId.toString(),
              state.user.name,
              state.user.color
            );
            cursors.moveCursor(
              clientId.toString(),
              state.cursor
            );
          } else {
            cursors.removeCursor(clientId.toString());
          }
        }
      });
      
      setCollaborators(collabs);
    });

    // Track cursor position
    quill.on('selection-change', (range) => {
      if (range) {
        provider.awareness.setLocalStateField('cursor', range);
      } else {
        provider.awareness.setLocalStateField('cursor', null);
      }
    });

    // Cleanup
    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [document.id, currentUser, wsUrl]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.documentInfo}>
          <h1 className={styles.title}>{document.title}</h1>
          <div className={styles.metadata}>
            <span className={styles.lastEdited}>
              Last edited {formatTimestamp(document.updatedAt)}
            </span>
            {document.lastEditedBy && (
              <span className={styles.editor}>
                by {document.lastEditedBy}
              </span>
            )}
          </div>
        </div>
        
        <div className={styles.status}>
          <div className={styles.connectionStatus}>
            <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
          
          {collaborators.size > 0 && (
            <div className={styles.collaboratorsList}>
              <i className="fa-solid fa-users" />
              <span>{collaborators.size} collaborator{collaborators.size > 1 ? 's' : ''}</span>
              <div className={styles.collaboratorAvatars}>
                {Array.from(collaborators.values()).slice(0, 3).map((user, i) => (
                  <div
                    key={i}
                    className={styles.avatar}
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.size > 3 && (
                  <div className={styles.moreCollaborators}>
                    +{collaborators.size - 3}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.editorWrapper}>
        <div ref={editorRef} className={styles.editor} />
      </div>
    </div>
  );
}

function formatTimestamp(date: Date | string): string {
  const docDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - docDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  return docDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const styles = {
  container: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #fafbfc;
  `,
  
  header: css`
    padding: 20px 24px;
    background: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  
  documentInfo: css`
    flex: 1;
  `,
  
  title: css`
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
  `,
  
  metadata: css`
    display: flex;
    gap: 8px;
    font-size: 14px;
    color: #6b7280;
  `,
  
  lastEdited: css``,
  
  editor: css`
    font-weight: 500;
    color: #4b5563;
  `,
  
  status: css`
    display: flex;
    align-items: center;
    gap: 24px;
  `,
  
  connectionStatus: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #6b7280;
  `,
  
  statusDot: css`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background-color 0.3s;
  `,
  
  connected: css`
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  `,
  
  disconnected: css`
    background-color: #f59e0b;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  
  collaboratorsList: css`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #6b7280;
  `,
  
  collaboratorAvatars: css`
    display: flex;
    margin-left: 4px;
  `,
  
  avatar: css`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
    margin-left: -8px;
    border: 2px solid white;
    
    &:first-child {
      margin-left: 0;
    }
  `,
  
  moreCollaborators: css`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    margin-left: -8px;
    border: 2px solid white;
  `,
  
  editorWrapper: css`
    flex: 1;
    overflow: hidden;
    padding: 0;
    background: white;
    margin: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  `,
  
  editor: css`
    height: 100%;
    
    .ql-container {
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .ql-editor {
      padding: 40px 60px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .ql-toolbar {
      border: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      background: #fafbfc;
      padding: 12px 16px;
    }
    
    .ql-container {
      border: none;
    }
  `
};