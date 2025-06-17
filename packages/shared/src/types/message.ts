export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: Date;
  updatedAt?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export type MessageType = Message['type'];
export type MessageStatus = Message['status'];