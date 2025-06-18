export interface Document {
  id: string;
  title: string;
  content?: any; // Y.js document content
  ownerId: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy?: string;
  isPublic: boolean;
  tags?: string[];
}

export interface DocumentListItem {
  id: string;
  title: string;
  preview: string;
  ownerId: string;
  ownerName: string;
  collaboratorCount: number;
  updatedAt: Date;
  isPublic: boolean;
  tags?: string[];
}

export interface DocumentUpdate {
  documentId: string;
  update: Uint8Array;
  userId: string;
}

export interface DocumentAwareness {
  documentId: string;
  userId: string;
  cursor?: {
    anchor: number;
    head: number;
  };
  user?: {
    name: string;
    color: string;
  };
}