import { css } from '@emotion/css';
import { useAuthStore } from '../stores/authStore';

export function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className={containerStyles}>
      <header className={headerStyles}>
        <h1>HomeChat</h1>
        <div className={userInfoStyles}>
          <span>Welcome, {user?.displayName}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <main className={mainStyles}>
        <div className={sidebarStyles}>
          <h2>Rooms</h2>
          <p>Family Chat</p>
        </div>
        <div className={chatAreaStyles}>
          <div className={messagesStyles}>
            <p>Chat functionality coming soon...</p>
          </div>
          <div className={inputStyles}>
            <input type="text" placeholder="Type a message..." />
            <button>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

const containerStyles = css`
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const headerStyles = css`
  background: #667eea;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 1.5rem;
  }
`;

const userInfoStyles = css`
  display: flex;
  align-items: center;
  gap: 1rem;

  button {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const mainStyles = css`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const sidebarStyles = css`
  width: 250px;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 1rem;

  h2 {
    font-size: 1rem;
    margin-bottom: 1rem;
    color: #4a5568;
  }

  p {
    padding: 0.5rem;
    background: #f7fafc;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #edf2f7;
    }
  }
`;

const chatAreaStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const messagesStyles = css`
  flex: 1;
  padding: 1rem;
  background: #f7fafc;
  overflow-y: auto;
`;

const inputStyles = css`
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e2e8f0;

  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    margin-right: 0.5rem;

    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }

  button {
    padding: 0.5rem 1rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #5a67d8;
    }
  }
`;