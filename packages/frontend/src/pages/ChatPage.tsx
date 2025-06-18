import { useEffect, useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { socketService } from '../services/socket';
import { RoomList } from '../components/chat/RoomList';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { NewChatModal } from '../components/chat/NewChatModal';
import type { Message } from '@homechat/shared';
import type { Room } from '../types';

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  const {
    rooms,
    activeRoom,
    messages,
    typingUsers,
    setRooms,
    setActiveRoom,
    addMessage,
    updateMessage,
    setMessages,
    setTypingUser,
    setUserOnline,
    getMessagesForRoom,
    getTypingUsersForRoom
  } = useChatStore();

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    // Connect to socket
    socketService.connect();

    // Set up event handlers
    const unsubscribeConnection = socketService.onConnectionChange(setIsConnected);
    
    const unsubscribeMessage = socketService.onMessage((message) => {
      // Skip adding our own messages from message:new if we have a temp message
      // They will be handled by message:sent event
      const roomMessages = getMessagesForRoom(message.roomId);
      const hasTempMessage = roomMessages.some(m => 
        m.id.startsWith('temp-') && 
        m.userId === user.id &&
        m.content === message.content
      );
      
      if (message.userId === user.id && hasTempMessage) {
        // This is our own message and we have a temp version, skip it
        return;
      }
      
      addMessage(message.roomId, message);
    });
    
    const unsubscribeTyping = socketService.onTyping((event) => {
      setTypingUser(event.roomId, event.userId, event.isTyping);
    });
    
    const unsubscribeStatus = socketService.onUserStatus((userId, status) => {
      setUserOnline(userId, status === 'online');
    });

    // Load rooms
    loadRooms();

    return () => {
      unsubscribeConnection();
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeStatus();
      socketService.disconnect();
    };
  }, [user, getMessagesForRoom]);

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (response.ok) {
        const roomsData = await response.json();
        setRooms(roomsData);
        
        // Set first room as active if none selected
        if (roomsData.length > 0 && !activeRoom) {
          setActiveRoom(roomsData[0].id);
          await loadMessages(roomsData[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(roomId, messagesData);
        socketService.joinRoom(roomId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleRoomSelect = useCallback(async (roomId: string) => {
    if (activeRoom) {
      socketService.leaveRoom(activeRoom);
    }
    
    setActiveRoom(roomId);
    await loadMessages(roomId);
  }, [activeRoom, setActiveRoom]);

  const handleSendMessage = useCallback((content: string) => {
    if (!activeRoom || !user) return;
    
    const tempId = socketService.sendMessage(activeRoom, content);
    
    // Add optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      roomId: activeRoom,
      userId: user.id,
      content,
      type: 'text',
      status: 'sending',
      createdAt: new Date()
    };
    
    addMessage(activeRoom, optimisticMessage);
  }, [activeRoom, user, addMessage]);

  const handleTypingStart = useCallback(() => {
    if (activeRoom) {
      socketService.startTyping(activeRoom);
    }
  }, [activeRoom]);

  const handleTypingStop = useCallback(() => {
    if (activeRoom) {
      socketService.stopTyping(activeRoom);
    }
  }, [activeRoom]);

  const handleCreateRoom = async (name: string, type: 'direct' | 'group', memberIds: string[]) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, type, memberIds })
      });
      
      if (response.ok) {
        const newRoom = await response.json();
        setShowNewChatModal(false);
        // Reload rooms and select the new one
        await loadRooms();
        setActiveRoom(newRoom.id);
        await loadMessages(newRoom.id);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create room');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    }
  };

  const activeRoomData = rooms.find(r => r.id === activeRoom);
  const activeMessages = activeRoom ? getMessagesForRoom(activeRoom) : [];
  const activeTypingUsers = activeRoom ? getTypingUsersForRoom(activeRoom) : [];

  if (isLoading) {
    return (
      <div className={loadingStyles}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <RoomList
        rooms={rooms}
        activeRoomId={activeRoom}
        onRoomSelect={handleRoomSelect}
        onNewChat={() => setShowNewChatModal(true)}
      />
      
      <div className={chatAreaStyles}>
        {activeRoom ? (
          <>
            <header className={chatHeaderStyles}>
              <h2>{activeRoomData?.name}</h2>
              <div className={connectionStatus}>
                {isConnected ? (
                  <span className={connectedDot}>● Connected</span>
                ) : (
                  <span className={disconnectedDot}>● Disconnected</span>
                )}
              </div>
            </header>
            
            <MessageList
              messages={activeMessages}
              currentUserId={user!.id}
            />
            
            <TypingIndicator users={activeTypingUsers} />
            
            <MessageInput
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              disabled={!isConnected}
            />
          </>
        ) : (
          <div className={emptyStateStyles}>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
      
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  );
}


const containerStyles = css`
  height: 100%;
  display: flex;
  background: #f5f5f5;
`;

const chatAreaStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const chatHeaderStyles = css`
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
`;

const connectionStatus = css`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

const connectedDot = css`
  color: #4caf50;
`;

const disconnectedDot = css`
  color: #f44336;
`;

const emptyStateStyles = css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 16px;
`;

const loadingStyles = css`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
`;