import { z } from 'zod';

export const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file']).default('text'),
  replyTo: z.string().uuid().optional()
});

export const updateMessageSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000)
});

export const deleteMessageSchema = z.object({
  messageId: z.string().uuid()
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;