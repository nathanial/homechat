import { css } from '@emotion/css';

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const message = formatTypingMessage(users);

  return (
    <div className={styles.container}>
      <div className={styles.dots}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      <span className={styles.text}>{message}</span>
    </div>
  );
}

function formatTypingMessage(users: string[]): string {
  if (users.length === 1) {
    return `${users[0]} is typing...`;
  } else if (users.length === 2) {
    return `${users[0]} and ${users[1]} are typing...`;
  } else {
    return `${users[0]} and ${users.length - 1} others are typing...`;
  }
}

const styles = {
  container: css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    color: #666;
    font-size: 14px;
    height: 32px;
    background: #f5f5f5;
  `,
  
  dots: css`
    display: flex;
    gap: 3px;
  `,
  
  dot: css`
    width: 8px;
    height: 8px;
    background: #999;
    border-radius: 50%;
    animation: typing 1.4s infinite;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
  `,
  
  text: css`
    color: #666;
  `
};