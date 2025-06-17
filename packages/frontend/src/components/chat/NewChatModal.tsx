import { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import type { User } from '@homechat/shared';
import { useAuthStore } from '../../stores/authStore';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, type: 'direct' | 'group', memberIds: string[]) => void;
}

export function NewChatModal({ isOpen, onClose, onCreateRoom }: NewChatModalProps) {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'direct' | 'group'>('direct');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const currentUserId = useAuthStore(state => state.user?.id);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setRoomName('');
      setRoomType('direct');
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${useAuthStore.getState().accessToken}`
        }
      });
      
      console.log('Users API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        // Filter out current user
        const filteredUsers = data.filter((u: User) => u.id !== currentUserId);
        console.log('Filtered users:', filteredUsers);
        setUsers(filteredUsers);
      } else {
        console.error('Users API error:', await response.text());
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (roomType === 'direct' && selectedUsers.length !== 1) {
      alert('Please select exactly one user for a direct message');
      return;
    }
    
    if (roomType === 'group' && selectedUsers.length < 1) {
      alert('Please select at least one user for a group chat');
      return;
    }
    
    if (roomType === 'group' && !roomName.trim()) {
      alert('Please enter a name for the group chat');
      return;
    }
    
    setIsLoading(true);
    
    const name = roomType === 'direct' 
      ? users.find(u => u.id === selectedUsers[0])?.displayName || 'Direct Message'
      : roomName.trim();
    
    onCreateRoom(name, roomType, selectedUsers);
  };

  const toggleUserSelection = (userId: string) => {
    if (roomType === 'direct') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>New Chat</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.typeSelector}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="direct"
                checked={roomType === 'direct'}
                onChange={(e) => setRoomType(e.target.value as 'direct')}
              />
              Direct Message
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="group"
                checked={roomType === 'group'}
                onChange={(e) => setRoomType(e.target.value as 'group')}
              />
              Group Chat
            </label>
          </div>

          {roomType === 'group' && (
            <input
              type="text"
              placeholder="Group name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={styles.input}
              required
            />
          )}

          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.input}
          />

          <div className={styles.userList}>
            {filteredUsers.map(user => (
              <label key={user.id} className={styles.userItem}>
                <input
                  type={roomType === 'direct' ? 'radio' : 'checkbox'}
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.displayName}</span>
                  <span className={styles.userUsername}>@{user.username}</span>
                </div>
                <span className={`${styles.status} ${styles[user.status || 'offline']}`}>
                  {user.status || 'offline'}
                </span>
              </label>
            ))}
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `,

  modal: css`
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  `,

  header: css`
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  `,

  closeButton: css`
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }
  `,

  form: css`
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    overflow: hidden;
  `,

  typeSelector: css`
    display: flex;
    gap: 20px;
    margin-bottom: 8px;
  `,

  radioLabel: css`
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;

    input {
      cursor: pointer;
    }
  `,

  input: css`
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #007bff;
    }
  `,

  userList: css`
    flex: 1;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 8px;
    min-height: 200px;
  `,

  userItem: css`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    input {
      cursor: pointer;
    }
  `,

  userInfo: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  `,

  userName: css`
    font-size: 14px;
    font-weight: 500;
    color: #333;
  `,

  userUsername: css`
    font-size: 12px;
    color: #666;
  `,

  status: css`
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    text-transform: lowercase;
  `,

  online: css`
    background: #e8f5e9;
    color: #4caf50;
  `,

  offline: css`
    background: #f5f5f5;
    color: #999;
  `,

  away: css`
    background: #fff3e0;
    color: #ff9800;
  `,

  busy: css`
    background: #ffebee;
    color: #f44336;
  `,

  actions: css`
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 16px;
  `,

  cancelButton: css`
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    color: #666;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }
  `,

  submitButton: css`
    padding: 8px 16px;
    border: none;
    background: #007bff;
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #0056b3;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `
};