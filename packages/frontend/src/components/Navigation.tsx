import { NavLink } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuthStore } from '../stores/authStore';

export function Navigation() {
  const { user, logout } = useAuthStore();

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <i className="fa-solid fa-house" />
        HomeChat
      </div>

      <div className={styles.links}>
        <NavLink 
          to="/" 
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          <i className="fa-solid fa-comments" />
          <span>Chat</span>
        </NavLink>
        
        <NavLink 
          to="/documents" 
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          <i className="fa-solid fa-file-lines" />
          <span>Documents</span>
        </NavLink>
      </div>

      <div className={styles.user}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <span className={styles.username}>{user?.username}</span>
        </div>
        
        <button className={styles.logoutButton} onClick={logout} title="Logout">
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: css`
    height: 60px;
    background: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  `,

  brand: css`
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    
    i {
      color: #007bff;
    }
  `,

  links: css`
    display: flex;
    gap: 8px;
    flex: 1;
    justify-content: center;
  `,

  link: css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 8px;
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
    }
    
    i {
      font-size: 18px;
    }
  `,

  active: css`
    background: rgba(0, 123, 255, 0.1) !important;
    color: #007bff !important;
  `,

  user: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,

  userInfo: css`
    display: flex;
    align-items: center;
    gap: 10px;
  `,

  avatar: css`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
  `,

  username: css`
    font-weight: 500;
    color: #374151;
  `,

  logoutButton: css`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: #ef4444;
      color: white;
      transform: scale(1.05);
    }
  `
};