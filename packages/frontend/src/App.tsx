import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <div className={appStyles}>
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

const appStyles = css`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
`;