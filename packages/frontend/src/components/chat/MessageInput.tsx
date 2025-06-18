import { useState, useRef, useEffect } from 'react';
import { css } from '@emotion/css';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value.trim()) {
      handleTyping();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        setIsTyping(false);
        onTypingStop();
      }
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        onTypingStop();
      }
    };
  }, [isTyping, onTypingStop]);

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={styles.textarea}
          rows={1}
          maxLength={1000}
        />
        
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className={styles.sendButton}
          aria-label="Send message"
        >
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </form>
  );
}

const styles = {
  container: css`
    padding: 20px 24px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.98));
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  `,
  
  inputWrapper: css`
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 28px;
    padding: 10px 10px 10px 20px;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.04),
      inset 0 1px 2px rgba(0, 0, 0, 0.02);
    transition: all 0.2s ease;
    
    &:focus-within {
      background: rgba(255, 255, 255, 1);
      border-color: #007bff;
      box-shadow: 
        0 0 0 3px rgba(0, 123, 255, 0.1),
        0 4px 12px rgba(0, 123, 255, 0.15);
    }
  `,
  
  textarea: css`
    flex: 1;
    border: none;
    background: transparent;
    resize: none;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 24px;
    max-height: 150px;
    overflow-y: auto;
    color: #1a1a1a;
    
    &::placeholder {
      color: #9ca3af;
      font-weight: 400;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  `,
  
  sendButton: css`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }
    
    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.35);
      
      &::before {
        width: 80px;
        height: 80px;
      }
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
    }
    
    &:disabled {
      background: linear-gradient(135deg, #e0e0e0 0%, #cccccc 100%);
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
    }
    
    svg {
      position: relative;
      z-index: 1;
      transform: translateX(-1px);
    }
  `
};