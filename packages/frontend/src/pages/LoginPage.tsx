import { useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { loginSchema, registerSchema } from '@homechat/shared';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
      email: formData.get('email') as string,
      displayName: formData.get('displayName') as string
    };

    try {
      if (isRegister) {
        const validated = registerSchema.parse(data);
        const authUser = await authService.register(validated);
        login(authUser);
      } else {
        const validated = loginSchema.parse(data);
        const authUser = await authService.login(validated);
        login(authUser);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={containerStyles}>
      <form className={formStyles} onSubmit={handleSubmit}>
        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        
        <input
          name="username"
          type="text"
          placeholder="Username"
          required
          minLength={3}
          maxLength={50}
        />
        
        {isRegister && (
          <>
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
            />
            <input
              name="displayName"
              type="text"
              placeholder="Display Name"
              required
              minLength={1}
              maxLength={100}
            />
          </>
        )}
        
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={6}
        />
        
        {error && <div className={errorStyles}>{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
        </button>
        
        <p>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            className={linkStyles}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </form>
    </div>
  );
}

const containerStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const formStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;

  h1 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: #333;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }

  button[type="submit"] {
    width: 100%;
    padding: 0.75rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #5a67d8;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  p {
    margin-top: 1rem;
    text-align: center;
    color: #666;
  }
`;

const linkStyles = css`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: #5a67d8;
  }
`;

const errorStyles = css`
  background: #fed7d7;
  color: #c53030;
  padding: 0.5rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;