import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { useAuthStore } from './stores/authStore';
import { LoginPage } from './pages/LoginPage';
import { ChatPage } from './pages/ChatPage';
import { useEffect, useState } from 'react';

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // Wait for Zustand to hydrate from localStorage and validate token
  useEffect(() => {
    const validateAuth = async () => {
      // First rehydrate the store
      await useAuthStore.persist.rehydrate();
      setIsHydrated(true);

      // Then validate the token if authenticated
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken) {
        try {
          const response = await fetch('/api/auth/validate', {
            headers: {
              'Authorization': `Bearer ${currentToken}`
            }
          });
          
          if (!response.ok) {
            // Token is invalid, clear auth state
            logout();
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          // Keep the user logged in if validation fails (network error)
        }
      }
      
      setIsValidating(false);
    };

    validateAuth();
  }, [logout]);

  // Show loading state while hydrating or validating
  if (!isHydrated || isValidating) {
    return (
      <div className={loadingStyles}>
        <p>Loading...</p>
      </div>
    );
  }

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

const loadingStyles = css`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
`;