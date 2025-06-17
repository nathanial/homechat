import { css } from '@emotion/css';
import type { Room } from '../../types';

interface RoomListProps {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onNewChat: () => void;
}

export function RoomList({ rooms, activeRoomId, onRoomSelect, onNewChat }: RoomListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chats</h2>
        <button className={styles.newChatButton} aria-label="New chat" onClick={onNewChat}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
      
      <div className={styles.roomList}>
        {rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No conversations yet</p>
            <p className={styles.emptyStateHint}>Start a new chat to get started</p>
          </div>
        ) : (
          rooms.map(room => (
            <button
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className={`${styles.roomItem} ${activeRoomId === room.id ? styles.active : ''}`}
            >
              <div className={styles.roomAvatar}>
                {room.name.substring(0, 2).toUpperCase()}
              </div>
              
              <div className={styles.roomInfo}>
                <h3 className={styles.roomName}>{room.name}</h3>
                {room.lastMessage && (
                  <p className={styles.lastMessage}>
                    {room.lastMessage.content}
                  </p>
                )}
              </div>
              
              <div className={styles.roomMeta}>
                {room.lastMessage && (
                  <span className={styles.timestamp}>
                    {formatTimestamp(room.lastMessage.createdAt)}
                  </span>
                )}
                {room.unreadCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
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
  const messageDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

const styles = {
  container: css`
    width: 320px;
    height: 100%;
    background: white;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
  `,
  
  header: css`
    padding: 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  
  title: css`
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #333;
  `,
  
  newChatButton: css`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #0056b3;
      transform: scale(1.05);
    }
  `,
  
  roomList: css`
    flex: 1;
    overflow-y: auto;
  `,
  
  emptyState: css`
    padding: 32px;
    text-align: center;
    color: #666;
    
    p {
      margin: 0 0 8px 0;
    }
  `,
  
  emptyStateHint: css`
    font-size: 14px;
    color: #999;
  `,
  
  roomItem: css`
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: white;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    text-align: left;
    
    &:hover {
      background: #f5f5f5;
    }
  `,
  
  active: css`
    background: #e3f2fd !important;
  `,
  
  roomAvatar: css`
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
  `,
  
  roomInfo: css`
    flex: 1;
    min-width: 0;
  `,
  
  roomName: css`
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  
  lastMessage: css`
    margin: 0;
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  
  roomMeta: css`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;
  `,
  
  timestamp: css`
    font-size: 12px;
    color: #999;
  `,
  
  unreadBadge: css`
    background: #007bff;
    color: white;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
  `
};