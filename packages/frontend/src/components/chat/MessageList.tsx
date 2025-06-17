import { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import type { Message } from '@homechat/shared';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore?: () => void;
}

export function MessageList({ messages, currentUserId, onLoadMore }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousScrollHeight = useRef<number>(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current && messages.length > 0) {
      const container = scrollContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // Handle scroll for loading more messages
  const handleScroll = () => {
    if (scrollContainerRef.current && onLoadMore) {
      const container = scrollContainerRef.current;
      
      if (container.scrollTop === 0) {
        previousScrollHeight.current = container.scrollHeight;
        onLoadMore();
      }
    }
  };

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (scrollContainerRef.current && previousScrollHeight.current > 0) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight.current;
      
      if (scrollDiff > 0) {
        container.scrollTop = scrollDiff;
        previousScrollHeight.current = 0;
      }
    }
  }, [messages]);

  return (
    <div 
      ref={scrollContainerRef}
      className={styles.container}
      onScroll={handleScroll}
    >
      <div className={styles.messageList}>
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDateDivider = shouldShowDateDivider(previousMessage, message);
          
          return (
            <div key={message.id}>
              {showDateDivider && (
                <div className={styles.dateDivider}>
                  {formatMessageDate(message.createdAt)}
                </div>
              )}
              <MessageItem
                message={message}
                isOwn={message.userId === currentUserId}
                showAvatar={shouldShowAvatar(previousMessage, message)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function shouldShowDateDivider(previous: Message | null, current: Message): boolean {
  if (!previous) return true;
  
  const prevDate = new Date(previous.createdAt);
  const currDate = new Date(current.createdAt);
  
  return prevDate.toDateString() !== currDate.toDateString();
}

function shouldShowAvatar(previous: Message | null, current: Message): boolean {
  if (!previous) return true;
  if (previous.userId !== current.userId) return true;
  
  const timeDiff = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
  return timeDiff > 5 * 60 * 1000; // 5 minutes
}

function formatMessageDate(date: Date | string): string {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
}

const styles = {
  container: css`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: #f5f5f5;
  `,
  
  messageList: css`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  
  dateDivider: css`
    text-align: center;
    margin: 20px 0;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #ddd;
      z-index: 0;
    }
    
    & > * {
      background: #f5f5f5;
      padding: 0 16px;
      position: relative;
      z-index: 1;
      color: #666;
      font-size: 13px;
      font-weight: 500;
    }
  `
};