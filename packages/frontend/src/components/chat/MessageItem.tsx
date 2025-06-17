import { css } from '@emotion/css';
import type { Message } from '@homechat/shared';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

export function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const messageTime = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className={`${styles.container} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && showAvatar && (
        <div className={styles.avatar}>
          {/* Avatar placeholder - will be replaced with actual avatar */}
          <div className={styles.avatarPlaceholder}>
            {message.userId.substring(0, 2).toUpperCase()}
          </div>
        </div>
      )}
      
      <div className={styles.content}>
        <div className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}>
          <div className={styles.text}>{message.content}</div>
          <div className={styles.metadata}>
            <span className={styles.time}>{messageTime}</span>
            {isOwn && (
              <span className={styles.status}>
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && <span className={styles.read}>✓✓</span>}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {!isOwn && !showAvatar && <div className={styles.avatarSpacer} />}
    </div>
  );
}

const styles = {
  container: css`
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 2px;
  `,
  
  own: css`
    flex-direction: row-reverse;
  `,
  
  other: css`
    flex-direction: row;
  `,
  
  avatar: css`
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  `,
  
  avatarPlaceholder: css`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #007bff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  `,
  
  avatarSpacer: css`
    width: 32px;
    flex-shrink: 0;
  `,
  
  content: css`
    max-width: 70%;
    min-width: 0;
  `,
  
  bubble: css`
    padding: 8px 12px;
    border-radius: 18px;
    word-wrap: break-word;
    position: relative;
  `,
  
  ownBubble: css`
    background: #007bff;
    color: white;
    border-bottom-right-radius: 4px;
  `,
  
  otherBubble: css`
    background: white;
    color: #333;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `,
  
  text: css`
    margin: 0;
    white-space: pre-wrap;
  `,
  
  metadata: css`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
  `,
  
  time: css`
    font-size: 11px;
    opacity: 0.7;
  `,
  
  status: css`
    font-size: 12px;
    opacity: 0.7;
  `,
  
  read: css`
    color: #4fc3f7;
  `
};