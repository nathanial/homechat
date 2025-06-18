import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as documentsController from '../controllers/documents.js';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

const router: Router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all documents for the current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const documents = await documentsController.getUserDocuments(req.user!.id);
    return res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a specific document
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await documentsController.getDocument(req.params.id, req.user!.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }
    
    return res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create a new document
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, isPublic } = req.body;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const document = await documentsController.createDocument(
      req.user!.id,
      title,
      isPublic || false
    );
    
    return res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update a document
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    
    const success = await documentsController.updateDocument(
      req.params.id,
      req.user!.id,
      updates
    );
    
    if (!success) {
      return res.status(403).json({ error: 'Access denied or document not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const success = await documentsController.deleteDocument(
      req.params.id,
      req.user!.id
    );
    
    if (!success) {
      return res.status(403).json({ error: 'Access denied or document not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Add a collaborator to a document
router.post('/:id/collaborators', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, permission } = req.body;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const success = await documentsController.addCollaborator(
      req.params.id,
      req.user!.id,
      userId,
      permission || 'write'
    );
    
    if (!success) {
      return res.status(403).json({ error: 'Access denied or document not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// Remove a collaborator from a document
router.delete('/:id/collaborators/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const success = await documentsController.removeCollaborator(
      req.params.id,
      req.user!.id,
      req.params.userId
    );
    
    if (!success) {
      return res.status(403).json({ error: 'Access denied or document not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

export default router;