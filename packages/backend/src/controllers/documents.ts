import { v4 as uuidv4 } from 'uuid';
import type { Document, DocumentListItem } from '@homechat/shared';
import { dbRun, dbGet, dbAll } from '../database/init.js';

interface DocumentRow {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  is_public: number;
  created_at: string;
  updated_at: string;
  last_edited_by: string | null;
}

interface DocumentWithOwner extends DocumentRow {
  owner_username: string;
  owner_display_name: string;
  collaborator_count?: number;
}

export async function createDocument(
  userId: string,
  title: string,
  isPublic: boolean = false
): Promise<Document> {
  const documentId = uuidv4();
  const now = new Date().toISOString();

  dbRun(
    `INSERT INTO documents (id, title, owner_id, is_public, created_at, updated_at, last_edited_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [documentId, title, userId, isPublic ? 1 : 0, now, now, userId]
  );

  // Add owner as collaborator with write permission
  dbRun(
    `INSERT INTO document_collaborators (document_id, user_id, permission)
     VALUES (?, ?, 'write')`,
    [documentId, userId]
  );

  return {
    id: documentId,
    title,
    content: '',
    ownerId: userId,
    collaborators: [],
    isPublic,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    lastEditedBy: userId,
    tags: []
  };
}

export async function getDocument(documentId: string, userId: string): Promise<Document | null> {
  const doc = dbGet<DocumentWithOwner>(
    `SELECT d.*, u.username as owner_username, u.display_name as owner_display_name
     FROM documents d
     JOIN users u ON d.owner_id = u.id
     WHERE d.id = ?`,
    [documentId]
  );

  if (!doc) {
    return null;
  }

  // Check if user has access
  const hasAccess = await checkDocumentAccess(documentId, userId);
  if (!hasAccess) {
    return null;
  }

  // Get collaborators
  const collaborators = dbAll<{ user_id: string; permission: string }>(
    `SELECT user_id, permission FROM document_collaborators WHERE document_id = ?`,
    [documentId]
  );

  // Get tags
  const tags = dbAll<{ tag: string }>(
    `SELECT tag FROM document_tags WHERE document_id = ?`,
    [documentId]
  ).map(row => row.tag);

  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    ownerId: doc.owner_id,
    collaborators: collaborators.map(c => c.user_id),
    isPublic: doc.is_public === 1,
    createdAt: new Date(doc.created_at),
    updatedAt: new Date(doc.updated_at),
    lastEditedBy: doc.last_edited_by || doc.owner_id,
    tags
  };
}

export async function getUserDocuments(userId: string): Promise<DocumentListItem[]> {
  const documents = dbAll<DocumentWithOwner>(
    `SELECT DISTINCT d.*, u.username as owner_username, u.display_name as owner_display_name,
            (SELECT COUNT(*) FROM document_collaborators dc WHERE dc.document_id = d.id) as collaborator_count
     FROM documents d
     JOIN users u ON d.owner_id = u.id
     LEFT JOIN document_collaborators dc ON d.id = dc.document_id
     WHERE d.owner_id = ? OR dc.user_id = ? OR d.is_public = 1
     ORDER BY d.updated_at DESC`,
    [userId, userId]
  );

  return documents.map(doc => {
    const preview = doc.content ? doc.content.substring(0, 100) + '...' : 'Empty document';
    
    return {
      id: doc.id,
      title: doc.title,
      preview,
      ownerId: doc.owner_id,
      ownerName: doc.owner_display_name || doc.owner_username,
      collaboratorCount: parseInt(doc.collaborator_count as any) - 1, // Exclude owner
      updatedAt: new Date(doc.updated_at),
      isPublic: doc.is_public === 1,
      tags: [] // Tags loaded separately if needed
    };
  });
}

export async function updateDocument(
  documentId: string,
  userId: string,
  updates: Partial<Pick<Document, 'title' | 'content' | 'tags'>>
): Promise<boolean> {
  // Check write permission
  const hasWriteAccess = await checkDocumentAccess(documentId, userId, 'write');
  if (!hasWriteAccess) {
    return false;
  }

  const updateFields: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    updateFields.push('title = ?');
    params.push(updates.title);
  }

  if (updates.content !== undefined) {
    updateFields.push('content = ?');
    params.push(updates.content);
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = ?', 'last_edited_by = ?');
    params.push(new Date().toISOString(), userId, documentId);

    dbRun(
      `UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
  }

  // Update tags if provided
  if (updates.tags) {
    // Remove old tags
    dbRun('DELETE FROM document_tags WHERE document_id = ?', [documentId]);
    
    // Add new tags
    for (const tag of updates.tags) {
      dbRun(
        'INSERT INTO document_tags (document_id, tag) VALUES (?, ?)',
        [documentId, tag]
      );
    }
  }

  return true;
}

export async function deleteDocument(documentId: string, userId: string): Promise<boolean> {
  // Only owner can delete
  const doc = dbGet<{ owner_id: string }>(
    'SELECT owner_id FROM documents WHERE id = ?',
    [documentId]
  );

  if (!doc || doc.owner_id !== userId) {
    return false;
  }

  dbRun('DELETE FROM documents WHERE id = ?', [documentId]);
  return true;
}

export async function addCollaborator(
  documentId: string,
  ownerId: string,
  collaboratorId: string,
  permission: 'read' | 'write' = 'write'
): Promise<boolean> {
  // Check if user is owner
  const doc = dbGet<{ owner_id: string }>(
    'SELECT owner_id FROM documents WHERE id = ?',
    [documentId]
  );

  if (!doc || doc.owner_id !== ownerId) {
    return false;
  }

  // Check if collaborator already exists
  const existing = dbGet(
    'SELECT 1 FROM document_collaborators WHERE document_id = ? AND user_id = ?',
    [documentId, collaboratorId]
  );

  if (existing) {
    // Update permission
    dbRun(
      'UPDATE document_collaborators SET permission = ? WHERE document_id = ? AND user_id = ?',
      [permission, documentId, collaboratorId]
    );
  } else {
    // Add new collaborator
    dbRun(
      'INSERT INTO document_collaborators (document_id, user_id, permission) VALUES (?, ?, ?)',
      [documentId, collaboratorId, permission]
    );
  }

  return true;
}

export async function removeCollaborator(
  documentId: string,
  ownerId: string,
  collaboratorId: string
): Promise<boolean> {
  // Check if user is owner
  const doc = dbGet<{ owner_id: string }>(
    'SELECT owner_id FROM documents WHERE id = ?',
    [documentId]
  );

  if (!doc || doc.owner_id !== ownerId) {
    return false;
  }

  // Can't remove owner
  if (collaboratorId === ownerId) {
    return false;
  }

  dbRun(
    'DELETE FROM document_collaborators WHERE document_id = ? AND user_id = ?',
    [documentId, collaboratorId]
  );

  return true;
}

export async function checkDocumentAccess(
  documentId: string,
  userId: string,
  requiredPermission?: 'read' | 'write'
): Promise<boolean> {
  const doc = dbGet<{ owner_id: string; is_public: number }>(
    'SELECT owner_id, is_public FROM documents WHERE id = ?',
    [documentId]
  );

  if (!doc) {
    return false;
  }

  // Owner has full access
  if (doc.owner_id === userId) {
    return true;
  }

  // Public documents have read access
  if (doc.is_public === 1 && (!requiredPermission || requiredPermission === 'read')) {
    return true;
  }

  // Check collaborator permissions
  const collaborator = dbGet<{ permission: string }>(
    'SELECT permission FROM document_collaborators WHERE document_id = ? AND user_id = ?',
    [documentId, userId]
  );

  if (!collaborator) {
    return false;
  }

  // If no specific permission required, any access is fine
  if (!requiredPermission) {
    return true;
  }

  // Write permission includes read
  if (collaborator.permission === 'write') {
    return true;
  }

  // Read permission only allows read
  return collaborator.permission === 'read' && requiredPermission === 'read';
}