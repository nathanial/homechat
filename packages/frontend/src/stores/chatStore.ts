import { create } from 'zustand';
import type { Message } from '@homechat/shared';
import type { Room } from '../types';

interface ChatState {
  rooms: Room[];
  messages: Record<string, Message[]>; // roomId -> messages
  activeRoom: string | null;
  typingUsers: Record<string, string[]>; // roomId -> userIds
  onlineUsers: Set<string>;
  
  // Actions
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  setActiveRoom: (roomId: string | null) => void;
  
  addMessage: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  
  setTypingUser: (roomId: string, userId: string, isTyping: boolean) => void;
  setUserOnline: (userId: string, isOnline: boolean) => void;
  
  getMessagesForRoom: (roomId: string) => Message[];
  getTypingUsersForRoom: (roomId: string) => string[];
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: {},
  activeRoom: null,
  typingUsers: {},
  onlineUsers: new Set(),

  setRooms: (rooms) => set({ rooms }),
  
  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms, room]
  })),
  
  setActiveRoom: (roomId) => set({ activeRoom: roomId }),
  
  addMessage: (roomId, message) => set((state) => {
    const roomMessages = state.messages[roomId] || [];
    // Check if we already have this message (by ID)
    const existingMessage = roomMessages.find(m => m.id === message.id);
    if (existingMessage) {
      return state; // Don't add duplicate
    }
    
    // Check if this is replacing a temp message
    const tempMessage = roomMessages.find(m => 
      m.id.startsWith('temp-') && 
      m.userId === message.userId && 
      m.content === message.content &&
      Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000 // Within 5 seconds
    );
    
    if (tempMessage) {
      // Replace temp message with real message
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMessages.map(m => m.id === tempMessage.id ? message : m)
        }
      };
    }
    
    // Add new message
    return {
      messages: {
        ...state.messages,
        [roomId]: [...roomMessages, message]
      }
    };
  }),
  
  updateMessage: (roomId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: (state.messages[roomId] || []).map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }
  })),
  
  setMessages: (roomId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: messages
    }
  })),
  
  setTypingUser: (roomId, userId, isTyping) => set((state) => {
    const currentTyping = state.typingUsers[roomId] || [];
    const newTyping = isTyping
      ? [...new Set([...currentTyping, userId])]
      : currentTyping.filter(id => id !== userId);
    
    return {
      typingUsers: {
        ...state.typingUsers,
        [roomId]: newTyping
      }
    };
  }),
  
  setUserOnline: (userId, isOnline) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers);
    if (isOnline) {
      newOnlineUsers.add(userId);
    } else {
      newOnlineUsers.delete(userId);
    }
    return { onlineUsers: newOnlineUsers };
  }),
  
  getMessagesForRoom: (roomId) => {
    return get().messages[roomId] || [];
  },
  
  getTypingUsersForRoom: (roomId) => {
    return get().typingUsers[roomId] || [];
  }
}));