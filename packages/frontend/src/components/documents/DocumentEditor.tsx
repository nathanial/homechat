import { useEffect, useRef, useState, useCallback } from 'react';
import { css } from '@emotion/css';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { WebsocketProvider } from 'y-websocket';
import type { Document, User } from '@homechat/shared';
import { useDocumentStore } from '../../stores/documentStore';
import { socketService } from '../../services/socket';
import 'quill/dist/quill.snow.css';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const quillRef = useRef<Quill | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { updateDocument } = useDocumentStore();
  
  // Save document content
  const saveContent = useCallback(async () => {
    if (!quillRef.current) return;
    
    const content = JSON.stringify(quillRef.current.getContents());
    setSaveStatus('saving');
    
    try {
      // Update via REST API
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ content })
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        // Also update local state
        updateDocument(document.id, { content, updatedAt: new Date() });
      } else {
        setSaveStatus('error');
        console.error('Failed to save document:', response.statusText);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save document:', error);
    }
  }, [document.id, updateDocument]);

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
        } as any
      },
      placeholder: 'Start writing...',
    });

    quillRef.current = quill;

    // Initialize Y.js
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');
    
    // Set initial content if document has content
    if (document.content) {
      try {
        const delta = JSON.parse(document.content);
        quill.setContents(delta);
      } catch (e) {
        // If content is plain text, set it as text
        quill.setText(document.content);
      }
    }

    // Create WebSocket provider with authentication
    const token = (window as any).localStorage.getItem('accessToken');
    const wsUrlWithAuth = `${wsUrl}?token=${encodeURIComponent(token || '')}&userId=${currentUser.id}`;
    
    const provider = new WebsocketProvider(
      wsUrlWithAuth,
      `document-${document.id}`,
      ydoc
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
          const cursors = quill.getModule('cursors') as any;
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
    
    // Save content on text change (debounced)
    quill.on('text-change', () => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        saveContent();
      }, 2000);
    });
    
    // Save on blur
    quill.on('blur', () => {
      saveContent();
    });

    // Cleanup
    return () => {
      // Clear save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save before cleanup
      saveContent();
      
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [document.id, currentUser, wsUrl, saveContent]);

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
              <span className={styles.editorInfo}>
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
          
          <div className={styles.saveStatus}>
            {saveStatus === 'saving' && (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <i className="fa-solid fa-check" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <i className="fa-solid fa-triangle-exclamation" />
                <span>Save failed</span>
              </>
            )}
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
  
  editorInfo: css`
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
  
  saveStatus: css`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #6b7280;
    
    i {
      font-size: 12px;
    }
    
    .fa-check {
      color: #10b981;
    }
    
    .fa-triangle-exclamation {
      color: #ef4444;
    }
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
    
    /* Cursor styles */
    .ql-cursor {
      position: absolute;
      width: 2px;
      height: 1.2em;
      background-color: currentColor;
      pointer-events: none;
      
      &-flag {
        position: absolute;
        top: -12px;
        left: -2px;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        user-select: none;
        pointer-events: none;
        color: white;
      }
      
      &-selection {
        position: absolute;
        background-color: currentColor;
        opacity: 0.3;
        pointer-events: none;
      }
    }
    
    .ql-container {
      border: none;
    }
  `
};